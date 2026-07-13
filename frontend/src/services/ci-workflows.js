function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callCIBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Restart Wails after adding CI bindings.`);
    }

    return method(...args);
}

export function listCIWorkflowRuns({owner, repo, token = ''}) {
    return callCIBinding('ListCIWorkflowRuns', owner, repo, token);
}