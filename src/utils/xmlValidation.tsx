import { ValidationError } from '../types/validation.tsx';
import { validateValue, findLineNumber } from './validationUtils';
import { VALIDATION_MESSAGES } from '../constants/validationMessages';

export const validateElement = (
    xmlElem: any,
    xsdElem: any,
    errors: ValidationError[],
    path: string,
    xmlContent: string
): void => {
    if (xsdElem['xs:complexType']?.['xs:sequence']) {
        const elements = [].concat(xsdElem['xs:complexType']['xs:sequence']['xs:element']);

        elements.forEach((elemDef: any) => {
            const elemName = elemDef['@_name'];
            const elemType = elemDef['@_type'];
            const currentPath = `${path}.${elemName}`;

            if (xmlElem[elemName] === undefined) {
                const lineNumber = findLineNumber(xmlContent, path);
                errors.push({
                    message: VALIDATION_MESSAGES.MISSING_ELEMENT(currentPath),
                    line: lineNumber > 0 ? lineNumber : undefined
                });
            } else if (elemDef['xs:complexType']) {
                validateElement(xmlElem[elemName], elemDef, errors, currentPath, xmlContent);
            } else {
                errors.push(...validateValue(xmlElem[elemName], elemType, currentPath, xmlContent));
            }
        });
    }

    if (xsdElem['xs:complexType']?.['xs:attribute']) {
        const attributes = [].concat(xsdElem['xs:complexType']['xs:attribute']);

        attributes.forEach((attrDef: any) => {
            const attrName = attrDef['@_name'];
            const attrType = attrDef['@_type'];
            const isRequired = attrDef['@_use'] === 'required';
            const currentPath = `${path}@${attrName}`;

            if (!xmlElem['@_']?.[attrName]) {
                if (isRequired) {
                    const lineNumber = findLineNumber(xmlContent, path);
                    errors.push({
                        message: VALIDATION_MESSAGES.MISSING_ATTRIBUTE(currentPath),
                        line: lineNumber > 0 ? lineNumber : undefined
                    });
                }
            } else {
                errors.push(...validateValue(xmlElem['@_'][attrName], attrType, currentPath, xmlContent));
            }
        });
    }
};

export const validateXmlAgainstXsd = (xmlObj: any, xsdObj: any, xmlContent: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rootElement = xsdObj['xs:schema']?.['xs:element'];

    if (!rootElement) {
        errors.push({
            message: 'Invalid XSD structure: missing schema or root element'
        });
        return errors;
    }

    const rootName = rootElement['@_name'];
    if (!xmlObj[rootName]) {
        const lineNumber = findLineNumber(xmlContent, rootName);
        errors.push({
            message: VALIDATION_MESSAGES.MISSING_ROOT(rootName),
            line: lineNumber > 0 ? lineNumber : undefined
        });
        return errors;
    }

    validateElement(xmlObj[rootName], rootElement, errors, rootName, xmlContent);
    return errors;
};