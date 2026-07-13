import {dockerdashTheme} from '../../config/theme';
import {cn} from '../../lib/utils';

export function StatusIndicator({tone = 'pending', children, className}) {
    const toneClass = dockerdashTheme.status[tone] || dockerdashTheme.status.pending;

    return (
        <div className={cn(dockerdashTheme.surfaces.statusPill, className)}>
            <span className={cn('h-2 w-2 rounded-full', toneClass)} />
            {children}
        </div>
    );
}