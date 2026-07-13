import {Keyboard, X} from 'lucide-react';
import {SHORTCUT_GROUPS} from '../../config/keyboard-shortcuts';
import {Button} from '../ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';

function ShortcutKeys({keys}) {
    return (
        <div className="flex items-center gap-1">
            {keys.map((key) => (
                <kbd key={key} className="min-w-7 rounded-md border bg-background px-2 py-1 text-center font-mono text-xs text-muted-foreground shadow-sm">
                    {key}
                </kbd>
            ))}
        </div>
    );
}

export function ShortcutsHelp({open, onClose}) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <Card className="w-full max-w-2xl overflow-hidden shadow-panel">
                <CardHeader className="border-b bg-docker-surface">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-docker-surface-strong text-docker-info">
                                <Keyboard className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Keyboard shortcuts</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">Fast navigation and workspace controls.</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close keyboard shortcuts">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
                    {SHORTCUT_GROUPS.map((group) => (
                        <section key={group.title} className="space-y-3">
                            <h4 className="text-sm font-semibold">{group.title}</h4>
                            <div className="space-y-2">
                                {group.items.map((item) => (
                                    <div key={item.shortcut} className="flex items-center justify-between gap-4 rounded-md border bg-card px-3 py-2">
                                        <span className="text-sm text-muted-foreground">{item.label}</span>
                                        <ShortcutKeys keys={item.keys} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
