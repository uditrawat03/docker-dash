import {useCallback, useEffect, useMemo, useState} from 'react';
import {Database, Plus, RefreshCw, Trash2} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {createVolume, listVolumes, removeVolume} from '../../services/docker-volumes';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const volumeSearchSelectors = [
    (volume) => volume.name,
    (volume) => volume.driver,
    (volume) => volume.scope,
    (volume) => volume.mountpoint,
    (volume) => volume.usedBy,
];

function VolumeCard({volume, removingName, onRemove}) {
    const inUse = volume.inUse;
    const isRemoving = removingName === volume.name;

    return (
        <Card className="shadow-panel">
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="truncate text-base">{volume.name}</CardTitle>
                        <CardDescription>{volume.driver || 'local'} driver</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={inUse || isRemoving} onClick={() => onRemove(volume)} aria-label={`Remove volume ${volume.name}`}>
                        {isRemoving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-docker-surface px-2 py-1">{volume.scope || 'local'}</span>
                    <span className={inUse ? 'rounded-md bg-docker-surface px-2 py-1 text-docker-running' : 'rounded-md bg-docker-surface px-2 py-1'}>{inUse ? 'in use' : 'unused'}</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">Mountpoint</p>
                    <p className="mt-2 truncate font-mono text-xs text-muted-foreground" title={volume.mountpoint}>{volume.mountpoint || '-'}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">Created</p>
                    <p className="mt-2 text-sm text-muted-foreground">{volume.createdAt || '-'}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">Containers</p>
                    {volume.usedBy?.length ? (
                        <div className="mt-2 space-y-2">
                            {volume.usedBy.map((usage) => (
                                <div key={`${usage.containerId}-${usage.destination}`} className="rounded-md border bg-docker-surface p-2 text-xs">
                                    <p className="font-medium">{usage.containerName}</p>
                                    <p className="mt-1 font-mono text-muted-foreground">{usage.destination}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="mt-2 text-sm text-muted-foreground">No containers are using this volume.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export function VolumesPanel({query = ''}) {
    const [volumes, setVolumes] = useState([]);
    const [volumeName, setVolumeName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [removingName, setRemovingName] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const {notify} = useNotifications();

    const refreshVolumes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setVolumes(await listVolumes());
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Volume refresh failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        refreshVolumes();
    }, [refreshVolumes]);

    const sortedVolumes = useMemo(() => [...volumes].sort((left, right) => left.name.localeCompare(right.name)), [volumes]);
    const filteredVolumes = useResourceFilter(sortedVolumes, query, volumeSearchSelectors);
    const canCreate = volumeName.trim().length > 0 && !creating;

    async function handleCreate(event) {
        event.preventDefault();
        const nextName = volumeName.trim();
        if (!nextName) {
            return;
        }

        setCreating(true);
        setError(null);
        setMessage(null);
        try {
            await createVolume(nextName);
            setVolumeName('');
            setMessage(`${nextName} created`);
            notify({title: 'Volume created', detail: `${nextName} is ready for containers`, type: 'success'});
            await refreshVolumes();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Volume create failed', detail, type: 'error'});
        } finally {
            setCreating(false);
        }
    }

    async function handleRemove(volume) {
        if (volume.inUse || !window.confirm(`Remove volume "${volume.name}"?`)) {
            return;
        }

        setRemovingName(volume.name);
        setError(null);
        setMessage(null);
        try {
            await removeVolume(volume.name, false);
            setMessage(`${volume.name} removed`);
            notify({title: 'Volume removed', detail: `${volume.name} removed from Docker`, type: 'success'});
            await refreshVolumes();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Volume remove failed', detail, type: 'error'});
        } finally {
            setRemovingName(null);
        }
    }

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Volumes</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Create, inspect, and remove Docker volumes from the active Docker context.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 sm:self-auto" onClick={refreshVolumes} disabled={loading}>
                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {(error || message) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-docker-running'}>{error || message}</p>}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Create volume</CardTitle>
                            <CardDescription>Provision a local Docker volume.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreate}>
                        <input
                            value={volumeName}
                            onChange={(event) => setVolumeName(event.target.value)}
                            placeholder="app-data"
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

            {filteredVolumes.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredVolumes.map((volume) => (
                        <VolumeCard key={volume.name} volume={volume} removingName={removingName} onRemove={handleRemove} />
                    ))}
                </div>
            ) : (
                <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                    {loading ? 'Loading Docker volumes...' : query ? 'No volumes match the current search.' : 'No volumes were returned by the active Docker context.'}
                </div>
            )}
        </section>
    );
}
