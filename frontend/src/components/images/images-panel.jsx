import {useCallback, useEffect, useMemo, useState} from 'react';
import {ArrowUpDown, Download, Image, RefreshCw, ShieldAlert, Trash2} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {listImages, onImagePullProgress, pullImage, removeImage, scanImage} from '../../services/docker-images';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const imageSearchSelectors = [
    (image) => image.id,
    (image) => image.repository,
    (image) => image.tag,
    (image) => image.fullTag,
];

function formatBytes(value) {
    if (!value) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = value;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function progressPercent(progress) {
    const current = progress?.progressDetail?.current || 0;
    const total = progress?.progressDetail?.total || 0;

    if (!total) {
        return 0;
    }

    return Math.min(100, Math.round((current / total) * 100));
}

function splitTag(tag) {
    if (!tag || tag === '<none>:<none>') {
        return {repository: '<none>', tag: '<none>'};
    }

    const slashIndex = tag.lastIndexOf('/');
    const colonIndex = tag.lastIndexOf(':');
    if (colonIndex > slashIndex) {
        return {repository: tag.slice(0, colonIndex), tag: tag.slice(colonIndex + 1)};
    }

    return {repository: tag, tag: 'latest'};
}

function imageRows(images) {
    return images.flatMap((image) => image.tags.map((tag) => ({
        ...image,
        fullTag: tag,
        ...splitTag(tag),
    })));
}

function SortButton({field, label, sort, onSort}) {
    const active = sort.field === field;

    return (
        <button type="button" className="inline-flex items-center gap-1 font-medium tracking-normal" onClick={() => onSort(field)}>
            {label}
            <ArrowUpDown className={active ? 'h-3.5 w-3.5 text-docker-info' : 'h-3.5 w-3.5 text-muted-foreground'} />
        </button>
    );
}

function SeverityPill({label, value, className}) {
    return <span className={`rounded-md border px-2 py-1 font-mono text-[11px] ${className}`}>{label}: {value}</span>;
}

function VulnerabilityBadge({result}) {
    if (!result) {
        return <span className="text-xs text-muted-foreground">Not scanned</span>;
    }

    const summary = result.summary || {};
    return (
        <div className="flex min-w-[220px] flex-wrap gap-1">
            <SeverityPill label="C" value={summary.critical || 0} className="border-destructive/30 bg-destructive/10 text-destructive" />
            <SeverityPill label="H" value={summary.high || 0} className="border-docker-stopped/30 bg-docker-stopped/10 text-docker-stopped" />
            <SeverityPill label="M" value={summary.medium || 0} className="border-docker-warning/30 bg-docker-warning/10 text-docker-warning" />
            <SeverityPill label="L" value={summary.low || 0} className="border-border bg-docker-surface text-muted-foreground" />
        </div>
    );
}
function ImagesTable({images, query, sort, removingId, scanningRef, scanResults, onSort, onRemove, onScan}) {
    const allRows = useMemo(() => imageRows(images), [images]);
    const filteredRows = useResourceFilter(allRows, query, imageSearchSelectors);
    const rows = useMemo(() => {
        return [...filteredRows].sort((left, right) => {
            const direction = sort.direction === 'asc' ? 1 : -1;
            const leftValue = left[sort.field];
            const rightValue = right[sort.field];

            if (sort.field === 'size') {
                return (leftValue - rightValue) * direction;
            }

            return String(leftValue).localeCompare(String(rightValue)) * direction;
        });
    }, [filteredRows, sort]);

    return (
        <div className="space-y-4">

            {!rows.length ? (
                <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">{query ? 'No images match the current search.' : 'No images were returned by the active Docker context.'}</div>
            ) : (
                <div className={dockerdashTheme.surfaces.tableShell}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1040px] text-sm">
                            <thead className={dockerdashTheme.surfaces.tableHead}>
                                <tr>
                                    <th className="px-4 py-3 text-left"><SortButton field="id" label="Image ID" sort={sort} onSort={onSort} /></th>
                                    <th className="px-4 py-3 text-left"><SortButton field="repository" label="Repository" sort={sort} onSort={onSort} /></th>
                                    <th className="px-4 py-3 text-left"><SortButton field="tag" label="Tag" sort={sort} onSort={onSort} /></th>
                                    <th className="px-4 py-3 text-left"><SortButton field="size" label="Size" sort={sort} onSort={onSort} /></th>
                                    <th className="px-4 py-3 text-left"><SortButton field="created" label="Created" sort={sort} onSort={onSort} /></th>
                                    <th className="px-4 py-3 text-left font-medium tracking-normal">Vulnerabilities</th>
                                    <th className="px-4 py-3 text-left font-medium tracking-normal">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map((row) => {
                                    const rowKey = `${row.id}-${row.fullTag}`;
                                    const isRemoving = removingId === row.id;
                                    const isScanning = scanningRef === row.fullTag;
                                    const canScan = row.fullTag && row.fullTag !== '<none>:<none>';

                                    return (
                                        <tr key={rowKey} className={dockerdashTheme.surfaces.tableRow}>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.id}</td>
                                            <td className="max-w-[260px] truncate px-4 py-3 font-medium">{row.repository}</td>
                                            <td className="px-4 py-3"><span className="rounded-md bg-docker-surface px-2 py-1 font-mono text-xs text-muted-foreground">{row.tag}</span></td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatBytes(row.size)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{row.created}</td>
                                            <td className="px-4 py-3"><VulnerabilityBadge result={scanResults[row.fullTag]} /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!canScan || isScanning} onClick={() => onScan(row)} aria-label={`Scan image ${row.fullTag}`}>
                                                        {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isRemoving} onClick={() => onRemove(row)} aria-label={`Remove image ${row.fullTag}`}>
                                                        {isRemoving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function PullProgressList({layers}) {
    const entries = Object.values(layers);

    if (!entries.length) {
        return null;
    }

    return (
        <div className="space-y-3">
            {entries.map((progress) => {
                const percent = progressPercent(progress);

                return (
                    <div key={progress.id || progress.status} className="space-y-1.5 rounded-md border bg-docker-surface p-3">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="min-w-0 truncate font-mono text-muted-foreground">{progress.id || 'image'}</span>
                            <span className="shrink-0 text-muted-foreground">{progress.status}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-md bg-background">
                            <div className="h-full bg-docker-info transition-all" style={{width: `${percent}%`}} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{progress.progress || 'Waiting for layer progress'}</span>
                            <span>{percent}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function ImagesPanel({query = ''}) {
    const [imageRef, setImageRef] = useState('nginx:alpine');
    const [pullingRef, setPullingRef] = useState(null);
    const [layers, setLayers] = useState({});
    const [images, setImages] = useState([]);
    const [loadingImages, setLoadingImages] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [scanningRef, setScanningRef] = useState(null);
    const [scanResults, setScanResults] = useState({});
    const [sort, setSort] = useState({field: 'repository', direction: 'asc'});
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const {notify} = useNotifications();

    const refreshImages = useCallback(async () => {
        setLoadingImages(true);
        setError(null);
        try {
            setImages(await listImages());
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Image refresh failed', detail, type: 'error'});
        } finally {
            setLoadingImages(false);
        }
    }, [notify]);

    useEffect(() => {
        refreshImages();
    }, [refreshImages]);

    useEffect(() => onImagePullProgress((progress) => {
        if (!pullingRef || progress.imageRef !== pullingRef) {
            return;
        }

        if (progress.id) {
            setLayers((current) => ({...current, [progress.id]: progress}));
        }

        if (progress.error) {
            setError(progress.error);
            notify({title: 'Image pull failed', detail: progress.error, type: 'error'});
            setPullingRef(null);
        }

        if (progress.done) {
            setMessage(`${progress.imageRef} pulled successfully`);
            notify({title: 'Image pulled', detail: `${progress.imageRef} is available locally`, type: 'success'});
            setPullingRef(null);
            refreshImages();
        }
    }), [notify, pullingRef, refreshImages]);

    const canPull = useMemo(() => imageRef.trim().length > 0 && !pullingRef, [imageRef, pullingRef]);

    function handleSort(field) {
        setSort((current) => ({
            field,
            direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    }

    async function handlePull(event) {
        event.preventDefault();
        const nextRef = imageRef.trim();
        if (!nextRef) {
            return;
        }

        setError(null);
        setMessage(null);
        setLayers({});
        setPullingRef(nextRef);

        try {
            await pullImage(nextRef);
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Image pull failed', detail, type: 'error'});
            setPullingRef(null);
        }
    }


    async function handleScan(row) {
        const nextRef = row.fullTag;
        if (!nextRef || nextRef === '<none>:<none>') {
            return;
        }

        setError(null);
        setMessage(null);
        setScanningRef(nextRef);
        try {
            const result = await scanImage(nextRef);
            setScanResults((current) => ({...current, [nextRef]: result}));
            setMessage(`${nextRef} scan completed`);
            notify({title: 'Image scan completed', detail: `${nextRef} scanned with Docker Scout`, type: 'success'});
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Image scan failed', detail, type: 'error'});
        } finally {
            setScanningRef(null);
        }
    }
    async function handleRemove(row) {
        if (!window.confirm(`Remove image "${row.fullTag}"?`)) {
            return;
        }

        setError(null);
        setMessage(null);
        setRemovingId(row.id);
        try {
            await removeImage(row.id, true);
            setMessage(`${row.fullTag} removed`);
            notify({title: 'Image removed', detail: `${row.fullTag} removed from local cache`, type: 'success'});
            await refreshImages();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setError(detail);
            notify({title: 'Image remove failed', detail, type: 'error'});
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Images</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Pull images from a registry and browse the local Docker image cache.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 sm:self-auto" onClick={refreshImages} disabled={loadingImages}>
                    <RefreshCw className={loadingImages ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {(error || message) && <p className={error ? 'text-sm text-destructive' : 'text-sm text-docker-running'}>{error || message}</p>}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                            <Download className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Pull image</CardTitle>
                            <CardDescription>Download an image into the active Docker context.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handlePull}>
                        <input
                            value={imageRef}
                            onChange={(event) => setImageRef(event.target.value)}
                            disabled={Boolean(pullingRef)}
                            placeholder="nginx:alpine"
                            className="min-h-10 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-docker-info disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <Button type="submit" className="gap-2" disabled={!canPull}>
                            <Download className="h-4 w-4" />
                            {pullingRef ? 'Pulling' : 'Pull'}
                        </Button>
                    </form>
                    <PullProgressList layers={layers} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                            <Image className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Image browser</CardTitle>
                            <CardDescription>Search, sort, and remove images currently available to Docker on this machine.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ImagesTable images={images} query={query} sort={sort} removingId={removingId} scanningRef={scanningRef} scanResults={scanResults} onSort={handleSort} onRemove={handleRemove} onScan={handleScan} />
                </CardContent>
            </Card>
        </section>
    );
}
