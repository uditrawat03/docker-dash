import {Activity, Box, Boxes, Container, Cpu, GitGraph, GitBranch, HardDrive, Image, Layers3, LayoutDashboard, Network, Settings} from 'lucide-react';

export const NAVIGATION_VIEWS = {
    dashboard: 'dashboard',
    containers: 'containers',
    stats: 'stats',
    images: 'images',
    volumes: 'volumes',
    networks: 'networks',
    registries: 'registries',
    swarm: 'swarm',
    ci: 'ci',
    compose: 'compose',
    activity: 'activity',
    settings: 'settings',
};

export const primaryNavigation = [
    {id: NAVIGATION_VIEWS.dashboard, title: 'Dashboard', icon: LayoutDashboard},
    {id: NAVIGATION_VIEWS.containers, title: 'Containers', icon: Container},
    {id: NAVIGATION_VIEWS.stats, title: 'Stats', icon: Cpu},
    {id: NAVIGATION_VIEWS.images, title: 'Images', icon: Image},
    {id: NAVIGATION_VIEWS.volumes, title: 'Volumes', icon: HardDrive},
    {id: NAVIGATION_VIEWS.networks, title: 'Networks', icon: Network},
    // {id: NAVIGATION_VIEWS.registries, title: 'Registries', icon: Boxes},
    // {id: NAVIGATION_VIEWS.swarm, title: 'Swarm & Secrets', icon: GitBranch},
    {id: NAVIGATION_VIEWS.ci, title: 'CI Pipelines', icon: GitGraph},
    {id: NAVIGATION_VIEWS.compose, title: 'Compose', icon: Layers3},
];

export const secondaryNavigation = [
    {id: NAVIGATION_VIEWS.activity, title: 'Activity', icon: Activity},
    {id: NAVIGATION_VIEWS.settings, title: 'Settings', icon: Settings},
];

export const appBrand = {
    name: 'DockerDash',
    description: 'Docker GUI',
    icon: Box,
};

export const navigationItems = [...primaryNavigation, ...secondaryNavigation];

export function getNavigationItem(viewId) {
    return navigationItems.find((item) => item.id === viewId) || primaryNavigation[0];
}
