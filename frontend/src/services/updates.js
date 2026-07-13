function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callUpdateBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Restart Wails after adding update bindings.`);
    }

    return method(...args);
}

export function checkForUpdate({owner, repo, currentVersion = '0.0.0'}) {
    return callUpdateBinding('CheckForUpdate', owner, repo, currentVersion);
}

export function openExternalUrl(url) {
    return callUpdateBinding('OpenExternalURL', url);
}