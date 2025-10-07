import { useCallback, useState } from 'react';
import { XMLValidator, XMLParser } from 'fast-xml-parser';
import { VALIDATION_MESSAGES } from '../constants/validationMessages';
import { validateXmlAgainstXsd } from '../utils/xmlValidation';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { ValidationError } from '../types/validation';

export const useValidationLogic = (xsd: string, xml: string, updateValidationResult: (result: ValidationError[]) => void) => {
    const [error, setError] = useState<string | null>(null);

    const validateDocuments = useCallback(() => {
        try {
            setError(null);
            updateValidationResult([{ message: VALIDATION_MESSAGES.VALIDATING }]);

            if (!xsd.trim() || !xml.trim()) {
                throw new Error(ERROR_MESSAGES.EMPTY_DOCUMENT);
            }

            if (xml.length > 5 * 1024 * 1024) {
                throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            const xsdValidation = XMLValidator.validate(xsd);
            if (xsdValidation !== true) {
                const lineInfo = xsdValidation?.err?.line ? `Line ${xsdValidation.err.line}: ` : '';
                throw new Error(`${VALIDATION_MESSAGES.INVALID_XSD_SYNTAX}\n${lineInfo}${xsdValidation?.err?.msg}`);
            }

            const xmlValidation = XMLValidator.validate(xml);
            if (xmlValidation !== true) {
                const lineInfo = xmlValidation?.err?.line ? `Line ${xmlValidation.err.line}: ` : '';
                throw new Error(`${VALIDATION_MESSAGES.INVALID_XML_SYNTAX}\n${lineInfo}${xmlValidation?.err?.msg}`);
            }

            const parser = new XMLParser({
                ignoreAttributes: false,
                parseTagValue: true,
                parseAttributeValue: true
            });

            const xsdObj = parser.parse(xsd);
            const xmlObj = parser.parse(xml);
            const validationErrors = validateXmlAgainstXsd(xmlObj, xsdObj, xml);

            if (validationErrors.length === 0) {
                updateValidationResult([{ message: VALIDATION_MESSAGES.SUCCESS }]);
            } else {
                updateValidationResult(validationErrors);
            }

        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
            setError(errorMessage);
            updateValidationResult([{ message: `Error: ${errorMessage}` }]);
        }
    }, [xsd, xml, updateValidationResult]);

    return {
        validateDocuments,
        error
    };
};