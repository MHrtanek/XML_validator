import { ValidationError } from '../types/validation';
import { VALIDATION_TYPES, VALIDATION_MESSAGES } from '../constants/validationMessages';

export const findLineNumber = (xmlContent: string, elementPath: string): number => {
    if (!xmlContent) return -1;

    const pathParts = elementPath.split(/[.@]/).filter(part => part.length > 0);
    if (pathParts.length === 0) return -1;

    const lines = xmlContent.split('\n');
    const targetElement = pathParts[pathParts.length - 1];
    const elementRegex = new RegExp(`<${targetElement}[\\s>]`);

    for (let i = 0; i < lines.length; i++) {
        if (elementRegex.test(lines[i])) {
            return i + 1;
        }
    }

    return -1;
};

export const validateValue = (
    value: any,
    type: string,
    path: string,
    xmlContent: string
): ValidationError[] => {
    const errors: ValidationError[] = [];
    const numValue = Number(value);

    const validators = {
        [VALIDATION_TYPES.INTEGER]: () => isNaN(numValue) || !Number.isInteger(numValue),
        [VALIDATION_TYPES.DECIMAL]: () => isNaN(numValue),
        [VALIDATION_TYPES.BOOLEAN]: () => !['true', 'false', '1', '0'].includes(value?.toString().toLowerCase()),
        [VALIDATION_TYPES.DATE]: () => isNaN(new Date(value).getTime()),
        [VALIDATION_TYPES.DATETIME]: () => isNaN(new Date(value).getTime()),
        [VALIDATION_TYPES.POSITIVE_INTEGER]: () => isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0,
        [VALIDATION_TYPES.NEGATIVE_INTEGER]: () => isNaN(numValue) || !Number.isInteger(numValue) || numValue >= 0,
        [VALIDATION_TYPES.NON_NEGATIVE_INTEGER]: () => isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0,
        [VALIDATION_TYPES.STRING]: () => typeof value !== 'string'
    };

    const validator = validators[type as keyof typeof validators];
    if (validator?.()) {
        const lineNumber = findLineNumber(xmlContent, path);
        errors.push({
            message: VALIDATION_MESSAGES.TYPE_MISMATCH(path, type.replace('xs:', ''), value),
            line: lineNumber > 0 ? lineNumber : undefined
        });
    }

    return errors;
};