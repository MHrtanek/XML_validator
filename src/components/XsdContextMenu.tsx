import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ErrorContextMenu.css'; // Použijeme rovnaký styling

interface Props {
    position: { x: number; y: number };
    lineNumber: number;
    typeName: string;
    onClose: () => void;
    onNavigateToType: () => void;
}

const XsdContextMenu: React.FC<Props> = ({
    position,
    lineNumber,
    typeName,
    onClose,
    onNavigateToType
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
                Type: {typeName}
            </div>
            <div className="context-menu-items">
                <button 
                    className="context-menu-item"
                    onClick={() => handleMenuClick(onNavigateToType)}
                >
                    <span className="menu-icon">🔍</span>
                    <span>Go to type definition</span>
                </button>
            </div>
        </div>
    );

    return createPortal(menuContent, document.body);
};

export default XsdContextMenu;

