import {Bell, Clock, RefreshCw, Server} from 'lucide-react';
import {emptyDockerActivityEvents} from '../../config/docker-dashboard';
import {dockerdashTheme} from '../../config/theme';
import {useDockerDashboard} from '../../hooks/use-docker-dashboard';
import {useNotifications} from '../../providers/notification-provider';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {StatusBadge} from '../ui/status-badge';

function formatDateTime(value) {
    if (!value) {
        return 'Not refreshed yet';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function EventList({events}) {
    const activityEvents = events?.length ? events : emptyDockerActivityEvents;

    return (
        <Card className="shadow-panel">
            <CardHeader>
                <CardTitle>Docker activity</CardTitle>
                <CardDescription>Recent daemon, container, and image events from the active context.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="divide-y rounded-md border">
                    {activityEvents.map((event) => (
                        <article key={`${event.title}-${event.detail}`} className="flex gap-3 bg-card p-4">
                            <div className={`${dockerdashTheme.surfaces.iconTile} mt-0.5 h-8 w-8 shrink-0`}>
                                <Clock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-medium">{event.title}</h4>
                                <p className="mt-1 text-sm leading-5 text-muted-foreground">{event.detail}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function NotificationHistory({notifications}) {
    const recentNotifications = notifications.slice(0, 8);

    return (
        <Card className="shadow-panel">
            <CardHeader>
                <CardTitle>Notification history</CardTitle>
                <CardDescription>Latest DockerDash action results from this session.</CardDescription>
            </CardHeader>
            <CardContent>
                {recentNotifications.length ? (
                    <div className="divide-y rounded-md border">
                        {recentNotifications.map((notification) => (
                            <article key={notification.id} className="flex gap-3 bg-card p-4">
                                <div className={`${dockerdashTheme.surfaces.iconTile} mt-0.5 h-8 w-8 shrink-0`}>
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-medium">{notification.title}</h4>
                                        <StatusBadge status={notification.type === 'error' ? 'stopped' : notification.type === 'success' ? 'running' : 'pending'}>{notification.type}</StatusBadge>
                                    </div>
                                    {notification.detail && <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.detail}</p>}
                                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                        DockerDash notifications will appear here after actions run.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ActivityPanel() {
    const {snapshot, loading, error, refresh} = useDockerDashboard();
    const {notifications} = useNotifications();
    const engineConnected = snapshot?.engine?.connected;

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Activity</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Review Docker daemon activity, recent resource events, and DockerDash action results.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 lg:self-auto" onClick={refresh} disabled={loading}>
                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Card className="shadow-panel">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                            <Server className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Activity summary</CardTitle>
                            <CardDescription>Current engine state and latest dashboard refresh.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border bg-docker-surface p-3">
                        <p className="text-xs text-muted-foreground">Engine</p>
                        <div className="mt-2">
                            <StatusBadge status={engineConnected ? 'running' : 'pending'}>{engineConnected ? 'Connected' : 'Pending'}</StatusBadge>
                        </div>
                    </div>
                    <div className="rounded-md border bg-docker-surface p-3">
                        <p className="text-xs text-muted-foreground">Last refresh</p>
                        <p className="mt-2 text-sm font-medium">{formatDateTime(snapshot?.updatedAt)}</p>
                    </div>
                    <div className="rounded-md border bg-docker-surface p-3">
                        <p className="text-xs text-muted-foreground">Session notifications</p>
                        <p className="mt-2 text-sm font-medium">{notifications.length}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
                <EventList events={snapshot?.activity} />
                <NotificationHistory notifications={notifications} />
            </div>
        </section>
    );
}
