export const dockerdashTheme = {
    layout: {
        appShell: 'flex h-screen w-full overflow-hidden bg-background text-foreground',
        mainColumn: 'flex min-w-0 flex-1 flex-col overflow-hidden',
        contentScroll: 'min-h-0 flex-1 overflow-y-auto',
        pageSection: 'flex flex-1 flex-col gap-6 p-6',
    },
    surfaces: {
        metricCard: 'shadow-panel',
        iconTile: 'flex items-center justify-center rounded-md bg-docker-surface-strong text-docker-info',
        statusPill: 'flex items-center gap-2 rounded-md border bg-docker-surface px-3 py-2 text-sm text-muted-foreground',
        tableShell: 'overflow-hidden rounded-md border bg-card shadow-panel',
        tableHead: 'bg-docker-surface text-xs uppercase text-muted-foreground',
        tableRow: 'transition-colors hover:bg-docker-surface',
    },
    status: {
        pending: 'bg-docker-warning',
        running: 'bg-docker-running',
        paused: 'bg-docker-paused',
        stopped: 'bg-docker-stopped',
    },
};
