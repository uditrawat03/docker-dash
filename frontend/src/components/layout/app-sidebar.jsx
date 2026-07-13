import {appBrand, primaryNavigation, secondaryNavigation} from '../../config/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '../ui/sidebar';

function NavigationGroup({label, items, activeView, onNavigate}) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                    isActive={activeView === item.id}
                                    tooltip={item.title}
                                    onClick={() => onNavigate(item.id)}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

export function AppSidebar({activeView, onNavigate}) {
    const BrandIcon = appBrand.icon;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="gap-3" tooltip={appBrand.name} onClick={() => onNavigate('dashboard')}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                                <BrandIcon className="h-4 w-4" />
                            </div>
                            <span className="flex min-w-0 flex-col text-left">
                                <span className="truncate text-sm font-semibold leading-none">{appBrand.name}</span>
                                <span className="mt-1 truncate text-xs text-sidebar-muted-foreground">{appBrand.description}</span>
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavigationGroup label="Application" items={primaryNavigation} activeView={activeView} onNavigate={onNavigate} />
            </SidebarContent>

            <SidebarFooter>
                <NavigationGroup label="System" items={secondaryNavigation} activeView={activeView} onNavigate={onNavigate} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}