import React, { useEffect, useMemo, useRef, useState } from "react";
import { listForStudent } from "../../../services/api/announcement";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import { getModulesByStudent } from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import webSocketService from "../../../services/WebSocketService";

const TYPE_META: Record<string, { icon: string; color: string; label: string; badgeClass: string }> = {
    assignment:  { icon: 'fas fa-tasks',        color: 'var(--accent)', label: 'Devoir',      badgeClass: 'badge-primary' },
    exam:        { icon: 'fas fa-file-alt',     color: 'var(--accent)', label: 'Examen',      badgeClass: 'badge-primary'  },
    event:       { icon: 'fas fa-calendar-alt', color: 'var(--text-muted)',   label: 'Événement',   badgeClass: 'badge-info'    },
    maintenance: { icon: 'fas fa-tools',        color: 'var(--text-muted)',label: 'Maintenance',  badgeClass: 'badge-secondary' },
};

const FILTERS = ['TOUS', 'assignment', 'exam', 'event', 'maintenance'] as const;

const fmtDate = (raw?: string) => {
    if (!raw) return '';
    try { return new Date(raw).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return raw; }
};

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('TOUS');
    const [loading, setLoading] = useState(true);
    const classIdsRef = useRef<Set<string>>(new Set());
    const ueCodesRef  = useRef<Set<string>>(new Set());

    useEffect(() => {
        (async () => {
            try {
                const stored = localStorage.getItem('user');
                const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                if (!uname) { setLoading(false); return; }

                const modules = await getModulesByStudent(uname);
                const classIds = new Set<string>();
                const ueCodes = new Set<string>();
                if (Array.isArray(modules)) {
                    modules.forEach((m: any) => {
                        if (m.teachingUnit?.classId) classIds.add(String(m.teachingUnit.classId));
                        if (m.teachingUnit?.code) ueCodes.add(m.teachingUnit.code);
                    });
                }
                classIdsRef.current = classIds;
                ueCodesRef.current  = ueCodes;

                const list = await listForStudent(Array.from(ueCodes), Array.from(classIds));
                if (Array.isArray(list)) {
                    setAnnouncements(list.sort((a: any, b: any) =>
                        new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
                    ));
                }
            } catch (e) {
                console.error('Announcements load error:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* Temps réel: nouvelle annonce via STOMP */
    useEffect(() => {
        const topicId = 'announcements-student';
        webSocketService.subscribeTopic(topicId, '/topic/announcements', (a: any) => {
            const audience: string = (a.targetAudience || '').toUpperCase();
            const isRelevant =
                audience === 'ALL' ||
                audience === 'STUDENTS' ||
                (audience === 'CLASS'  && classIdsRef.current.has(String(a.targetId))) ||
                (audience === 'COURSE' && ueCodesRef.current.has(String(a.targetId)));
            if (!isRelevant) return;
            setAnnouncements(prev => prev.some(x => x.id === a.id) ? prev : [a, ...prev]);
        });
        return () => webSocketService.unsubscribeTopic(topicId);
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'TOUS') return announcements;
        return announcements.filter(a => (a.type || '').toLowerCase() === filter);
    }, [announcements, filter]);

    const getMeta = (rawType: string) => TYPE_META[(rawType || '').toLowerCase()] || TYPE_META.assignment;

    if (loading) return <PageLoading />;

    return (
        <div className="content">
        <div className="container py-5">
                <StudentPageHeader
                    title="Annonces"
                    subtitle={`${announcements.length} annonces publiées pour votre classe.`}
                    icon="fa-bullhorn"
                />

                {/* Filter bar */}
                <div className="d-flex flex-wrap mb-4" style={{ gap: 8 }}>
                    {FILTERS.map(f => {
                        const meta = f !== 'TOUS' ? TYPE_META[f] : null;
                        const isActive = filter === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`btn btn-sm ${isActive ? 'btn-soft-primary' : 'btn-secondary'}`}
                            >
                                {meta && <i className={`${meta.icon} mr-1`} />}
                                {f === 'TOUS' ? 'Tous' : (meta?.label || f)}
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="empty-state-box">
                        <i className="fas fa-bullhorn" />
                        <p>Aucune annonce dans cette catégorie.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map((a: any) => {
                            const meta = getMeta(a.type);
                            const dueOrEvent = a.assignmentDueDate || a.examDate || a.eventDate || a.maintenanceStart;
                            const cleanTitle = (a.title || '').replace(/^(Devoir|Info|Examen|Maintenance)\s*—\s*/i, '');
                            return (
                                <div key={a.id} className="card mb-3 shadow-sm border-0">
                                    <div className="card-body p-4" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                        <div className="stat-card__icon" style={{ flexShrink: 0, color: meta.color }}>
                                            <i className={meta.icon} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="d-flex align-items-center justify-content-between flex-wrap mb-1" style={{ gap: 8 }}>
                                                <strong>{cleanTitle}</strong>
                                                <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                                            </div>
                                            {a.description && (
                                                <p className="text-muted small mb-2" style={{ lineHeight: 1.6 }}>{a.description}</p>
                                            )}
                                            <div className="d-flex flex-wrap text-muted" style={{ gap: '12px 20px', fontSize: '0.8rem' }}>
                                                {a.targetAudience && <span><i className="fas fa-users mr-1" />{a.targetAudience}{a.targetId ? ` · ${a.targetId}` : ''}</span>}
                                                {dueOrEvent && <span><i className="far fa-clock mr-1" />{fmtDate(dueOrEvent)}</span>}
                                                {(a.examLocation || a.eventLocation) && <span><i className="fas fa-map-marker-alt mr-1" />{a.examLocation || a.eventLocation}</span>}
                                                {(a.assignmentInstructor || a.examInstructor) && <span><i className="fas fa-user-tie mr-1" />{a.assignmentInstructor || a.examInstructor}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Announcements;
