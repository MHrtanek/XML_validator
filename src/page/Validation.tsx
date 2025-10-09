import './Validation.css';
import { Editor } from '@monaco-editor/react';
import { Link } from 'react-router-dom';
import { useValidation } from '../hooks/useValidation';
import { editorOptions } from '../config/editorConfig';
import MonacoEditorWithValidation, { MonacoEditorRef } from "../components/MonacoEditorWithValidation";
import ValidationResults from "../components/ValidationResults";
import ErrorContextMenu from "../components/ErrorContextMenu";
import XmlContextMenu from "../components/XmlContextMenu";
import XsdContextMenu from "../components/XsdContextMenu";
import { useRef, useState, useEffect } from 'react';
import { extractElementName, findElementInXsd, findAllElementsInXsd } from '../utils/xsdNavigation';
import { findParentElementInXml, findElementInTypeContext, findElementWithXmlContext } from '../utils/xmlContextNavigation';
import { extractTypeAtPosition, findTypeDefinitionInXsd } from '../utils/xsdTypeNavigation';
import { commentOutElement, uncommentElement, isElementCommented } from '../utils/xmlCommentUtils';
import { removeElement, PossibleFix } from '../utils/xmlFixUtils';
import { formatXml } from '../utils/formatXml';
import { ValidationError } from '../types/validation';

