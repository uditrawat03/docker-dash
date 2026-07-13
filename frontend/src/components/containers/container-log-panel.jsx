import {useEffect, useMemo, useRef, useState} from 'react';
import {Download, Trash2, X} from 'lucide-react';
import {Button} from '../ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/card';
import {onContainerLogError, onContainerLogLine, startContainerLogStream, stopContainerLogStream} from '../../services/container-logs';

const maxLogLines = 1000;

function formatLogTimestamp(value) {
    if (!value) {
        return '--:--:--';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleTimeString();
}

function downloadText(filename, text) {
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export function ContainerLogPanel({container, onClose}) {
    const [lines, setLines] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const containerId = container?.id;

    useEffect(() => {
        if (!containerId) {
            return undefined;
        }

        setLines([]);
        setError(null);
        startContainerLogStream(containerId).catch((nextError) => {
            setError(nextError?.message || String(nextError));
        });

        const offLine = onContainerLogLine((line) => {
            if (line.containerId !== containerId) {
                return;
            }

            setLines((current) => [...current, line].slice(-maxLogLines));
        });

        const offError = onContainerLogError((nextError) => {
            if (nextError.containerId === containerId) {
                setError(nextError.message);
            }
        });

        return () => {
            offLine();
            offError();
            stopContainerLogStream(containerId).catch(() => undefined);
        };
    }, [containerId]);

    useEffect(() => {
        if (autoScroll) {
            bottomRef.current?.scrollIntoView({block: 'end'});
        }
    }, [autoScroll, lines]);

    const exportText = useMemo(() => lines.map((line) => `[${line.timestamp}] ${line.stream}: ${line.text}`).join('\n'), [lines]);

    if (!container) {
        return null;
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-3 border-b bg-docker-surface sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <CardTitle className="truncate text-base">Logs: {container.name}</CardTitle>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{container.id}</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} />
                        Auto-scroll
                    </label>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLines([])} aria-label="Clear logs">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadText(`${container.name}-logs.txt`, exportText)} disabled={!lines.length} aria-label="Download logs">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close logs">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {error && <div className="border-b px-4 py-3 text-sm text-destructive">{error}</div>}
                <div className="h-[360px] overflow-y-auto bg-[#0b1020] p-4 font-mono text-xs text-slate-200">
                    {lines.length === 0 ? (
                        <p className="text-slate-500">Waiting for log output from this container.</p>
                    ) : (
                        <div className="space-y-1">
                            {lines.map((line, index) => (
                                <div key={`${line.timestamp}-${index}`} className="grid grid-cols-[82px_54px_minmax(0,1fr)] gap-3 leading-5">
                                    <span className="text-slate-500">{formatLogTimestamp(line.timestamp)}</span>
                                    <span className={line.stream === 'stderr' ? 'text-red-300' : 'text-cyan-300'}>{line.stream}</span>
                                    <span className="min-w-0 whitespace-pre-wrap break-words">{line.text}</span>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
