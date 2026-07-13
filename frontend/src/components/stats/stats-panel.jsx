import {useCallback, useEffect, useMemo, useState} from 'react';
import {Activity, Cpu, Gauge, RefreshCw, Server} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {getContainerStatsSnapshot} from '../../services/docker-container-stats';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const statsSearchSelectors = [
    (row) => row.container.id,
    (row) => row.container.name,
    (row) => row.container.image,
    (row) => row.container.state,
    (row) => row.container.status,
];

function clampPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.min(number, 100));
}

function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const amount = bytes / (1024 ** index);

    return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
}

function formatPercent(value) {
    const number = Number(value || 0);
    return `${number.toFixed(number >= 10 ? 0 : 1)}%`;
}

function MetricCard({label, value, detail, icon: Icon}) {
    return (
        <Card className="shadow-panel">
            <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                    <p className="text-xs uppercase text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                    {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
                </div>
                <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10 shrink-0`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function StatBar({label, value, detail, icon: Icon, className}) {
    const percent = clampPercent(value);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                </span>
                <span className="font-mono">{detail || formatPercent(percent)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-md bg-muted">
                <div className={`h-full rounded-md transition-all duration-500 ${className}`} style={{width: `${percent}%`}} />
            </div>
        </div>
    );
}

function StatsRow({row}) {
    const {container, stats, error} = row;

    return (
        <div className="rounded-md border bg-card p-4 shadow-panel">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold">{container.name}</h4>
                        <span className="rounded-md bg-docker-surface px-2 py-1 font-mono text-xs text-muted-foreground">{container.id}</span>
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">{container.image}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{container.status}</p>
                </div>
                {stats ? (
                    <div className="space-y-3">
                        <StatBar label="CPU" value={stats.cpuPercent} icon={Cpu} className="bg-docker-info" />
                        <StatBar
                            label="Memory"
                            value={stats.memoryPercent}
                            detail={`${formatBytes(stats.memoryUsage)} / ${formatBytes(stats.memoryLimit)}`}
                            icon={Activity}
                            className="bg-docker-running"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>PIDs</span>
                            <span className="font-mono">{stats.pids || 0}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{error || 'Stats unavailable for this container.'}</p>
                )}
            </div>
        </div>
    );
}

export function StatsPanel({query = ''}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const {notify} = useNotifications();

    const filteredRows = useResourceFilter(rows, query, statsSearchSelectors);
    const summary = useMemo(() => {
        const readyRows = rows.filter((row) => row.stats);
        const totalMemory = readyRows.reduce((sum, row) => sum + Number(row.stats.memoryUsage || 0), 0);
        const averageCPU = readyRows.length
            ? readyRows.reduce((sum, row) => sum + Number(row.stats.cpuPercent || 0), 0) / readyRows.length
            : 0;
        const maxMemoryPercent = readyRows.reduce((max, row) => Math.max(max, Number(row.stats.memoryPercent || 0)), 0);

        return {readyRows, totalMemory, averageCPU, maxMemoryPercent};
    }, [rows]);

    const refreshStats = useCallback(async ({silent = false} = {}) => {
        if (!silent) {
            setLoading(true);
        }
        setError(null);
        try {
            const snapshot = await getContainerStatsSnapshot();
            setRows(snapshot);
            setLastUpdated(new Date());
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            if (!silent) {
                notify({title: 'Stats refresh failed', detail, type: 'error'});
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [notify]);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    useEffect(() => {
        if (!autoRefresh) {
            return undefined;
        }

        const interval = window.setInterval(() => refreshStats({silent: true}), 5000);
        return () => window.clearInterval(interval);
    }, [autoRefresh, refreshStats]);

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Stats</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Monitor live CPU, memory, and process usage for running containers in the active Docker context.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setAutoRefresh((current) => !current)}>
                        <Gauge className="h-4 w-4" />
                        {autoRefresh ? 'Auto refresh on' : 'Auto refresh off'}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => refreshStats()} disabled={loading}>
                        <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {lastUpdated && <p className="text-xs text-muted-foreground">Last updated {lastUpdated.toLocaleTimeString()}</p>}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Running containers" value={rows.length} detail="Stats source" icon={Server} />
                <MetricCard label="Readable stats" value={summary.readyRows.length} detail="Containers with samples" icon={Gauge} />
                <MetricCard label="Average CPU" value={formatPercent(summary.averageCPU)} detail="Across readable samples" icon={Cpu} />
                <MetricCard label="Memory used" value={formatBytes(summary.totalMemory)} detail={`Peak ${formatPercent(summary.maxMemoryPercent)}`} icon={Activity} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Container resource usage</CardTitle>
                    <CardDescription>Polling every 5 seconds while auto refresh is enabled.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!filteredRows.length ? (
                        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                            {rows.length ? 'No running containers match the current search.' : 'No running containers are available for stats.'}
                        </div>
                    ) : filteredRows.map((row) => <StatsRow key={row.container.id} row={row} />)}
                </CardContent>
            </Card>
        </section>
    );
}