import { useState, useRef, useEffect } from 'preact/hooks';
import { themeDropdown, themeDropdownButton } from './theme-dropdown.css';

export function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 8.5 7 11.5 12 5.5" />
        </svg>
    );
}

export function ThemeDropdown({ theme, setTheme, resolvedTheme }: { theme: string, setTheme: (t: string) => void, resolvedTheme: string }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown if click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (open && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [open]);

    function ThemeIcon({ theme }: { theme: string }) {
        if (theme === 'dark') {
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
            );
        }
        if (theme === 'light') {
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
            );
        }
        // system
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <button
                aria-label="Change theme"
                class={themeDropdownButton} 
                onClick={() => setOpen(o => !o)}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--sidebar-accent)')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
                onFocus={e => (e.currentTarget.style.background = 'var(--sidebar-accent)')}
                onBlur={e => (e.currentTarget.style.background = 'none')}
            >
                <ThemeIcon theme={resolvedTheme} />
            </button>
            {open && (
                <div ref={dropdownRef} className={themeDropdown}>
                    <button className={themeDropdownButton} data-active={theme === 'system'} onClick={() => { setTheme('system'); setOpen(false); }}>
                        System
                        {theme === 'system' && <CheckIcon />}
                    </button>
                    <button className={themeDropdownButton} data-active={theme === 'light'} onClick={() => { setTheme('light'); setOpen(false); }}>
                        Light
                        {theme === 'light' && <CheckIcon />}
                    </button>
                    <button className={themeDropdownButton} data-active={theme === 'dark'} onClick={() => { setTheme('dark'); setOpen(false); }}>
                        Dark
                        {theme === 'dark' && <CheckIcon />}
                    </button>
                </div>
            )}
        </div>
    );
} 