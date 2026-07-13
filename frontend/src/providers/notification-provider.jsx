import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {DOCKER_DASHBOARD_EVENTS, subscribeToDockerEvent} from '../services/docker-events';

const NotificationContext = createContext(null);
const MAX_NOTIFICATIONS = 50;

function normalizeNotification(notification) {
    const createdAt = notification.createdAt || notification.at || new Date().toISOString();

    return {
        id: notification.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: notification.title || 'DockerDash',
        detail: notification.detail || notification.message || '',
        type: notification.type || 'info',
        read: Boolean(notification.read),
        createdAt,
    };
}

export function NotificationProvider({children}) {
    const [notifications, setNotifications] = useState([]);

    const notify = useCallback((notification) => {
        const nextNotification = normalizeNotification(notification);
        setNotifications((current) => [nextNotification, ...current].slice(0, MAX_NOTIFICATIONS));
        return nextNotification.id;
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((current) => current.map((notification) => ({...notification, read: true})));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    useEffect(() => subscribeToDockerEvent(DOCKER_DASHBOARD_EVENTS.notificationCreated, notify), [notify]);

    const value = useMemo(() => ({
        notifications,
        unreadCount: notifications.filter((notification) => !notification.read).length,
        notify,
        markAllRead,
        clearNotifications,
    }), [clearNotifications, markAllRead, notifications, notify]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }

    return context;
}
