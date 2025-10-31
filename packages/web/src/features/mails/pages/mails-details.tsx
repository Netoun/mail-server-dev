import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail } from "../../../types/mail.type";
import {
    mailDetailsContainer,
    mailHeader,
    mailMeta,
    mailBody,
    mailSignature,
    mailFooter,
    mailHeaderContent,
    mailHeaderSubject,
    mailHeaderReplyTo,
    mailHeaderFrom,
    mailHeaderSubjectContainer,
    mailBodyContainer,
    mailDeleteButton,
} from "./mails-details.css";
import dayjs from 'dayjs';
import { useLocation } from "preact-iso";
import { Attachments } from "../components/attachments";

type MailDetailsProps = {
    id: string;
}

export const MailDetails = ({ id }: MailDetailsProps) => {
    const queryClient = useQueryClient()
    const location = useLocation()
    const { data, isLoading, error } = useQuery<Mail>({
        queryKey: ['mail', id],
        queryFn: () => fetch(`/api/mails/${id}`).then(res => res.json())
    })

    const deleteMail = useMutation({
        mutationFn: () => fetch(`/api/mails/${id}`, {
            method: 'DELETE',
        }),
        onSuccess: () => {
            window.dispatchEvent(new CustomEvent(`mail:delete:${id}`));
            queryClient.invalidateQueries({ queryKey: ['mails'] })
            location.route('/')
        }
    })

    if (isLoading)
        return (
            <div class={mailDetailsContainer} style={{ textAlign: "center", padding: "2em" }}>
                Loading…
            </div>
        );
    if (error || !data)
        return (
            <div class={mailDetailsContainer} style={{ textAlign: "center", padding: "2em" }}>
                Error loading email.
            </div>
        );

    // Extract name and email
    const fromMatch = data.from_address.match(/^(.*)<(.*)>$/);
    const fromName = fromMatch ? fromMatch[1].trim() : data.from_address;
    const fromEmail = fromMatch ? fromMatch[2].trim() : data.from_address;

    const toMatch = data.to_address.match(/^(.*)<(.*)>$/);
    const toName = toMatch ? toMatch[1].trim() : data.to_address;
    const toEmail = toMatch ? toMatch[2].trim() : data.to_address;

    return (
        <div class={mailDetailsContainer}>
            <div class={mailHeader}>
                <div class={mailHeaderContent}>
                    <span class={mailHeaderFrom}><strong>From :</strong> {fromName ?? fromEmail}</span>
                    <span class={mailHeaderReplyTo}><strong>To :</strong> {toName ?? toEmail}</span>
                </div>
                <div>
                    <button class={mailDeleteButton} onClick={() => deleteMail.mutate()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    </button>
                </div>
            </div>
        <div class={mailHeaderSubjectContainer}>
                <span class={mailHeaderSubject}><strong>Subject :</strong> {data.subject}</span>
                <div class={mailMeta}>
                    <span>{dayjs(data.date).format('DD/MM/YYYY HH:mm')}</span>
                </div>
            </div>
            <div class={mailBodyContainer}>
                <div class={mailBody} dangerouslySetInnerHTML={{ __html: data.html }} />
            </div>
            <Attachments attachments={data.attachments} />
            <div class={mailFooter}>
                <span>
                    <strong>Signature :</strong>
                </span>
                <div class={mailSignature}>{fromName.split(" ")[0]}</div>
            </div>
        </div>
    );
};