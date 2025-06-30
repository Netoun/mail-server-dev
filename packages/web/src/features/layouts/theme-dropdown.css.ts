import { style } from '@vanilla-extract/css';

export const themeDropdown = style({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    minWidth: 140,
    zIndex: 10,
    padding: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
});

export const themeDropdownButton = style({
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    color: 'inherit',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '1rem',
    transition: 'background 0.15s',
    selectors: {
        '&:hover, &:focus': {
            background: 'var(--sidebar-accent)',
        },
        '&[data-active="true"]': {
            background: 'var(--sidebar-accent)',
            color: 'var(--primary)',
            fontWeight: 500,
        },
    },
}); 