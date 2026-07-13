import {dockerdashTheme} from '../../config/theme';
import {SidebarProvider, SidebarInset} from '../ui/sidebar';
import {AppHeader} from './app-header';
import {AppSidebar} from './app-sidebar';

export function AppLayout({activeView, onNavigate, search, children}) {
    return (
        <SidebarProvider defaultOpen className={dockerdashTheme.layout.appShell}>
            <AppSidebar activeView={activeView} onNavigate={onNavigate} />
            <SidebarInset className={dockerdashTheme.layout.mainColumn}>
                <AppHeader activeView={activeView} search={search} />
                <main className={dockerdashTheme.layout.contentScroll}>{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
