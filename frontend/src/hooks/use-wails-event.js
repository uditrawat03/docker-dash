import {useEffect} from 'react';
import {subscribeToDockerEvent} from '../services/docker-events';

export function useWailsEvent(eventName, handler, enabled = true) {
    useEffect(() => {
        if (!enabled || !eventName || typeof handler !== 'function') {
            return undefined;
        }

        const unsubscribe = subscribeToDockerEvent(eventName, handler);

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [enabled, eventName, handler]);
}
