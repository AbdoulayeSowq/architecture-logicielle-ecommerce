import React, { useEffect, useState, useCallback } from 'react';
import { countUnread } from '../services/api/messages';

interface Props {
    username: string;
    style?: React.CSSProperties;
    badgeClass?: string;
}

const UnreadBadge: React.FC<Props> = ({ username, style = {}, badgeClass = "badge badge-danger" }) => {
    const [count, setCount] = useState(0);

    const loadCount = useCallback(async () => {
        if (!username) return;
        try {
            const unread = await countUnread(username);
            setCount(unread);
        } catch {
            setCount(0);
        }
    }, [username]);

    useEffect(() => {
        loadCount();

        /* Quand un message est marqué lu → resync serveur */
        const handleUpdate = () => loadCount();
        window.addEventListener('messagesUpdated', handleUpdate);

        /* Nouveau message reçu → incrément immédiat sans HTTP */
        const handleNewMsg = (e: Event) => {
            const msg = (e as CustomEvent).detail;
            if (msg && msg.receiverUsername === username) {
                setCount(c => c + 1);
            }
        };
        window.addEventListener('wsNewMessage', handleNewMsg);

        return () => {
            window.removeEventListener('messagesUpdated', handleUpdate);
            window.removeEventListener('wsNewMessage', handleNewMsg);
        };
    }, [loadCount, username]);

    if (count === 0) return null;

    return (
        <span className={badgeClass} style={{
            background: '#ff3e3e',
            color: '#fff',
            marginLeft: '6px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            ...style
        }}>
            {count > 99 ? '99+' : count}
        </span>
    );
};

export default UnreadBadge;
