import { useEffect, useRef } from "react";
import { ValidationError } from '../types/validation';
import './MonacoEditorWithValidation.css';
import { Editor } from '@monaco-editor/react';

interface Props {
    value: string;
    onChange?: (value: string | undefined) => void;
    language?: string;
    errors?: ValidationError[];
    readOnly?: boolean;
    height?: string | number;
    theme?: string;
}

export default function MonacoEditorWithValidation({
                                                       value,
                                                       onChange,
                                                       language = "xml",
                                                       errors = [],
                                                       readOnly = false,
                                                       height = "100%",
                                                       theme = "vs-dark"
                                                   }: Props) {
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        updateDecorations(editor, monaco, errors);
    };

    const updateDecorations = (editor: any, monaco: any, errorList: ValidationError[]) => {
        const model = editor.getModel();
        if (!model) return;

        const newDecorations: any[] = [];

        errorList.forEach((error) => {
            if (error.line && error.message) {
                const lineNumber = error.line;
                if (lineNumber <= model.getLineCount()) {
                    const hover = { value: error.message };
                    newDecorations.push({
                        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                        options: {
                            isWholeLine: true,
                            glyphMarginClassName: "errorGlyph",
                            glyphMarginHoverMessage: [hover],
                            className: "errorLine",
                            hoverMessage: [hover]
                        }
                    });
                }
            }
        });

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    };

    useEffect(() => {
        if (!editorRef.current) return;

        import('monaco-editor').then(monaco => {
            updateDecorations(editorRef.current, monaco, errors);
        });
    }, [errors]);

    return (
        <Editor
            height={height}
            language={language}
            value={value}
            onChange={onChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
                glyphMargin: true,
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: readOnly
            }}
        />
    );
}