import { createTheme } from "@vanilla-extract/css";
import { globalStyle } from "@vanilla-extract/css";
import '@fontsource-variable/geist';

export const [themeClass, vars] = createTheme({
    color: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        cardForeground: 'var(--card-foreground)',
        popover: 'var(--popover)',
        popoverForeground: 'var(--popover-foreground)',
        primary: 'var(--primary)',
        primaryForeground: 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        secondaryForeground: 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        mutedForeground: 'var(--muted-foreground)',
        accent: 'var(--accent)',
        accentForeground: 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart1: 'var(--chart-1)',
        chart2: 'var(--chart-2)',
        chart3: 'var(--chart-3)',
        chart4: 'var(--chart-4)',
        chart5: 'var(--chart-5)',
        sidebar: 'var(--sidebar)',
        sidebarForeground: 'var(--sidebar-foreground)',
        sidebarPrimary: 'var(--sidebar-primary)',
        sidebarPrimaryForeground: 'var(--sidebar-primary-foreground)',
        sidebarAccent: 'var(--sidebar-accent)',
        sidebarAccentForeground: 'var(--sidebar-accent-foreground)',
        sidebarBorder: 'var(--sidebar-border)',
        sidebarRing: 'var(--sidebar-ring)',
    },
});

globalStyle('body', {
    fontFamily: "'Geist Variable', sans-serif",
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
});
