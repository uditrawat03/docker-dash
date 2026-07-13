import {useMemo, useState} from 'react';
import {CheckCircle2, CircleDot, ExternalLink, GitGraph, GitBranch, GitCommit, KeyRound, PlayCircle, RefreshCw, Save, Trash2, XCircle} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {useSettings} from '../../providers/settings-provider';
import {listCIWorkflowRuns} from '../../services/ci-workflows';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const workflowSearchSelectors = [
    (run) => run.name,
    (run) => run.status,
    (run) => run.conclusion,
    (run) => run.branch,
    (run) => run.event,
    (run) => run.commitSha,
    (run) => run.commitTitle,
];

const statusStyles = {
    success: 'border-docker-running/30 bg-docker-running/10 text-docker-running',
    failure: 'border-destructive/30 bg-destructive/10 text-destructive',
    cancelled: 'border-muted bg-docker-surface text-muted-foreground',
    skipped: 'border-muted bg-docker-surface text-muted-foreground',
    in_progress: 'border-docker-info/30 bg-docker-info/10 text-docker-info',
    queued: 'border-docker-warning/30 bg-docker-warning/10 text-docker-warning',
    requested: 'border-docker-warning/30 bg-docker-warning/10 text-docker-warning',
};

function createPipelineId() {
    return `pipeline-${Date.now()}`;
}

function runState(run) {
    return run.conclusion || run.status || 'unknown';
}

function statusClass(run) {
    return statusStyles[runState(run)] || 'border-border bg-docker-surface text-muted-foreground';
}

function StatusIcon({run}) {
    const state = runState(run);

    if (state === 'success') {
        return <CheckCircle2 className="h-4 w-4" />;
    }
    if (state === 'failure') {
        return <XCircle className="h-4 w-4" />;
    }
    if (state === 'in_progress' || state === 'queued' || state === 'requested') {
        return <RefreshCw className="h-4 w-4 animate-spin" />;
    }

    return <CircleDot className="h-4 w-4" />;
}

function shortSha(value) {
    return value ? value.slice(0, 7) : 'unknown';
}

