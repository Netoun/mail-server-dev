import { style } from "@vanilla-extract/css";
import { vars } from "../../lib/theme.css";

export const containerStyles = style({
    display: 'grid',
    gridTemplateColumns: 'var(--sidebar-width) 1fr',
    gridTemplateRows: 'var(--header-height) 1fr',
    gridTemplateAreas: `
        "sidebar header"
        "sidebar main"
    `,
    width: '100vw',
    height: '100vh',
    '@media': {
        'screen and (min-width: 768px)': {
            vars: {
                '--sidebar-width': '300px',
                '--header-height': '50px',
            },
        },
        'screen and (max-width: 768px)': {
            vars: {
                '--sidebar-width': '100%',
                '--header-height': '50px',
            },
            gridTemplateColumns: '1fr',
            gridTemplateRows: 'var(--header-height) 1fr',
            gridTemplateAreas: `
                "header"
                "main"
            `,
        },
    },
});

export const mainStyles = style({
    gridArea: 'main',
    height: "calc(100vh - var(--header-height))",
    color: vars.color.cardForeground,
    background: vars.color.background,
});