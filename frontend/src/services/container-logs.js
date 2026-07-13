import {EventsOff, EventsOn} from '../../wailsjs/runtime/runtime';

export const CONTAINER_LOG_EVENTS = {
    line: 'docker:container-log-line',
    error: 'docker:container-log-error',
};

function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callLogBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Regenerate Wails bindings before using container logs.`);
    }

    return method(...args);
}

export function startContainerLogStream(containerId) {
    return callLogBinding('StartContainerLogStream', containerId);
}

export function stopContainerLogStream(containerId) {
    return callLogBinding('StopContainerLogStream', containerId);
}

export function onContainerLogLine(handler) {
    EventsOn(CONTAINER_LOG_EVENTS.line, handler);
    return () => EventsOff(CONTAINER_LOG_EVENTS.line);
}

export function onContainerLogError(handler) {
    EventsOn(CONTAINER_LOG_EVENTS.error, handler);
    return () => EventsOff(CONTAINER_LOG_EVENTS.error);
}
