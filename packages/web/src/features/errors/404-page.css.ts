import { style } from '@vanilla-extract/css';

export const notfoundRoot = style({
  display: 'flex',

  background: 'var(--background)',
});

export const notfoundContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  padding: '2rem 2.5rem',
  borderRadius: '1.2rem',
});

export const notfoundTitle = style({
  fontSize: '5rem',
  fontWeight: 700,
  color: 'var(--muted-foreground)',
  letterSpacing: '-0.04em',
  margin: 0,
  lineHeight: 1,
});

export const notfoundMessage = style({
  fontSize: '1.2rem',
  color: 'var(--muted-foreground)',
  margin: 0,
  textAlign: 'center',
});

export const notfoundHomeBtn = style({
  marginTop: '0.5rem',
  padding: '0.7em 1.6em',
  fontSize: '1rem',
  borderRadius: '0.6em',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  border: 'none',
  textDecoration: 'none',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.18s',
  ':hover': {
    background: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
}); 