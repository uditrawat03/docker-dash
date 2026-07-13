function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callRegistryBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Restart Wails after adding registry bindings.`);
    }

    return method(...args);
}

export function testRegistryConnection(registry) {
    return callRegistryBinding('TestRegistryConnection', registry);
}

export function listRegistryCatalog(registry) {
    return callRegistryBinding('ListRegistryCatalog', registry);
}

export function listRegistryTags(registry, repository) {
    return callRegistryBinding('ListRegistryTags', registry, repository);
}

export function encodeRegistryAuth(auth) {
    return callRegistryBinding('EncodeRegistryAuth', auth);
}
