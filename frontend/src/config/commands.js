import {HelpCircle, Keyboard, Search} from 'lucide-react';
import {navigationItems} from './navigation';

export function createCommandItems({navigate, openShortcuts}) {
    const navigationCommands = navigationItems.map((item) => ({
        id: `nav:${item.id}`,
        label: `Go to ${item.title}`,
        description: 'Navigate workspace',
        Icon: item.icon,
        keywords: [item.title, item.id, 'navigation'],
        run: () => navigate(item.id),
    }));

    return [
        ...navigationCommands,
        {
            id: 'workspace:shortcuts',
            label: 'Show keyboard shortcuts',
            description: 'Open shortcut reference',
            Icon: Keyboard,
            keywords: ['keyboard', 'shortcuts', 'help'],
            run: openShortcuts,
        },
        {
            id: 'workspace:search',
            label: 'Search from current panel',
            description: 'Use the active workspace search field',
            Icon: Search,
            keywords: ['search', 'filter', 'find'],
            disabled: true,
        },
        {
            id: 'workspace:help',
            label: 'Open command palette',
            description: 'Ctrl+K opens this palette',
            Icon: HelpCircle,
            keywords: ['command', 'palette'],
            disabled: true,
        },
    ];
}

export function filterCommandItems(items, query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return items;
    }

    return items.filter((item) => [
        item.label,
        item.description,
        ...(item.keywords || []),
    ].some((value) => String(value).toLowerCase().includes(normalizedQuery)));
}
