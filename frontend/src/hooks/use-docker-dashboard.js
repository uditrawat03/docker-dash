import {useCallback, useState} from 'react';
import {DOCKER_DASHBOARD_EVENTS} from '../services/docker-events';
import {getDockerDashboardSnapshot} from '../services/docker-dashboard-service';
import {useWailsCall} from './use-wails-call';
import {useWailsEvent} from './use-wails-event';

export function useDockerDashboard() {
    const [liveSnapshot, setLiveSnapshot] = useState(null);
    const {
        data: snapshot,
        loading,
        error,
        execute,
    } = useWailsCall(getDockerDashboardSnapshot, {
        initialData: null,
        immediate: true,
    });

    const handleDashboardSnapshot = useCallback((nextSnapshot) => {
        setLiveSnapshot(nextSnapshot);
    }, []);

    useWailsEvent(DOCKER_DASHBOARD_EVENTS.dashboardSnapshot, handleDashboardSnapshot);

    const refresh = useCallback(() => {
        setLiveSnapshot(null);
        return execute().catch(() => null);
    }, [execute]);

    return {snapshot: liveSnapshot || snapshot, loading, error, refresh};
}
