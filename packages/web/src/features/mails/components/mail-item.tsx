import { Mail, MailList } from "../../../types/mail.type";
import { mailStyles, mailHeader, mailHeaderTop, mailSender, mailDate, mailSubject, mailTo, mailPreview, mailFadeOut } from "./mail-item.css";
import { useLocation } from "preact-iso";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "preact/hooks";
import { formatRelativeTimeFormat } from "../../../utils/date";
import { useSidebarStore } from "../../../lib/sidebar-store";

export type MailItemProps = {
    mail: Mail;
}

export const MailItem = ({ mail }: MailItemProps) => {
    const location = useLocation();
    const queryClient = useQueryClient();
    const { closeSidebar } = useSidebarStore();
    const isActive = useMemo(() => location.url === `/mail/${mail.id}`, [location.url, mail.id]);

    const date = formatRelativeTimeFormat({
        date: new Date(mail.date),
    })

    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        window.addEventListener(`mail:delete:${mail.id}`, () => {
            setDeleting(true);
        });

        return () => {
            window.removeEventListener(`mail:delete:${mail.id}`, () => {});
        };
    }, []);

    console.log(deleting);

    return (
        <li
            key={mail.id}
            class={`${mailStyles} ${deleting ? mailFadeOut : ''}`}
            data-read={mail.is_read}
            data-active={isActive}
            onClick={async () => {
                location.route(`/mail/${mail.id}`);
                queryClient.setQueryData(['mails'], (old: MailList) => old.map(m => m.id === mail.id ? {...m, is_read: true} : m));
                closeSidebar();
            }}
        >
            <div class={mailHeader}>
            <div class={mailHeaderTop}>
                <span class={mailSender}>{mail.from_name ? mail.from_name : mail.from_address}</span>
                <span class={mailDate}>{date}</span>
            </div>
            <span class={mailSubject}>{mail.subject}</span>
            </div>
            <span class={mailPreview}>{mail.text}</span>
        </li>
    );
}