import {Moon, Sun} from 'lucide-react';
import {useTheme} from '../../providers/theme-provider';
import {Button} from './button';

export function ThemeToggle() {
    const {isDark, toggleTheme} = useTheme();
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    const Icon = isDark ? Sun : Moon;

    return (
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label={label} title={label}>
            <Icon className="h-4 w-4" />
        </Button>
    );
}