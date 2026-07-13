import {useEffect, useMemo, useState} from 'react';
import {Braces, CheckCircle2, ExternalLink, FileText, Info, ShieldAlert, X, XCircle} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {inspectContainer, openContainerInBrowser} from '../../services/docker-container-details';
import {Button} from '../ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {StatusBadge} from '../ui/status-badge';
import {ContainerLogPanel} from './container-log-panel';

const tabs = [
    {id: 'overview', label: 'Overview', icon: Info},
    {id: 'inspect', label: 'Inspect', icon: Braces},
    {id: 'logs', label: 'Logs', icon: FileText},
];

function maskEnv(value) {
    const [key, ...parts] = String(value).split('=');
    const secretPattern = /(token|secret|password|passwd|pwd|key|credential)/i;

    if (!parts.length) {
        return value;
    }

    return secretPattern.test(key) ? `${key}=********` : value;
}

function DetailList({items, empty}) {
    if (!items?.length) {
        return <p className="text-sm text-muted-foreground">{empty}</p>;
    }

    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-md border bg-docker-surface px-3 py-2 font-mono text-xs text-muted-foreground">
                    {item}
                </div>
            ))}
        </div>
    );
}

function OverviewTab({details}) {
    const summary = [
        ['Image', details.image],
        ['Command', details.command || '-'],
        ['Created', details.created || '-'],
        ['Status', details.status || '-'],
        ['Health', details.health || 'none'],
        ['Failing streak', String(details.healthFailingStreak || 0)],
    ];

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="space-y-4">
                <SecurityPostureCard security={details.security} />

                <div className="grid gap-3 sm:grid-cols-2">
                    {summary.map(([label, value]) => (
                        <div key={label} className="rounded-md border bg-docker-surface p-3">
                            <p className="text-xs uppercase tracking-normal text-muted-foreground">{label}</p>
                            <p className="mt-2 break-words text-sm">{value}</p>
                        </div>
                    ))}
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-base">Ports</CardTitle></CardHeader>
                    <CardContent><DetailList items={details.ports} empty="No published ports were reported." /></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader>
                    <CardContent><DetailList items={(details.env || []).map(maskEnv)} empty="No environment variables were reported." /></CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Mounts</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {details.mounts?.length ? details.mounts.map((mount) => (
                            <div key={`${mount.source}-${mount.destination}`} className="rounded-md border bg-docker-surface p-3 text-sm">
                                <p className="font-medium">{mount.destination}</p>
                                <p className="mt-1 break-words font-mono text-xs text-muted-foreground">{mount.source || mount.type}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{mount.rw ? 'read/write' : 'read-only'} {mount.mode ? `- ${mount.mode}` : ''}</p>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">No mounts were reported.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Networks</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {details.networks?.length ? details.networks.map((network) => (
                            <div key={network.name} className="rounded-md border bg-docker-surface p-3 text-sm">
                                <p className="font-medium">{network.name}</p>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">IP {network.ipAddress || '-'}</p>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">Gateway {network.gateway || '-'}</p>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">No networks were reported.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function securityTone(score = 0) {
    if (score >= 80) {
        return {label: 'Strong', color: 'text-docker-running', ring: 'hsl(var(--docker-running))'};
    }
    if (score >= 50) {
        return {label: 'Needs review', color: 'text-docker-warning', ring: 'hsl(var(--docker-warning))'};
    }

    return {label: 'High risk', color: 'text-destructive', ring: 'hsl(var(--destructive))'};
}

function SecurityPostureCard({security}) {
    const checks = security?.checks || [];
    const score = Number(security?.score || 0);
    const tone = securityTone(score);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className={dockerdashTheme.surfaces.iconTile}>
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Security posture</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">Container hardening checks from Docker inspect.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                        style={{background: `conic-gradient(${tone.ring} ${score}%, hsl(var(--muted)) 0)`}}
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-lg font-semibold">{score}</div>
                    </div>
                    <div>
                        <p className={`text-sm font-semibold ${tone.color}`}>{tone.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{checks.filter((check) => check.passed).length}/{checks.length || 0} checks passed</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {checks.map((check) => {
                        const Icon = check.passed ? CheckCircle2 : XCircle;
                        return (
                            <div key={check.key} className="flex items-start gap-2 rounded-md border bg-docker-surface p-2 text-sm">
                                <Icon className={check.passed ? 'mt-0.5 h-4 w-4 text-docker-running' : 'mt-0.5 h-4 w-4 text-muted-foreground'} />
                                <div>
                                    <p className="font-medium">{check.label}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{check.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
function InspectTab({details}) {
    return (
        <pre className="max-h-[560px] overflow-auto rounded-md border bg-[#0b1020] p-4 text-xs leading-5 text-slate-200">
            {details.rawJson}
        </pre>
    );
}

export function ContainerDetailPanel({container, onClose}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [browserError, setBrowserError] = useState(null);
    const [openingBrowser, setOpeningBrowser] = useState(false);

    useEffect(() => {
        if (!container?.id) {
            return;
        }

        setActiveTab('overview');
        setDetails(null);
        setError(null);
        setBrowserError(null);
        setLoading(true);
        inspectContainer(container.id)
            .then(setDetails)
            .catch((nextError) => setError(nextError?.message || String(nextError)))
            .finally(() => setLoading(false));
    }, [container?.id]);

    const logContainer = useMemo(() => details ? {...container, id: details.id, name: details.name} : container, [container, details]);

    const handleOpenBrowser = async () => {
        if (!details?.id || !details?.browserUrl) {
            return;
        }

        setBrowserError(null);
        setOpeningBrowser(true);

        try {
            await openContainerInBrowser(details.id, details.browserUrl);
        } catch (nextError) {
            setBrowserError(nextError?.message || String(nextError));
        } finally {
            setOpeningBrowser(false);
        }
    };

    if (!container) {
        return null;
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b bg-docker-surface">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <CardTitle className="truncate text-lg">{details?.name || container.name}</CardTitle>
                            <StatusBadge status={details?.state || container.state} />
                            <StatusBadge status={details?.health || container.health || 'none'} />
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{details?.id || container.id}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                        {details?.browserUrl && (
                            <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenBrowser} disabled={openingBrowser}>
                                <ExternalLink className="h-4 w-4" />
                                {openingBrowser ? 'Opening...' : 'Open'}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close container details">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <Button key={tab.id} variant={isActive ? 'default' : 'outline'} size="sm" className="gap-2" onClick={() => setActiveTab(tab.id)}>
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </Button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                {loading && <p className="text-sm text-muted-foreground">Loading container details...</p>}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {browserError && <p className="mb-4 text-sm text-destructive">{browserError}</p>}
                {!loading && !error && details && activeTab === 'overview' && <OverviewTab details={details} />}
                {!loading && !error && details && activeTab === 'inspect' && <InspectTab details={details} />}
                {!loading && !error && activeTab === 'logs' && <ContainerLogPanel container={logContainer} onClose={() => setActiveTab('overview')} />}
            </CardContent>
        </Card>
    );
}
