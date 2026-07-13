function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callNetworkBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Regenerate Wails bindings before using network actions.`);
    }

    return method(...args);
}

export function listNetworks() {
    return callNetworkBinding('ListNetworks');
}

export function createNetwork(name) {
    return callNetworkBinding('CreateNetwork', name);
}

export function removeNetwork(id) {
    return callNetworkBinding('RemoveNetwork', id);
}
