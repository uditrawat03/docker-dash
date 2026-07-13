import {EventsOff, EventsOn} from '../../wailsjs/runtime/runtime';

export const COMPOSE_OUTPUT_EVENT = 'docker:compose-output';

function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callComposeBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Restart Wails after adding Compose bindings.`);
    }

    return method(...args);
}

export function selectComposeFile() {
    return callComposeBinding('SelectComposeFile');
}

export function inspectComposeFile(path) {
    return callComposeBinding('InspectComposeFile', path);
}

export function composeUp(path) {
    return callComposeBinding('ComposeUp', path);
}

export function composeDown(path) {
    return callComposeBinding('ComposeDown', path);
}

export function onComposeOutput(handler) {
    EventsOn(COMPOSE_OUTPUT_EVENT, handler);
    return () => EventsOff(COMPOSE_OUTPUT_EVENT);
}
