import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from '../services/api/announcement';

/* ── Types ──────────────────────────────────────────────── */
interface Notification {
    id: number;
    userId: string;
    title: string;
    content: string;
    read: boolean;
    type: string | null;
    createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
    QUIZ:      'fas fa-bullseye',
    COURSE:    'fas fa-book',
    COURS:     'fas fa-book',
    BADGE:     'fas fa-medal',
    SYSTEM:    'fas fa-cog',
    SYSTEME:   'fas fa-cog',
    MENTORING: 'fas fa-hands-helping',
    GRADE:     'fas fa-graduation-cap',
};
const TYPE_COLOR: Record<string, string> = {
    QUIZ:      '#2cb5e8',
    COURSE:    'var(--accent)',
    COURS:     'var(--accent)',
    BADGE:     '#ffaf00',
    SYSTEM:    '#a855f7',
    SYSTEME:   '#a855f7',
    MENTORING: '#ec4899',
    GRADE:     '#f59e0b',
};

const fmtDate = (iso: any) => {
    if (!iso) return '';
    try {
        let d: Date;
        if (Array.isArray(iso)) {
            const [y, m, dNum, h, min, s] = iso;
            d = new Date(y, (m || 1) - 1, dNum || 1, h || 0, min || 0, s || 0);
        } else {
            const normalized = typeof iso === 'string' ? iso.replace(' ', 'T') : iso;
            d = new Date(normalized);
        }
        if (isNaN(d.getTime())) return '';
        const diffM = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diffM < 1)  return 'À l\'instant';
        if (diffM < 60) return `Il y a ${diffM} min`;
        const diffH = Math.floor(diffM / 60);
        if (diffH < 24) return `Il y a ${diffH}h`;
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch (e) {
        return '';
    }
};

/* ── Component ──────────────────────────────────────────── */
interface Props {
    /** username du user connecté */
    userId: string;
    /** Variante de style — 'dark' pour HTB student/admin, 'light' pour AdminLTE */
    variant?: 'dark' | 'light';
}

