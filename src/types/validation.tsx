export interface ValidationState {
    xsd: string;
    xml: string;
    validationResult: ValidationError[];
}

export interface ValidationError {
    message: string;
    line?: number;
    column?: number;
}

export interface FileInputRefs {
    left: React.RefObject<HTMLInputElement>;
    right: React.RefObject<HTMLInputElement>;
}

export interface EditorRefs {
    editor: React.RefObject<any>;
}

export type FileType = 'xsd' | 'xml';
export type PanelType = 'left' | 'right';