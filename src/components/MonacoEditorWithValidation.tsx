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
    onErrorGlyphClick?: (error: ValidationError, event: MouseEvent) => void;
    onContextMenu?: (lineNumber: number, event: MouseEvent) => void;
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
                                                       onErrorGlyphClick,
                                                       onContextMenu
                                                   }, ref) => {
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);
    const monacoRef = useRef<any>(null);
    const errorsRef = useRef<ValidationError[]>(errors);
    const onErrorGlyphClickRef = useRef(onErrorGlyphClick);
    const onContextMenuRef = useRef(onContextMenu);

    // Aktualizuj refs pri zmene
    useEffect(() => {
        errorsRef.current = errors;
        onErrorGlyphClickRef.current = onErrorGlyphClick;
        onContextMenuRef.current = onContextMenu;
    }, [errors, onErrorGlyphClick, onContextMenu]);

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
        
        // Pridáme click handler pre error glyph
        editor.onMouseDown((e: any) => {
            if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                const lineNumber = e.target.position?.lineNumber;
                if (lineNumber) {
                    const currentErrors = errorsRef.current;
                    const error = currentErrors.find(err => err.line === lineNumber);
                    if (error && onErrorGlyphClickRef.current) {
                        const mouseEvent = e.event?.browserEvent || new MouseEvent('click', {
                            clientX: e.event?.posx || 100,
                            clientY: e.event?.posy || 100,
                            bubbles: true,
                            cancelable: true
                        });
                        
                        onErrorGlyphClickRef.current(error, mouseEvent);
                    }
                }
            }
        });
        
        // Pridáme handler pre pravé tlačidlo myši (context menu)
        editor.onContextMenu((e: any) => {
            if (onContextMenuRef.current && e.target.position) {
                const lineNumber = e.target.position.lineNumber;
                const mouseEvent = e.event?.browserEvent || new MouseEvent('contextmenu', {
                    clientX: e.event?.posx || 100,
                    clientY: e.event?.posy || 100,
                    bubbles: true,
                    cancelable: true
                });
                
                // Prevent default context menu
                e.event?.preventDefault();
                
                onContextMenuRef.current(lineNumber, mouseEvent);
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
                readOnly: readOnly,
                contextmenu: false // Zakážeme default context menu
            }}
        />
    );
});

MonacoEditorWithValidation.displayName = 'MonacoEditorWithValidation';

export default MonacoEditorWithValidation;