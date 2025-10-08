import { useState, useCallback, useRef } from 'react';
import { ValidationState, FileType, ValidationError } from '../types/validation';
import { useFileOperations } from './useFileOperations';
import { useValidationLogic } from './useValidationLogic';
import { DEFAULT_FILE_NAMES } from '../config/editorConfig';

export const useValidation = () => {
    const [state, setState] = useState<ValidationState>({
        xsd: '',
        xml: '',
        validationResult: []
    });

    const editorRef = useRef<any>(null);

    const updateState = useCallback((updates: Partial<ValidationState>) => {
        setState((prev: ValidationState) => ({ ...prev, ...updates }));
    }, []);

    const { fileInputRefs, importFile, handleFileChange, saveFile } = useFileOperations();
    const { validateDocuments, error } = useValidationLogic(state.xsd, state.xml, (result: ValidationError[]) => updateState({ validationResult: result }));

    const loadFileContent = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: FileType) => {
        handleFileChange(event, (content: string, fileType: FileType) => {
            if (fileType === 'xsd') {
                updateState({ xsd: content });
            } else {
                updateState({ xml: content });
                editorRef.current?.setValue(content);
            }
        }, type);
    }, [handleFileChange, updateState]);

    const handleSave = useCallback(() => {
        const contentToSave = state.xml || state.xsd;
        const fileName = state.xml ? DEFAULT_FILE_NAMES.xml : DEFAULT_FILE_NAMES.xsd;
        saveFile(contentToSave, fileName);
    }, [state.xml, state.xsd, saveFile]);

    const handleValidate = useCallback(() => {
        validateDocuments();
    }, [validateDocuments]);

    const handleClear = useCallback(() => {
        updateState({ xsd: '', xml: '', validationResult: [] });
        editorRef.current?.setValue('');
        if (fileInputRefs.left.current) fileInputRefs.left.current.value = '';
        if (fileInputRefs.right.current) fileInputRefs.right.current.value = '';
    }, [updateState, fileInputRefs]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        updateState({ xml: value || '' });
    }, [updateState]);

    return {
        state,
        fileInputRefs,
        importFile,
        loadFileContent,
        handleSave,
        handleValidate,
        handleClear,
        handleEditorChange,
        error
    };
};