import {useEffect, useState} from 'react';
import {Activity, Cpu} from 'lucide-react';
import {getContainerStats} from '../../services/docker-container-stats';

function clampPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.min(number, 100));
}

function formatBytes(value) {
    const bytes = Number(value || 0);
    if (!bytes) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const amount = bytes / (1024 ** index);

    return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
}

function ResourceBar({label, value, detail, icon: Icon}) {
    const percent = clampPercent(value);

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1">
                    <Icon className="h-3 w-3 shrink-0" />
                    <span>{label}</span>
                </span>
                <span className="font-mono">{detail || `${percent.toFixed(1)}%`}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-docker-info transition-all" style={{width: `${percent}%`}} />
            </div>
        </div>
    );
}

export function ContainerResourceCell({container}) {
    const [stats, setStats] = useState(null);
    const [state, setState] = useState('idle');

    useEffect(() => {
        let isActive = true;

        if (!container?.id || container.state !== 'running') {
            setStats(null);
            setState('idle');
            return undefined;
        }

        setState('loading');
        getContainerStats(container.id)
            .then((nextStats) => {
                if (isActive) {
                    setStats(nextStats);
                    setState('ready');
                }
            })
            .catch(() => {
                if (isActive) {
                    setStats(null);
                    setState('error');
                }
            });

        return () => {
            isActive = false;
        };
    }, [container?.id, container?.state]);

    if (container.state !== 'running') {
        return <span className="text-xs text-muted-foreground">Not running</span>;
    }

    if (state === 'loading') {
        return <span className="text-xs text-muted-foreground">Reading stats...</span>;
    }

    if (state === 'error' || !stats) {
        return <span className="text-xs text-muted-foreground">Stats unavailable</span>;
    }

    return (
        <div className="w-[170px] space-y-2">
            <ResourceBar label="CPU" value={stats.cpuPercent} icon={Cpu} />
            <ResourceBar
                label="Memory"
                value={stats.memoryPercent}
                detail={`${formatBytes(stats.memoryUsage)} / ${formatBytes(stats.memoryLimit)}`}
                icon={Activity}
            />
        </div>
    );
}
