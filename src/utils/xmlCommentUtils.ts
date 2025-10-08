/**
 * Nájde začiatok a koniec XML elementu na danom riadku
 * Funguje aj pre opening tag aj closing tag
 */
export function findElementBounds(xmlContent: string, lineNumber: number): { start: number; end: number } | null {
    const lines = xmlContent.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) {
        return null;
    }
    
    const lineIndex = lineNumber - 1;
    const line = lines[lineIndex];
    
    // Nájdeme pozíciu začiatku tohto riadku v celom texte
    let lineStartPos = 0;
    for (let i = 0; i < lineIndex; i++) {
        lineStartPos += lines[i].length + 1; // +1 for newline
    }
    
    // Skontrolujeme či je to CLOSING TAG
    const closingTagMatch = line.match(/<\/(\w+[\w:.-]*)\s*>/);
    if (closingTagMatch) {
        const tagName = closingTagMatch[1];
        return findElementBoundsByClosingTag(xmlContent, lineNumber, tagName, lineStartPos);
    }
    
    // Skúsime nájsť opening tag na tomto riadku
    const openTagMatch = line.match(/<(\w+[\w:.-]*)/);
    if (!openTagMatch) {
        return null;
    }
    
    const tagName = openTagMatch[1];
    const tagStartInLine = line.indexOf('<' + tagName);
    const elementStart = lineStartPos + tagStartInLine;
    
    // Skontrolujeme či je to self-closing tag
    if (line.includes('/>')) {
        const selfClosingEnd = line.indexOf('/>');
        const elementEnd = lineStartPos + selfClosingEnd + 2;
        return { start: elementStart, end: elementEnd };
    }
    
    // Ak nie, hľadáme closing tag
    const closingTag = `</${tagName}>`;
    const xmlFromElement = xmlContent.substring(elementStart);
    
    // Jednoduchý search pre closing tag (môže byť na viacerých riadkoch)
    const closingTagPos = xmlFromElement.indexOf(closingTag);
    if (closingTagPos === -1) {
        // Ak nenájdeme closing tag, skúsime najsť koniec aktuálneho riadku s >
        const lineEnd = line.lastIndexOf('>');
        if (lineEnd !== -1) {
            return { start: elementStart, end: lineStartPos + lineEnd + 1 };
        }
        return null;
    }
    
    const elementEnd = elementStart + closingTagPos + closingTag.length;
    return { start: elementStart, end: elementEnd };
}

/**
 * Nájde bounds elementu keď máme closing tag
 */
function findElementBoundsByClosingTag(
    xmlContent: string, 
    closingLineNumber: number, 
    tagName: string,
    closingLineStartPos: number
): { start: number; end: number } | null {
    const lines = xmlContent.split('\n');
    const closingLineIndex = closingLineNumber - 1;
    const closingLine = lines[closingLineIndex];
    
    // Nájdeme pozíciu closing tagu v celom texte
    const closingTagInLine = closingLine.indexOf(`</${tagName}>`);
    if (closingTagInLine === -1) return null;
    
    const closingTagEnd = closingLineStartPos + closingTagInLine + `</${tagName}>`.length;
    
    // Hľadáme opening tag (ideme dozadu)
    const openingTag = `<${tagName}`;
    const beforeClosing = xmlContent.substring(0, closingLineStartPos);
    
    // Musíme nájsť párový opening tag (počítať vnorenia)
    let depth = 1;
    let searchPos = beforeClosing.length;
    
    while (depth > 0 && searchPos > 0) {
        const lastClosing = beforeClosing.lastIndexOf(`</${tagName}`, searchPos - 1);
        const lastOpening = beforeClosing.lastIndexOf(openingTag, searchPos - 1);
        
        if (lastOpening === -1) {
            return null; // Nenašli sme opening tag
        }
        
        if (lastClosing > lastOpening) {
            // Našli sme ďalší closing tag pred našim opening tagom
            depth++;
            searchPos = lastClosing;
        } else {
            // Našli sme opening tag
            depth--;
            if (depth === 0) {
                // Toto je náš opening tag
                return { start: lastOpening, end: closingTagEnd };
            }
            searchPos = lastOpening;
        }
    }
    
    return null;
}

