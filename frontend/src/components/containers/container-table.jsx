import {useState} from 'react';
import {FileText, Play, RotateCw, Square, Trash2} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {Button} from '../ui/button';
import {StatusBadge} from '../ui/status-badge';
import {Skeleton} from '../ui/skeleton';
import {ContainerResourceCell} from './container-resource-cell';

const containerColumns = ['Name', 'Image', 'State', 'Health', 'Resources', 'Status', 'Ports', 'Actions'];

function ContainerActions({container, onAction, onSelectLogs}) {
    const [pendingAction, setPendingAction] = useState(null);
    const isRunning = container.state === 'running';
    const isBusy = Boolean(pendingAction);

    async function runAction(action) {
        const shouldConfirm = action === 'remove';
        if (shouldConfirm && !window.confirm(`Remove container "${container.name}"?`)) {
            return;
        }

        setPendingAction(action);
        try {
            await onAction?.(action, container);
        } finally {
            setPendingAction(null);
        }
    }

    function actionIcon(action, Icon) {
        return pendingAction === action ? <RotateCw className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />;
    }

    return (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSelectLogs?.(container)} aria-label={`View logs for ${container.name}`}>
                <FileText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isBusy || isRunning} onClick={() => runAction('start')} aria-label={`Start ${container.name}`}>
                {actionIcon('start', Play)}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isBusy || !isRunning} onClick={() => runAction('stop')} aria-label={`Stop ${container.name}`}>
                {actionIcon('stop', Square)}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isBusy} onClick={() => runAction('restart')} aria-label={`Restart ${container.name}`}>
                {actionIcon('restart', RotateCw)}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isBusy} onClick={() => runAction('remove')} aria-label={`Remove ${container.name}`}>
                {actionIcon('remove', Trash2)}
            </Button>
        </div>
    );
}

export function ContainerTableSkeleton({rows = 4}) {
    return (
        <div className={dockerdashTheme.surfaces.tableShell}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-sm">
                    <thead className={dockerdashTheme.surfaces.tableHead}>
                        <tr>
                            {containerColumns.map((column) => (
                                <th key={column} className="px-4 py-3 text-left font-medium tracking-normal">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {Array.from({length: rows}).map((_, index) => (
                            <tr key={index}>
                                {containerColumns.map((column) => (
                                    <td key={column} className="px-4 py-3">
                                        <Skeleton className="h-4 w-3/4" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ContainerTable({containers = [], onAction, onSelectLogs, onSelectDetails, emptyMessage}) {
    if (!containers.length) {
        return (
            <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
                {emptyMessage || 'No containers are available from the active Docker context.'}
            </div>
        );
    }

    return (
        <div className={dockerdashTheme.surfaces.tableShell}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-sm">
                    <thead className={dockerdashTheme.surfaces.tableHead}>
                        <tr>
                            {containerColumns.map((column) => (
                                <th key={column} className="px-4 py-3 text-left font-medium tracking-normal">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {containers.map((container) => (
                            <tr key={container.id} className={`${dockerdashTheme.surfaces.tableRow} cursor-pointer`} onClick={() => onSelectDetails?.(container)}>
                                <td className="px-4 py-3 font-medium">{container.name}</td>
                                <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">{container.image}</td>
                                <td className="px-4 py-3"><StatusBadge status={container.state} /></td>
                                <td className="px-4 py-3"><StatusBadge status={container.health || 'none'} /></td>
                                <td className="px-4 py-3"><ContainerResourceCell container={container} /></td>
                                <td className="px-4 py-3 text-muted-foreground">{container.status}</td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{container.ports || '-'}</td>
                                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}><ContainerActions container={container} onAction={onAction} onSelectLogs={onSelectLogs} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
