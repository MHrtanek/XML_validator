import { useEffect, useRef } from "react";
import { ValidationError } from '../types/validation';
import './MonacoEditorWithValidation.css';

interface Props {
    value: string;
    onChange?: (value: string) => void;
    language?: string;
    errors?: ValidationError[];
    readOnly?: boolean;
    height?: string | number;
}

export default function MonacoEditorWithValidation({
                                                       value,
                                                       onChange,
                                                       language = "xml",
                                                       errors = [],
                                                       readOnly = false,
                                                       height = "100%"
                                                   }: Props) {
    const editorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const decorationsRef = useRef<string[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        const initEditor = async () => {
            const monaco = await import('monaco-editor');

            const editor = monaco.editor.create(containerRef.current!, {
                value: value,
                language: language,
                glyphMargin: true,
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: readOnly,
                theme: "vs-dark"
            });

            editorRef.current = editor;

            if (onChange) {
                editor.onDidChangeModelContent(() => {
                    onChange(editor.getValue());
                });
            }
        };

        initEditor();

        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, [language, readOnly]);

    useEffect(() => {
        if (!editorRef.current) return;

        const initDecorations = async () => {
            const monaco = await import('monaco-editor');
            const editor = editorRef.current;
            const model = editor.getModel();

            if (!model) return;

            if (decorationsRef.current.length > 0) {
                editor.deltaDecorations(decorationsRef.current, []);
                decorationsRef.current = [];
            }

            if (errors.length > 0) {
                const newDecorations: any[] = [];

                errors.forEach((error) => {
                    if (error.line && error.message) {
                        const lineNumber = error.line;

                        if (lineNumber <= model.getLineCount()) {
                            const hover = {
                                value: error.message
                            };

                            const decoration = {
                                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                                options: {
                                    isWholeLine: true,
                                    glyphMarginClassName: "errorGlyph",
                                    glyphMarginHoverMessage: [hover],
                                    className: "errorLine",
                                    hoverMessage: [hover]
                                }
                            };

                            newDecorations.push(decoration);
                        }
                    }
                });

                if (newDecorations.length > 0) {
                    decorationsRef.current = editor.deltaDecorations([], newDecorations);
                }
            }
        };

        initDecorations();
    }, [errors]);

    useEffect(() => {
        if (!editorRef.current || editorRef.current.getValue() === value) return;
        editorRef.current.setValue(value);
    }, [value]);

    return (
        <div
            ref={containerRef}
            style={{
                height: height,
                width: "100%",
                border: readOnly ? "none" : "1px solid #464647"
            }}
        />
    );
}