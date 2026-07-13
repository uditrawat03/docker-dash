function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

export async function inspectContainer(id) {
    const method = getAppBindings()?.InspectContainer;

    if (typeof method !== 'function') {
        throw new Error('InspectContainer is not available. Regenerate Wails bindings before using container details.');
    }

    return method(id);
}

export async function openContainerInBrowser(id, fallbackUrl) {
    const bindings = getAppBindings();

    if (typeof bindings?.OpenContainerInBrowser === 'function') {
        return bindings.OpenContainerInBrowser(id);
    }

    if (fallbackUrl && typeof bindings?.OpenExternalURL === 'function') {
        return bindings.OpenExternalURL(fallbackUrl);
    }

    throw new Error('OpenContainerInBrowser is not available. Restart Wails after adding container browser bindings.');
}
