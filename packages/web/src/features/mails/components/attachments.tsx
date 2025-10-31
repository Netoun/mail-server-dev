import { Attachment } from "../../../types/mail.type";
import { attachmentsContainer, attachmentItem, attachmentIcon, attachmentInfo, attachmentName, attachmentSize, downloadButton } from "./attachments.css";

type AttachmentsProps = {
    attachments: Attachment[];
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (contentType: string): string => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('text/')) return '📄';
    if (contentType.includes('pdf')) return '📕';
    if (contentType.includes('zip') || contentType.includes('rar')) return '📦';
    if (contentType.includes('audio/')) return '🎵';
    if (contentType.includes('video/')) return '🎬';
    return '📎';
};

export const Attachments = ({ attachments }: AttachmentsProps) => {
    if (!attachments || attachments.length === 0) {
        return null;
    }

    const handleDownload = (attachment: Attachment) => {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = `/api${attachment.file_url}`;
        link.download = attachment.filename;
        link.target = '_blank';
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div class={attachmentsContainer}>
            <h4>Attachments ({attachments.length})</h4>
            <div>
                {attachments.map((attachment) => (
                    <div key={attachment.id} class={attachmentItem}>
                        <div class={attachmentIcon}>
                            {getFileIcon(attachment.content_type)}
                        </div>
                        <div class={attachmentInfo}>
                            <div class={attachmentName}>{attachment.filename}</div>
                            <div class={attachmentSize}>
                                {formatFileSize(attachment.size_bytes)} • {attachment.content_type}
                            </div>
                        </div>
                        <button 
                            class={downloadButton}
                            onClick={() => handleDownload(attachment)}
                            title={`Download ${attachment.filename}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="m8 11 4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}; 