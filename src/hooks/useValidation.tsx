import { useState, useCallback } from 'react';
import { ValidationState, FileType, ValidationError } from '../types/validation';
import { useFileOperations } from './useFileOperations';
import { useValidationLogic } from './useValidationLogic';
import { DEFAULT_FILE_NAMES } from '../config/editorConfig';
import { formatXml } from '../utils/formatXml';
import { getQuickFixForMessage } from '../utils/quickFixUtils';

export const useValidation = () => {
    const [state, setState] = useState<ValidationState>({
        xsd: '',
        xml: '',
        validationResult: []
    });

    const updateState = useCallback((updates: Partial<ValidationState>) => {
        setState((prev: ValidationState) => ({ ...prev, ...updates }));
    }, []);

    const { fileInputRefs, importFile, handleFileChange, saveFile } = useFileOperations();
    const { validateDocuments, error } = useValidationLogic(state.xsd, state.xml, (result: ValidationError[]) => updateState({ validationResult: result }));

    const loadFileContent = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: FileType) => {
        handleFileChange(event, (content: string, fileType: FileType) => {
            // Automaticky formatujeme obsah po načítaní
            const formatted = formatXml(content);
            
            if (fileType === 'xsd') {
                updateState({ xsd: formatted });
            } else {
                updateState({ xml: formatted });
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
        if (fileInputRefs.left.current) fileInputRefs.left.current.value = '';
        if (fileInputRefs.right.current) fileInputRefs.right.current.value = '';
    }, [updateState, fileInputRefs]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        updateState({ xml: value || '' });
    }, [updateState]);

    const handleXsdChange = useCallback((value: string | undefined) => {
        updateState({ xsd: value || '' });
    }, [updateState]);

    const handleFormatXml = useCallback(() => {
        const formatted = formatXml(state.xml);
        updateState({ xml: formatted });
    }, [state.xml, updateState]);

    const handleFormatXsd = useCallback(() => {
        const formatted = formatXml(state.xsd);
        updateState({ xsd: formatted });
    }, [state.xsd, updateState]);

    const applyQuickFix = useCallback((message: string) => {
        const fix = getQuickFixForMessage(message, state.xml);
        if (!fix) return;
        const updated = fix.apply(state.xml);
        updateState({ xml: updated });
    }, [state.xml, updateState]);

    return {
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
        applyQuickFix,
        error
    };
};