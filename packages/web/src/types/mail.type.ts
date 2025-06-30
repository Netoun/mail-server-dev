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
}

export type MailList = Mail[];