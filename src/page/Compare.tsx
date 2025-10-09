import './Compare.css';
import { DiffEditor } from '@monaco-editor/react';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import { formatXml } from '../utils/formatXml';

const Compare: React.FC = () => {
    const [leftXml, setLeftXml] = useState('');
    const [rightXml, setRightXml] = useState('');
    const leftFileInputRef = useRef<HTMLInputElement>(null);
    const rightFileInputRef = useRef<HTMLInputElement>(null);
    const diffEditorRef = useRef<any>(null);

    const importFile = (side: 'left' | 'right') => {
        if (side === 'left' && leftFileInputRef.current) {
            leftFileInputRef.current.click();
        } else if (side === 'right' && rightFileInputRef.current) {
            rightFileInputRef.current.click();
        }
    };

    const loadFileContent = (event: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const formatted = formatXml(content);
            
            if (side === 'left') {
                setLeftXml(formatted);
            } else {
                setRightXml(formatted);
            }
        };
        reader.readAsText(file);
    };

    const handleFormat = (side: 'left' | 'right') => {
        if (side === 'left') {
            setLeftXml(formatXml(leftXml));
        } else {
            setRightXml(formatXml(rightXml));
        }
    };

    const handleClear = () => {
        setLeftXml('');
        setRightXml('');
        if (leftFileInputRef.current) leftFileInputRef.current.value = '';
        if (rightFileInputRef.current) rightFileInputRef.current.value = '';
    };

    return (
        <div className="compare-container">
            <div className="header">
                <div className="header-left">
                    <Link to="/" className="header-home-link">XML Tools</Link>
                    <h1>Compare</h1>
                    <Link to="/validation" className="header-nav-link">Validator</Link>
                </div>
                <div className="panel-btns">
                    <button onClick={() => importFile('left')} className="panel-btn panel-btn-primary">Import Left</button>
                    <button onClick={() => importFile('right')} className="panel-btn panel-btn-primary">Import Right</button>
                    <button onClick={() => handleFormat('left')} className="panel-btn panel-btn-secondary">Format Left</button>
                    <button onClick={() => handleFormat('right')} className="panel-btn panel-btn-secondary">Format Right</button>
                    <button onClick={handleClear} className="panel-btn panel-btn-secondary">Reset</button>
                </div>
            </div>

            <div className="diff-editor-container">
                <DiffEditor
                    height="calc(100vh - 80px)"
                    language="xml"
                    original={leftXml}
                    modified={rightXml}
                    theme="vs-dark"
                    options={{
                        readOnly: false,
                        renderSideBySide: true,
                        enableSplitViewResizing: true,
                        renderOverviewRuler: true,
                        scrollBeyondLastLine: false,
                        minimap: { enabled: true },
                        originalEditable: true,
                        diffWordWrap: 'on',
                        ignoreTrimWhitespace: false
                    }}
                    onMount={(editor) => { diffEditorRef.current = editor; }}
                />
            </div>

            <input
                type="file"
                ref={leftFileInputRef}
                onChange={(e) => loadFileContent(e, 'left')}
                style={{ display: 'none' }}
                accept=".xml"
            />
            <input
                type="file"
                ref={rightFileInputRef}
                onChange={(e) => loadFileContent(e, 'right')}
                style={{ display: 'none' }}
                accept=".xml"
            />
        </div>
    );
};

export default Compare;

