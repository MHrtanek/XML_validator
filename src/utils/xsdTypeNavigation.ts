/**
 * Extrahuje názov typu z textu na danej pozícii v riadku
 * Príklad: type="TransactionParty2" -> "TransactionParty2"
 */
export function extractTypeAtPosition(line: string, column: number): string | null {
    // Hľadáme type="..." pattern v blízkosti kliknutia
    const typeMatches = line.matchAll(/type\s*=\s*["']([^"']+)["']/gi);
    
    for (const match of typeMatches) {
        if (match.index !== undefined && match[1]) {
            const typeStart = match.index;
            const typeEnd = match.index + match[0].length;
            
            // Ak sme klikli v rámci tohto type atribútu
            if (column >= typeStart && column <= typeEnd) {
                return match[1];
            }
        }
    }
    
    return null;
}

/**
 * Nájde definíciu typu v XSD schéme
 * Hľadá <xs:complexType name="TypeName"> alebo <xs:simpleType name="TypeName">
 */
export function findTypeDefinitionInXsd(xsdContent: string, typeName: string): number | null {
    if (!xsdContent || !typeName) return null;
    
    const lines = xsdContent.split('\n');
    
    // Hľadáme rôzne pattern-y definície typu v XSD:
    const patterns = [
        new RegExp(`<xs:complexType\\s+name=["']${typeName}["']`, 'i'),
        new RegExp(`<xsd:complexType\\s+name=["']${typeName}["']`, 'i'),
        new RegExp(`<complexType\\s+name=["']${typeName}["']`, 'i'),
        new RegExp(`<xs:simpleType\\s+name=["']${typeName}["']`, 'i'),
        new RegExp(`<xsd:simpleType\\s+name=["']${typeName}["']`, 'i'),
        new RegExp(`<simpleType\\s+name=["']${typeName}["']`, 'i'),
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

