import {useEffect, useMemo, useState} from 'react';
import {Check, Cloud, Copy, HelpCircle, KeyRound, Plus, RefreshCw, Save, Search, Server, Tags, Trash2} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {useSettings} from '../../providers/settings-provider';
import {encodeRegistryAuth, listRegistryCatalog, listRegistryTags, testRegistryConnection} from '../../services/docker-registries';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const fallbackRegistryProfiles = [
    {id: 'local', name: 'Local registry', url: 'localhost:5000', username: ''},
    {id: 'ghcr', name: 'GitHub Container Registry', url: 'ghcr.io', username: ''},
];

const registryPresets = [
    {
        id: 'ghcr',
        name: 'GitHub Container Registry',
        url: 'ghcr.io',
        usernameHint: 'GitHub username',
        tokenHint: 'GitHub PAT with read:packages or write:packages',
        loginCommand: 'echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin',
    },
    {
        id: 'ecr',
        name: 'Amazon ECR',
        url: 'ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com',
        usernameHint: 'AWS',
        tokenHint: 'aws ecr get-login-password token',
        loginCommand: 'aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com',
    },
    {
        id: 'gar',
        name: 'Google Artifact Registry',
        url: 'REGION-docker.pkg.dev',
        usernameHint: 'oauth2accesstoken or _json_key',
        tokenHint: 'gcloud auth print-access-token or service account JSON',
        loginCommand: 'gcloud auth configure-docker REGION-docker.pkg.dev',
    },
];

const repositorySearchSelectors = [
    (row) => row.repository,
    (row) => row.tags,
];

function createProfileId() {
    return `registry-${Date.now()}`;
}

function profileToForm(profile) {
    return {
        id: profile.id || createProfileId(),
        name: profile.name || profile.url || 'Registry',
        url: profile.url || '',
        username: profile.username || '',
        password: '',
    };
}

function registryPayload(registry) {
    return {
        name: registry.name.trim() || registry.url.trim(),
        url: registry.url.trim(),
        username: registry.username.trim(),
        password: registry.password,
    };
}

function profilePayload(registry) {
    return {
        id: registry.id || createProfileId(),
        name: registry.name.trim() || registry.url.trim(),
        url: registry.url.trim(),
        username: registry.username.trim(),
    };
}

function RepositoryCard({repository, selected, tags, loadingTags, onSelect}) {
    return (
        <button type="button" className={selected ? 'rounded-md border border-docker-info bg-docker-surface p-4 text-left shadow-panel' : 'rounded-md border bg-card p-4 text-left transition-colors hover:bg-docker-surface'} onClick={() => onSelect(repository)}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium">{repository}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Docker V2 repository</p>
                </div>
                <Tags className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            {selected && (
                <div className="mt-3 border-t pt-3">
                    {loadingTags ? (
                        <p className="text-xs text-muted-foreground">Loading tags...</p>
                    ) : tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span key={tag} className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">{tag}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">No tags returned for this repository.</p>
                    )}
                </div>
            )}
        </button>
    );
}

function RegistryPresetCard({preset, onUse}) {
    return (
        <div className="rounded-md border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="text-sm font-medium">{preset.name}</h4>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{preset.url}</p>
                </div>
                <Cloud className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>User: {preset.usernameHint}</p>
                <p>Token: {preset.tokenHint}</p>
                <p className="rounded-md bg-docker-surface p-2 font-mono leading-5">{preset.loginCommand}</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => onUse(preset)}>
                <Copy className="h-4 w-4" />
                Use preset
            </Button>
        </div>
    );
}


