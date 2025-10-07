import { useRef, useCallback } from 'react';
import { FileType, PanelType } from '../types/validation.tsx';

export const useFileOperations = () => {
    const fileInputRefLeft = useRef<HTMLInputElement>(null);
    const fileInputRefRight = useRef<HTMLInputElement>(null);

    const importFile = useCallback((panel: PanelType) => {
        const ref = panel === 'left' ? fileInputRefLeft : fileInputRefRight;
        ref.current?.click();
    }, []);

    const handleFileChange = useCallback((
        event: React.ChangeEvent<HTMLInputElement>,
        onFileLoad: (content: string, type: FileType) => void,
        type: FileType
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            onFileLoad(content, type);
        };
        reader.readAsText(file);
    }, []);

    const saveFile = useCallback((content: string, fileName: string) => {
        if (!content) return;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    return {
        fileInputRefs: {
            left: fileInputRefLeft,
            right: fileInputRefRight
        },
        importFile,
        handleFileChange,
        saveFile
    };
};