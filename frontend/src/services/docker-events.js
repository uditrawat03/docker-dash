import {EventsEmit, EventsOn} from '../../wailsjs/runtime/runtime';

export const DOCKER_DASHBOARD_EVENTS = {
    dashboardSnapshot: 'dockerdash:dashboard:snapshot',
    containersUpdated: 'dockerdash:containers:updated',
    activityCreated: 'dockerdash:activity:created',
    notificationCreated: 'dockerdash:notification:created',
};

function hasWailsRuntime() {
    return typeof window !== 'undefined' && Boolean(window.runtime);
}

export function subscribeToDockerEvent(eventName, handler) {
    if (!hasWailsRuntime()) {
        return () => {};
    }

    return EventsOn(eventName, handler);
}

export function emitDockerEvent(eventName, payload) {
    if (!hasWailsRuntime()) {
        return;
    }

    EventsEmit(eventName, payload);
}
