function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

function requireBinding(name) {
    const method = getAppBindings()?.[name];
    if (typeof method !== 'function') {
        throw new Error(`${name} is not available. Regenerate Wails bindings before using secrets.`);
    }

    return method;
}

export function listSecrets() {
    return requireBinding('ListSecrets')();
}

export function createSecret(name, value) {
    return requireBinding('CreateSecret')(name, value);
}

export function removeSecret(id) {
    return requireBinding('RemoveSecret')(id);
}
