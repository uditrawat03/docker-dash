import {dockerdashTheme} from '../../config/theme';
import {cn} from '../../lib/utils';

const STATUS_TONES = {
    healthy: {
        label: 'Healthy',
        dot: dockerdashTheme.status.running,
        badge: 'border-docker-running/30 bg-docker-running/10 text-docker-running',
        pulse: false,
    },
    unhealthy: {
        label: 'Unhealthy',
        dot: dockerdashTheme.status.stopped,
        badge: 'border-destructive/30 bg-destructive/10 text-destructive',
        pulse: true,
    },
    starting: {
        label: 'Starting',
        dot: dockerdashTheme.status.pending,
        badge: 'border-docker-warning/30 bg-docker-warning/10 text-docker-warning',
        pulse: true,
    },
    none: {
        label: 'No healthcheck',
        dot: 'bg-muted-foreground',
        badge: 'border-border bg-muted text-muted-foreground',
        pulse: false,
    },
    running: {
        label: 'Running',
        dot: dockerdashTheme.status.running,
        badge: 'border-docker-running/30 bg-docker-running/10 text-docker-running',
        pulse: true,
    },
    paused: {
        label: 'Paused',
        dot: dockerdashTheme.status.paused,
        badge: 'border-docker-paused/30 bg-docker-paused/10 text-docker-paused',
        pulse: false,
    },
    exited: {
        label: 'Exited',
        dot: dockerdashTheme.status.stopped,
        badge: 'border-docker-stopped/30 bg-docker-stopped/10 text-docker-stopped',
        pulse: false,
    },
    stopped: {
        label: 'Stopped',
        dot: dockerdashTheme.status.stopped,
        badge: 'border-docker-stopped/30 bg-docker-stopped/10 text-docker-stopped',
        pulse: false,
    },
    pending: {
        label: 'Pending',
        dot: dockerdashTheme.status.pending,
        badge: 'border-docker-warning/30 bg-docker-warning/10 text-docker-warning',
        pulse: false,
    },
};

export function getStatusTone(status) {
    return STATUS_TONES[status] || {
        label: status || 'Unknown',
        dot: 'bg-muted-foreground',
        badge: 'border-border bg-muted text-muted-foreground',
        pulse: false,
    };
}

export function StatusDot({status, className}) {
    const tone = getStatusTone(status);

    return <span className={cn('h-2 w-2 rounded-full', tone.dot, tone.pulse && 'animate-pulse', className)} />;
}

export function StatusBadge({status, children, className}) {
    const tone = getStatusTone(status);

    return (
        <span className={cn('inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium capitalize', tone.badge, className)}>
            <StatusDot status={status} />
            {children || tone.label}
        </span>
    );
}
