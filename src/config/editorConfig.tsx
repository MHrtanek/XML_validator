export const editorOptions = {
    glyphMargin: true,
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover' as const,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    lineDecorationsWidth: 10,
    minimap: { enabled: false }
};

export const readOnlyEditorOptions = {
    readOnly: true,
    lineNumbers: 'off' as const,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    selectionHighlight: true,
    occurrencesHighlight: 'off' as const,
    renderLineHighlight: 'none' as const,
    contextmenu: true,
    quickSuggestions: false,
    links: false
};

export const DEFAULT_FILE_NAMES = {
    xsd: 'schema.xsd',
    xml: 'document.xml'
} as const;