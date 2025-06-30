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
        // Demande la permission pour les notifications système
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
                    // Notification système
                    if (window.Notification && Notification.permission === 'granted') {
                        new Notification('📧 Nouveau mail', {
                            body: mail.subject || 'Vous avez reçu un nouveau mail',
                            icon: '/vite.svg',
                        });
                    }
                }
            } catch {}
        };
        return () => es.close();
    }, [queryClient]);

    // Met à jour le titre de la page avec le nombre de mails non lus
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
                        aria-label="Fermer le menu"
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
