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
 * Vyhľadá všetky výskyty elementu v XSD schéme
 */
export function findAllElementsInXsd(xsdContent: string, elementName: string): Array<{ line: number; context: string }> {
    if (!xsdContent || !elementName) return [];
    
    const lines = xsdContent.split('\n');
    const results: Array<{ line: number; context: string }> = [];
    
    const patterns = [
        new RegExp(`<xs:element\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<xsd:element\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<element\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<xs:complexType\\s+name=["']${elementName}["']`, 'i'),
        new RegExp(`<xsd:complexType\\s+name=["']${elementName}["']`, 'i'),
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
            if (pattern.test(line)) {
                // Hľadáme parent complexType/element pre kontext
                const context = findParentContext(lines, i);
                results.push({ 
                    line: i + 1, 
                    context: context || 'Root level'
                });
            }
        }
    }
    
    return results;
}

/**
 * Nájde parent context (complexType name) pre daný riadok
 */
function findParentContext(lines: string[], lineIndex: number): string | null {
    // Ideme hore a hľadáme <xs:complexType name="...">
    for (let i = lineIndex - 1; i >= 0; i--) {
        const line = lines[i];
        const match = line.match(/<xs:complexType\s+name=["']([^"']+)["']/i) ||
                      line.match(/<xsd:complexType\s+name=["']([^"']+)["']/i);
        if (match) {
            return match[1];
        }
        
        // Ak narazíme na zatvárajúci complexType, prestaneme hľadať
        if (line.includes('</xs:complexType>') || line.includes('</xsd:complexType>')) {
            break;
        }
    }
    return null;
}

/**
 * Vyhľadá element v XSD schéme a vráti číslo riadku (prvý výskyt)
 */
export function findElementInXsd(xsdContent: string, elementName: string): number | null {
    const results = findAllElementsInXsd(xsdContent, elementName);
    return results.length > 0 ? results[0].line : null;
}

/**
 * Extrahuje namespace z error správy ak existuje
 */
export function extractNamespace(errorMessage: string): string | null {
    const match = errorMessage.match(/\{([^}]+)\}/);
    return match ? match[1] : null;
}


