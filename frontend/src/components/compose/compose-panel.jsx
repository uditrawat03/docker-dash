import {useEffect, useMemo, useState} from 'react';
import {FileCode2, FolderOpen, Layers3, Play, Square, Terminal} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {composeDown, composeUp, inspectComposeFile, onComposeOutput, selectComposeFile} from '../../services/docker-compose';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {StatusIndicator} from '../ui/status-indicator';

function fileName(path = '') {
    return String(path).split(/[\\/]/).filter(Boolean).pop() || 'docker-compose.yml';
}

function ServiceCard({service}) {
    return (
        <Card className="shadow-panel">
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                        <Layers3 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="truncate text-base">{service.name}</CardTitle>
                        <CardDescription className="truncate">{service.image || 'Image resolved by Compose'}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-xs uppercase tracking-normal text-muted-foreground">Published ports</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {service.ports?.length ? service.ports.map((port) => (
                        <span key={port} className="rounded-md border bg-docker-surface px-2 py-1 font-mono text-xs text-muted-foreground">{port}</span>
                    )) : <span className="text-sm text-muted-foreground">No ports declared</span>}
                </div>
            </CardContent>
        </Card>
    );
}

function OutputLine({entry}) {
    const tone = entry.stream === 'stderr' ? 'text-docker-warning' : 'text-muted-foreground';
    return <div className={tone}>{entry.line}</div>;
}

export function ComposePanel({query = ''}) {
    const [project, setProject] = useState(null);
    const [output, setOutput] = useState([]);
    const [busyAction, setBusyAction] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => onComposeOutput((entry) => {
        setOutput((current) => [...current, entry]);
    }), []);

    const canRun = Boolean(project?.path) && !busyAction;
    const serviceCount = project?.services?.length || 0;
    const normalizedQuery = query.trim().toLowerCase();
    const filteredServices = (project?.services || []).filter((service) => {
        if (!normalizedQuery) {
            return true;
        }

        return [service.name, service.image, ...(service.ports || [])].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    });

    const outputTitle = useMemo(() => {
        if (!output.length) {
            return 'Compose output will appear here.';
        }

        return `${output.length} output ${output.length === 1 ? 'line' : 'lines'}`;
    }, [output.length]);

    const handleSelectFile = async () => {
        setError(null);
        try {
            const path = await selectComposeFile();
            if (!path) {
                return;
            }

            const summary = await inspectComposeFile(path);
            setProject(summary);
            setOutput([{stream: 'stdout', line: `Selected ${path}`}]);
        } catch (nextError) {
            setError(nextError?.message || String(nextError));
        }
    };

    const runCompose = async (action) => {
        if (!project?.path) {
            return;
        }

        setError(null);
        setBusyAction(action);
        setOutput((current) => [...current, {stream: 'stdout', line: `docker compose ${action === 'up' ? 'up -d' : 'down'}`}]);

        try {
            if (action === 'up') {
                await composeUp(project.path);
                setOutput((current) => [...current, {stream: 'stdout', line: 'Compose stack started.'}]);
            } else {
                await composeDown(project.path);
                setOutput((current) => [...current, {stream: 'stdout', line: 'Compose stack stopped.'}]);
            }
        } catch (nextError) {
            const message = nextError?.message || String(nextError);
            setError(message);
            setOutput((current) => [...current, {stream: 'stderr', line: message}]);
        } finally {
            setBusyAction(null);
        }
    };

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Compose stack launcher</p>
                    <h1 className="text-2xl font-semibold tracking-normal">Docker Compose</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleSelectFile} disabled={Boolean(busyAction)}>
                        <FolderOpen className="h-4 w-4" />
                        Select file
                    </Button>
                    <Button className="gap-2" onClick={() => runCompose('up')} disabled={!canRun}>
                        <Play className="h-4 w-4" />
                        {busyAction === 'up' ? 'Starting...' : 'Compose up'}
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => runCompose('down')} disabled={!canRun}>
                        <Square className="h-4 w-4" />
                        {busyAction === 'down' ? 'Stopping...' : 'Compose down'}
                    </Button>
                </div>
            </div>

            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <Card className="shadow-panel">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                                <FileCode2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <CardTitle>{project ? fileName(project.path) : 'No Compose file selected'}</CardTitle>
                                <CardDescription className="break-all">{project?.path || 'Select a docker-compose.yml or compose.yaml file to inspect services.'}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-md border bg-docker-surface p-3">
                                <p className="text-xs uppercase tracking-normal text-muted-foreground">Project</p>
                                <p className="mt-2 text-sm font-medium">{project?.name || '-'}</p>
                            </div>
                            <div className="rounded-md border bg-docker-surface p-3">
                                <p className="text-xs uppercase tracking-normal text-muted-foreground">Services</p>
                                <p className="mt-2 text-sm font-medium">{serviceCount}</p>
                            </div>
                        </div>
                        <StatusIndicator tone={project ? 'running' : 'pending'}>
                            {project ? 'Ready for compose commands' : 'Waiting for Compose file'}
                        </StatusIndicator>
                    </CardContent>
                </Card>

                <Card className="shadow-panel">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                                <Terminal className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Command output</CardTitle>
                                <CardDescription>{outputTitle}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 overflow-auto rounded-md border bg-[#0b1020] p-3 font-mono text-xs leading-5 text-slate-300">
                            {output.length ? output.map((entry, index) => <OutputLine key={`${entry.line}-${index}`} entry={entry} />) : (
                                <p className="text-muted-foreground">Select a file, then run Compose up or down.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {project?.services?.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredServices.map((service) => <ServiceCard key={service.name} service={service} />)}
                </div>
            ) : null}
        </section>
    );
}
