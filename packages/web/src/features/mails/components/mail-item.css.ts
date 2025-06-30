import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "../../../lib/theme.css";

export const mailStyles = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    height: "100px",
    padding: "0.5rem 1.25rem",
    transition: "background 0.15s cubic-bezier(.4,0,.2,1), border-color 0.15s cubic-bezier(.4,0,.2,1)",
    cursor: "pointer",
    borderBottom: `1px solid ${vars.color.border}`,
    background: "transparent",
    outline: "none",
    selectors: {
        '&:hover': {
            background: vars.color.sidebarAccent,
        },
        '&:focus': {
            background: vars.color.sidebarAccent,
            borderLeft: `2px solid ${vars.color.primary}`,
        },
        '&[data-read="false"]::before': {
            content: '',
            position: 'absolute',
            top: '0.9rem',
            left: '0.5rem',
            width: '0.5rem',
            height: '0.5rem',
            background: vars.color.primary,
            borderRadius: '50%',
            marginRight: '0.5rem',
        },
        '&[data-active="false"][data-read="true"]::before': {
           content: '',
           inset: 0,
           position: 'absolute',
           background: `color-mix(in oklab, ${vars.color.background} 40%, transparent)`,
           userSelect: 'none',
           pointerEvents: 'none',
        },
        '&[data-active="true"]::after': {
            content: '',
            top: 0,
            bottom: 0,
            left: 0,
            width: '2px',
            position: 'absolute',
            background: vars.color.primary,
            userSelect: 'none',
            pointerEvents: 'none',
        },
    },

    '@media': {
        'screen and (max-width: 768px)': {
            paddingBlock: '0.75rem',
        },
    },
});

export const mailHeader = style({
    display: "flex",
    flexDirection: "column",
    width: "100%",
});

export const mailHeaderTop = style({
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
});

export const mailSender = style({
    fontWeight: 500,
    color: vars.color.cardForeground,
    fontSize: "0.8rem",
    background: vars.color.muted,
    padding: "0.15rem 0.4rem",
    borderRadius: "var(--radius)",
});

export const mailTo = style({
    fontSize: "0.8rem",
    color: vars.color.mutedForeground,
});

export const mailDate = style({
    marginLeft: "auto",
    fontSize: "0.8rem",
    color: vars.color.mutedForeground,
});

export const mailSubject = style({
    fontSize: "0.8rem",
    color: vars.color.foreground,
    marginTop: "0.15rem",
});

export const mailPreview = style({
    color: vars.color.mutedForeground,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "pre-line",
    maxHeight: "2.6em",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    fontSize: "0.75rem",
    marginTop: "0.15rem",
});

const fadeOut = keyframes({
    from: {
        opacity: 1,
        transform: 'scale(1)',
    },
    to: {
        opacity: 0,
        transform: 'scale(0.95)',
    },
});

export const mailFadeOut = style({
    animation: `${fadeOut} 0.3s forwards`,
});