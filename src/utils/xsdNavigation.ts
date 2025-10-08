/**
 * Extrahuje názov elementu z chybovej správy
 * Príklad: "Element '{urn:iso:std:iso:20022:tech:xsd:camt.053.001.02}PrvtId': This element is not expected."
 * Výsledok: "PrvtId"
 */
export function extractElementName(errorMessage: string): string | null {
    // Hľadáme pattern: Element '{namespace}ElementName'
    const match = errorMessage.match(/Element\s+'[^}]*}([^']+)'/);
    if (match && match[1]) {
        return match[1];
    }
    
    // Alternatívne pattern bez namespace
    const simpleMatch = errorMessage.match(/Element\s+'([^']+)'/);
    if (simpleMatch && simpleMatch[1]) {
        return simpleMatch[1];
    }
    
    return null;
}

/**
 * Vyhľadá element v XSD schéme a vráti číslo riadku
 */
export function findElementInXsd(xsdContent: string, elementName: string): number | null {
    if (!xsdContent || !elementName) return null;
    
    const lines = xsdContent.split('\n');
    
    // Hľadáme rôzne pattern-y definície elementu v XSD:
    // 1. <xs:element name="ElementName"...>
    // 2. <xsd:element name="ElementName"...>
    // 3. <element name="ElementName"...>
    const patterns = [
        new RegExp(`<xs:element\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<xsd:element\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<element\\s+name=["']${elementName}["']`, 'i'),
        // Komplexné typy
        new RegExp(`<xs:complexType\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<xsd:complexType\\s+name=["']${elementName}["']`, 'i'),
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
            if (pattern.test(line)) {
                return i + 1; // Line numbers are 1-based
            }
        }
    }
    
    return null;
}

/**
 * Extrahuje namespace z error správy ak existuje
 */
export function extractNamespace(errorMessage: string): string | null {
    const match = errorMessage.match(/\{([^}]+)\}/);
    return match ? match[1] : null;
}

