import { MailList } from "../../../types/mail.type";
import { mailsListStyles } from "./mails-list.css";
import { MailItem } from "./mail-item";
import { useEffect, useRef, useState } from "preact/hooks";

type MailsListProps = { 
    data: MailList;
    isLoading: boolean;
    error: Error | null;
}

export const MailsList = ({ data, isLoading, error }: MailsListProps) => {
    const [mails, setMails] = useState(data || []);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setMails(data || []);
    }, [data]);

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            const id = String(e.detail.id);
            setDeletingId(id);
            timeoutRef.current = window.setTimeout(() => {
                setMails(mails => mails.filter(m => String(m.id) !== id));
                setDeletingId(null);
            }, 300);
        };
        window.addEventListener('mail:delete', handler as EventListener);
        return () => {
            window.removeEventListener('mail:delete', handler as EventListener);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (isLoading) return <div style={{textAlign: 'center', padding: '2em'}}>Loading…</div>;
    if (error) return <div style={{textAlign: 'center', padding: '2em'}}>Error loading emails.</div>;

    return (
        <ul class={mailsListStyles}>
            {mails?.map((mail) => (
              <MailItem key={mail.id} mail={mail} />
            ))}
        </ul>
    );
};