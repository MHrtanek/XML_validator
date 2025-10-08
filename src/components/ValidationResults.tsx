import React from 'react';
import { ValidationError } from '../types/validation';
import './ValidationResults.css';

interface Props {
    errors: ValidationError[];
    onLineClick: (line: number) => void;
}

const ValidationResults: React.FC<Props> = ({ errors, onLineClick }) => {
    const copyToClipboard = (text: string, event: React.MouseEvent) => {
        event.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            // Môžeme pridať vizuálny feedback
            const button = event.currentTarget as HTMLElement;
            const originalContent = button.innerHTML;
            button.innerHTML = '✓';
            setTimeout(() => {
                button.innerHTML = originalContent;
            }, 1000);
        });
    };

    const formatError = (error: ValidationError) => {
        if (error.line) {
            const lineLabel = `Line ${error.line}:`.padEnd(12, ' ');
            return `• ${lineLabel}${error.message}`;
        }
        return `• ${error.message}`;
    };

    const handleLineClick = (error: ValidationError) => {
        if (error.line) {
            onLineClick(error.line);
        }
    };

    return (
        <div className="validation-results-container">
            {errors.filter(e => e.message).map((error, idx) => (
                <div 
                    key={idx} 
                    className="validation-result-line"
                    onClick={() => handleLineClick(error)}
                >
                    <span className="result-text">{formatError(error)}</span>
                    <button 
                        className="copy-btn"
                        onClick={(e) => copyToClipboard(formatError(error), e)}
                        title="Copy to clipboard"
                        aria-label="Copy to clipboard"
                    >
                        📋
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ValidationResults;

