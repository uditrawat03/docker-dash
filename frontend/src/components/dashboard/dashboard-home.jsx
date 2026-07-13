import {dockerEngineSummary, dockerMetricCards, dockerQuickActions, dockerResourceUsage, emptyDockerActivityEvents} from '../../config/docker-dashboard';
import {dockerdashTheme} from '../../config/theme';
import {useDockerDashboard} from '../../hooks/use-docker-dashboard';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

function MetricCards({metrics}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dockerMetricCards.map((metric) => {
                const Icon = metric.icon;
                return (
                    <Card key={metric.key} className={dockerdashTheme.surfaces.metricCard}>
                        <CardHeader className="flex-row items-start justify-between space-y-0 p-5">
                            <div>
                                <CardDescription>{metric.label}</CardDescription>
                                <CardTitle className="mt-3 text-3xl">{metrics?.[metric.key] ?? 0}</CardTitle>
                            </div>
                            <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{metric.detail}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function EngineSummary({engine}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Docker engine</CardTitle>
                <CardDescription>Connection and runtime summary for the active Docker context.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                    {dockerEngineSummary.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.key} className="flex items-center gap-3 rounded-md border bg-background p-4">
                                <div className={`${dockerdashTheme.surfaces.iconTile} h-9 w-9`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                    <p className="truncate text-sm font-medium">{engine?.[item.key] || 'Not available'}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function ResourceUsage({resources}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource usage</CardTitle>
                <CardDescription>Host and container resource metrics will update from Docker stats.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
                {dockerResourceUsage.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.key} className="flex items-center justify-between rounded-md border bg-background p-4">
                            <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{item.label}</span>
                            </div>
                            <strong className="text-sm">{resources?.[item.key] || '0'}</strong>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function QuickActions({loading, onRefresh}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Common Docker workflows will become active when live data is connected.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
                {dockerQuickActions.map((action) => {
                    const Icon = action.icon;
                    const isRefresh = action.id === 'refresh';
                    return (
                        <Button
                            key={action.id}
                            variant="outline"
                            className="justify-start gap-2"
                            disabled={!action.enabled || loading}
                            onClick={isRefresh ? onRefresh : undefined}
                        >
                            <Icon className={loading && isRefresh ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                            {action.label}
                        </Button>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function ActivityFeed({events}) {
    const activityEvents = events?.length ? events : emptyDockerActivityEvents;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Container, image, volume, and network events.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    {activityEvents.map((event) => (
                        <div key={event.title} className="rounded-md border bg-background p-4">
                            <h4 className="text-sm font-medium">{event.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function DashboardHome() {
    const {snapshot, loading, error, refresh} = useDockerDashboard();

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold">Docker overview</h3>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Monitor containers, images, volumes, networks, and engine health from one desktop workspace.
                </p>
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <MetricCards metrics={snapshot?.metrics} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
                <div className="grid gap-6">
                    <EngineSummary engine={snapshot?.engine} />
                    <ActivityFeed events={snapshot?.activity} />
                </div>
                <div className="grid content-start gap-6">
                    <ResourceUsage resources={snapshot?.resources} />
                    <QuickActions loading={loading} onRefresh={refresh} />
                </div>
            </div>
        </section>
    );
}
