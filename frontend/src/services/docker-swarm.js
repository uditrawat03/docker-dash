function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

function requireBinding(name) {
    const method = getAppBindings()?.[name];
    if (typeof method !== 'function') {
        throw new Error(`${name} is not available. Regenerate Wails bindings before using Swarm features.`);
    }

    return method;
}

export function getSwarmOverview() {
    return requireBinding('GetSwarmOverview')();
}

export function listSwarmServices() {
    return requireBinding('ListSwarmServices')();
}
