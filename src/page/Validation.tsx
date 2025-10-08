import './Validation.css';
import { Editor } from '@monaco-editor/react';
import { useValidation } from '../hooks/useValidation';
import { editorOptions } from '../config/editorConfig';
import MonacoEditorWithValidation, { MonacoEditorRef } from "../components/MonacoEditorWithValidation";
import ValidationResults from "../components/ValidationResults";
import ErrorContextMenu from "../components/ErrorContextMenu";
import { useRef, useState } from 'react';
import { extractElementName, findElementInXsd } from '../utils/xsdNavigation';
import { commentOutElement } from '../utils/xmlCommentUtils';
import { ValidationError } from '../types/validation';

const Validation: React.FC = () => {
    const xmlEditorRef = useRef<MonacoEditorRef>(null);
    const xsdEditorRef = useRef<any>(null);
    const [contextMenu, setContextMenu] = useState<{
        error: ValidationError;
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
        loadSampleXml,
        loadSampleXsd,
        error
    } = useValidation();


    const handleLineClick = (lineNumber: number) => {
        xmlEditorRef.current?.goToLine(lineNumber);
    };

    const handleXsdEditorMount = (editor: any) => {
        xsdEditorRef.current = editor;
    };

    const handleErrorGlyphClick = (error: ValidationError, event: MouseEvent) => {
        setContextMenu({
            error,
            position: {
                x: event.clientX,
                y: event.clientY
            }
        });
    };

    const handleNavigateToXsd = () => {
        if (!contextMenu || !contextMenu.error.message || !state.xsd) return;
        
        const elementName = extractElementName(contextMenu.error.message);
        if (!elementName) {
            console.log('Could not extract element name from error:', contextMenu.error.message);
            return;
        }
        
        console.log('Looking for element:', elementName, 'in XSD');
        
        const lineNumber = findElementInXsd(state.xsd, elementName);
        if (lineNumber && xsdEditorRef.current) {
            xsdEditorRef.current.revealLineInCenter(lineNumber);
            xsdEditorRef.current.setPosition({ lineNumber, column: 1 });
            xsdEditorRef.current.focus();
            console.log('Navigated to line', lineNumber, 'in XSD');
        } else {
            console.log('Element not found in XSD:', elementName);
        }
    };

    const handleCommentElement = () => {
        if (!contextMenu || !contextMenu.error.line) return;
        
        const commented = commentOutElement(state.xml, contextMenu.error.line);
        if (commented) {
            handleEditorChange(commented);
            console.log('Element commented out on line', contextMenu.error.line);
        } else {
            console.log('Could not comment out element on line', contextMenu.error.line);
        }
    };

    return (
        <div className="validation-container">
            {contextMenu && (
                <ErrorContextMenu
                    error={contextMenu.error}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                    onNavigateToXsd={handleNavigateToXsd}
                    onCommentElement={handleCommentElement}
                />
            )}
            
            {/* Header zostáva rovnaký */}
            <div className="header">
                <h1>XML/XSD Validator</h1>
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
                            <button onClick={loadSampleXsd} className="panel-btn panel-btn-secondary">Load Sample</button>
                        </div>
                    </div>
                    <div className="editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            value={state.xsd}
                            onChange={handleXsdChange}
                            theme="vs-dark"
                            options={{ ...editorOptions, readOnly: false }}
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
                            <button onClick={loadSampleXml} className="panel-btn panel-btn-secondary">Load Sample</button>
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