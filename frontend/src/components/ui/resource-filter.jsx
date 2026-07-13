import {Search, X} from 'lucide-react';
import {cn} from '../../lib/utils';
import {Button} from './button';

export function ResourceFilter({value, onChange, placeholder, resultCount, totalCount, className, inputClassName}) {
    const filtering = value.trim().length > 0;
    const showCount = typeof resultCount === 'number' && typeof totalCount === 'number';

    return (
        <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className={cn('relative w-full max-w-md', inputClassName)}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="search"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="min-h-10 w-full rounded-md border bg-background py-2 pl-9 pr-10 text-sm outline-none transition-colors focus:border-docker-info"
                />
                {filtering && (
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8" onClick={() => onChange('')} aria-label="Clear search">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {showCount && (
                <p className="shrink-0 text-xs text-muted-foreground" aria-live="polite">
                    {filtering ? resultCount + ' of ' + totalCount : totalCount + ' total'}
                </p>
            )}
        </div>
    );
}
