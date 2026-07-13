import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cn} from '../../lib/utils';

const SidebarContext = React.createContext(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);

    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider.');
    }

    return context;
}

function SidebarProvider({defaultOpen = true, open: openProp, onOpenChange, className, children, ...props}) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const open = openProp ?? uncontrolledOpen;

    const setOpen = React.useCallback(
        (value) => {
            const nextOpen = typeof value === 'function' ? value(open) : value;
            if (onOpenChange) {
                onOpenChange(nextOpen);
            } else {
                setUncontrolledOpen(nextOpen);
            }
        },
        [onOpenChange, open]
    );

    const toggleSidebar = React.useCallback(() => setOpen((value) => !value), [setOpen]);
    const state = open ? 'expanded' : 'collapsed';

    const value = React.useMemo(
        () => ({state, open, setOpen, toggleSidebar}),
        [state, open, setOpen, toggleSidebar]
    );

    React.useEffect(() => {
        function onKeyDown(event) {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
                event.preventDefault();
                toggleSidebar();
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [toggleSidebar]);

    return (
        <SidebarContext.Provider value={value}>
            <div
                data-sidebar-wrapper=""
                data-state={state}
                className={cn(
                    'group/sidebar-wrapper flex h-screen w-full overflow-hidden bg-background text-foreground [--sidebar-width:16rem] [--sidebar-width-icon:4.5rem]',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </SidebarContext.Provider>
    );
}

function Sidebar({className, collapsible = 'offcanvas', children, ...props}) {
    return (
        <aside
            data-sidebar="sidebar"
            data-collapsible={collapsible}
            className={cn(
                'relative flex h-screen w-[--sidebar-width] shrink-0 flex-col overflow-hidden border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear',
                collapsible === 'icon' && 'group-data-[state=collapsed]/sidebar-wrapper:w-[--sidebar-width-icon]',
                className
            )}
            {...props}
        >
            {children}
        </aside>
    );
}

function SidebarHeader({className, ...props}) {
    return <div className={cn('border-b p-3', className)} {...props} />;
}

function SidebarContent({className, ...props}) {
    return <div className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3', className)} {...props} />;
}

function SidebarFooter({className, ...props}) {
    return <div className={cn('border-t p-3', className)} {...props} />;
}

function SidebarGroup({className, ...props}) {
    return <div className={cn('grid gap-1', className)} {...props} />;
}

function SidebarGroupLabel({className, ...props}) {
    return (
        <div
            className={cn(
                'px-2 py-1.5 text-xs font-medium text-sidebar-muted-foreground transition-opacity group-data-[state=collapsed]/sidebar-wrapper:sr-only',
                className
            )}
            {...props}
        />
    );
}

function SidebarGroupContent({className, ...props}) {
    return <div className={cn('grid gap-1', className)} {...props} />;
}

function SidebarMenu({className, ...props}) {
    return <ul className={cn('grid gap-1', className)} {...props} />;
}

function SidebarMenuItem({className, ...props}) {
    return <li className={cn('min-w-0', className)} {...props} />;
}

const menuButtonSizes = {
    default: 'h-10 px-3',
    sm: 'h-8 px-2',
    lg: 'h-12 px-3',
};

function SidebarMenuButton({asChild = false, isActive = false, size = 'default', tooltip, className, ...props}) {
    const Comp = asChild ? Slot : 'button';
    const buttonProps = asChild ? {} : {type: 'button'};

    return (
        <Comp
            {...buttonProps}
            data-active={isActive}
            title={tooltip}
            className={cn(
                'flex w-full min-w-0 items-center gap-3 rounded-md text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
                'group-data-[state=collapsed]/sidebar-wrapper:justify-center group-data-[state=collapsed]/sidebar-wrapper:px-0 group-data-[state=collapsed]/sidebar-wrapper:[&>span]:sr-only',
                menuButtonSizes[size],
                className
            )}
            {...props}
        />
    );
}

function SidebarInset({className, ...props}) {
    return <div className={cn('flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-background', className)} {...props} />;
}

const SidebarTrigger = React.forwardRef(({className, asChild = false, ...props}, ref) => {
    const {toggleSidebar} = useSidebar();
    const Comp = asChild ? Slot : 'button';
    const buttonProps = asChild ? {} : {type: 'button'};

    return <Comp ref={ref} {...buttonProps} data-sidebar-trigger="" onClick={toggleSidebar} className={className} {...props} />;
});
SidebarTrigger.displayName = 'SidebarTrigger';

function SidebarRail({className, ...props}) {
    const {toggleSidebar} = useSidebar();

    return (
        <button
            type="button"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            onClick={toggleSidebar}
            className={cn(
                'absolute inset-y-0 right-[-5px] z-10 hidden w-2 cursor-col-resize opacity-0 transition-opacity hover:opacity-100 md:block',
                'after:absolute after:inset-y-4 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full after:bg-sidebar-border',
                className
            )}
            {...props}
        />
    );
}

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
};
