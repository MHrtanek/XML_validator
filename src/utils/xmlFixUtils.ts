import { findElementBounds } from './xmlCommentUtils';

/**
 * Odstráni element na danom riadku
 */
export function removeElement(xmlContent: string, lineNumber: number): string | null {
    const bounds = findElementBounds(xmlContent, lineNumber);
    if (!bounds) {
        console.log('Could not find element bounds for removal');
        return null;
    }
    
    const beforeElement = xmlContent.substring(0, bounds.start);
    const afterElement = xmlContent.substring(bounds.end);
    
    // Odstránime element
    return beforeElement + afterElement;
}

/**
 * Detekuje typ chyby a vráti možné opravy
 */
export interface PossibleFix {
    label: string;
    action: 'remove' | 'comment';
}

export function getPossibleFixes(errorMessage: string): PossibleFix[] {
    const fixes: PossibleFix[] = [];
    
    // "This element is not expected"
    if (errorMessage.includes('This element is not expected')) {
        fixes.push({
            label: 'Remove element',
            action: 'remove'
        });
    }
    
    // Môžeme pridať ďalšie typy chýb a oprá v budúcnosti
    
    return fixes;
}

