import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import {NotificationProvider} from './providers/notification-provider'
import {SettingsProvider} from './providers/settings-provider'
import {ThemeProvider} from './providers/theme-provider'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <ThemeProvider>
            <SettingsProvider>
                <NotificationProvider>
                    <App/>
                </NotificationProvider>
            </SettingsProvider>
        </ThemeProvider>
    </React.StrictMode>
)
