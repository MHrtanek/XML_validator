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
        error
    } = useValidation();

    console.log('Validation errors:', state.validationResult);
    console.log('Errors with lines:', state.validationResult.filter(err => err.line));

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
                    <button onClick={handleClear} className="panel-btn panel-btn-secondary">Clear</button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {state.validationResult.length > 0 && (
                <div className="validation-result">
                    <Editor
                        height="100px"
                        defaultLanguage="text"
                        value={validationResultText}
                        theme="vs-dark"
                        options={readOnlyEditorOptions}
                    />
                </div>
            )}

            <div className="editors-grid">
                {/* ĽAVÝ PANEL - XSD (pôvodný Editor) */}
                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3>XSD Schema</h3>
                        <div className="panel-btns">
                            <button onClick={() => importFile('left')} className="panel-btn panel-btn-primary">Import File</button>
                        </div>
                    </div>
                    <div className="editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            value={state.xsd}
                            onChange={(value) => handleEditorChange(value)}
                            theme="vs-dark"
                            options={{ ...editorOptions, readOnly: false }}
                        />
                    </div>
                </div>

                {/* PRAVÝ PANEL - XML (NÁŠ NOVÝ KOMPONENT) */}
                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3>XML Document</h3>
                        <div className="panel-btns">
                            <button onClick={() => importFile('right')} className="panel-btn panel-btn-primary">Import File</button>
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