function formatDate(value) {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function WorkflowRunCard({run}) {
    return (
        <div className="rounded-md border bg-card p-4 shadow-panel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${statusClass(run)}`}>
                            <StatusIcon run={run} />
                            {runState(run)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-docker-surface px-2 py-1 text-xs text-muted-foreground">
                            <PlayCircle className="h-3.5 w-3.5" />
                            {run.event || 'event'}
                        </span>
                    </div>
                    <h4 className="mt-3 truncate text-base font-semibold">{run.name || 'Workflow run'}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{run.commitTitle}</p>
                </div>
                {run.htmlUrl && (
                    <a href={run.htmlUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-docker-surface hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                        View
                    </a>
                )}
            </div>
            <div className="mt-4 grid gap-3 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="flex min-w-0 items-center gap-2">
                    <GitBranch className="h-4 w-4 shrink-0" />
                    <span className="truncate">{run.branch || 'unknown branch'}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <GitCommit className="h-4 w-4 shrink-0" />
                    <span className="font-mono">{shortSha(run.commitSha)}</span>
                </div>
                <div className="text-right sm:text-left">Updated {formatDate(run.updatedAt || run.createdAt)}</div>
            </div>
        </div>
    );
}

function WorkflowSummary({runs}) {
    const summary = useMemo(() => runs.reduce((counts, run) => {
        const state = runState(run);
        return {...counts, [state]: (counts[state] || 0) + 1};
    }, {}), [runs]);

    const items = [
        {label: 'Success', value: summary.success || 0, className: 'text-docker-running'},
        {label: 'Failure', value: summary.failure || 0, className: 'text-destructive'},
        {label: 'Running', value: summary.in_progress || 0, className: 'text-docker-info'},
        {label: 'Queued', value: (summary.queued || 0) + (summary.requested || 0), className: 'text-docker-warning'},
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-4">
            {items.map((item) => (
                <Card key={item.label} className="shadow-panel">
                    <CardContent className="p-4">
                        <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                        <p className={`mt-2 text-2xl font-semibold ${item.className}`}>{item.value}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function PipelineGuide() {
    return (
        <Card className="border-docker-info/30 bg-docker-info/5 shadow-panel">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-docker-info/10 text-docker-info">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>How to add a GitHub Actions pipeline</CardTitle>
                        <CardDescription>Connect a repository, optionally paste a GitHub token, save the pipeline, then refresh runs.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <div className="rounded-md border bg-background p-3">For public repositories, owner and repo are enough.</div>
                <div className="rounded-md border bg-background p-3">For private repositories, use a GitHub token with Actions read access.</div>
                <div className="rounded-md border bg-background p-3">Tokens are session-only here; saved pipelines store owner and repo only.</div>
            </CardContent>
        </Card>
    );
}

function PipelineList({pipelines, selectedId, onSelect, onRemove}) {
    return (
        <Card className="shadow-panel">
            <CardHeader>
                <CardTitle>Saved pipelines</CardTitle>
                <CardDescription>Add repositories you want to monitor regularly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {pipelines.length ? pipelines.map((pipeline) => (
                    <div key={pipeline.id} className={selectedId === pipeline.id ? 'rounded-md border border-docker-info bg-docker-surface p-3' : 'rounded-md border bg-card p-3'}>
                        <button type="button" className="w-full text-left" onClick={() => onSelect(pipeline)}>
                            <p className="text-sm font-medium">{pipeline.name || `${pipeline.owner}/${pipeline.repo}`}</p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{pipeline.owner}/{pipeline.repo}</p>
                        </button>
                        <Button type="button" variant="ghost" size="sm" className="mt-2 gap-2 text-destructive hover:text-destructive" onClick={() => onRemove(pipeline)}>
                            <Trash2 className="h-4 w-4" />
                            Remove
                        </Button>
                    </div>
                )) : <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">No pipelines saved yet.</p>}
            </CardContent>
        </Card>
    );
}

export function CIPanel({query = ''}) {
    const {settings, updateSettings} = useSettings();
    const pipelines = settings.ciPipelines || [];
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [pipelineName, setPipelineName] = useState('');
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [token, setToken] = useState('');
    const [runs, setRuns] = useState([]);
    const [repositoryLabel, setRepositoryLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const {notify} = useNotifications();

    const filteredRuns = useResourceFilter(runs, query, workflowSearchSelectors);
    const canRefresh = owner.trim().length > 0 && repo.trim().length > 0 && !loading;
    const canSave = owner.trim().length > 0 && repo.trim().length > 0;

    function selectPipeline(pipeline) {
        setSelectedPipelineId(pipeline.id);
        setPipelineName(pipeline.name || '');
        setOwner(pipeline.owner || '');
        setRepo(pipeline.repo || '');
        setToken('');
        setError(null);
        setMessage(`${pipeline.owner}/${pipeline.repo} selected`);
    }

    function savePipeline() {
        if (!canSave) {
            return;
        }

        const nextPipeline = {
            id: selectedPipelineId || createPipelineId(),
            name: pipelineName.trim() || `${owner.trim()}/${repo.trim()}`,
            owner: owner.trim(),
            repo: repo.trim(),
        };
        const exists = pipelines.some((pipeline) => pipeline.id === nextPipeline.id);
        const nextPipelines = exists
            ? pipelines.map((pipeline) => (pipeline.id === nextPipeline.id ? nextPipeline : pipeline))
            : [...pipelines, nextPipeline];

        updateSettings({ciPipelines: nextPipelines});
        setSelectedPipelineId(nextPipeline.id);
        setMessage(`${nextPipeline.name} saved`);
        notify({title: 'Pipeline saved', detail: `${nextPipeline.owner}/${nextPipeline.repo}`, type: 'success'});
    }

    function removePipeline(pipeline) {
        updateSettings({ciPipelines: pipelines.filter((item) => item.id !== pipeline.id)});
        if (selectedPipelineId === pipeline.id) {
            setSelectedPipelineId('');
            setPipelineName('');
            setOwner('');
            setRepo('');
            setRuns([]);
            setRepositoryLabel('');
        }
        notify({title: 'Pipeline removed', detail: `${pipeline.owner}/${pipeline.repo}`, type: 'info'});
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!canRefresh) {
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const result = await listCIWorkflowRuns({owner: owner.trim(), repo: repo.trim(), token});
            setRuns(result.runs || []);
            setRepositoryLabel(`${result.owner}/${result.repo}`);
            setMessage(`${result.runs?.length || 0} workflow runs loaded`);
            notify({title: 'CI runs loaded', detail: `${result.owner}/${result.repo}`, type: 'success'});
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'CI refresh failed', detail, type: 'error'});
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">CI Pipelines</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Add GitHub repositories, authenticate when needed, and review recent GitHub Actions runs for Docker build and release pipelines.
                    </p>
                </div>
                {repositoryLabel && <span className="rounded-md border bg-docker-surface px-3 py-2 font-mono text-sm text-muted-foreground">{repositoryLabel}</span>}
            </div>

            {(error || message) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-docker-running'}>{error || message}</p>}
            <PipelineGuide />

            <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                <PipelineList pipelines={pipelines} selectedId={selectedPipelineId} onSelect={selectPipeline} onRemove={removePipeline} />

                <Card className="shadow-panel">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                                <GitGraph className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Add or refresh pipeline</CardTitle>
                                <CardDescription>Save the repository profile, then refresh runs from GitHub Actions.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]" onSubmit={handleSubmit}>
                            <input value={pipelineName} onChange={(event) => setPipelineName(event.target.value)} placeholder="Display name" className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info" />
                            <input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="owner" className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info" />
                            <input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="repository" className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info" />
                            <input value={token} onChange={(event) => setToken(event.target.value)} type="password" placeholder="optional GitHub token" className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info lg:col-span-2" />
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" className="gap-2" disabled={!canSave} onClick={savePipeline}>
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                                <Button type="submit" className="gap-2" disabled={!canRefresh}>
                                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                                    Refresh
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <WorkflowSummary runs={filteredRuns} />

            <div className="space-y-3">
                {!filteredRuns.length ? (
                    <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                        {runs.length ? 'No workflow runs match the current search.' : 'No workflow runs loaded yet. Add a pipeline above and refresh it from GitHub.'}
                    </div>
                ) : filteredRuns.map((run) => <WorkflowRunCard key={run.id} run={run} />)}
            </div>
        </section>
    );
}
