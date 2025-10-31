import { headerStyles } from "./header.css";
import { useThemeStore } from '../../lib/theme-store';
import { ThemeDropdown } from './theme-dropdown';
import { useSidebarStore } from '../../lib/sidebar-store';
import { sidebarBurger } from './sidebar.css';

export function Header() {
    const { theme, setTheme, resolvedTheme } = useThemeStore();
    const toggleSidebar = useSidebarStore(s => s.toggleSidebar);
    return (
        <header class={headerStyles}>
            <button
                aria-label="Open menu"
                onClick={toggleSidebar}
                class={sidebarBurger}
            >
                {/* Simple burger icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div style={{ fontWeight: 500, fontSize: '1.1rem' }}>Fastmail SMTP Dev</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ThemeDropdown theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />
                {/* Space for other icons on the right */}
            </div>
        </header>
    );
}   