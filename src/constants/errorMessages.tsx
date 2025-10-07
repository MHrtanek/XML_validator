export const ERROR_MESSAGES = {
    FILE_TOO_LARGE: "File is too large. Maximum size is 5MB.",
    INVALID_XML: "XML file has invalid structure. Check closing tags.",
    NETWORK_ERROR: "Error loading file. Please try again.",
    UNKNOWN_ERROR: "An unexpected error occurred. Please contact support.",
    EMPTY_DOCUMENT: "Please provide both XSD schema and XML document before validation."
} as const;