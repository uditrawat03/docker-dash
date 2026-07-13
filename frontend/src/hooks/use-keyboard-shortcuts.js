import {useEffect} from 'react';

function isEditableTarget(target) {
    if (!target) {
        return false;
    }

    const tagName = target.tagName?.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
}

function parseShortcut(shortcut) {
    const parts = shortcut.toLowerCase().split('+');
    const key = parts[parts.length - 1];

    return {
        key,
        ctrl: parts.includes('ctrl') || parts.includes('cmd'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        meta: parts.includes('meta') || parts.includes('cmd'),
    };
}

function matchesShortcut(event, shortcut) {
    const parsed = parseShortcut(shortcut);
    const eventKey = event.key.toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    return eventKey === parsed.key &&
        ctrlOrMeta === parsed.ctrl &&
        event.shiftKey === parsed.shift &&
        event.altKey === parsed.alt;
}

export function useKeyboardShortcuts(shortcuts, enabled = true) {
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        function handleKeyDown(event) {
            if (isEditableTarget(event.target)) {
                return;
            }

            const match = Object.entries(shortcuts).find(([shortcut]) => matchesShortcut(event, shortcut));

            if (!match) {
                return;
            }

            event.preventDefault();
            match[1](event);
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, shortcuts]);
}