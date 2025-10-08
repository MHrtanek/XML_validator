import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

export function formatXml(xml: string, indentSize: number = 2): string {
    if (!xml || typeof xml !== 'string') return '';
    const input = xml.replace(/\r\n|\r/g, '\n').trim();

    // Preserve XML declaration if present
    const declMatch = input.match(/^<\?xml[^>]*\?>/);
    const declaration = declMatch ? declMatch[0] : '';
    const withoutDecl = declMatch ? input.slice(declMatch[0].length).trimStart() : input;

    try {
        // Validate before parse; if invalid, fall back to basic pretty-print
        const valid = XMLValidator.validate(input);
        if (valid !== true) throw new Error('invalid');

        const parser = new XMLParser({
            ignoreAttributes: false,
            parseTagValue: true,
            parseAttributeValue: false
        });

        const jsonObj = parser.parse(withoutDecl);

        const builder = new XMLBuilder({
            ignoreAttributes: false,
            suppressEmptyNode: false,
            format: true,
            indentBy: ' '.repeat(indentSize)
        });

        const built = builder.build(jsonObj).trim();
        const finalXml = (declaration ? declaration + '\n' : '') + built + '\n';
        return finalXml;
    } catch {
        // Fallback basic formatter: ensures clean line breaks and indentation
        const PSEUDO_TOKEN = '__XML__NEWLINE__TOKEN__';
        const normalized = withoutDecl.replace(/>\s+</g, '><');
        const withBreaks = normalized
            .replace(/>(<)(?!\/?\!)/g, `>${PSEUDO_TOKEN}$1`)
            .replace(/(\?>)(<)/g, `$1${PSEUDO_TOKEN}$2`);

        const lines = withBreaks.split(PSEUDO_TOKEN);
        const indentChar = ' '.repeat(indentSize);
        let level = 0;
        const out: string[] = [];

        for (const raw of lines) {
            if (!raw) continue;
            const line = raw.trim();
            const isClosing = /^<\//.test(line);
            const isSelfClosing = /\/>$/.test(line);
            const isOpening = /^<[^!?/][^>]*>$/.test(line) && !isSelfClosing;

            if (isClosing) level = Math.max(level - 1, 0);
            out.push(indentChar.repeat(level) + line);
            if (isOpening) level++;
        }

        return (declaration ? declaration + '\n' : '') + out.join('\n') + '\n';
    }
}