const NotificationBell: React.FC<Props> = ({ userId, variant = 'dark' }) => {
    const [open, setOpen]               = useState(false);
    const [notifs, setNotifs]           = useState<Notification[]>([]);
    const [loading, setLoading]         = useState(false);
    const ref                           = useRef<HTMLDivElement>(null);

    const unreadCount = notifs.filter(n => !n.read).length;

    const load = useCallback(async (showLoader = true) => {
        if (!userId) return;
        if (showLoader) setLoading(true);
        const data = await getUserNotifications(userId);
        setNotifs(Array.isArray(data) ? data : []);
        if (showLoader) setLoading(false);
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    /* Temps réel: nouvelle notif via WebSocket — plus de polling */
    useEffect(() => {
        const handler = (e: Event) => {
            const notif = (e as CustomEvent).detail as Notification;
            if (!notif || notif.userId !== userId) return;
            setNotifs(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]);
        };
        window.addEventListener('wsNewNotification', handler);
        return () => window.removeEventListener('wsNewNotification', handler);
    }, [userId]);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleRead = async (n: Notification) => {
        if (!n.read) {
            await markNotificationAsRead(n.id);
            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        }
    };

    const handleReadAll = async () => {
        await markAllNotificationsAsRead(userId);
        setNotifs(prev => prev.map(x => ({ ...x, read: true })));
    };

    const handleDelete = async (e: React.MouseEvent, n: Notification) => {
        e.stopPropagation();
        await deleteNotification(n.id);
        setNotifs(prev => prev.filter(x => x.id !== n.id));
    };

    /* ── Styles ── */
    const S = {
        wrap: {
            position: 'relative' as const,
            display: 'inline-block',
        },
        btn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            position: 'relative' as const,
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            lineHeight: 1,
        },
        badge: {
            position: 'absolute' as const,
            top: 2,
            right: 4,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 800,
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
        },
        dropdown: {
            position: 'absolute' as const,
            right: 0,
            top: 'calc(100% + 8px)',
            width: 340,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 9999,
            overflow: 'hidden',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
        },
        headerTitle: {
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            margin: 0,
        },
        readAllBtn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: 0,
        },
        list: {
            maxHeight: 360,
            overflowY: 'auto' as const,
        },
        item: (read: boolean) => ({
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '11px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid var(--border)',
            background: read ? 'transparent' : 'rgba(37, 99, 235, 0.08)',
            transition: 'background .15s',
        }),
        icon: (type: string | null) => ({
            fontSize: '1.2rem',
            flexShrink: 0,
            width: 28,
            textAlign: 'center' as const,
            color: TYPE_COLOR[type ?? ''] ?? 'var(--text-muted)',
        }),
        itemBody: {
            flex: 1,
            minWidth: 0,
        },
        itemTitle: (read: boolean) => ({
            color: 'var(--text-primary)',
            fontWeight: read ? 500 : 700,
            fontSize: '0.83rem',
            marginBottom: 2,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        }),
        itemContent: {
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
        },
        itemMeta: {
            color: 'var(--text-muted)',
            fontSize: '0.68rem',
            marginTop: 3,
        },
        deleteBtn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            padding: '2px 4px',
            flexShrink: 0,
            opacity: 0.7,
            transition: 'opacity .15s, color .15s',
        },
        emptyState: {
            padding: '32px 16px',
            textAlign: 'center' as const,
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
        },
        footer: {
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center' as const,
            background: 'var(--bg-elevated)',
        },
        unreadDot: {
            width: 7,
            height: 7,
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'inline-block',
            marginRight: 4,
            flexShrink: 0,
        },
    };

    return (
        <div style={S.wrap} ref={ref}>
            <button
                style={S.btn}
                onClick={() => { setOpen(o => !o); if (!open) load(); }}
                title="Notifications"
                id="notification-bell-btn"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span style={S.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div style={S.dropdown}>
                    {/* Header */}
                    <div style={S.header}>
                        <h3 style={S.headerTitle}>
                            Notifications
                            {unreadCount > 0 && (
                                <span style={{
                                    marginLeft: 8, background: 'rgba(37, 99, 235,.15)',
                                    color: 'var(--accent)', borderRadius: 99,
                                    fontSize: '0.65rem', padding: '2px 7px', fontWeight: 800,
                                }}>
                                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button style={S.readAllBtn} onClick={handleReadAll}>
                                ✓ Tout lire
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={S.list}>
                        {loading ? (
                            <div style={S.emptyState}>
                                <i className="fas fa-spinner fa-spin" /> Chargement...
                            </div>
                        ) : notifs.length === 0 ? (
                            <div style={S.emptyState}>
                                <div style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--text-muted)' }}>
                                    <i className="far fa-bell-slash"></i>
                                </div>
                                <p style={{ margin: 0 }}>Aucune notification</p>
                            </div>
                        ) : (
                            notifs.map(n => (
                                <div
                                    key={n.id}
                                    style={S.item(n.read)}
                                    onClick={() => handleRead(n)}
                                >
                                    {!n.read && <span style={S.unreadDot} />}
                                    <span style={S.icon(n.type)}>
                                        <i className={TYPE_ICON[n.type ?? ''] ?? 'fas fa-bullhorn'}></i>
                                    </span>
                                    <div style={S.itemBody}>
                                        <div style={S.itemTitle(n.read)}>{n.title}</div>
                                        <div style={S.itemContent as React.CSSProperties}>{n.content}</div>
                                        <div style={S.itemMeta}>{fmtDate(n.createdAt)}</div>
                                    </div>
                                    <button
                                        style={S.deleteBtn}
                                        onClick={e => handleDelete(e, n)}
                                        title="Supprimer"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifs.length > 0 && (
                        <div style={S.footer}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                {notifs.length} notification{notifs.length > 1 ? 's' : ''} au total
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
