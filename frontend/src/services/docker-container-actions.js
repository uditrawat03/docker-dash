function getAppBindings() {
    return window?.go?.main?.App;
}

async function callContainerAction(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Regenerate Wails bindings before using this action.`);
    }

    return method(...args);
}

export const CONTAINER_ACTIONS = {
    start: 'start',
    stop: 'stop',
    restart: 'restart',
    remove: 'remove',
};

export function startContainer(id) {
    return callContainerAction('StartContainer', id);
}

export function stopContainer(id) {
    return callContainerAction('StopContainer', id);
}

export function restartContainer(id) {
    return callContainerAction('RestartContainer', id);
}

export function removeContainer(id, force = false) {
    return callContainerAction('RemoveContainer', id, force);
}