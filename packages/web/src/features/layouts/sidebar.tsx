import { sidebarStyles, sidebarHeader, sidebarHeaderTitle, sidebarContent, sidebarHeaderUnreadCount, sidebarOverlay, sidebarClose } from './sidebar.css';
import { MailsList } from '../mails/components/mails-list';
import { MailList } from '../../types/mail.type';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'preact/hooks';
import { useEffect } from 'preact/hooks';
import { useSidebarStore } from '../../lib/sidebar-store';

export function Sidebar() {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery<MailList>({
        queryKey: ['mails'],
        queryFn: () => fetch('/api/mails').then(res => res.json()),
    })

    const unreadCount = data?.filter(mail => !mail.is_read).length || 0;

    const [notif, setNotif] = useState(false);
    const isOpen = useSidebarStore(s => s.isOpen);
    const closeSidebar = useSidebarStore(s => s.closeSidebar);

    useEffect(() => {
        // Request permission for system notifications
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const es = new EventSource('/api/events');
        es.onmessage = (event) => {
            queryClient.invalidateQueries({ queryKey: ['mails'] });
            try {
                const mail = JSON.parse(event.data);
                if (mail && mail.is_read === false) {
                    setNotif(true);
                    // System notification
                    if (window.Notification && Notification.permission === 'granted') {
                        new Notification('📧 New email', {
                            body: mail.subject || 'You have received a new email',
                            icon: '/vite.svg',
                        });
                    }
                }
            } catch {}
        };
        return () => es.close();
    }, [queryClient]);

    // Update page title with unread email count
    useEffect(() => {
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) Fastmail SMTP Dev`;
        } else {
            document.title = 'Fastmail SMTP Dev';
        }
    }, [unreadCount]);

    // Overlay mobile
    return (
        <>
            <div
                class={sidebarOverlay}
                data-open={isOpen}
                onClick={closeSidebar}
            />
            <aside
                class={sidebarStyles}
                data-open={isOpen}
                onClick={e => e.stopPropagation()}
            >
                <div class={sidebarHeader}>
                    <h1 class={sidebarHeaderTitle}>Inbox {unreadCount > 0 && <span class={sidebarHeaderUnreadCount}>{unreadCount}</span>}</h1>
                    <button
                        aria-label="Close menu"
                        onClick={closeSidebar}
                        class={sidebarClose}
                    >
                        ×
                    </button>
                </div>
                <div class={sidebarContent}>
                    <MailsList data={data} isLoading={isLoading} error={error} />
                </div>
            </aside>
        </>
    );
}
