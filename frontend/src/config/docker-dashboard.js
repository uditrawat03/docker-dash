import {Activity, Boxes, Container, Cpu, Database, Gauge, HardDrive, Image, Network, PlayCircle, RotateCw, Server, ShieldAlert, Square, Trash2} from 'lucide-react';

export const dockerMetricCards = [
    {key: 'runningContainers', label: 'Running containers', detail: 'Active container processes', icon: Container},
    {key: 'images', label: 'Images', detail: 'Local image cache', icon: Image},
    {key: 'volumes', label: 'Volumes', detail: 'Persistent Docker storage', icon: HardDrive},
    {key: 'networks', label: 'Networks', detail: 'Bridge and custom networks', icon: Network},
];

export const dockerEngineSummary = [
    {key: 'message', label: 'Engine status', icon: Server},
    {key: 'version', label: 'Docker version', icon: Boxes},
    {key: 'context', label: 'Context', icon: Gauge},
    {key: 'securityScan', label: 'Security scan', icon: ShieldAlert},
];

export const dockerResourceUsage = [
    {key: 'cpu', label: 'CPU usage', icon: Cpu},
    {key: 'memory', label: 'Memory usage', icon: Activity},
    {key: 'disk', label: 'Disk usage', icon: Database},
];

export const dockerQuickActions = [
    {id: 'refresh', label: 'Refresh Docker data', icon: RotateCw, enabled: true},
    {id: 'start', label: 'Start selected', icon: PlayCircle, enabled: false},
    {id: 'stop', label: 'Stop selected', icon: Square, enabled: false},
    {id: 'prune', label: 'Prune unused', icon: Trash2, enabled: false},
];

export const emptyDockerActivityEvents = [
    {title: 'Docker connection pending', detail: 'Connect Docker to load live daemon metrics.'},
    {title: 'No container events loaded', detail: 'Recent starts, stops, and health changes will stream here.'},
    {title: 'No image activity loaded', detail: 'Pulls, builds, and removals will be tracked from this panel.'},
];
