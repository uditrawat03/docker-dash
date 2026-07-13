import {appReviewSections} from '../../config/app-review';
import {dockerdashTheme} from '../../config/theme';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

export function FeatureWalkthroughCard() {
    return (
        <Card className="shadow-panel">
            <CardHeader>
                <CardTitle>DockerDash feature walkthrough</CardTitle>
                <CardDescription>Review the app modules completed across.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {appReviewSections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <div key={section.id} className="rounded-md border bg-docker-surface p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`${dockerdashTheme.surfaces.iconTile} h-9 w-9`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-sm font-semibold">{section.title}</h4>
                                </div>
                                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                                    {section.items.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
