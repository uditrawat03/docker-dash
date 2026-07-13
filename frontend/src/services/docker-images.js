import {EventsOff, EventsOn} from '../../wailsjs/runtime/runtime';

export const IMAGE_PULL_PROGRESS_EVENT = 'docker:image-pull-progress';

function getAppBindings() {
    if (typeof window === 'undefined') {
        return undefined;
    }

    return window.go?.main?.App;
}

async function callImageBinding(methodName, ...args) {
    const method = getAppBindings()?.[methodName];

    if (typeof method !== 'function') {
        throw new Error(`${methodName} is not available. Regenerate Wails bindings before using image actions.`);
    }

    return method(...args);
}

export function pullImage(imageRef) {
    return callImageBinding('PullImage', imageRef);
}

export function listImages() {
    return callImageBinding('ListImages');
}

export function removeImage(imageId, force = false) {
    return callImageBinding('RemoveImage', imageId, force);
}

export function scanImage(imageRef) {
    return callImageBinding('ScanImage', imageRef);
}

export function onImagePullProgress(handler) {
    EventsOn(IMAGE_PULL_PROGRESS_EVENT, handler);
    return () => EventsOff(IMAGE_PULL_PROGRESS_EVENT);
}
