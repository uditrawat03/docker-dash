import {NAVIGATION_VIEWS} from './navigation';

export const SHORTCUT_GROUPS = [
    {
        title: 'Navigation',
        items: [
            {keys: ['Ctrl', '1'], shortcut: 'ctrl+1', label: 'Dashboard', view: NAVIGATION_VIEWS.dashboard},
            {keys: ['Ctrl', '2'], shortcut: 'ctrl+2', label: 'Containers', view: NAVIGATION_VIEWS.containers},
            {keys: ['Ctrl', '3'], shortcut: 'ctrl+3', label: 'Images', view: NAVIGATION_VIEWS.images},
            {keys: ['Ctrl', '4'], shortcut: 'ctrl+4', label: 'Volumes', view: NAVIGATION_VIEWS.volumes},
            {keys: ['Ctrl', '5'], shortcut: 'ctrl+5', label: 'Networks', view: NAVIGATION_VIEWS.networks},
            {keys: ['Ctrl', '6'], shortcut: 'ctrl+6', label: 'Registries', view: NAVIGATION_VIEWS.registries},
            {keys: ['Ctrl', '7'], shortcut: 'ctrl+7', label: 'Compose', view: NAVIGATION_VIEWS.compose},
            {keys: ['Ctrl', ','], shortcut: 'ctrl+,', label: 'Settings', view: NAVIGATION_VIEWS.settings},
        ],
    },
    {
        title: 'Workspace',
        items: [
            {keys: ['Ctrl', 'K'], shortcut: 'ctrl+k', label: 'Open command palette', action: 'command-palette'},
            {keys: ['?'], shortcut: '?', label: 'Show keyboard shortcuts', action: 'shortcuts'},
            {keys: ['Esc'], shortcut: 'escape', label: 'Close overlays', action: 'close-overlays'},
        ],
    },
];

export function createShortcutHandlers({navigate, openShortcuts, closeShortcuts, openCommandPalette, closeCommandPalette}) {
    return SHORTCUT_GROUPS.flatMap((group) => group.items).reduce((handlers, item) => {
        if (item.view) {
            handlers[item.shortcut] = () => navigate(item.view);
            return handlers;
        }

        if (item.action === 'command-palette') {
            handlers[item.shortcut] = openCommandPalette;
        }

        if (item.action === 'shortcuts') {
            handlers[item.shortcut] = openShortcuts;
        }

        if (item.action === 'close-overlays') {
            handlers[item.shortcut] = () => {
                closeCommandPalette?.();
                closeShortcuts?.();
            };
        }

        return handlers;
    }, {});
}
