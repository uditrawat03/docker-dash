import {useMemo, useState} from 'react';
import {Check, ExternalLink, Info, RefreshCw, RotateCcw, Save, Server, SlidersHorizontal, Terminal} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useNotifications} from '../../providers/notification-provider';
import {useSettings} from '../../providers/settings-provider';
import {useTheme} from '../../providers/theme-provider';
import {checkForUpdate, openExternalUrl} from '../../services/updates';
import {ReleaseReadinessCard} from './release-readiness-card';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const accentOptions = [
    {id: 'blue', label: 'Blue', className: 'bg-docker-info'},
    {id: 'green', label: 'Green', className: 'bg-docker-running'},
    {id: 'amber', label: 'Amber', className: 'bg-docker-warning'},
];

const timestampOptions = [
    {id: 'local', label: 'Local time'},
    {id: 'utc', label: 'UTC'},
    {id: 'relative', label: 'Relative'},
];

function SettingSection({icon: Icon, title, description, children}) {
    return (
        <Card className="shadow-panel">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

function FieldLabel({label, detail}) {
    return (
        <div>
            <p className="text-sm font-medium">{label}</p>
            {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        </div>
    );
}

function SegmentedControl({value, options, onChange}) {
    return (
        <div className="inline-flex rounded-md border bg-docker-surface p-1">
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    className={value === option.id ? 'rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm' : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'}
                    onClick={() => onChange(option.id)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function ToggleRow({checked, label, detail, onChange}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border bg-docker-surface px-4 py-3">
            <FieldLabel label={label} detail={detail} />
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        </label>
    );
}

export function SettingsPanel() {
    const {settings, updateSettings, resetSettings} = useSettings();
    const {theme, setTheme} = useTheme();
    const {notify} = useNotifications();
    const [draft, setDraft] = useState(settings);
    const [updateRepo, setUpdateRepo] = useState({owner: '', repo: ''});
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateResult, setUpdateResult] = useState(null);
    const [updateError, setUpdateError] = useState(null);

    const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);

    function updateDraft(nextValue) {
        setDraft((current) => ({
            ...current,
            ...nextValue,
        }));
    }

    function handleSave() {
        updateSettings(draft);
        notify({title: 'Settings saved', detail: 'DockerDash preferences were updated.', type: 'success'});
    }

    function handleReset() {
        resetSettings();
        setDraft({
            refreshInterval: 10,
            dockerSocket: 'default',
            logMaxLines: 500,
            timestampFormat: 'local',
            showSystemContainers: true,
            accentColor: 'blue',
        });
        notify({title: 'Settings reset', detail: 'DockerDash preferences are back to defaults.', type: 'info'});
    }

    function handleTestConnection() {
        notify({title: 'Docker connection check', detail: 'Connection testing will use the active Docker integration.', type: 'info'});
    }

    async function handleCheckUpdate(event) {
        event.preventDefault();
        if (!updateRepo.owner.trim() || !updateRepo.repo.trim()) {
            return;
        }

        setCheckingUpdate(true);
        setUpdateError(null);
        setUpdateResult(null);
        try {
            const result = await checkForUpdate({owner: updateRepo.owner.trim(), repo: updateRepo.repo.trim(), currentVersion: '0.0.0'});
            setUpdateResult(result);
            notify({
                title: result.updateAvailable ? 'Update available' : 'DockerDash is current',
                detail: result.updateAvailable ? `${result.latestVersion} is available` : `Current version ${result.currentVersion}`,
                type: result.updateAvailable ? 'info' : 'success',
            });
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setUpdateError(detail);
            notify({title: 'Update check failed', detail, type: 'error'});
        } finally {
            setCheckingUpdate(false);
        }
    }

    async function handleOpenRelease() {
        const url = updateResult?.release?.htmlUrl;
        if (!url) {
            return;
        }

        try {
            await openExternalUrl(url);
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setUpdateError(detail);
            notify({title: 'Could not open release page', detail, type: 'error'});
        }
    }

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Settings</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Configure DockerDash preferences for appearance, refresh behavior, Docker access, and log display.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </Button>
                    <Button className="gap-2" onClick={handleSave} disabled={!hasChanges}>
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <SettingSection icon={SlidersHorizontal} title="Appearance" description="Theme and accent preferences for the local UI.">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <FieldLabel label="Theme" detail="Choose how DockerDash renders on this machine." />
                        <SegmentedControl
                            value={theme}
                            options={[
                                {id: 'dark', label: 'Dark'},
                                {id: 'light', label: 'Light'},
                            ]}
                            onChange={setTheme}
                        />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <FieldLabel label="Accent" detail="Reserved for future charts and status highlights." />
                        <div className="flex gap-2">
                            {accentOptions.map((option) => (
                                <button key={option.id} type="button" className={draft.accentColor === option.id ? 'flex h-9 w-9 items-center justify-center rounded-md border-2 border-primary' : 'flex h-9 w-9 items-center justify-center rounded-md border'} onClick={() => updateDraft({accentColor: option.id})} aria-label={`${option.label} accent`}>
                                    <span className={`h-5 w-5 rounded-full ${option.className}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </SettingSection>

                <SettingSection icon={RotateCcw} title="Refresh" description="Control how often DockerDash should refresh live Docker data.">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <FieldLabel label="Auto-refresh interval" detail="Used by future background refresh tasks." />
                            <span className="rounded-md bg-docker-surface px-3 py-1 text-sm">{draft.refreshInterval}s</span>
                        </div>
                        <input type="range" min="1" max="30" value={draft.refreshInterval} onChange={(event) => updateDraft({refreshInterval: Number(event.target.value)})} className="w-full accent-primary" />
                    </div>
                    <ToggleRow checked={draft.showSystemContainers} label="Show system containers" detail="Include infrastructure containers when filtering future inventory views." onChange={(showSystemContainers) => updateDraft({showSystemContainers})} />
                </SettingSection>

                <SettingSection icon={Server} title="Docker" description="Connection preferences for the active Docker daemon.">
                    <div className="space-y-2">
                        <FieldLabel label="Docker socket" detail="Use default for the local daemon, or provide a platform-specific socket path later." />
                        <input
                            value={draft.dockerSocket}
                            onChange={(event) => updateDraft({dockerSocket: event.target.value})}
                            placeholder="default"
                            className="min-h-10 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-docker-info"
                        />
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleTestConnection}>
                        <Check className="h-4 w-4" />
                        Test Connection
                    </Button>
                </SettingSection>

                <SettingSection icon={Terminal} title="Logs" description="Defaults for container log viewing and buffering.">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <FieldLabel label="Max buffered lines" detail="Limits how many log lines a viewer keeps in memory." />
                            <span className="rounded-md bg-docker-surface px-3 py-1 text-sm">{draft.logMaxLines}</span>
                        </div>
                        <input type="range" min="100" max="5000" step="100" value={draft.logMaxLines} onChange={(event) => updateDraft({logMaxLines: Number(event.target.value)})} className="w-full accent-primary" />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <FieldLabel label="Timestamp format" detail="Controls future log timestamp rendering." />
                        <SegmentedControl value={draft.timestampFormat} options={timestampOptions} onChange={(timestampFormat) => updateDraft({timestampFormat})} />
                    </div>
                </SettingSection>
            </div>

            <ReleaseReadinessCard />

            <SettingSection icon={Info} title="About" description="Runtime information and release checks for this DockerDash workspace.">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border bg-docker-surface p-3">
                        <p className="text-xs text-muted-foreground">DockerDash</p>
                        <p className="mt-1 text-sm font-medium">0.0.0</p>
                    </div>
                    <div className="rounded-md border bg-docker-surface p-3">
                        <p className="text-xs text-muted-foreground">Wails</p>
                        <p className="mt-1 text-sm font-medium">Runtime bound</p>
                    </div>
                    <div className="rounded-md border bg-docker-surface p-3">
                        <p className="text-xs text-muted-foreground">Docker</p>
                        <p className="mt-1 text-sm font-medium">Active context</p>
                    </div>
                </div>

                <form className="grid gap-3 border-t pt-4 lg:grid-cols-[1fr_1fr_auto]" onSubmit={handleCheckUpdate}>
                    <input
                        value={updateRepo.owner}
                        onChange={(event) => setUpdateRepo((current) => ({...current, owner: event.target.value}))}
                        placeholder="GitHub owner"
                        className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info"
                    />
                    <input
                        value={updateRepo.repo}
                        onChange={(event) => setUpdateRepo((current) => ({...current, repo: event.target.value}))}
                        placeholder="repository"
                        className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info"
                    />
                    <Button type="submit" variant="outline" className="gap-2" disabled={checkingUpdate || !updateRepo.owner.trim() || !updateRepo.repo.trim()}>
                        <RefreshCw className={checkingUpdate ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        Check Updates
                    </Button>
                </form>

                {(updateResult || updateError) && (
                    <div className={updateError ? 'rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive' : 'rounded-md border bg-docker-surface p-4 text-sm'}>
                        {updateError ? (
                            <p>{updateError}</p>
                        ) : (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">{updateResult.updateAvailable ? `${updateResult.latestVersion} is available` : 'DockerDash is current'}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Current version {updateResult.currentVersion}</p>
                                </div>
                                {updateResult.release?.htmlUrl && (
                                    <Button type="button" variant="outline" className="gap-2" onClick={handleOpenRelease}>
                                        <ExternalLink className="h-4 w-4" />
                                        Release Notes
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </SettingSection>
        </section>
    );
}
