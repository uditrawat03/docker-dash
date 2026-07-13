import {useCallback, useEffect, useMemo, useState} from 'react';
import {Boxes, GitBranch, RefreshCw, Server, ShieldCheck} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {getSwarmOverview, listSwarmServices} from '../../services/docker-swarm';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {StatusBadge} from '../ui/status-badge';
import {SecretsPanel} from '../secrets/secrets-panel';

const serviceSearchSelectors = [
    (service) => service.id,
    (service) => service.name,
    (service) => service.image,
    (service) => service.mode,
    (service) => service.updateState,
];


function SwarmPurposeCard() {
    return (
        <Card className="border-docker-info/30 bg-docker-info/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-docker-info/10 text-docker-info">
                        <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Orchestration workspace</CardTitle>
                        <CardDescription>Use Swarm to review services, replicas, managers, workers, and rollout state.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <div className="rounded-md border bg-background p-3">Services define the desired running containers.</div>
                <div className="rounded-md border bg-background p-3">Replicas show desired tasks versus running tasks.</div>
                <div className="rounded-md border bg-background p-3">Managers control scheduling and service updates.</div>
            </CardContent>
        </Card>
    );
}
function SummaryCard({label, value, detail, icon: Icon}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className={dockerdashTheme.surfaces.iconTile}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">{label}</p>
                    <p className="mt-1 truncate text-lg font-semibold">{value}</p>
                    {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function replicasLabel(service) {
    if (service.mode === 'global' || service.mode === 'global job') {
        return `${service.runningTasks || 0} running`;
    }

    return `${service.runningTasks || 0}/${service.desiredTasks || 0}`;
}

function SwarmInactiveState({overview}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className={dockerdashTheme.surfaces.iconTile}>
                        <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Swarm is not active</CardTitle>
                        <CardDescription>This Docker Engine is currently reporting Swarm state: {overview?.localNodeState || 'unknown'}.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Initialize a local learning swarm from your terminal when you are ready to explore services and replicas.</p>
                <pre className="overflow-x-auto rounded-md border bg-docker-surface p-3 font-mono text-xs">docker swarm init</pre>
            </CardContent>
        </Card>
    );
}

function SwarmServicesTable({services}) {
    if (!services.length) {
        return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">No Swarm services are available in this cluster.</div>;
    }

    return (
        <div className={dockerdashTheme.surfaces.tableShell}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                    <thead className={dockerdashTheme.surfaces.tableHead}>
                        <tr>
                            {['Name', 'Image', 'Mode', 'Replicas', 'Update', 'Updated'].map((column) => (
                                <th key={column} className="px-4 py-3 text-left font-medium tracking-normal">{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {services.map((service) => (
                            <tr key={service.id} className={dockerdashTheme.surfaces.tableRow}>
                                <td className="px-4 py-3 font-medium">{service.name}</td>
                                <td className="max-w-[260px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">{service.image || '-'}</td>
                                <td className="px-4 py-3 text-muted-foreground">{service.mode}</td>
                                <td className="px-4 py-3 font-mono text-xs">{replicasLabel(service)}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={service.updateState === 'completed' ? 'healthy' : 'pending'}>
                                        {service.updateState || 'unknown'}
                                    </StatusBadge>
                                    {service.updateMessage && <p className="mt-1 max-w-[240px] truncate text-xs text-muted-foreground">{service.updateMessage}</p>}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{service.updated || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function SwarmPanel({query = ''}) {
    const [overview, setOverview] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const {notify} = useNotifications();

    const refreshSwarm = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const nextOverview = await getSwarmOverview();
            setOverview(nextOverview);
            if (nextOverview?.active && nextOverview?.controlAvailable) {
                setServices(await listSwarmServices());
            } else {
                setServices([]);
            }
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Swarm refresh failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        refreshSwarm();
    }, [refreshSwarm]);

    const filteredServices = useResourceFilter(services, query, serviceSearchSelectors);
    const role = overview?.controlAvailable ? 'manager' : overview?.active ? 'worker' : 'inactive';
    const summary = useMemo(() => ([
        {label: 'Swarm state', value: overview?.localNodeState || 'unknown', detail: role, icon: GitBranch},
        {label: 'Nodes', value: String(overview?.nodes || 0), detail: `${overview?.managers || 0} managers`, icon: Server},
        {label: 'Services', value: String(services.length), detail: overview?.clusterId || 'No active cluster', icon: ShieldCheck},
    ]), [overview, role, services.length]);

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Swarm & Secrets</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Detect Swarm mode, inspect service replica status, and manage Swarm secrets from one related workspace.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 sm:self-auto" onClick={refreshSwarm} disabled={loading}>
                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <SwarmPurposeCard />

            <div className="grid gap-4 md:grid-cols-3">
                {summary.map((item) => <SummaryCard key={item.label} {...item} />)}
            </div>

            {!overview?.active && !loading ? <SwarmInactiveState overview={overview} /> : (
                <Card>
                    <CardHeader>
                        <CardTitle>Swarm services</CardTitle>
                        <CardDescription>Desired and running task counts reported by the Docker manager.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <p className="text-sm text-muted-foreground">Loading Swarm services...</p> : <SwarmServicesTable services={filteredServices} />}
                    </CardContent>
                </Card>
            )}

            <SecretsPanel query={query} embedded />
        </section>
    );
}
