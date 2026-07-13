import {useCallback, useEffect, useMemo, useState} from 'react';
import {EyeOff, KeyRound, Plus, RefreshCw, ShieldAlert, Trash2} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {createSecret, listSecrets, removeSecret} from '../../services/docker-secrets';
import {getSwarmOverview} from '../../services/docker-swarm';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const secretSearchSelectors = [
    (secret) => secret.id,
    (secret) => secret.name,
    (secret) => secret.created,
    (secret) => secret.updated,
    (secret) => secret.labels,
];


function SecretsPurposeCard() {
    return (
        <Card className="border-docker-warning/30 bg-docker-warning/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-docker-warning/10 text-docker-warning">
                        <EyeOff className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Secure configuration workspace</CardTitle>
                        <CardDescription>Use Secrets for sensitive values that services need but users should not read back.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <div className="rounded-md border bg-background p-3">Secret values are sent once and never displayed again.</div>
                <div className="rounded-md border bg-background p-3">Only Swarm manager nodes can create and list secrets.</div>
                <div className="rounded-md border bg-background p-3">Services consume secrets as mounted files at runtime.</div>
            </CardContent>
        </Card>
    );
}
function SecretTable({secrets, removingId, onRemove}) {
    if (!secrets.length) {
        return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">No Docker secrets are available in this Swarm.</div>;
    }

    return (
        <div className={dockerdashTheme.surfaces.tableShell}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                    <thead className={dockerdashTheme.surfaces.tableHead}>
                        <tr>
                            {['Name', 'Secret ID', 'Created', 'Labels', 'Actions'].map((column) => (
                                <th key={column} className="px-4 py-3 text-left font-medium tracking-normal">{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {secrets.map((secret) => (
                            <tr key={secret.id} className={dockerdashTheme.surfaces.tableRow}>
                                <td className="px-4 py-3 font-medium">{secret.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{secret.id}</td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{secret.created || '-'}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{secret.labels?.length ? secret.labels.join(', ') : '-'}</td>
                                <td className="px-4 py-3">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={removingId === secret.id} onClick={() => onRemove(secret)} aria-label={`Remove secret ${secret.name}`}>
                                        {removingId === secret.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SwarmRequiredCard({overview}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className={dockerdashTheme.surfaces.iconTile}>
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Swarm manager required</CardTitle>
                        <CardDescription>Docker secrets are a Swarm feature. Current state: {overview?.localNodeState || 'unknown'}.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Initialize Swarm or switch to a manager node before creating and listing secrets.</p>
                <pre className="overflow-x-auto rounded-md border bg-docker-surface p-3 font-mono text-xs">docker swarm init</pre>
            </CardContent>
        </Card>
    );
}

export function SecretsPanel({query = '', embedded = false}) {
    const [overview, setOverview] = useState(null);
    const [secrets, setSecrets] = useState([]);
    const [secretName, setSecretName] = useState('');
    const [secretValue, setSecretValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const {notify} = useNotifications();

    const managerReady = overview?.active && overview?.controlAvailable;

    const refreshSecrets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const nextOverview = await getSwarmOverview();
            setOverview(nextOverview);
            if (nextOverview?.active && nextOverview?.controlAvailable) {
                setSecrets(await listSecrets());
            } else {
                setSecrets([]);
            }
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Secret refresh failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        refreshSecrets();
    }, [refreshSecrets]);

    const filteredSecrets = useResourceFilter(secrets, query, secretSearchSelectors);
    const canCreate = managerReady && secretName.trim() && secretValue && !creating;
    const summary = useMemo(() => ({
        state: overview?.localNodeState || 'unknown',
        role: overview?.controlAvailable ? 'manager' : overview?.active ? 'worker' : 'inactive',
    }), [overview]);

    async function handleCreate(event) {
        event.preventDefault();
        const name = secretName.trim();
        if (!name || !secretValue) {
            return;
        }

        setCreating(true);
        setError(null);
        setMessage(null);
        try {
            await createSecret(name, secretValue);
            setSecretName('');
            setSecretValue('');
            setMessage(`${name} created`);
            notify({title: 'Secret created', detail: `${name} was stored in Docker Swarm`, type: 'success'});
            await refreshSecrets();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Secret create failed', detail, type: 'error'});
        } finally {
            setCreating(false);
        }
    }

    async function handleRemove(secret) {
        if (!window.confirm(`Remove secret "${secret.name}"? Services using it may fail on future updates.`)) {
            return;
        }

        setRemovingId(secret.id);
        setError(null);
        setMessage(null);
        try {
            await removeSecret(secret.id);
            setMessage(`${secret.name} removed`);
            notify({title: 'Secret removed', detail: `${secret.name} removed from Docker Swarm`, type: 'success'});
            await refreshSecrets();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Secret remove failed', detail, type: 'error'});
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <section className={embedded ? 'grid gap-6' : dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Secrets</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Manage Docker Swarm secret metadata and create one-time secret values without displaying stored contents.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 sm:self-auto" onClick={refreshSecrets} disabled={loading}>
                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {(error || message) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-docker-running'}>{error || message}</p>}

            <SecretsPurposeCard />

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className={dockerdashTheme.surfaces.iconTile}><KeyRound className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs uppercase tracking-normal text-muted-foreground">Secrets</p>
                            <p className="mt-1 text-lg font-semibold">{secrets.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-normal text-muted-foreground">Swarm state</p>
                        <p className="mt-1 text-lg font-semibold">{summary.state}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-normal text-muted-foreground">Node role</p>
                        <p className="mt-1 text-lg font-semibold">{summary.role}</p>
                    </CardContent>
                </Card>
            </div>

            {!managerReady && !loading ? <SwarmRequiredCard overview={overview} /> : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create secret</CardTitle>
                            <CardDescription>The value is sent once to Docker and cleared from the form after creation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-3 lg:grid-cols-[minmax(180px,0.6fr)_minmax(260px,1fr)_auto]" onSubmit={handleCreate}>
                                <input value={secretName} onChange={(event) => setSecretName(event.target.value)} placeholder="db_password" disabled={!managerReady || creating} className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info disabled:cursor-not-allowed disabled:opacity-60" />
                                <input value={secretValue} onChange={(event) => setSecretValue(event.target.value)} type="password" placeholder="Secret value" disabled={!managerReady || creating} className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info disabled:cursor-not-allowed disabled:opacity-60" />
                                <Button type="submit" className="gap-2" disabled={!canCreate}>
                                    <Plus className="h-4 w-4" />
                                    {creating ? 'Creating' : 'Create'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Secret inventory</CardTitle>
                            <CardDescription>Docker never returns secret values after creation; only metadata is listed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <p className="text-sm text-muted-foreground">Loading Docker secrets...</p> : <SecretTable secrets={filteredSecrets} removingId={removingId} onRemove={handleRemove} />}
                        </CardContent>
                    </Card>
                </>
            )}
        </section>
    );
}
