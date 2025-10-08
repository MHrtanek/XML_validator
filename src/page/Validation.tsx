import './Validation.css';
import { Editor } from '@monaco-editor/react';
import { useValidation } from '../hooks/useValidation';
import { editorOptions, readOnlyEditorOptions } from '../config/editorConfig';
import MonacoEditorWithValidation from "../components/MonacoEditorWithValidation";

const Validation: React.FC = () => {
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


    const validationResultText = state.validationResult
        .map(error => error.line ? `• Line ${error.line}: ${error.message}` : `• ${error.message}`)
        .join('\n');

    return (
        <div className="validation-container">
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
                    <Editor
                        height="100px"
                        defaultLanguage="text"
                        value={validationResultText}
                        theme="vs-dark"
                        options={readOnlyEditorOptions}
                    />
                    <div className="quickfix-list" aria-live="polite">
                        {state.validationResult.map((err, idx) => (
                            <div key={idx} className="quickfix-item">
                                <span>{err.line ? `Line ${err.line}: ` : ''}{err.message}</span>
                                <button
                                    className="panel-btn panel-btn-secondary"
                                    onClick={() => applyQuickFix(err.message)}
                                    aria-label="Apply quick fix"
                                >
                                    Quick Fix
                                </button>
                            </div>
                        ))}
                    </div>
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
                            value={state.xml}
                            onChange={handleEditorChange}
                            language="xml"
                            height="100%"
                            errors={state.validationResult.filter(err => err.line)}
                            readOnly={false}
                            theme="vs-dark"
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