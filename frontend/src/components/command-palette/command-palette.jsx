import {useEffect, useMemo, useRef, useState} from 'react';
import {Command, X} from 'lucide-react';
import {filterCommandItems} from '../../config/commands';
import {Button} from '../ui/button';
import {Card} from '../ui/card';

export function CommandPalette({open, items, onClose}) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) {
            setQuery('');
            return;
        }

        const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, [open]);

    const filteredItems = useMemo(() => filterCommandItems(items, query), [items, query]);

    if (!open) {
        return null;
    }

    function runCommand(item) {
        if (item.disabled) {
            return;
        }

        item.run?.();
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 p-4 pt-20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={onClose}>
            <Card className="w-full max-w-2xl overflow-hidden shadow-panel" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center gap-3 border-b bg-docker-surface px-4 py-3">
                    <Command className="h-5 w-5 text-docker-info" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search commands and workspaces"
                        className="min-h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close command palette">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="max-h-[420px] overflow-y-auto p-2">
                    {filteredItems.length ? filteredItems.map((item) => {
                        const Icon = item.Icon;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={item.disabled}
                                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-docker-surface disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => runCommand(item)}
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-docker-surface-strong text-docker-info">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{item.label}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                                </span>
                            </button>
                        );
                    }) : (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">No commands match the current search.</div>
                    )}
                </div>
            </Card>
        </div>
    );
}
