import {useCallback, useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {CONTAINER_ACTIONS, removeContainer, restartContainer, startContainer, stopContainer} from '../../services/docker-container-actions';
import {useDockerDashboard} from '../../hooks/use-docker-dashboard';
import {useResourceFilter} from '../../hooks/use-resource-filter';
import {useNotifications} from '../../providers/notification-provider';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';
import {ContainerDetailPanel} from './container-detail-panel';
import {ContainerLogPanel} from './container-log-panel';
import {ContainerTable, ContainerTableSkeleton} from './container-table';

const actionHandlers = {
    [CONTAINER_ACTIONS.start]: (container) => startContainer(container.id),
    [CONTAINER_ACTIONS.stop]: (container) => stopContainer(container.id),
    [CONTAINER_ACTIONS.restart]: (container) => restartContainer(container.id),
    [CONTAINER_ACTIONS.remove]: (container) => removeContainer(container.id, container.state === 'running'),
};

const containerSearchSelectors = [
    (container) => container.id,
    (container) => container.name,
    (container) => container.image,
    (container) => container.state,
    (container) => container.status,
    (container) => container.ports,
];

export function ContainersPanel({query = ''}) {
    const {snapshot, loading, error, refresh} = useDockerDashboard();
    const [actionError, setActionError] = useState(null);
    const [selectedLogContainer, setSelectedLogContainer] = useState(null);
    const [selectedDetailContainer, setSelectedDetailContainer] = useState(null);
    const containers = snapshot?.containers || [];
    const {notify} = useNotifications();
    const filteredContainers = useResourceFilter(containers, query, containerSearchSelectors);

    const handleContainerAction = useCallback(async (action, container) => {
        const handler = actionHandlers[action];
        if (!handler) {
            return;
        }

        setActionError(null);
        try {
            await handler(container);
            notify({title: 'Container action completed', detail: `${container.name || container.id} ${action} completed`, type: 'success'});
            await refresh();
        } catch (nextError) {
            const detail = nextError?.message || String(nextError);
            setActionError(detail);
            notify({title: 'Container action failed', detail, type: 'error'});
        }
    }, [notify, refresh]);

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-2xl font-semibold">Containers</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Inspect container state, images, ports, and lifecycle actions from the active Docker context.
                    </p>
                </div>
                <Button variant="outline" className="self-start gap-2 sm:self-auto" onClick={refresh} disabled={loading}>
                    <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    Refresh
                </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {actionError && <p className="text-sm text-destructive">{actionError}</p>}

            <Card>
                <CardHeader>
                    <CardTitle>Container inventory</CardTitle>
                    <CardDescription>Start, stop, restart, and remove containers from the active Docker context.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && !containers.length ? <ContainerTableSkeleton /> : <ContainerTable containers={filteredContainers} onAction={handleContainerAction} onSelectLogs={setSelectedLogContainer} onSelectDetails={setSelectedDetailContainer} emptyMessage={query ? 'No containers match the current search.' : undefined} />}
                </CardContent>
            </Card>

            {selectedDetailContainer && (
                <ContainerDetailPanel container={selectedDetailContainer} onClose={() => setSelectedDetailContainer(null)} />
            )}

            {selectedLogContainer && (
                <ContainerLogPanel container={selectedLogContainer} onClose={() => setSelectedLogContainer(null)} />
            )}
        </section>
    );
}
