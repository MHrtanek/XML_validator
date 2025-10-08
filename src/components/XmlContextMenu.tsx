import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ErrorContextMenu.css'; // Použijeme rovnaký styling

interface Props {
    position: { x: number; y: number };
    lineNumber: number;
    isCommented: boolean;
    onClose: () => void;
    onCommentElement: () => void;
}

const XmlContextMenu: React.FC<Props> = ({
    position,
    lineNumber,
    isCommented,
    onClose,
    onCommentElement
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Odložíme registráciu event listenera aby sme ignorovali klik ktorý menu vytvoril
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleMenuClick = (action: () => void) => {
        action();
        onClose();
    };

    const menuContent = (
        <div 
            ref={menuRef}
            className="error-context-menu"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            <div className="context-menu-header">
                Line {lineNumber}
            </div>
            <div className="context-menu-items">
                <button 
                    className="context-menu-item"
                    onClick={() => handleMenuClick(onCommentElement)}
                >
                    <span className="menu-icon">{isCommented ? '✏️' : '💬'}</span>
                    <span>{isCommented ? 'Uncomment element' : 'Comment out element'}</span>
                </button>
            </div>
        </div>
    );

    return createPortal(menuContent, document.body);
};

export default XmlContextMenu;

