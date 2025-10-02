import './Validation.css'
import { Editor } from "@monaco-editor/react"

function Validation() {
    return (
        <>
            <div className="validation-container">
                <div className="header">
                    <h1>Validator</h1>
                    <div className="btn-container">
                        <button className="btn btn-primary">Save</button>
                        <button className="btn btn-success">Validate</button>
                        <button className="btn btn-secondary">Clear</button>
                    </div>
                </div>

                <div className="editors-grid w-full max-w-[100vw] mx-auto">

                    <div className="editor-panel min-w-[1vw]">
                        <div className="panel-header">
                            <h3>Input Code</h3>
                        </div>
                        <div className="editor-wrapper">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                defaultValue="// Write your code here"
                                theme="vs-dark"
                            />
                        </div>
                    </div>

                    <div className="editor-panel">
                        <div className="panel-header">
                            <h3>Validation Result</h3>
                        </div>
                        <div className="editor-wrapper">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                defaultValue="// Results will appear here"
                                theme="vs-dark"
                                options={{ readOnly: true }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}

export default Validation