const Validation: React.FC = () => {
    const xmlEditorRef = useRef<MonacoEditorRef>(null);
    const xsdEditorRef = useRef<any>(null);
    const xsdContentRef = useRef<string>('');
    const xmlContentRef = useRef<string>('');
    const xsdDecorationsRef = useRef<string[]>([]);
    
    const [errorContextMenu, setErrorContextMenu] = useState<{
        error: ValidationError;
        position: { x: number; y: number };
        xsdMatches: Array<{ line: number; context: string }>;
    } | null>(null);
    
    const [xmlContextMenu, setXmlContextMenu] = useState<{
        lineNumber: number;
        position: { x: number; y: number };
    } | null>(null);
    
    const [xsdContextMenu, setXsdContextMenu] = useState<{
        lineNumber: number;
        column: number;
        typeName: string;
        position: { x: number; y: number };
    } | null>(null);
    
    const {
        state,
        fileInputRefs,
        importFile,
        loadFileContent,
        handleSave,
        handleValidate,
        handleClear,
        handleEditorChange,
        handleXsdChange,
        handleFormatXml,
        handleFormatXsd,
        error
    } = useValidation();

    // Aktualizuj refs pri zmene state
    useEffect(() => {
        xsdContentRef.current = state.xsd;
        xmlContentRef.current = state.xml;
    }, [state.xsd, state.xml]);

    const handleLineClick = (lineNumber: number) => {
        xmlEditorRef.current?.goToLine(lineNumber);
    };

    const handleXsdEditorMount = (editor: any) => {
        xsdEditorRef.current = editor;
        
        // Pridáme handler pre pravé tlačidlo myši v XSD editore
        editor.onContextMenu((e: any) => {
            if (e.target.position) {
                const lineNumber = e.target.position.lineNumber;
                const column = e.target.position.column;
                const mouseEvent = e.event?.browserEvent || new MouseEvent('contextmenu', {
                    clientX: e.event?.posx || 100,
                    clientY: e.event?.posy || 100,
                    bubbles: true,
                    cancelable: true
                });
                
                e.event?.preventDefault();
                handleXsdContextMenuClick(lineNumber, column, mouseEvent);
            }
        });
    };

    const handleErrorGlyphClick = (error: ValidationError, event: MouseEvent) => {
        const elementName = extractElementName(error.message || '');
        if (!elementName || !error.line) {
            setErrorContextMenu({
                error,
                position: { x: event.clientX, y: event.clientY },
                xsdMatches: []
            });
            return;
        }
        
        let xsdMatches = findAllElementsInXsd(xsdContentRef.current, elementName);
        
        // Použijeme novú context-aware funkciu
        const contextLine = findElementWithXmlContext(
            xsdContentRef.current,
            xmlContentRef.current,
            elementName,
            error.line
        );
        
        if (contextLine) {
            // Preusporiadame matches - context-aware match bude prvý
            xsdMatches = xsdMatches.filter(m => m.line !== contextLine);
            
            // Nájdeme context pre tento riadok
            const lines = xsdContentRef.current.split('\n');
            let contextName = 'Best match (from XML context)';
            for (let i = contextLine - 2; i >= 0; i--) {
                const match = lines[i].match(/<xs:complexType\s+name=["']([^"']+)["']/i);
                if (match) {
                    contextName = match[1] + ' ⭐ (XML context)';
                    break;
                }
            }
            
            xsdMatches.unshift({ line: contextLine, context: contextName });
        }
        
        setErrorContextMenu({
            error,
            position: {
                x: event.clientX,
                y: event.clientY
            },
            xsdMatches
        });
    };

    const handleXmlContextMenu = (lineNumber: number, event: MouseEvent) => {
        setXmlContextMenu({
            lineNumber,
            position: {
                x: event.clientX,
                y: event.clientY
            }
        });
    };

    const handleXsdContextMenuClick = (lineNumber: number, column: number, event: MouseEvent) => {
        const xsdContent = xsdContentRef.current;
        const lines = xsdContent.split('\n');
        
        if (lineNumber < 1 || lineNumber > lines.length) {
            return;
        }
        
        const line = lines[lineNumber - 1];
        const typeName = extractTypeAtPosition(line, column);
        
        if (typeName) {
            setXsdContextMenu({
                lineNumber,
                column,
                typeName,
                position: {
                    x: event.clientX,
                    y: event.clientY
                }
            });
        }
    };

    const handleNavigateToType = () => {
        if (!xsdContextMenu || !state.xsd) return;
        
        const lineNumber = findTypeDefinitionInXsd(state.xsd, xsdContextMenu.typeName);
        if (lineNumber && xsdEditorRef.current) {
            const editor = xsdEditorRef.current;
            
            editor.revealLineInCenter(lineNumber);
            editor.setPosition({ lineNumber, column: 1 });
            editor.focus();
            
            // Zvýrazni riadok natrvalo (odstránime predchádzajúce)
            import('monaco-editor').then(monaco => {
                const newDecorations = editor.deltaDecorations(xsdDecorationsRef.current, [
                    {
                        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                        options: {
                            isWholeLine: true,
                            className: 'highlighted-line',
                            glyphMarginClassName: 'highlighted-line-glyph'
                        }
                    }
                ]);
                xsdDecorationsRef.current = newDecorations;
            });
            
        }
    };

    const handleNavigateToXsd = (lineNumber?: number) => {
        if (!errorContextMenu || !xsdEditorRef.current) return;
        
        let targetLine = lineNumber;
        
        // Ak nemáme explicitný line number, použijeme prvý match
        if (!targetLine) {
            if (errorContextMenu.xsdMatches.length > 0) {
                targetLine = errorContextMenu.xsdMatches[0].line;
            } else {
                // Fallback na staré správanie
                const elementName = extractElementName(errorContextMenu.error.message || '');
                if (!elementName) return;
                const foundLine = findElementInXsd(xsdContentRef.current, elementName);
                if (!foundLine) return;
                targetLine = foundLine;
            }
        }
        
        if (targetLine && xsdEditorRef.current) {
            const editor = xsdEditorRef.current;
            
            // Naviguj na riadok
            editor.revealLineInCenter(targetLine);
            editor.setPosition({ lineNumber: targetLine, column: 1 });
            editor.focus();
            
            // Zvýrazni riadok natrvalo (odstránime predchádzajúce)
            import('monaco-editor').then(monaco => {
                const newDecorations = editor.deltaDecorations(xsdDecorationsRef.current, [
                    {
                        range: new monaco.Range(targetLine!, 1, targetLine!, 1),
                        options: {
                            isWholeLine: true,
                            className: 'highlighted-line',
                            glyphMarginClassName: 'highlighted-line-glyph'
                        }
                    }
                ]);
                xsdDecorationsRef.current = newDecorations;
            });
            
        }
    };

    const handleCommentElement = () => {
        if (!xmlContextMenu) return;
        
        const lineNumber = xmlContextMenu.lineNumber;
        const isCommented = isElementCommented(state.xml, lineNumber);
        
        let result: string | null;
        if (isCommented) {
            result = uncommentElement(state.xml, lineNumber);
            if (result) {
                handleEditorChange(result);
            }
        } else {
            result = commentOutElement(state.xml, lineNumber);
            if (result) {
                handleEditorChange(result);
            }
        }
    };

    const handleApplyFix = (fix: PossibleFix) => {
        if (!errorContextMenu || !errorContextMenu.error.line) return;
        
        const lineNumber = errorContextMenu.error.line;
        let result: string | null = null;
        
        switch (fix.action) {
            case 'remove':
                result = removeElement(state.xml, lineNumber);
                if (result) {
                    const formatted = formatXml(result);
                    handleEditorChange(formatted);
                }
                break;
            case 'comment':
                result = commentOutElement(state.xml, lineNumber);
                if (result) {
                    handleEditorChange(result);
                }
                break;
        }
    };

    return (
        <div className="validation-container">
            {errorContextMenu && (
                <ErrorContextMenu
                    error={errorContextMenu.error}
                    position={errorContextMenu.position}
                    xsdMatches={errorContextMenu.xsdMatches}
                    onClose={() => setErrorContextMenu(null)}
                    onNavigateToXsd={handleNavigateToXsd}
                    onApplyFix={handleApplyFix}
                />
            )}
            
            {xmlContextMenu && (
                <XmlContextMenu
                    lineNumber={xmlContextMenu.lineNumber}
                    position={xmlContextMenu.position}
                    isCommented={isElementCommented(state.xml, xmlContextMenu.lineNumber)}
                    onClose={() => setXmlContextMenu(null)}
                    onCommentElement={handleCommentElement}
                />
            )}
            
            {xsdContextMenu && (
                <XsdContextMenu
                    lineNumber={xsdContextMenu.lineNumber}
                    typeName={xsdContextMenu.typeName}
                    position={xsdContextMenu.position}
                    onClose={() => setXsdContextMenu(null)}
                    onNavigateToType={handleNavigateToType}
                />
            )}
            
            <div className="header">
                <div className="header-left">
                    <Link to="/" className="header-home-link">XML Tools</Link>
                    <h1>Validator</h1>
                    <Link to="/compare" className="header-nav-link">Compare</Link>
                </div>
                <div className="panel-btns">
                    <button onClick={handleSave} className="panel-btn panel-btn-primary">Save</button>
                    <button onClick={handleValidate} className="panel-btn panel-btn-success">Validate</button>
                    <button onClick={handleClear} className="panel-btn panel-btn-secondary">Reset</button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {state.validationResult.length > 0 && (
                <div className="validation-result" role="region" aria-label="Validation results">
                    <ValidationResults 
                        errors={state.validationResult}
                        onLineClick={handleLineClick}
                    />
                </div>
            )}

            <div className="editors-grid">
                {/* ĽAVÝ PANEL - XSD (pôvodný Editor) */}
                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3 id="xsd-editor-label">XSD Schema</h3>
                        <div className="panel-btns">
                            <button onClick={() => importFile('left')} className="panel-btn panel-btn-primary">Import File</button>
                            <button onClick={handleFormatXsd} className="panel-btn panel-btn-secondary">Format</button>
                        </div>
                    </div>
                    <div className="editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            value={state.xsd}
                            onChange={handleXsdChange}
                            theme="vs-dark"
                            options={{ ...editorOptions, readOnly: false, contextmenu: false }}
                            aria-label="XSD editor"
                            onMount={handleXsdEditorMount}
                        />
                    </div>
                </div>

                {/* PRAVÝ PANEL - XML (NÁŠ NOVÝ KOMPONENT) */}
                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3 id="xml-editor-label">XML Document</h3>
                        <div className="panel-btns">
                            <button onClick={() => importFile('right')} className="panel-btn panel-btn-primary">Import File</button>
                            <button onClick={handleFormatXml} className="panel-btn panel-btn-secondary">Format</button>
                        </div>
                    </div>
                    <div className="editor-wrapper">
                        <MonacoEditorWithValidation
                            ref={xmlEditorRef}
                            value={state.xml}
                            onChange={handleEditorChange}
                            language="xml"
                            height="100%"
                            errors={state.validationResult.filter(err => err.line)}
                            readOnly={false}
                            theme="vs-dark"
                            onErrorGlyphClick={handleErrorGlyphClick}
                            onContextMenu={handleXmlContextMenu}
                        />
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRefs.left}
                    onChange={(e) => loadFileContent(e, 'xsd')}
                    style={{ display: 'none' }}
                    accept=".xsd"
                />
                <input
                    type="file"
                    ref={fileInputRefs.right}
                    onChange={(e) => loadFileContent(e, 'xml')}
                    style={{ display: 'none' }}
                    accept=".xml"
                />
            </div>
        </div>
    );
};

export default Validation;