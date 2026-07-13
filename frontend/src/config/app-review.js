import {Boxes, Container, FileCode2, GitGraph, HardDrive, Image, KeyRound, Network, PackageCheck, ShieldAlert, Terminal} from 'lucide-react';

export const appReviewSections = [
    {
        id: 'containers',
        title: 'Containers',
        icon: Container,
        items: ['Live inventory', 'Start, stop, restart, and remove actions', 'Detail panel with health, ports, mounts, env, logs, and browser launch'],
    },
    {
        id: 'images',
        title: 'Images',
        icon: Image,
        items: ['Image list', 'Pull workflow with progress events', 'Remove action', 'Scanner-oriented vulnerability summary'],
    },
    {
        id: 'storage',
        title: 'Storage',
        icon: HardDrive,
        items: ['Volume inventory', 'Usage mapping to containers', 'Create and remove volume workflows'],
    },
    {
        id: 'networking',
        title: 'Networking',
        icon: Network,
        items: ['Network inventory', 'Subnet and gateway details', 'Connected container inspection'],
    },
    {
        id: 'registries',
        title: 'Registries',
        icon: Boxes,
        items: ['Registry configuration', 'Repository-oriented panel', 'Authentication foundation'],
    },
    {
        id: 'security',
        title: 'Security',
        icon: ShieldAlert,
        items: ['Container security posture checks', 'Secrets panel', 'Private registry lessons'],
    },
    {
        id: 'automation',
        title: 'Automation',
        icon: GitGraph,
        items: ['CI workflow panel', 'GitHub Actions run summary', 'Release update checker'],
    },
    {
        id: 'compose',
        title: 'Compose',
        icon: FileCode2,
        items: ['Compose file picker', 'Service summary cards', 'Compose up/down with streamed output'],
    },
    {
        id: 'observability',
        title: 'Observability',
        icon: Terminal,
        items: ['Container logs', 'Stats panel', 'Activity workspace foundation'],
    },
    {
        id: 'release',
        title: 'Release Readiness',
        icon: PackageCheck,
        items: ['Packaging checklist', 'Platform target summary', 'Update release notes workflow'],
    },
    {
        id: 'access',
        title: 'App Controls',
        icon: KeyRound,
        items: ['Command palette', 'Keyboard shortcuts help', 'Settings persistence and theme controls'],
    },
];
