import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

const SETTINGS_STORAGE_KEY = 'dockerdash-settings';

const defaultSettings = {
    refreshInterval: 10,
    dockerSocket: 'default',
    logMaxLines: 500,
    timestampFormat: 'local',
    showSystemContainers: true,
    accentColor: 'blue',
    registryProfiles: [
        {id: 'local', name: 'Local registry', url: 'localhost:5000', username: ''},
        {id: 'ghcr', name: 'GitHub Container Registry', url: 'ghcr.io', username: ''},
    ],
    ciPipelines: [],
};

const SettingsContext = createContext(null);

function readSettings() {
    if (typeof window === 'undefined') {
        return defaultSettings;
    }

    try {
        const savedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        return savedSettings ? {...defaultSettings, ...JSON.parse(savedSettings)} : defaultSettings;
    } catch {
        return defaultSettings;
    }
}

export function SettingsProvider({children}) {
    const [settings, setSettings] = useState(readSettings);

    useEffect(() => {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSettings = useCallback((nextSettings) => {
        setSettings((current) => ({
            ...current,
            ...nextSettings,
        }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
    }, []);

    const value = useMemo(() => ({
        settings,
        updateSettings,
        resetSettings,
        defaultSettings,
    }), [settings, updateSettings, resetSettings]);

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }

    return context;
}
