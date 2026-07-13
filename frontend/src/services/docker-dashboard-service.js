import {GetDockerStatus, ListDemoContainers} from '../../wailsjs/go/main/App';

function listContainers() {
    return ListDemoContainers();
}

function countByState(containers, state) {
    return containers.filter((container) => container.state === state).length;
}

function uniqueCount(items) {
    return new Set(items.filter(Boolean)).size;
}

function createMetricCards(containers) {
    const runningContainers = countByState(containers, 'running');
    const imageCount = uniqueCount(containers.map((container) => container.image));
    const networkCount = containers.length > 0 ? 1 : 0;

    return {
        runningContainers,
        images: imageCount,
        volumes: 0,
        networks: networkCount,
    };
}

function createEngineSummary(status) {
    const connected = Boolean(status?.connected);
    const platform = [status?.os, status?.arch].filter(Boolean).join(' ');

    return {
        connected,
        message: connected ? status?.message || 'Docker engine connected' : status?.errorMessage || status?.message || 'Docker status unavailable',
        version: status?.version || 'Not available',
        context: platform || 'Local default',
        securityScan: status?.apiVersion ? `API ${status.apiVersion}` : 'Not configured',
    };
}

function createActivityEvents(status, containers) {
    if (!containers.length) {
        return [
            {title: 'Docker connection pending', detail: status?.message || 'Connect Docker to load live daemon metrics.'},
            {title: 'No container events loaded', detail: 'Recent starts, stops, and health changes will stream here.'},
            {title: 'No image activity loaded', detail: 'Pulls, builds, and removals will be tracked from this panel.'},
        ];
    }

    return containers.slice(0, 3).map((container) => ({
        title: `${container.name} is ${container.state}`,
        detail: `${container.image} - ${container.status}`,
    }));
}

export function createDashboardSnapshot(status, containers) {
    const safeContainers = Array.isArray(containers) ? containers : [];

    return {
        engine: createEngineSummary(status),
        metrics: createMetricCards(safeContainers),
        resources: {
            cpu: '0%',
            memory: '0 MB',
            disk: '0 MB',
        },
        activity: createActivityEvents(status, safeContainers),
        containers: safeContainers,
        updatedAt: new Date().toISOString(),
    };
}

export async function getDockerDashboardSnapshot() {
    const [status, containers] = await Promise.all([
        GetDockerStatus(),
        listContainers(),
    ]);

    return createDashboardSnapshot(status, containers);
}
