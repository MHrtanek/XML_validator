import { VALIDATION_MESSAGES } from '../constants/validationMessages';

export type QuickFix = {
    label: string;
    apply: (xml: string) => string;
};

// Attempts to insert a missing element under its parent path at a best-effort location
export function makeMissingElementFix(path: string, xml: string): QuickFix | null {
    // path is like Root.Child.GrandChild
    const parts = path.split('.');
    if (parts.length < 1) return null;
    const elementName = parts[parts.length - 1];
    const parentName = parts[parts.length - 2];

    const label = `Insert <${elementName}>`;
    const apply = (content: string) => {
        if (!parentName) {
            // Insert root if missing
            const insertion = `<${elementName}></${elementName}>`;
            return content && content.trim().length > 0 ? content : insertion + '\n';
        }
        // Find last occurrence of closing parent tag and insert before it
        const closingParent = new RegExp(`</${parentName}\\s*>`);
        const lines = content.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            if (closingParent.test(lines[i])) {
                const indentMatch = lines[i].match(/^(\s*)/);
                const baseIndent = indentMatch ? indentMatch[1] : '';
                const childIndent = baseIndent.replace(/\s{2}$/,'') + '  ';
                const insertion = `${childIndent}<${elementName}></${elementName}>`;
                lines.splice(i, 0, insertion);
                return lines.join('\n');
            }
        }
        // Fallback: append at end
        return content + `\n<${elementName}></${elementName}>`;
    };

    return { label, apply };
}

export function makeMissingAttributeFix(path: string, xml: string): QuickFix | null {
    // path like Parent.Child@attrName
    const atIdx = path.lastIndexOf('@');
    if (atIdx === -1) return null;
    const elemPath = path.slice(0, atIdx);
    const parts = elemPath.split('.');
    const elementName = parts[parts.length - 1];
    const attrName = path.slice(atIdx + 1);

    const label = `Add @${attrName}`;
    const apply = (content: string) => {
        // Find opening tag of element and inject attribute if not present
        const openTagRegex = new RegExp(`<${elementName}(\s[^>]*)?>`);
        return content.replace(openTagRegex, (match, attrs) => {
            if (attrs && new RegExp(`\\s${attrName}=`).test(attrs)) return match; // already has it
            const insertion = attrs ? `${attrs} ${attrName}=""` : ` ${attrName}=""`;
            return `<${elementName}${insertion}>`;
        });
    };

    return { label, apply };
}

export function getQuickFixForMessage(message: string, xml: string): QuickFix | null {
    // Parse path out of standardized messages
    // Missing element: "Missing required element: 'Root.Child'"
    // Missing attribute: "Missing required attribute: 'Root.Child@attr'"
    const elemMatch = message.match(/Missing required element: '([^']+)'/);
    if (elemMatch) return makeMissingElementFix(elemMatch[1], xml);
    const attrMatch = message.match(/Missing required attribute: '([^']+)'/);
    if (attrMatch) return makeMissingAttributeFix(attrMatch[1], xml);
    return null;
}


