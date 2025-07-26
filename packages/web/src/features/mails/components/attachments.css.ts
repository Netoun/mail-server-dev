import { style } from "@vanilla-extract/css";
import { vars } from "../../../lib/theme.css";

export const attachmentsContainer = style({
    padding: "1rem",
    borderBottom: `1px solid ${vars.color.border}`,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
});

export const attachmentItem = style({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    marginBottom: "0.5rem",
    backgroundColor: vars.color.background,
    borderRadius: "6px",
    border: `1px solid ${vars.color.border}`,
    transition: "all 0.2s ease",
    ":hover": {
        backgroundColor: vars.color.muted,
        borderColor: vars.color.ring,
    },
    ":last-child": {
        marginBottom: 0,
    },
});

export const attachmentIcon = style({
    fontSize: "1.25rem",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
});

export const attachmentInfo = style({
    flex: 1,
    minWidth: 0,
});

export const attachmentName = style({
    fontWeight: "500",
    color: vars.color.foreground,
    marginBottom: "0.25rem",
    wordBreak: "break-word",
});

export const attachmentSize = style({
    fontSize: "0.875rem",
    color: vars.color.mutedForeground,
    fontFamily: "monospace",
});

export const downloadButton = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    padding: "0.25rem",
    backgroundColor: "transparent",
    border: `1px solid ${vars.color.border}`,
    borderRadius: "4px",
    color: vars.color.foreground,
    cursor: "pointer",
    transition: "all 0.2s ease",
    flexShrink: 0,
    ":hover": {
        backgroundColor: vars.color.primary,
        borderColor: vars.color.primary,
        color: vars.color.primaryForeground,
    },
    ":active": {
        transform: "translateY(1px)",
    },
}); 