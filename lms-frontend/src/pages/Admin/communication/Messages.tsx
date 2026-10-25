import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Message, getInbox, getSent, sendMessage, markAsRead,
    deleteMessageByReceiver, deleteMessageBySender,
} from "../../../services/api/messages";
import {
    sendNotification, getUserNotifications, deleteNotification,
} from "../../../services/api/announcement";
import { getContacts } from "../../../services/api/user";

const getUsername = (): string => {
    try { const s = localStorage.getItem('user'); return s ? (JSON.parse(s).username || JSON.parse(s).sub || '') : ''; } catch { return ''; }
};
const getRole = (): string => {
    try { const s = localStorage.getItem('user'); return s ? (JSON.parse(s).role || '') : ''; } catch { return ''; }
};

const fmtConv = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
const fmtTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
const fmtDay = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso), now = new Date();
    if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const inits = (n: string) => (n || '?').slice(0, 2).toUpperCase();

interface Conv { contact: string; messages: Message[]; unread: number; last: Message | null; }

const AV = (active: boolean) => ({
    width: '42px', height: '42px', borderRadius: '50%',
    background: active ? 'var(--accent)' : 'var(--accent-light)',
    color: active ? '#fff' : 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.82rem', flexShrink: 0,
} as React.CSSProperties);

const BUBBLE = (isMe: boolean) => ({
    maxWidth: '65%', padding: '8px 12px',
    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    background: isMe ? 'var(--accent)' : 'var(--bg-card)',
    color: isMe ? '#fff' : 'var(--text-primary)',
    border: isMe ? 'none' : '1px solid var(--border)',
    fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word' as const,
} as React.CSSProperties);

