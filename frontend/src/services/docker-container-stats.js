function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callStatsBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Regenerate Wails bindings before using container stats.`);
    }

    return method(...args);
}

export function listContainersForStats() {
    return callStatsBinding('ListContainers');
}

export function getContainerStats(id) {
    return callStatsBinding('GetContainerStats', id);
}

export async function getContainerStatsSnapshot() {
    const containers = await listContainersForStats();
    const runningContainers = (containers || []).filter((container) => container.state === 'running');
    const results = await Promise.allSettled(runningContainers.map((container) => getContainerStats(container.id)));

    return runningContainers.map((container, index) => {
        const result = results[index];
        return {
            container,
            stats: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason?.message || String(result.reason) : null,
        };
    });
}