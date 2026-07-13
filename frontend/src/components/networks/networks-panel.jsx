import {useCallback, useEffect, useMemo, useState} from 'react';
import {Network, Plus, RefreshCw, Trash2} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {createNetwork, listNetworks, removeNetwork} from '../../services/docker-networks';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const networkSearchSelectors = [
    (network) => network.id,
    (network) => network.name,
    (network) => network.driver,
    (network) => network.scope,
    (network) => network.subnets,
    (network) => network.containers,
];

function NetworkCard({network, removingId, onRemove}) {
    const isRemoving = removingId === network.id;
    const removable = !network.default && !network.containers?.length;

    return (
        <Card className="shadow-panel">
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="truncate text-base">{network.name}</CardTitle>
                        <CardDescription>{network.driver || 'unknown'} driver</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={!removable || isRemoving} onClick={() => onRemove(network)} aria-label={`Remove network ${network.name}`}>
                        {isRemoving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-docker-surface px-2 py-1">{network.scope || 'local'}</span>
                    {network.default && <span className="rounded-md bg-docker-surface px-2 py-1">default</span>}
                    {network.internal && <span className="rounded-md bg-docker-surface px-2 py-1">internal</span>}
                    {network.attachable && <span className="rounded-md bg-docker-surface px-2 py-1">attachable</span>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">Network ID</p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">{network.id}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">IPAM</p>
                    {network.subnets?.length ? (
                        <div className="mt-2 space-y-2">
                            {network.subnets.map((subnet) => (
                                <div key={`${subnet.subnet}-${subnet.gateway}`} className="rounded-md border bg-docker-surface p-2 text-xs">
                                    <p className="font-mono">{subnet.subnet || '-'}</p>
                                    <p className="mt-1 font-mono text-muted-foreground">Gateway {subnet.gateway || '-'}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="mt-2 text-sm text-muted-foreground">No subnet configuration reported.</p>}
                </div>
                <div>
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">Connected containers</p>
                    {network.containers?.length ? (
                        <div className="mt-2 space-y-2">
                            {network.containers.map((container) => (
                                <div key={`${container.id}-${container.endpointId}`} className="rounded-md border bg-docker-surface p-2 text-xs">
                                    <p className="font-medium">{container.name || container.id}</p>
                                    <p className="mt-1 font-mono text-muted-foreground">IPv4 {container.ipv4Address || '-'}</p>
                                    {container.ipv6Address && <p className="mt-1 font-mono text-muted-foreground">IPv6 {container.ipv6Address}</p>}
                                </div>
                            ))}
                        </div>
                    ) : <p className="mt-2 text-sm text-muted-foreground">No containers are connected.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function NetworkSection({title, networks, removingId, onRemove}) {
    if (!networks.length) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">{title}</h4>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {networks.map((network) => (
                    <NetworkCard key={network.id} network={network} removingId={removingId} onRemove={onRemove} />
                ))}
            </div>
        </div>
    );
}

export function NetworksPanel({query = ''}) {
    const [networks, setNetworks] = useState([]);
    const [networkName, setNetworkName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const {notify} = useNotifications();

    const refreshNetworks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setNetworks(await listNetworks());
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Network refresh failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        refreshNetworks();
    }, [refreshNetworks]);

    const filteredNetworks = useResourceFilter(networks, query, networkSearchSelectors);
    const groupedNetworks = useMemo(() => ({
        defaults: filteredNetworks.filter((network) => network.default),
        custom: filteredNetworks.filter((network) => !network.default),
    }), [filteredNetworks]);
    const canCreate = networkName.trim().length > 0 && !creating;

    async function handleCreate(event) {
        event.preventDefault();
        const nextName = networkName.trim();
        if (!nextName) {
            return;
        }

        setCreating(true);
        setError(null);
        setMessage(null);
        try {
            await createNetwork(nextName);
            setNetworkName('');
            setMessage(`${nextName} created`);
            notify({title: 'Network created', detail: `${nextName} bridge network is ready`, type: 'success'});
            await refreshNetworks();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Network create failed', detail, type: 'error'});
        } finally {
            setCreating(false);
        }
    }

    async function handleRemove(network) {
        if (network.default || network.containers?.length || !window.confirm(`Remove network "${network.name}"?`)) {
            return;
        }

        setRemovingId(network.id);
        setError(null);
        setMessage(null);
        try {
            await removeNetwork(network.id);
            setMessage(`${network.name} removed`);
            notify({title: 'Network removed', detail: `${network.name} removed from Docker`, type: 'success'});
            await refreshNetworks();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Network remove failed', detail, type: 'error'});
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Networks</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Inspect Docker networks, IPAM configuration, and connected containers.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 sm:self-auto" onClick={refreshNetworks} disabled={loading}>
                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {(error || message) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-docker-running'}>{error || message}</p>}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                            <Network className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Create network</CardTitle>
                            <CardDescription>Create a bridge network in the active Docker context.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreate}>
                        <input
                            value={networkName}
                            onChange={(event) => setNetworkName(event.target.value)}
                            placeholder="app-network"
                            disabled={creating}
                            className="min-h-10 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <Button type="submit" className="gap-2" disabled={!canCreate}>
                            <Plus className="h-4 w-4" />
                            {creating ? 'Creating' : 'Create'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {filteredNetworks.length ? (
                <div className="space-y-6">
                    <NetworkSection title="Default networks" networks={groupedNetworks.defaults} removingId={removingId} onRemove={handleRemove} />
                    <NetworkSection title="User-created networks" networks={groupedNetworks.custom} removingId={removingId} onRemove={handleRemove} />
                </div>
            ) : (
                <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                    {loading ? 'Loading Docker networks...' : query ? 'No networks match the current search.' : 'No networks were returned by the active Docker context.'}
                </div>
            )}
        </section>
    );
}
