import './Validation.css';
import { Editor } from '@monaco-editor/react';
import { useRef, useState, useCallback } from 'react';
import { XMLValidator, XMLParser } from 'fast-xml-parser';

interface ValidationState {
    xsd: string;
    xml: string;
    validationResult: string;
}

interface ValidationError {
    message: string;
    line?: number;
    column?: number;
}

const useValidation = () => {
    const [state, setState] = useState<ValidationState>({
        xsd: '',
        xml: '',
        validationResult: ''
    });

    const fileInputRefLeft = useRef<HTMLInputElement>(null);
    const fileInputRefRight = useRef<HTMLInputElement>(null);
    const editorRef = useRef<any>(null);

    const updateState = useCallback((updates: Partial<ValidationState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const handleFileImport = useCallback((type: 'left' | 'right') => {
        const ref = type === 'left' ? fileInputRefLeft : fileInputRefRight;
        ref.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'xsd' | 'xml') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (type === 'xsd') {
                updateState({ xsd: content });
            } else {
                updateState({ xml: content });
                editorRef.current?.setValue(content);
            }
        };
        reader.readAsText(file);
    }, [updateState]);

    const handleSave = useCallback(() => {
        const contentToSave = state.xml || state.xsd;
        const fileName = state.xml ? 'document.xml' : 'schema.xsd';

        const blob = new Blob([contentToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [state.xml, state.xsd]);

    const findLineNumber = useCallback((xmlContent: string, elementPath: string): number => {
        if (!xmlContent) return -1;

        const pathParts = elementPath.split(/[.@]/).filter(part => part.length > 0);
        if (pathParts.length === 0) return -1;

        const lines = xmlContent.split('\n');
        let currentElement = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const targetElement = pathParts[pathParts.length - 1];
            const elementRegex = new RegExp(`<${targetElement}[\\s>]`);

            if (elementRegex.test(line)) {
                return i + 1;
            }
        }

        return -1;
    }, []);

    const validateValue = useCallback((value: any, type: string, path: string, xmlContent: string): ValidationError[] => {
        const errors: ValidationError[] = [];
        const numValue = Number(value);

        const validators = {
            'xs:integer': () => isNaN(numValue) || !Number.isInteger(numValue),
            'xs:decimal': () => isNaN(numValue),
            'xs:boolean': () => !['true', 'false', '1', '0'].includes(value.toLowerCase()),
            'xs:date': () => isNaN(new Date(value).getTime()),
            'xs:dateTime': () => isNaN(new Date(value).getTime()),
            'xs:positiveInteger': () => isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0,
            'xs:negativeInteger': () => isNaN(numValue) || !Number.isInteger(numValue) || numValue >= 0,
            'xs:nonNegativeInteger': () => isNaN(numValue) || !Number.isInteger(numValue) || numValue < 0,
            'xs:string': () => typeof value !== 'string'
        };

        if (validators[type as keyof typeof validators]?.()) {
            const lineNumber = findLineNumber(xmlContent, path);
            errors.push({
                message: `Element '${path}' should be ${type.replace('xs:', '')}, but got: '${value}'`,
                line: lineNumber > 0 ? lineNumber : undefined
            });
        }

        return errors;
    }, [findLineNumber]);

    const validateElement = useCallback((xmlElem: any, xsdElem: any, errors: ValidationError[], path: string, xmlContent: string) => {
        if (xsdElem['xs:complexType']?.['xs:sequence']) {
            const elements = [].concat(xsdElem['xs:complexType']['xs:sequence']['xs:element']);

            elements.forEach((elemDef: any) => {
                const elemName = elemDef['@_name'];
                const elemType = elemDef['@_type'];
                const currentPath = `${path}.${elemName}`;

                if (xmlElem[elemName] === undefined) {
                    const lineNumber = findLineNumber(xmlContent, path);
                    errors.push({
                        message: `Missing required element: '${currentPath}'`,
                        line: lineNumber > 0 ? lineNumber : undefined
                    });
                } else if (elemDef['xs:complexType']) {
                    validateElement(xmlElem[elemName], elemDef, errors, currentPath, xmlContent);
                } else {
                    errors.push(...validateValue(xmlElem[elemName], elemType, currentPath, xmlContent));
                }
            });
        }

        if (xsdElem['xs:complexType']?.['xs:attribute']) {
            const attributes = [].concat(xsdElem['xs:complexType']['xs:attribute']);

            attributes.forEach((attrDef: any) => {
                const attrName = attrDef['@_name'];
                const attrType = attrDef['@_type'];
                const isRequired = attrDef['@_use'] === 'required';
                const currentPath = `${path}@${attrName}`;

                if (!xmlElem['@_']?.[attrName]) {
                    if (isRequired) {
                        const lineNumber = findLineNumber(xmlContent, path);
                        errors.push({
                            message: `Missing required attribute: '${currentPath}'`,
                            line: lineNumber > 0 ? lineNumber : undefined
                        });
                    }
                } else {
                    errors.push(...validateValue(xmlElem['@_'][attrName], attrType, currentPath, xmlContent));
                }
            });
        }
    }, [validateValue, findLineNumber]);

    const validateXmlAgainstXsd = useCallback((xmlObj: any, xsdObj: any, xmlContent: string): ValidationError[] => {
        const errors: ValidationError[] = [];
        const rootElement = xsdObj['xs:schema']?.['xs:element'];

        if (!rootElement) {
            errors.push({
                message: 'Invalid XSD structure: missing schema or root element'
            });
            return errors;
        }

        const rootName = rootElement['@_name'];
        if (!xmlObj[rootName]) {
            const lineNumber = findLineNumber(xmlContent, rootName);
            errors.push({
                message: `Missing root element: '${rootName}'`,
                line: lineNumber > 0 ? lineNumber : undefined
            });
            return errors;
        }

        validateElement(xmlObj[rootName], rootElement, errors, rootName, xmlContent);
        return errors;
    }, [validateElement, findLineNumber]);

    const handleValidate = useCallback(() => {
        try {
            updateState({ validationResult: 'Validating...' });

            if (!state.xsd.trim() || !state.xml.trim()) {
                updateState({ validationResult: `Error: ${!state.xsd.trim() ? 'XSD schema' : 'XML document'} is empty` });
                return;
            }

            const xsdValidation = XMLValidator.validate(state.xsd);
            const xmlValidation = XMLValidator.validate(state.xml);

            if (xsdValidation !== true) {
                const lineInfo = xsdValidation?.err?.line ? `Line ${xsdValidation.err.line}: ` : '';
                updateState({ validationResult: `XSD Schema Error:\n${lineInfo}${xsdValidation?.err?.msg || 'Invalid XSD syntax'}` });
                return;
            }

            if (xmlValidation !== true) {
                const lineInfo = xmlValidation?.err?.line ? `Line ${xmlValidation.err.line}: ` : '';
                updateState({ validationResult: `XML Document Error:\n${lineInfo}${xmlValidation?.err?.msg || 'Invalid XML syntax'}` });
                return;
            }

            const parser = new XMLParser({
                ignoreAttributes: false,
                parseTagValue: true,
                parseAttributeValue: true
            });

            const xsdObj = parser.parse(state.xsd);
            const xmlObj = parser.parse(state.xml);
            const validationErrors = validateXmlAgainstXsd(xmlObj, xsdObj, state.xml);

            if (validationErrors.length === 0) {
                updateState({ validationResult: 'VALIDATION SUCCESSFUL\n══════════════════\n- XSD syntax: Valid\n- XML syntax: Valid\n- XSD validation: Valid' });
            } else {
                const errorDetails = validationErrors.map(err =>
                    err.line ? `• Line ${err.line}: ${err.message}` : `• ${err.message}`
                ).join('\n');

                updateState({
                    validationResult: `VALIDATION FAILED\n══════════════════\n- XSD syntax: Valid\n- XML syntax: Valid\n- Validation errors:\n${errorDetails}`
                });
            }

        } catch (error: any) {
            updateState({ validationResult: `Validation error:\n${error.message || error}` });
        }
    }, [state.xsd, state.xml, updateState, validateXmlAgainstXsd]);

    const handleClear = useCallback(() => {
        updateState({ xsd: '', xml: '', validationResult: '' });
        editorRef.current?.setValue('');
        fileInputRefLeft.current && (fileInputRefLeft.current.value = '');
        fileInputRefRight.current && (fileInputRefRight.current.value = '');
    }, [updateState]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        updateState({ xml: value || '' });
    }, [updateState]);

    const handleEditorDidMount = useCallback((editor: any) => {
        editorRef.current = editor;
    }, []);

    return {
        state,
        fileInputRefLeft,
        fileInputRefRight,
        editorRef,
        handleFileImport,
        handleFileChange,
        handleSave,
        handleValidate,
        handleClear,
        handleEditorChange,
        handleEditorDidMount
    };
};

const Validation: React.FC = () => {
    const {
        state,
        fileInputRefLeft,
        fileInputRefRight,
        editorRef,
        handleFileImport,
        handleFileChange,
        handleSave,
        handleValidate,
        handleClear,
        handleEditorChange,
        handleEditorDidMount
    } = useValidation();

    const editorOptions = {
        glyphMargin: true,
        folding: true,
        foldingHighlight: true,
        showFoldingControls: 'mouseover' as const,
        lineNumbers: 'on' as const,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        lineDecorationsWidth: 10
    };

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

            {state.validationResult && (
                <div className="validation-result">
                    <Editor
                        height="100px"
                        defaultLanguage="text"
                        value={state.validationResult}
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            lineNumbers: 'off',
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on'
                        }}
                    />
                </div>
            )}

            <div className="editors-grid">
                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3>XSD Schema</h3>
                        <div className="panel-btns">
                            <button onClick={() => handleFileImport('left')} className="panel-btn panel-btn-primary">Import File</button>
                        </div>
                    </div>
                    <div className="editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            value={state.xsd}
                            onChange={(value) => state.xsd !== value && handleEditorChange(value)}
                            theme="vs-dark"
                            options={{ ...editorOptions, readOnly: false }}
                        />
                    </div>
                </div>

                <div className="editor-panel">
                    <div className="panel-header panel-header-with-buttons">
                        <h3>XML Document</h3>
                        <div className="panel-btns">
                            <button onClick={() => handleFileImport('right')} className="panel-btn panel-btn-primary">Import File</button>
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

                <input type="file" ref={fileInputRefLeft} onChange={(e) => handleFileChange(e, 'xsd')} style={{ display: 'none' }} accept=".xsd" />
                <input type="file" ref={fileInputRefRight} onChange={(e) => handleFileChange(e, 'xml')} style={{ display: 'none' }} accept=".xml" />
            </div>
        </div>
    );
};

export default Validation;