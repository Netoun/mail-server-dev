import { style } from "@vanilla-extract/css";

export const headerStyles = style({
    backgroundColor: 'var(--sidebar)',
    color: 'var(--foreground)',
    gridArea: 'header',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1rem',
    borderBottom: '1px solid var(--border)',
});