function RegistryHelpPanel({presets, onUse}) {
    return (
        <Card className="border-docker-info/30 bg-docker-info/5 shadow-panel">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-docker-info/10 text-docker-info">
                        <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Registry setup guide</CardTitle>
                        <CardDescription>Choose a provider preset, save the profile, then test or load the catalog.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">GitHub Container Registry uses <span className="font-mono">ghcr.io</span>. Packages are created when an image is pushed.</div>
                    <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">Private registries need a username and token for catalog and tag requests.</div>
                    <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">DockerDash saves profile metadata locally, but keeps passwords and tokens session-only.</div>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                    {presets.map((preset) => <RegistryPresetCard key={preset.id} preset={preset} onUse={onUse} />)}
                </div>
            </CardContent>
        </Card>
    );
}

function GitHubRegistryFlow({registry, onActivate}) {
    const isGitHub = registry.url.trim() === 'ghcr.io';

    return (
        <Card className="shadow-panel">
            <CardHeader>
                <CardTitle>GitHub registry flow</CardTitle>
                <CardDescription>Create a GHCR profile here, authenticate with a GitHub token, then push packages from Docker workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border bg-docker-surface p-3">1. Load the GitHub preset or set URL to <span className="font-mono">ghcr.io</span>.</div>
                    <div className="rounded-md border bg-docker-surface p-3">2. Enter GitHub username and a PAT with package permissions.</div>
                    <div className="rounded-md border bg-docker-surface p-3">3. Activate the profile, then load catalog or use Docker push workflows.</div>
                </div>
                <Button type="button" className="gap-2" onClick={onActivate} disabled={!isGitHub || !registry.username.trim()}>
                    <KeyRound className="h-4 w-4" />
                    Activate GitHub Registry
                </Button>
                {!isGitHub && <p className="text-xs text-muted-foreground">Use the GitHub preset first to enable this action.</p>}
            </CardContent>
        </Card>
    );
}
function RegistryList({profiles, selectedId, onSelect, onAdd}) {
    return (
        <Card className="shadow-panel">
            <CardHeader>
                <CardTitle>Saved registries</CardTitle>
                <CardDescription>Connection profiles stored locally without passwords.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {profiles.map((profile) => (
                    <button key={profile.id} type="button" className={selectedId === profile.id ? 'w-full rounded-md border border-docker-info bg-docker-surface px-3 py-2 text-left' : 'w-full rounded-md border bg-card px-3 py-2 text-left transition-colors hover:bg-docker-surface'} onClick={() => onSelect(profile)}>
                        <p className="truncate text-sm font-medium">{profile.name}</p>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{profile.url}</p>
                    </button>
                ))}
                <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={onAdd}>
                    <Plus className="h-4 w-4" />
                    Add Registry
                </Button>
            </CardContent>
        </Card>
    );
}

