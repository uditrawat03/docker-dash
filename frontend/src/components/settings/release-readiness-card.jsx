import {CheckCircle2, CircleAlert, PackageCheck, ShieldCheck} from 'lucide-react';
import {releaseChecklist, releaseTargets} from '../../config/release-readiness';
import {dockerdashTheme} from '../../config/theme';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

const statusStyles = {
    ready: {label: 'Ready', className: 'text-docker-running', icon: CheckCircle2},
    review: {label: 'Review', className: 'text-docker-warning', icon: CircleAlert},
    blocked: {label: 'Needed', className: 'text-muted-foreground', icon: ShieldCheck},
};

export function ReleaseReadinessCard() {
    return (
        <Card className="shadow-panel">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className={`${dockerdashTheme.surfaces.iconTile} h-10 w-10`}>
                        <PackageCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle>Release readiness</CardTitle>
                        <CardDescription>Packaging checklist before publishing DockerDash.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-3">
                    {releaseTargets.map((target) => (
                        <div key={target.id} className="rounded-md border bg-docker-surface p-3">
                            <p className="text-sm font-medium">{target.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{target.artifact}</p>
                            <p className="mt-2 font-mono text-xs text-muted-foreground">{target.signing}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    {releaseChecklist.map((item) => {
                        const status = statusStyles[item.status] || statusStyles.review;
                        const Icon = status.icon;

                        return (
                            <div key={item.id} className="flex items-start justify-between gap-4 rounded-md border bg-docker-surface px-3 py-3">
                                <div>
                                    <p className="text-sm font-medium">{item.title}</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                                </div>
                                <div className={`flex shrink-0 items-center gap-1 text-xs font-medium ${status.className}`}>
                                    <Icon className="h-4 w-4" />
                                    {status.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
