import './Validation.css'
import { Editor } from "@monaco-editor/react"
import { useRef, useState } from 'react'

function Validation() {
    const fileInputRefLeft = useRef<HTMLInputElement>(null)
    const fileInputRefRight = useRef<HTMLInputElement>(null)
    const [code, setCode] = useState<string>("")
    const [result, setResult] = useState<string>("")
    const editorRef = useRef<any>(null)

    const handleFileImportLeft = () => {
        fileInputRefLeft.current?.click()
    }

    const handleFileImportRight = () => {
        fileInputRefRight.current?.click()
    }

    const handleFileChangeLeft = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setCode(content)
            }
            reader.readAsText(file)
        }
    }

    const handleFileChangeRight = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setResult(content)
                if (editorRef.current) {
                    editorRef.current.setValue(content)
                }
            }
            reader.readAsText(file)
        }
    }

    const handleSave = () => {
        const blob = new Blob([code], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document.xml'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleValidate = () => {
        try {
            if (result.trim() === '' || result === "//") {
                setCode("// Error :code is empty")
                return
            }
            if (result.includes('function') || result.includes('const') || result.includes('let')) {
                setCode("//  ")
            } else {
                setCode("// ")
            }
        } catch (error) {
            setCode(`// :\n// ${error}`)
        }
    }

    const handleClear = () => {
        setCode("// ")
        setResult("// ")
        if (editorRef.current) {
            editorRef.current.setValue("// ")
        }
        if (fileInputRefLeft.current) {
            fileInputRefLeft.current.value = ''
        }
        if (fileInputRefRight.current) {
            fileInputRefRight.current.value = ''
        }
    }

    const handleEditorChange = (value: string | undefined) => {
        setResult(value || "")
    }

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor
    }

    return (
        <>
            <div className="validation-container">
                <div className="header">
                    <h1>Validator</h1>
                    <div className="panel-btns">
                        <button
                            onClick={handleSave}
                            className="panel-btn panel-btn-primary"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleValidate}
                            className="panel-btn panel-btn-success"
                        >
                            Validate
                        </button>
                        <button
                            onClick={handleClear}
                            className="panel-btn panel-btn-secondary"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="editors-grid w-full max-w-[100vw] mx-auto">

                    <div className="editor-panel min-w-[1vw]">
                        <div className="panel-header panel-header-with-buttons">
                            <h3>.XSD docoment</h3>
                            <div className="panel-btns">
                                <button
                                    onClick={handleFileImportLeft}
                                    className="panel-btn panel-btn-primary"
                                >
                                    Import File
                                </button>
                            </div>
                        </div>
                        <div className="editor-wrapper">
                            <Editor
                                height="100%"
                                defaultLanguage="xml"
                                value={code}
                                theme="vs-dark"
                                options={{
                                    glyphMargin: true,
                                    folding: true,
                                    foldingHighlight: true,
                                    showFoldingControls: "mouseover",
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    lineDecorationsWidth: 10,
                                    readOnly: true
                                }}
                            />
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRefLeft}
                        onChange={handleFileChangeLeft}
                        style={{ display: 'none' }}
                        accept=".xsd"
                    />

                    <div className="editor-panel">
                        <div className="panel-header panel-header-with-buttons">
                            <h3>.xml document</h3>
                            <div className="panel-btns">
                                <button
                                    onClick={handleFileImportRight}
                                    className="panel-btn panel-btn-primary"
                                >
                                    Import File
                                </button>
                            </div>
                        </div>
                        <div className="editor-wrapper">
                            <Editor
                                height="100%"
                                defaultLanguage="xml"
                                value={result}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                theme="vs-dark"
                                options={{
                                    glyphMargin: true,
                                    minimap: { enabled: false },
                                    folding: true,
                                    foldingHighlight: true,
                                    showFoldingControls: "mouseover",
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    lineDecorationsWidth: 10,
                                }}
                            />
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRefRight}
                        onChange={handleFileChangeRight}
                        style={{ display: 'none' }}
                        accept=".xml"
                    />

                </div>
            </div>
        </>
    )
}

export default Validation