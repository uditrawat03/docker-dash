import {Component} from 'react';
import {AlertTriangle, RotateCcw} from 'lucide-react';
import {dockerdashTheme} from '../../config/theme';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card';

export class PanelErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {error: null};
    }

    static getDerivedStateFromError(error) {
        return {error};
    }

    componentDidCatch(error, errorInfo) {
        console.error('DockerDash panel error', error, errorInfo);
    }

    componentDidUpdate(previousProps) {
        if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
            this.setState({error: null});
        }
    }

    handleReset = () => {
        this.setState({error: null});
    };

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <section className={dockerdashTheme.layout.pageSection}>
                <Card className="max-w-3xl shadow-panel">
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Panel failed to load</CardTitle>
                                <CardDescription>
                                    DockerDash kept the app running, but this workspace needs to be opened again.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm leading-6 text-muted-foreground">
                            Try reloading the panel. If it fails again, switch to another workspace and check the developer console for the captured error.
                        </p>
                        <Button type="button" onClick={this.handleReset} className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Retry panel
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }
}
