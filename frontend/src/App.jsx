import {useEffect, useMemo, useState} from 'react';
import {CIPanel} from './components/ci/ci-panel';
import {CommandPalette} from './components/command-palette/command-palette';
import {ComposePanel} from './components/compose/compose-panel';
import {ContainersPanel} from './components/containers/containers-panel';
import {ImagesPanel} from './components/images/images-panel';
import {VolumesPanel} from './components/volumes/volumes-panel';
import {NetworksPanel} from './components/networks/networks-panel';
import {RegistriesPanel} from './components/registries/registries-panel';
import {SwarmPanel} from './components/swarm/swarm-panel';
import {StatsPanel} from './components/stats/stats-panel';
import {ActivityPanel} from './components/activity/activity-panel';
import {DashboardHome} from './components/dashboard/dashboard-home';
import {PanelErrorBoundary} from './components/error-boundary/panel-error-boundary';
import {ShortcutsHelp} from './components/keyboard/shortcuts-help';
import {AppLayout} from './components/layout/app-layout';
import {SettingsPanel} from './components/settings/settings-panel';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './components/ui/card';
import {createCommandItems} from './config/commands';
import {createShortcutHandlers} from './config/keyboard-shortcuts';
import {NAVIGATION_VIEWS, getNavigationItem} from './config/navigation';
import {dockerdashTheme} from './config/theme';
import {useKeyboardShortcuts} from './hooks/use-keyboard-shortcuts';

const RESOURCE_SEARCH = {
    [NAVIGATION_VIEWS.containers]: 'Search containers, images, or status',
    [NAVIGATION_VIEWS.stats]: 'Search containers, images, or resource state',
    [NAVIGATION_VIEWS.images]: 'Search images, repositories, or tags',
    [NAVIGATION_VIEWS.volumes]: 'Search volumes, drivers, or containers',
    [NAVIGATION_VIEWS.networks]: 'Search networks, subnets, or containers',
    [NAVIGATION_VIEWS.registries]: 'Search registry repositories or tags',
    [NAVIGATION_VIEWS.swarm]: 'Search Swarm services, secrets, images, labels, or update state',
    [NAVIGATION_VIEWS.ci]: 'Search workflow, branch, commit, or status',
    [NAVIGATION_VIEWS.compose]: 'Search Compose services, images, or ports',
};

function WorkspacePlaceholder({viewId}) {
    const item = getNavigationItem(viewId);
    const Icon = item.icon;

    return (
        <section className={dockerdashTheme.layout.pageSection}>
            <Card className="max-w-3xl shadow-panel">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>{item.title}</CardTitle>
                            <CardDescription>Docker workspace panel</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                        This section is reserved for live Docker data and actions. The navigation shell is ready, and the panel will be connected as the Docker integration expands.
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}

function App() {
    const [activeView, setActiveView] = useState(NAVIGATION_VIEWS.dashboard);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [resourceQuery, setResourceQuery] = useState('');

    const shortcuts = useMemo(() => createShortcutHandlers({
        navigate: setActiveView,
        openShortcuts: () => setShortcutsOpen(true),
        closeShortcuts: () => setShortcutsOpen(false),
        openCommandPalette: () => setCommandPaletteOpen(true),
        closeCommandPalette: () => setCommandPaletteOpen(false),
    }), []);

    const commandItems = useMemo(() => createCommandItems({
        navigate: setActiveView,
        openShortcuts: () => setShortcutsOpen(true),
    }), []);

    const search = RESOURCE_SEARCH[activeView]
        ? {value: resourceQuery, onChange: setResourceQuery, placeholder: RESOURCE_SEARCH[activeView]}
        : null;

    useEffect(() => {
        if (!RESOURCE_SEARCH[activeView] && resourceQuery) {
            setResourceQuery('');
        }
    }, [activeView, resourceQuery]);

    useKeyboardShortcuts(shortcuts);

    return (
        <>
            <AppLayout activeView={activeView} onNavigate={setActiveView} search={search}>
                <PanelErrorBoundary resetKey={activeView}>
                    {activeView === NAVIGATION_VIEWS.dashboard && <DashboardHome />}
                    {activeView === NAVIGATION_VIEWS.containers && <ContainersPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.stats && <StatsPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.images && <ImagesPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.volumes && <VolumesPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.networks && <NetworksPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.registries && <RegistriesPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.swarm && <SwarmPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.ci && <CIPanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.compose && <ComposePanel query={resourceQuery} />}
                    {activeView === NAVIGATION_VIEWS.activity && <ActivityPanel />}
                    {activeView === NAVIGATION_VIEWS.settings && <SettingsPanel />}
                    {activeView !== NAVIGATION_VIEWS.dashboard && activeView !== NAVIGATION_VIEWS.containers && activeView !== NAVIGATION_VIEWS.stats && activeView !== NAVIGATION_VIEWS.images && activeView !== NAVIGATION_VIEWS.volumes && activeView !== NAVIGATION_VIEWS.networks && activeView !== NAVIGATION_VIEWS.registries && activeView !== NAVIGATION_VIEWS.swarm && activeView !== NAVIGATION_VIEWS.ci && activeView !== NAVIGATION_VIEWS.compose && activeView !== NAVIGATION_VIEWS.activity && activeView !== NAVIGATION_VIEWS.settings && <WorkspacePlaceholder viewId={activeView} />}
                </PanelErrorBoundary>
            </AppLayout>
            <CommandPalette open={commandPaletteOpen} items={commandItems} onClose={() => setCommandPaletteOpen(false)} />
            <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </>
    );
}

export default App;
