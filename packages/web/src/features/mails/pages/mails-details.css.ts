import { style } from "@vanilla-extract/css";
import { vars } from "../../../lib/theme.css";

export const mailDetailsContainer = style({
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto auto 1fr auto",
    width: "100%",
    height: "100%",
    borderRadius: 12,
});

export const mailHeader = style({
    display: "grid",
    height: "100px",
    alignContent: "center",
    gridTemplateColumns: "1fr auto",
    fontSize: "0.9rem",
    fontWeight: 500,
    borderBottom: `1px solid ${vars.color.border}`,
    paddingInline: "1rem",

    '@media': { 
        'screen and (max-width: 768px)': {
            height: 'auto',
            paddingBlock: '1rem',
        },
    },
});

export const mailHeaderContent = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6
});

export const mailMeta = style({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    fontSize: "0.9rem",
    color: vars.color.mutedForeground,
    fontWeight: 400,
});

export const mailHeaderSubjectContainer = style({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100px",
    borderBottom: `1px solid ${vars.color.border}`,
    paddingInline: "1rem",

    '@media': { 
        'screen and (max-width: 768px)': {
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            height: "auto",
            paddingBlock: "1rem",
        },
    },
});

export const mailHeaderSubject = style({
    fontSize: "1.2rem",
    fontWeight: 500,
});

export const mailHeaderFrom = style({
    fontSize: "0.9rem",
});

export const mailHeaderReplyTo = style({
    fontSize: "0.9rem",
});

export const mailBody = style({
    fontSize: 15,
    lineHeight: 1.7,
});

export const mailBodyContainer = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "1rem",
    borderBottom: `1px solid ${vars.color.border}`,
    overflowY: "auto",
});

export const mailFooter = style({
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: "0.9rem",
    fontWeight: 500,
    padding: "1rem",
    paddingBottom: "3rem",
});

export const mailDeleteButton = style({
    background: "none",
    border: "none",
    cursor: "pointer",
    backgroundColor: vars.color.input,
    color: vars.color.secondaryForeground,
    padding: "0.5rem",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",

    ":hover": {
        backgroundColor: vars.color.muted,
    },
});


export const mailSignature = style({
    fontSize: 15,
    fontStyle: "italic",
    alignSelf: "flex-start",
});     