export function RegistriesPanel({query = ''}) {
    const {settings, updateSettings} = useSettings();
    const profiles = settings.registryProfiles?.length ? settings.registryProfiles : fallbackRegistryProfiles;
    const [registry, setRegistry] = useState(() => profileToForm(profiles[0]));
    const [repositories, setRepositories] = useState([]);
    const [selectedRepository, setSelectedRepository] = useState('');
    const [tagsByRepository, setTagsByRepository] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingTags, setLoadingTags] = useState(false);
    const [encodingAuth, setEncodingAuth] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const {notify} = useNotifications();

    useEffect(() => {
        if (!profiles.some((profile) => profile.id === registry.id)) {
            setRegistry(profileToForm(profiles[0]));
        }
    }, [profiles, registry.id]);

    const repositoryRows = useMemo(() => repositories.map((repository) => ({
        repository,
        tags: tagsByRepository[repository] || [],
    })), [repositories, tagsByRepository]);
    const filteredRepositories = useResourceFilter(repositoryRows, query, repositorySearchSelectors);
    const canQuery = useMemo(() => registry.url.trim().length > 0 && !loading, [loading, registry.url]);
    const canEncodeAuth = registry.url.trim() && registry.username.trim() && registry.password && !encodingAuth;

    function resetCatalog() {
        setRepositories([]);
        setSelectedRepository('');
        setTagsByRepository({});
    }

    function updateRegistry(nextValue) {
        setRegistry((current) => ({
            ...current,
            ...nextValue,
        }));
        setAuthReady(false);
    }

    function selectProfile(profile) {
        setRegistry(profileToForm(profile));
        setAuthReady(false);
        setError(null);
        setMessage(null);
        resetCatalog();
    }

    function addProfile() {
        const nextProfile = {id: createProfileId(), name: 'New registry', url: '', username: ''};
        updateSettings({registryProfiles: [...profiles, nextProfile]});
        selectProfile(nextProfile);
    }

    function saveProfile() {
        const nextProfile = profilePayload(registry);
        const exists = profiles.some((profile) => profile.id === nextProfile.id);
        const nextProfiles = exists
            ? profiles.map((profile) => (profile.id === nextProfile.id ? nextProfile : profile))
            : [...profiles, nextProfile];

        updateSettings({registryProfiles: nextProfiles});
        setRegistry((current) => ({...current, id: nextProfile.id}));
        setMessage(`${nextProfile.name} saved`);
        notify({title: 'Registry profile saved', detail: nextProfile.url, type: 'success'});
    }

    function removeProfile() {
        if (profiles.length <= 1) {
            setError('Keep at least one registry profile.');
            return;
        }

        const nextProfiles = profiles.filter((profile) => profile.id !== registry.id);
        updateSettings({registryProfiles: nextProfiles});
        selectProfile(nextProfiles[0]);
        notify({title: 'Registry profile removed', detail: registry.name, type: 'info'});
    }

    function usePreset(preset) {
        setRegistry({
            id: preset.id,
            name: preset.name,
            url: preset.url,
            username: preset.id === 'ecr' ? 'AWS' : '',
            password: '',
        });
        setAuthReady(false);
        resetCatalog();
        setMessage(`${preset.name} preset loaded`);
    }


    async function handleActivateGitHubRegistry() {
        const nextRegistry = {
            ...registry,
            id: 'ghcr',
            name: registry.name.trim() || 'GitHub Container Registry',
            url: 'ghcr.io',
            username: registry.username.trim(),
        };
        const nextProfile = profilePayload(nextRegistry);
        const nextProfiles = profiles.some((profile) => profile.id === nextProfile.id)
            ? profiles.map((profile) => (profile.id === nextProfile.id ? nextProfile : profile))
            : [...profiles, nextProfile];

        updateSettings({registryProfiles: nextProfiles});
        setRegistry(nextRegistry);
        setMessage('GitHub Container Registry profile activated');
        notify({title: 'GitHub registry activated', detail: 'ghcr.io profile saved', type: 'success'});

        if (registry.password) {
            await handlePrepareAuth();
        }
    }
    async function handlePrepareAuth() {
        setEncodingAuth(true);
        setError(null);
        setMessage(null);

        try {
            await encodeRegistryAuth({
                username: registry.username.trim(),
                password: registry.password,
                serveraddress: registry.url.trim(),
            });
            setAuthReady(true);
            setMessage('Registry auth payload is ready for Docker API operations');
            notify({title: 'Registry auth prepared', detail: registry.url, type: 'success'});
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Registry auth failed', detail, type: 'error'});
        } finally {
            setEncodingAuth(false);
        }
    }

    async function handleTestConnection() {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            await testRegistryConnection(registryPayload(registry));
            setMessage('Registry connection is healthy');
            notify({title: 'Registry connection healthy', detail: registry.url, type: 'success'});
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Registry connection failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }

    async function handleLoadCatalog() {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const result = await listRegistryCatalog(registryPayload(registry));
            const nextRepositories = result?.repositories || [];
            setRepositories(nextRepositories);
            setSelectedRepository('');
            setTagsByRepository({});
            setMessage(`${nextRepositories.length} repositories loaded`);
            notify({title: 'Registry catalog loaded', detail: `${nextRepositories.length} repositories from ${registry.url}`, type: 'success'});
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Registry catalog failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }

    async function handleSelectRepository(repository) {
        setSelectedRepository(repository);
        if (tagsByRepository[repository]) {
            return;
        }

        setLoadingTags(true);
        setError(null);

        try {
            const result = await listRegistryTags(registryPayload(registry), repository);
            setTagsByRepository((current) => ({
                ...current,
                [repository]: result?.tags || [],
            }));
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Registry tags failed', detail, type: 'error'});
        } finally {
            setLoadingTags(false);
        }
    }

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Registries</h3>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                        Save registry profiles, activate provider presets, connect to Docker Registry V2 endpoints, and inspect repositories.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => setShowHelp((current) => !current)}>
                        <HelpCircle className="h-4 w-4" />
                        {showHelp ? 'Hide Help' : 'Help'}
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" disabled={!canQuery} onClick={handleLoadCatalog}>
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh Catalog
                    </Button>
                </div>
            </div>

            {(error || message) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-docker-running'}>{error || message}</p>}

            {showHelp && <RegistryHelpPanel presets={registryPresets} onUse={usePreset} />}
            <GitHubRegistryFlow registry={registry} onActivate={handleActivateGitHubRegistry} />

            <div className="grid gap-6 xl:grid-cols-[280px_minmax(360px,0.75fr)_minmax(0,1.25fr)]">
                <RegistryList profiles={profiles} selectedId={registry.id} onSelect={selectProfile} onAdd={addProfile} />

                <div className="grid content-start gap-6">
                    <Card className="shadow-panel">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                                    <Server className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Registry connection</CardTitle>
                                    <CardDescription>Save endpoint profiles and use session-only credentials for requests.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="registry-name">Name</label>
                                <input id="registry-name" value={registry.name} onChange={(event) => updateRegistry({name: event.target.value})} className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="registry-url">URL</label>
                                <input id="registry-url" value={registry.url} onChange={(event) => updateRegistry({url: event.target.value})} placeholder="ghcr.io" className="min-h-10 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-docker-info" />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="registry-username">Username</label>
                                    <input id="registry-username" value={registry.username} onChange={(event) => updateRegistry({username: event.target.value})} className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="registry-password">Password or token</label>
                                    <input id="registry-password" type="password" value={registry.password} onChange={(event) => updateRegistry({password: event.target.value})} className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" className="gap-2" onClick={saveProfile}>
                                    <Save className="h-4 w-4" />
                                    Save Profile
                                </Button>
                                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={removeProfile}>
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" className="gap-2" disabled={!canQuery} onClick={handleTestConnection}>
                                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Test
                                </Button>
                                <Button className="gap-2" disabled={!canQuery} onClick={handleLoadCatalog}>
                                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Load Catalog
                                </Button>
                                <Button variant="outline" className="gap-2" disabled={!canEncodeAuth} onClick={handlePrepareAuth}>
                                    {encodingAuth ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                    Prepare Auth
                                </Button>
                            </div>
                            <div className={authReady ? 'rounded-md border border-docker-running/30 bg-docker-running/10 p-3 text-sm text-docker-running' : 'rounded-md border bg-docker-surface p-3 text-sm text-muted-foreground'}>
                                <div className="flex gap-2">
                                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>{authReady ? 'Auth payload validated for future Docker push/pull operations.' : 'Passwords are session-only. Saved profiles keep endpoint metadata but not secrets.'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-panel">
                    <CardHeader>
                        <CardTitle>Catalog</CardTitle>
                        <CardDescription>Repositories returned by the Registry V2 catalog API.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredRepositories.length ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {filteredRepositories.map(({repository}) => (
                                    <RepositoryCard
                                        key={repository}
                                        repository={repository}
                                        selected={selectedRepository === repository}
                                        tags={tagsByRepository[repository]}
                                        loadingTags={loadingTags && selectedRepository === repository}
                                        onSelect={handleSelectRepository}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                                {repositories.length && query ? 'No registry repositories match the current search.' : 'Load a registry catalog to inspect repositories and tags.'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
