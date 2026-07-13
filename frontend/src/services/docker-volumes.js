function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callVolumeBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Regenerate Wails bindings before using volume actions.`);
    }

    return method(...args);
}

export function listVolumes() {
    return callVolumeBinding('ListVolumes');
}

export function createVolume(name) {
    return callVolumeBinding('CreateVolume', name);
}

export function removeVolume(name, force = false) {
    return callVolumeBinding('RemoveVolume', name, force);
}