const Messages = () => {
    const username = getUsername();
    const isAdmin = ['ADMIN', 'ROLE_ADMIN'].includes(getRole());

    const [convs, setConvs] = useState<Conv[]>([]);
    const [active, setActive] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);
    const [showNew, setShowNew] = useState(false);
    const [searchNew, setSearchNew] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    const [tab, setTab] = useState<'messages' | 'notifications'>('messages');
    const [nTo, setNTo] = useState(''); const [nTitle, setNTitle] = useState('');
    const [nBody, setNBody] = useState(''); const [nType, setNType] = useState('SYSTEME');
    const [nSending, setNSending] = useState(false);
    const [nHistory, setNHistory] = useState<any[]>([]); const [nTarget, setNTarget] = useState('');
    const [nLoading, setNLoading] = useState(false);
    const [nSearch, setNSearch] = useState(''); const [nDrop, setNDrop] = useState(false);

    const name = useCallback((u: string) => {
        if (u === username) return 'Moi';
        const c = contacts.find((x: any) => x.username === u);
        return (c?.displayName || u).replace(/\s*\(Prof\)$/i, '').replace(/\s*\(Etudiant\)$/i, '').replace(/^Admin:\s*/i, '').trim();
    }, [contacts, username]);

    const build = useCallback((inbox: Message[], sent: Message[]) => {
        const map = new Map<string, Message[]>();
        for (const m of [...inbox, ...sent]) {
            const other = m.senderUsername === username ? m.receiverUsername : m.senderUsername;
            if (!map.has(other)) map.set(other, []);
            if (!map.get(other)!.find(x => x.id === m.id)) map.get(other)!.push(m);
        }
        const list: Conv[] = Array.from(map.entries()).map(([contact, msgs]) => {
            const sorted = [...msgs].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
            return { contact, messages: sorted, unread: msgs.filter(m => !m.read && m.receiverUsername === username).length, last: sorted[sorted.length - 1] || null };
        }).sort((a, b) => +new Date(b.last?.createdAt || 0) - +new Date(a.last?.createdAt || 0));
        setConvs(list);
    }, [username]);

    const load = useCallback(async () => {
        if (!username) { setLoading(false); return; }
        setLoading(true);
        const [inbox, sent] = await Promise.all([getInbox(username), getSent(username)]);
        build(inbox, sent);
        setLoading(false);
    }, [username, build]);

    useEffect(() => {
        load();
        getContacts().then(c => setContacts((c || []).filter((u: any) => u.username !== username))).catch(() => {});
    }, [load, username]);

    useEffect(() => {
        const handler = (e: any) => {
            const msg = e.detail as Message;
            if (!msg) return;
            const other = msg.senderUsername === username ? msg.receiverUsername : msg.senderUsername;
            setConvs(prev => {
                // Dedup: ignore if message ID already in conversation
                const existing = prev.find(c => c.contact === other);
                if (existing && existing.messages.some(m => m.id === msg.id)) return prev;
                const newMsg: Message = { ...msg, createdAt: msg.createdAt || new Date().toISOString() };
                if (existing) {
                    return prev
                        .map(c => c.contact === other
                            ? { ...c, messages: [...c.messages, newMsg], last: newMsg,
                                unread: msg.receiverUsername === username && other !== active ? c.unread + 1 : c.unread }
                            : c
                        )
                        .sort((a, b) => +new Date(b.last?.createdAt || 0) - +new Date(a.last?.createdAt || 0));
                }
                // New contact — create conversation entry
                return [{ contact: other, messages: [newMsg], unread: msg.receiverUsername === username ? 1 : 0, last: newMsg }, ...prev];
            });
        };
        window.addEventListener('wsNewMessage', handler);
        return () => window.removeEventListener('wsNewMessage', handler);
    }, [username, active]);

    useEffect(() => { setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60); }, [active, convs]);

    const openConv = async (contact: string) => {
        setActive(contact); setShowNew(false);
        setConvs(prev => prev.map(c => {
            if (c.contact !== contact) return c;
            c.messages.filter(m => !m.read && m.receiverUsername === username).forEach(m => markAsRead(m.id));
            return { ...c, unread: 0, messages: c.messages.map(m => m.receiverUsername === username ? { ...m, read: true } : m) };
        }));
        window.dispatchEvent(new Event('messagesUpdated'));
    };

    const send = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim() || !active || sending) return;
        setSending(true);
        const body = text.trim();
        setText('');
        // Optimistic: show message immediately without waiting for REST
        const optimistic: Message = {
            id: -Date.now(), senderUsername: username, receiverUsername: active,
            subject: 'Message', body, read: false,
            deletedBySender: false, deletedByReceiver: false,
            createdAt: new Date().toISOString(),
        };
        setConvs(prev => prev.map(c => c.contact !== active ? c
            : { ...c, messages: [...c.messages, optimistic], last: optimistic }
        ));
        const sent = await sendMessage({ senderUsername: username, receiverUsername: active, subject: 'Message', body });
        setSending(false);
        if (sent) {
            // Replace optimistic entry with real message from server (has real ID)
            setConvs(prev => prev.map(c => c.contact !== active ? c
                : { ...c, messages: c.messages.map(m => m.id === optimistic.id ? sent : m), last: sent }
            ));
        } else {
            // Rollback optimistic on failure
            setConvs(prev => prev.map(c => c.contact !== active ? c
                : { ...c, messages: c.messages.filter(m => m.id !== optimistic.id) }
            ));
        }
        // No load() needed: sender sees optimistic, receiver gets WebSocket push from backend
    };

    const delConv = async (contact: string) => {
        const c = convs.find(x => x.contact === contact);
        if (!c) return;
        for (const m of c.messages) m.senderUsername === username ? deleteMessageBySender(m.id) : deleteMessageByReceiver(m.id);
        setConvs(prev => prev.filter(x => x.contact !== contact));
        if (active === contact) setActive(null);
        window.dispatchEvent(new Event('messagesUpdated'));
    };

    const startChat = (contact: string) => {
        if (!convs.find(c => c.contact === contact))
            setConvs(prev => [{ contact, messages: [], unread: 0, last: null }, ...prev]);
        setActive(contact); setShowNew(false); setSearchNew('');
    };

    const sendNotif = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nTo || !nTitle || !nBody) return;
        setNSending(true);
        await sendNotification({ userId: nTo, title: nTitle, content: nBody, type: nType });
        setNSending(false); setNTitle(''); setNBody('');
        if (nTarget === nTo) loadNotifHistory(nTo);
    };

    const loadNotifHistory = async (uid: string) => {
        if (!uid) return;
        setNLoading(true); setNTarget(uid);
        const d = await getUserNotifications(uid);
        setNHistory(Array.isArray(d) ? d : []);
        setNLoading(false);
    };

    const activeMessages = convs.find(c => c.contact === active)?.messages || [];
    const filtered = convs.filter(c => name(c.contact).toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase()));
    const totalUnread = convs.reduce((s, c) => s + c.unread, 0);

    return (
        <section className="content">
            <div className="container py-4">
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', marginBottom: '1rem' }}>
                        {(['messages', 'notifications'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 16px', borderRadius: '20px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', background: tab === t ? 'var(--accent)' : 'var(--bg-elevated)', color: tab === t ? '#fff' : 'var(--text-secondary)' }}>
                                {t === 'messages' ? <><i className="fas fa-envelope mr-1" />Messages{totalUnread > 0 && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '0 6px' }}>{totalUnread}</span>}</> : '🔔 Notifications'}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'notifications' && isAdmin ? (
                    <div className="card shadow-sm">
                        <div className="card-header py-3"><h3 className="card-title font-weight-bold m-0">🔔 Envoyer une Notification</h3></div>
                        <div className="card-body p-4">
                            <form onSubmit={sendNotif}>
                                <div className="form-row">
                                    <div className="form-group col-md-6 position-relative">
                                        <label className="small font-weight-bold text-uppercase text-muted">Destinataire</label>
                                        <input type="text" className="form-control" placeholder="Rechercher..." value={nSearch} onChange={e => { setNSearch(e.target.value); setNDrop(true); }} onFocus={() => setNDrop(true)} />
                                        {nDrop && nSearch && (
                                            <div className="dropdown-menu show w-100 shadow-sm border mt-1" style={{ maxHeight: 220, overflowY: 'auto' }}>
                                                {contacts.filter((u: any) => (u.displayName || '').toLowerCase().includes(nSearch.toLowerCase()) || (u.username || '').toLowerCase().includes(nSearch.toLowerCase())).map((u: any) => (
                                                    <button key={u.username} type="button" className="dropdown-item py-2" onClick={() => { setNTo(u.username); setNSearch(u.displayName); setNDrop(false); }}>
                                                        <span className="font-weight-bold">{u.displayName}</span> <small className="text-muted ml-2">{u.username}</small>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label className="small font-weight-bold text-uppercase text-muted">Type</label>
                                        <select className="form-control" value={nType} onChange={e => setNType(e.target.value)}>
                                            <option value="SYSTEME">⚙️ Système</option><option value="COURS">📚 Cours</option>
                                            <option value="QUIZ">🎯 Quiz</option><option value="BADGE">🏆 Badge</option><option value="MENTORING">🤝 Mentorat</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group"><label className="small font-weight-bold text-uppercase text-muted">Titre</label><input type="text" className="form-control" placeholder="Titre" value={nTitle} onChange={e => setNTitle(e.target.value)} required /></div>
                                <div className="form-group"><label className="small font-weight-bold text-uppercase text-muted">Contenu</label><textarea className="form-control" rows={3} placeholder="Message..." value={nBody} onChange={e => setNBody(e.target.value)} required /></div>
                                <div className="d-flex mt-3" style={{ gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary font-weight-bold" disabled={nSending}>{nSending ? <><i className="fas fa-spinner fa-spin mr-2" />Envoi...</> : <><i className="fas fa-bell mr-2" />Envoyer</>}</button>
                                    <button type="button" className="btn btn-outline-secondary font-weight-bold" onClick={() => loadNotifHistory(nTo)} disabled={!nTo}><i className="fas fa-history mr-2" />Historique</button>
                                </div>
                            </form>
                            {nTarget && (
                                <div className="mt-4 border-top pt-4">
                                    <h5 className="font-weight-bold mb-3">Historique — <span className="text-primary">{nTarget}</span></h5>
                                    {nLoading ? <div className="text-center py-3"><i className="fas fa-spinner fa-spin" /></div> : nHistory.length === 0 ? <p className="text-muted text-center py-3">Aucune notification.</p> : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {nHistory.map((n: any) => (
                                                <div key={n.id} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div><div style={{ fontWeight: n.lu ? 400 : 700 }}>{n.titre} <span className="badge badge-secondary ml-1">{n.genre}</span></div><div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.contenu}</div></div>
                                                    <button className="btn btn-sm btn-outline-danger border-0 ml-3" onClick={() => { deleteNotification(n.id); setNHistory(p => p.filter((x: any) => x.id !== n.id)); }}><i className="fas fa-trash-alt" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    ) : (
                <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

                    {/* ── LEFT PANEL ── */}
                    <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Messages</span>
                            <button onClick={() => setShowNew(true)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-pen" style={{ fontSize: '0.68rem' }} />
                            </button>
                        </div>
                        <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.74rem' }} />
                                <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                                    style={{ width: '100%', padding: '7px 8px 7px 30px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, fontSize: '0.82rem', color: 'var(--text-primary)', outline: 'none' }} />
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {loading ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}><i className="fas fa-spinner fa-spin" /></div>
                                : filtered.length === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <i className="fas fa-comment-slash fa-2x" style={{ opacity: 0.2, display: 'block', marginBottom: 10 }} />
                                        <p style={{ fontSize: '0.82rem', marginBottom: 14 }}>Aucune conversation</p>
                                        <button onClick={() => setShowNew(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Démarrer</button>
                                    </div>
                                ) : filtered.map(conv => {
                                    const isActive = active === conv.contact;
                                    const n = name(conv.contact);
                                    return (
                                        <div key={conv.contact} onClick={() => openConv(conv.contact)}
                                            style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}>
                                            <div style={AV(isActive)}>{inits(n)}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <span style={{ fontWeight: conv.unread > 0 ? 700 : 500, fontSize: '0.855rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 6 }}>{fmtConv(conv.last?.createdAt || '')}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', marginTop: 2, gap: 4 }}>
                                                    <span style={{ fontSize: '0.76rem', color: conv.unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: conv.unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                        {conv.last?.senderUsername === username ? '✓ ' : ''}{conv.last?.body?.slice(0, 38)}
                                                    </span>
                                                    {conv.unread > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, flexShrink: 0 }}>{conv.unread}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL ── */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        {!active ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: 12 }}>
                                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-comments" style={{ fontSize: '1.8rem', color: 'var(--accent)', opacity: 0.5 }} />
                                </div>
                                <h5 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Vos Messages</h5>
                                <p style={{ fontSize: '0.85rem', margin: 0 }}>Sélectionnez une conversation ou démarrez-en une.</p>
                                <button onClick={() => setShowNew(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                                    <i className="fas fa-pen mr-2" />Nouveau message
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={AV(true)}>{inits(name(active))}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{name(active)}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{active}</div>
                                    </div>
                                    <button onClick={() => window.confirm('Supprimer cette conversation ?') && delConv(active)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6 }}>
                                        <i className="fas fa-trash-alt" />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 3, background: 'var(--bg-base)' }}>
                                    {activeMessages.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0', fontSize: '0.875rem' }}>
                                            <i className="fas fa-comment-dots fa-2x" style={{ opacity: 0.2, display: 'block', marginBottom: 10 }} />
                                            Démarrez la conversation.
                                        </div>
                                    ) : activeMessages.map((m, i) => {
                                        const isMe = m.senderUsername === username;
                                        const prev = i > 0 ? activeMessages[i - 1] : null;
                                        const newDay = !prev || new Date(m.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
                                        return (
                                            <React.Fragment key={m.id}>
                                                {newDay && (
                                                    <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
                                                        <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '3px 12px', borderRadius: 12, fontWeight: 600 }}>{fmtDay(m.createdAt)}</span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                    <div style={BUBBLE(isMe)}>
                                                        <div>{m.body}</div>
                                                        <div style={{ fontSize: '0.65rem', opacity: 0.7, textAlign: 'right', marginTop: 3 }}>
                                                            {fmtTime(m.createdAt)}{isMe && <span style={{ marginLeft: 3 }}>{m.read ? ' ✓✓' : ' ✓'}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                    <div ref={endRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={send} style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                    <textarea value={text} onChange={e => setText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                        placeholder="Tapez un message... (Entrée pour envoyer)"
                                        rows={1}
                                        style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'none', outline: 'none', maxHeight: 100, overflowY: 'auto', lineHeight: 1.4 }}
                                    />
                                    <button type="submit" disabled={!text.trim() || sending}
                                        style={{ width: 40, height: 40, borderRadius: '50%', background: text.trim() ? 'var(--accent)' : 'var(--bg-elevated)', color: text.trim() ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                        <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} style={{ fontSize: '0.875rem' }} />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* New Chat Modal */}
            {showNew && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 380, background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Nouvelle conversation</span>
                            <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                        </div>
                        <div style={{ padding: 14 }}>
                            <div style={{ position: 'relative', marginBottom: 10 }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.76rem' }} />
                                <input autoFocus type="text" placeholder="Rechercher un contact..." value={searchNew} onChange={e => setSearchNew(e.target.value)}
                                    style={{ width: '100%', padding: '9px 10px 9px 32px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
                            </div>
                            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {contacts.filter((u: any) => (u.displayName || '').toLowerCase().includes(searchNew.toLowerCase()) || (u.username || '').toLowerCase().includes(searchNew.toLowerCase())).map((u: any) => (
                                    <button key={u.username} onClick={() => startChat(u.username)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                                        <div style={AV(false)}>{inits(u.displayName || u.username)}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.displayName}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{u.username} · {(u.role || '').replace('ROLE_', '')}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </section>
    );
};

export default Messages;
