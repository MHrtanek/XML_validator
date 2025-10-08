import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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
    onErrorGlyphClick?: (error: ValidationError) => void;
}

export interface MonacoEditorRef {
    goToLine: (line: number) => void;
}

const MonacoEditorWithValidation = forwardRef<MonacoEditorRef, Props>(({
                                                       value,
                                                       onChange,
                                                       language = "xml",
                                                       errors = [],
                                                       readOnly = false,
                                                       height = "100%",
                                                       theme = "vs-dark",
                                                       onErrorGlyphClick
                                                   }, ref) => {
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);
    const monacoRef = useRef<any>(null);
    const errorsRef = useRef<ValidationError[]>(errors);
    const onErrorGlyphClickRef = useRef(onErrorGlyphClick);

    // Aktualizuj refs pri zmene
    useEffect(() => {
        errorsRef.current = errors;
        onErrorGlyphClickRef.current = onErrorGlyphClick;
    }, [errors, onErrorGlyphClick]);

    useImperativeHandle(ref, () => ({
        goToLine: (line: number) => {
            if (editorRef.current) {
                editorRef.current.revealLineInCenter(line);
                editorRef.current.setPosition({ lineNumber: line, column: 1 });
                editorRef.current.focus();
            }
        }
    }));

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        updateDecorations(editor, monaco, errors);
        
        // Pridáme click handler pre error glyph - používame ref aby sme mali vždy aktuálne errors
        editor.onMouseDown((e: any) => {
            console.log('Mouse down event:', e.target.type, monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN);
            
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                console.log('Clicked on glyph margin!');
                const lineNumber = e.target.position?.lineNumber;
                if (lineNumber) {
                    const currentErrors = errorsRef.current;
                    console.log('Current errors:', currentErrors);
                    const error = currentErrors.find(err => err.line === lineNumber);
                    console.log('Found error for line', lineNumber, ':', error);
                    if (error && onErrorGlyphClickRef.current) {
                        onErrorGlyphClickRef.current(error);
                    }
                }
            }
        });
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
});

MonacoEditorWithValidation.displayName = 'MonacoEditorWithValidation';

export default MonacoEditorWithValidation;