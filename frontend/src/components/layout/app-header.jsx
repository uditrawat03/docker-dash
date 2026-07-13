import {PanelLeft} from 'lucide-react';
import {getNavigationItem} from '../../config/navigation';
import {NotificationBell} from '../notifications/notification-bell';
import {Button} from '../ui/button';
import {ResourceFilter} from '../ui/resource-filter';
import {SidebarTrigger} from '../ui/sidebar';
import {StatusIndicator} from '../ui/status-indicator';
import {ThemeToggle} from '../ui/theme-toggle';

export function AppHeader({activeView, search}) {
    const currentItem = getNavigationItem(activeView);
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Toggle sidebar">
                        <PanelLeft className="h-4 w-4" />
                    </Button>
                </SidebarTrigger>
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Docker workspace</p>
                    <h2 className="truncate text-lg font-semibold">{currentItem.title}</h2>
                </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                {search && (
                    <ResourceFilter
                        value={search.value}
                        onChange={search.onChange}
                        placeholder={search.placeholder}
                        className="min-w-[160px] max-w-lg flex-1 justify-end"
                        inputClassName="max-w-lg"
                    />
                )}
                <StatusIndicator tone="pending" className="hidden lg:flex">
                    Docker status pending
                </StatusIndicator>
                <NotificationBell />
                <ThemeToggle />
            </div>
        </header>
    );
}
