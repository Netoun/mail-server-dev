export type Attachment = {
    id: number;
    mail_id: number;
    filename: string;
    content_type: string;
    content_disposition: string | null;
    size_bytes: number;
    file_url: string;
}

export type Mail = {
    id: number;
    from_address: string;
    from_name: string;
    to_address: string;
    to_name: string;
    subject: string;
    html: string;
    text: string;
    date: string;
    is_read: boolean;
    attachments: Attachment[];
}

export type MailList = Mail[];