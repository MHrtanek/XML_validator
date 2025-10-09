/**
 * Nájde parent element pre daný riadok v XML
 * Príklad: Ak je na riadku <Nm>, vráti názov parent elementu napr. "CdtrAcct"
 */
export function findParentElementInXml(xmlContent: string, lineNumber: number): string | null {
    const lines = xmlContent.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) {
        return null;
    }
    
    const lineIndex = lineNumber - 1;
    
    // Stack pre tracking otvorených tagov
    const tagStack: string[] = [];
    
    for (let i = 0; i <= lineIndex; i++) {
        const line = lines[i];
        
        // Nájdeme všetky opening tagy
        const openingMatches = line.matchAll(/<(\w+[\w:.-]*)[^>]*>/g);
        for (const match of openingMatches) {
            const fullMatch = match[0];
            const tagName = match[1];
            
            // Skip self-closing tags
            if (fullMatch.endsWith('/>') || fullMatch.includes('/>')) {
                continue;
            }
            
            // Skip closing tags
            if (fullMatch.startsWith('</')) {
                continue;
            }
            
            // Skip comments
            if (fullMatch.startsWith('<!--')) {
                continue;
            }
            
            tagStack.push(tagName);
        }
        
        // Nájdeme všetky closing tagy
        const closingMatches = line.matchAll(/<\/(\w+[\w:.-]*)\s*>/g);
        for (const match of closingMatches) {
            const tagName = match[1];
            // Pop zo stacku
            if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
                tagStack.pop();
            }
        }
    }
    
    // Vrátime posledný tag zo stacku (to je náš parent)
    const parent = tagStack.length > 0 ? tagStack[tagStack.length - 1] : null;
    console.log('Parent element stack:', tagStack, '-> parent:', parent);
    return parent;
}

/**
 * Nájde typ elementu v XSD
 */
function findElementType(xsdContent: string, elementName: string): string | null {
    const lines = xsdContent.split('\n');
    
    // Hľadáme <xs:element name="elementName" type="...">
    const patterns = [
        new RegExp(`<xs:element\\s+name=["']${elementName}["'][^>]*type=["']([^"']+)["']`, 'i'),
        new RegExp(`<xs:element\\s+[^>]*name=["']${elementName}["'][^>]*type=["']([^"']+)["']`, 'i'),
        new RegExp(`<xsd:element\\s+name=["']${elementName}["'][^>]*type=["']([^"']+)["']`, 'i'),
    ];
    
    for (const line of lines) {
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                console.log(`Found type for ${elementName}:`, match[1]);
                return match[1];
            }
        }
    }
    
    console.log('Could not find type for element:', elementName);
    return null;
}

/**
 * Nájde všetky možné cesty k elementu cez XML stack a XSD typy
 */
export function findElementWithXmlContext(
    xsdContent: string,
    xmlContent: string,
    elementName: string,
    lineNumber: number
): number | null {
    const lines = xmlContent.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) return null;
    
    const lineIndex = lineNumber - 1;
    const tagStack: string[] = [];
    
    // Budujeme stack až po chybný riadok
    for (let i = 0; i <= lineIndex; i++) {
        const line = lines[i];
        
        const openingMatches = line.matchAll(/<(\w+[\w:.-]*)[^>]*>/g);
        for (const match of openingMatches) {
            const fullMatch = match[0];
            const tagName = match[1];
            
            if (fullMatch.endsWith('/>') || fullMatch.includes('/>') || 
                fullMatch.startsWith('</') || fullMatch.startsWith('<!--')) {
                continue;
            }
            
            tagStack.push(tagName);
        }
        
        const closingMatches = line.matchAll(/<\/(\w+[\w:.-]*)\s*>/g);
        for (const match of closingMatches) {
            const tagName = match[1];
            if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
                tagStack.pop();
            }
        }
    }
    
    console.log('XML element stack:', tagStack);
    
    // Teraz ideme po stacku odzadu a hľadáme cestu cez typy
    // Začneme s posledným elementom (parent) a ideme hore
    for (let i = tagStack.length - 1; i >= 0; i--) {
        const parentEl = tagStack[i];
        console.log('Trying parent:', parentEl);
        
        const parentType = findElementType(xsdContent, parentEl);
        if (parentType) {
            console.log('Parent', parentEl, 'has type:', parentType);
            
            // Nájdeme element v rámci tohto typu
            const result = findElementInType(xsdContent, elementName, parentType);
            if (result) {
                return result;
            }
        }
    }
    
    return null;
}

/**
 * Nájde element v špecifickom type v XSD
 * Podporuje aj ref="..." atribúty
 */
function findElementInType(
    xsdContent: string,
    elementName: string,
    typeName: string
): number | null {
    const lines = xsdContent.split('\n');
    
    // Nájdeme complexType s týmto názvom
    const typeDefPattern = new RegExp(
        `<xs:complexType\\s+name=["']${typeName}["']`,
        'i'
    );
    
    let typeDefLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (typeDefPattern.test(lines[i])) {
            typeDefLine = i;
            console.log('Found type definition for', typeName, 'at line:', i + 1);
            break;
        }
    }
    
    if (typeDefLine === -1) {
        console.log('Type definition not found for:', typeName);
        return null;
    }
    
    // Hľadáme element v rámci tohto complexType
    // name="..." môže byť kdekoľvek v tagu (po maxOccurs, minOccurs, atď.)
    const elementNamePattern = new RegExp(
        `<xs:element\\s+[^>]*name=["']${elementName}["']`,
        'i'
    );
    const elementRefPattern = new RegExp(
        `<xs:element\\s+[^>]*ref=["']${elementName}["']`,
        'i'
    );
    
    for (let i = typeDefLine + 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('</xs:complexType>') || line.includes('</xsd:complexType>')) {
            console.log('Reached end of type', typeName, 'without finding element', elementName);
            break;
        }
        
        if (elementNamePattern.test(line) || elementRefPattern.test(line)) {
            console.log('Found element', elementName, 'in type', typeName, 'at line:', i + 1);
            return i + 1;
        }
    }
    
    console.log('Element', elementName, 'not found in type', typeName);
    return null;
}

/**
 * Nájde element v špecifickom type context v XSD (pôvodná verzia pre kompatibilitu)
 */
export function findElementInTypeContext(
    xsdContent: string, 
    elementName: string, 
    parentElementName: string
): number | null {
    return findElementInType(xsdContent, elementName, findElementType(xsdContent, parentElementName) || '');
}

