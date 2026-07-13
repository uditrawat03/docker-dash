import {useMemo, useState} from 'react';
import {Bell, CheckCheck, Info, Trash2, TriangleAlert, XCircle} from 'lucide-react';
import {useNotifications} from '../../providers/notification-provider';
import {Button} from '../ui/button';

const typeStyles = {
    success: 'text-docker-running',
    error: 'text-destructive',
    warning: 'text-docker-warning',
    info: 'text-docker-info',
};

function NotificationIcon({type}) {
    const className = `h-4 w-4 ${typeStyles[type] || typeStyles.info}`;

    if (type === 'success') {
        return <CheckCheck className={className} />;
    }

    if (type === 'error') {
        return <XCircle className={className} />;
    }

    if (type === 'warning') {
        return <TriangleAlert className={className} />;
    }

    return <Info className={className} />;
}

function formatTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const {notifications, unreadCount, markAllRead, clearNotifications} = useNotifications();
    const hasNotifications = notifications.length > 0;
    const latestNotifications = useMemo(() => notifications.slice(0, 50), [notifications]);

    function handleToggle() {
        setOpen((current) => !current);
        if (!open && unreadCount) {
            markAllRead();
        }
    }

    return (
        <div className="relative">
            <Button type="button" variant="ghost" size="icon" className="relative h-9 w-9" onClick={handleToggle} aria-label="Open notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {open && (
                <div className="fixed right-4 top-16 z-50 flex max-h-[min(560px,calc(100vh-5rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border bg-card shadow-xl">
                    <div className="flex items-center justify-between gap-3 border-b bg-docker-surface px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold">Notifications</h3>
                            <p className="text-xs text-muted-foreground">{hasNotifications ? `${notifications.length} recent events` : 'No Docker events yet'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={markAllRead} disabled={!hasNotifications} aria-label="Mark all notifications read">
                                <CheckCheck className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={clearNotifications} disabled={!hasNotifications} aria-label="Clear notifications">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {hasNotifications ? (
                            <div className="divide-y">
                                {latestNotifications.map((notification) => (
                                    <article key={notification.id} className="flex gap-3 px-4 py-3">
                                        <div className="mt-0.5">
                                            <NotificationIcon type={notification.type} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <h4 className="truncate text-sm font-medium">{notification.title}</h4>
                                                <time className="shrink-0 text-xs text-muted-foreground">{formatTime(notification.createdAt)}</time>
                                            </div>
                                            {notification.detail && <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.detail}</p>}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Docker actions will appear here.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
