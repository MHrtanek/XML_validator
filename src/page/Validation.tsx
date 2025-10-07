import './Validation.css';
import { Editor } from '@monaco-editor/react';
import { useValidation } from '../hooks/useValidation';
import { editorOptions, readOnlyEditorOptions } from '../config/editorConfig';

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
        handleEditorDidMount,
        error
    } = useValidation();

    return (
        <div className="validation-container">
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

            {state.validationResult && (
                <div className="validation-result">
                    <Editor
                        height="100px"
                        defaultLanguage="text"
                        value={state.validationResult}
                        theme="vs-dark"
                        options={readOnlyEditorOptions}
                    />
                </div>
            )}

            <div className="editors-grid">
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

                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3>XML Document</h3>
                        <div className="panel-btns">
                            <button onClick={() => importFile('right')} className="panel-btn panel-btn-primary">Import File</button>
                        </div>
                    </div>
                    <div className="editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            value={state.xml}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            theme="vs-dark"
                            options={{ ...editorOptions, minimap: { enabled: false } }}
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