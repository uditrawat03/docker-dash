import {useMemo} from 'react';

function searchableText(value) {
    if (Array.isArray(value)) {
        return value.map(searchableText).join(' ');
    }

    if (value && typeof value === 'object') {
        return Object.values(value).map(searchableText).join(' ');
    }

    return String(value ?? '');
}

export function useResourceFilter(items, query, selectors) {
    return useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return items;
        }

        return items.filter((item) => selectors.some((selector) => (
            searchableText(selector(item)).toLowerCase().includes(normalizedQuery)
        )));
    }, [items, query, selectors]);
}