/**
 * Zakomentuje element na danom riadku
 */
export function commentOutElement(xmlContent: string, lineNumber: number): string | null {
    const bounds = findElementBounds(xmlContent, lineNumber);
    if (!bounds) {
        console.log('Could not find element bounds');
        return null;
    }
    
    const beforeElement = xmlContent.substring(0, bounds.start);
    const element = xmlContent.substring(bounds.start, bounds.end);
    const afterElement = xmlContent.substring(bounds.end);
    
    // Zakomentujeme element
    const commented = `<!-- ${element} -->`;
    
    return beforeElement + commented + afterElement;
}

/**
 * Skontroluje či je element na danom riadku zakomentovaný
 */
export function isElementCommented(xmlContent: string, lineNumber: number): boolean {
    const lines = xmlContent.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) {
        return false;
    }
    
    const lineIndex = lineNumber - 1;
    
    // Nájdeme pozíciu začiatku tohto riadku v celom texte
    let lineStartPos = 0;
    for (let i = 0; i < lineIndex; i++) {
        lineStartPos += lines[i].length + 1;
    }
    
    const lineEndPos = lineStartPos + lines[lineIndex].length;
    
    // Hľadáme či je tento riadok vnútri komentára
    const beforeAndIncludingLine = xmlContent.substring(0, lineEndPos);
    const lastCommentStart = beforeAndIncludingLine.lastIndexOf('<!--');
    
    if (lastCommentStart === -1) {
        return false;
    }
    
    // Skontrolujeme či komentár nie je už ukončený pred týmto riadkom
    const afterCommentStart = beforeAndIncludingLine.substring(lastCommentStart);
    const commentEndInBefore = afterCommentStart.indexOf('-->');
    
    // Ak je komentár ukončený pred koncom nášho riadku, nie je zakomentovaný
    if (commentEndInBefore !== -1 && lastCommentStart + commentEndInBefore < lineStartPos) {
        return false;
    }
    
    return true;
}

/**
 * Odkomentuje element na danom riadku
 */
export function uncommentElement(xmlContent: string, lineNumber: number): string | null {
    const lines = xmlContent.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) {
        return null;
    }
    
    const lineIndex = lineNumber - 1;
    
    // Nájdeme pozíciu začiatku tohto riadku v celom texte
    let lineStartPos = 0;
    for (let i = 0; i < lineIndex; i++) {
        lineStartPos += lines[i].length + 1; // +1 for newline
    }
    
    const lineEndPos = lineStartPos + lines[lineIndex].length;
    
    // Hľadáme komentár ktorý obsahuje tento riadok
    // Môže začínať pred týmto riadkom alebo na ňom
    const beforeAndIncludingLine = xmlContent.substring(0, lineEndPos);
    const commentStartPos = beforeAndIncludingLine.lastIndexOf('<!--');
    
    if (commentStartPos === -1) {
        console.log('No comment start found');
        return null;
    }
    
    // Hľadáme koniec komentára
    const afterCommentStart = xmlContent.substring(commentStartPos);
    const commentEndIndex = afterCommentStart.indexOf('-->');
    
    if (commentEndIndex === -1) {
        console.log('No comment end found');
        return null;
    }
    
    const commentEndPos = commentStartPos + commentEndIndex + 3; // +3 for '-->'
    
    // Extrahujeme časti
    const beforeComment = xmlContent.substring(0, commentStartPos);
    const commentContent = xmlContent.substring(commentStartPos + 4, commentStartPos + commentEndIndex); // Remove '<!--' and '-->'
    const afterComment = xmlContent.substring(commentEndPos);
    
    console.log('Uncommenting:', {
        commentStart: commentStartPos,
        commentEnd: commentEndPos,
        content: commentContent
    });
    
    return beforeComment + commentContent.trim() + afterComment;
}

