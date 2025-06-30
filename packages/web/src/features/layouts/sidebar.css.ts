import { style } from "@vanilla-extract/css";
import { vars } from "../../lib/theme.css";

export const sidebarStyles = style({
    backgroundColor: 'var(--sidebar)',
    color: 'var(--sidebar-foreground)',
    height: '100vh',
    borderRight: `1px solid ${vars.color.border}`,
    '@media': {
        'screen and (max-width: 768px)': {
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: 'var(--sidebar-width)',
            zIndex: 1001,
            background: 'var(--background, #fff)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
            transition: 'transform 0.25s',
            transform: 'translateX(-100%)',
            selectors: {
                '&[data-open="true"]': {
                    transform: 'translateX(0)',
                },
            },  
        },
    },
});

export const sidebarOverlay = style({
    display: 'none',
    transition: 'opacity 0.2s',
    opacity: 0,
    '@media': {
        'screen and (max-width: 768px)': {
            display: 'block',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 1000,
        },
    },
    selectors: {
        '&[data-open="true"]': {
            opacity: 1,
            pointerEvents: 'auto',
        },
        '&[data-open="false"]': {
            opacity: 0,
            pointerEvents: 'none',
        },
    },
});

export const sidebarHeader = style({
    height: "var(--header-height)",
    padding: "0 1.25rem",
    display: "flex",
    alignItems: "center",
    fontWeight: 600,
    borderBottom: `1px solid ${vars.color.border}`,
    justifyContent: 'space-between',
});

export const sidebarHeaderTitle = style({
    fontSize: "1.2rem",
    fontWeight: 600,
    color: vars.color.cardForeground,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
});

export const sidebarContent = style({
    maxHeight: "calc(100vh - var(--header-height))",
    overflowY: "auto",
});

export const sidebarHeaderUnreadCount = style({
    backgroundColor: vars.color.primary,
    color: vars.color.primaryForeground,
    borderRadius: "50%",
    width: "1.25rem",
    height: "1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
});

export const sidebarBurger = style({
    display: 'none',
    background: 'none',
    border: 'none',
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    cursor: 'pointer',
    '@media': {
        'screen and (max-width: 768px)': {
            display: 'inline-flex',
        },
    },
});

export const sidebarClose = style({
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    '@media': {
        'screen and (max-width: 768px)': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

        },
    },
});