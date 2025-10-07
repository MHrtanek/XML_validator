export const VALIDATION_MESSAGES = {
    VALIDATING: 'Validating...',
    SUCCESS: 'VALIDATION SUCCESSFUL\n══════════════════\n- XSD syntax: Valid\n- XML syntax: Valid\n- XSD validation: Valid',
    EMPTY_XSD: 'Error: XSD schema is empty',
    EMPTY_XML: 'Error: XML document is empty',
    INVALID_XSD_SYNTAX: 'XSD Schema Error:',
    INVALID_XML_SYNTAX: 'XML Document Error:',
    MISSING_ROOT: (rootName: string) => `Missing root element: '${rootName}'`,
    MISSING_ELEMENT: (path: string) => `Missing required element: '${path}'`,
    MISSING_ATTRIBUTE: (path: string) => `Missing required attribute: '${path}'`,
    TYPE_MISMATCH: (path: string, expected: string, actual: string) =>
        `Element '${path}' should be ${expected}, but got: '${actual}'`,
    VALIDATION_FAILED: 'VALIDATION FAILED\n══════════════════\n- XSD syntax: Valid\n- XML syntax: Valid\n- Validation errors:'
} as const;

export const VALIDATION_TYPES = {
    INTEGER: 'xs:integer',
    DECIMAL: 'xs:decimal',
    BOOLEAN: 'xs:boolean',
    DATE: 'xs:date',
    DATETIME: 'xs:dateTime',
    POSITIVE_INTEGER: 'xs:positiveInteger',
    NEGATIVE_INTEGER: 'xs:negativeInteger',
    NON_NEGATIVE_INTEGER: 'xs:nonNegativeInteger',
    STRING: 'xs:string'
} as const;