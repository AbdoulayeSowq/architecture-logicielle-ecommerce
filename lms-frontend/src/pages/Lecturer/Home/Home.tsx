import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getModulesByLecturer } from "../../../services/api/course";
import { getLecturerDetailsByUsername } from "../../../services/api/user";
import { listForLecturer } from "../../../services/api/announcement";
import { SkeletonCard } from "../../../components/ui";
import { getActiveModuleMeetings, joinMeeting as apiJoinMeeting } from "../../../services/api/meeting";


// Google Classroom-inspired palette
const CARD_COLORS = [
    { bg: '#1565c0', text: '#ffffff' },
    { bg: '#2e7d32', text: '#ffffff' },
    { bg: '#6a1b9a', text: '#ffffff' },
    { bg: '#c62828', text: '#ffffff' },
    { bg: '#00838f', text: '#ffffff' },
    { bg: '#ef6c00', text: '#ffffff' },
    { bg: '#4527a0', text: '#ffffff' },
    { bg: '#00695c', text: '#ffffff' },
];

const LecturerHome = () => {
    const navigate = useNavigate();

    const [modules, setModules] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [lecturer, setLecturer] = useState<any>(null);
    const [role, setRole] = useState('');
    const [activeMeetingsMap, setActiveMeetingsMap] = useState<Record<number, any[]>>({});
    const [joiningMeetingId, setJoiningMeetingId] = useState<number | null>(null);
    const [showAllMeetingsModal, setShowAllMeetingsModal] = useState(false);

    useEffect(() => {
        const go = async () => {
            try {
                const stored = localStorage.getItem('user');
                const storedRole = localStorage.getItem('role') || '';
                setRole(storedRole);
                const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                setUsername(uname);
                const [list, details] = await Promise.all([
                    getModulesByLecturer(uname),
                    getLecturerDetailsByUsername(uname).catch(() => null),
                ]);
                const lecturerModules = Array.isArray(list) ? list : [];
                setModules(lecturerModules);
                setLecturer(details);

                const classIds = new Set<string>();
                const courseCodes = new Set<string>();
                lecturerModules.forEach((m: any) => {
                    if (m.teachingUnit?.classId) classIds.add(String(m.teachingUnit.classId));
                    if (m.teachingUnit?.code) courseCodes.add(m.teachingUnit.code);
                });

                const anns = await listForLecturer(Array.from(classIds), Array.from(courseCodes), uname).catch(() => []);
                setAnnouncements(Array.isArray(anns) ? anns : []);

                if (lecturerModules.length > 0) {
                    const meetingsResults = await Promise.all(
                        lecturerModules.map(mod => getActiveModuleMeetings(mod.id).catch(() => []))
                    );
                    const meetingsMap: Record<number, any[]> = {};
                    lecturerModules.forEach((mod, idx) => {
                        meetingsMap[mod.id] = meetingsResults[idx] || [];
                    });
                    setActiveMeetingsMap(meetingsMap);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        go();
    }, []);

    const allActiveMeetings = Object.entries(activeMeetingsMap).flatMap(([modId, meetings]) => {
        const mod = modules.find(m => m.id === Number(modId));
        return meetings.map((m: any) => ({ ...m, module: mod }));
    });

    const handleJoin = async (meeting: any) => {
        try {
            setJoiningMeetingId(meeting.id);
            const stored = localStorage.getItem('user');
            const userObj = stored ? JSON.parse(stored) : null;
            const uname = userObj ? (userObj.username || userObj.email || '') : 'Enseignant';
            
            const userRole = (userObj && userObj.roles && userObj.roles.includes('LECTURER')) ? 'LECTURER' : 'STUDENT';
            const role = userRole === 'LECTURER' ? 'HOST' : 'PARTICIPANT';

            const result = await apiJoinMeeting(meeting.id, { roomName: meeting.roomName, role });
            if (result) {
                const email = userObj?.email || '';
                const isHost = meeting.createdBy === uname || (email && meeting.createdBy === email);
                const params = new URLSearchParams({
                    token: result.token,
                    url: result.livekitUrl,
                    room: meeting.roomName,
                    meetingId: meeting.id.toString(),
                    isHost: isHost.toString(),
                    title: meeting.title,
                    moduleId: meeting.moduleId.toString(),
                });
                navigate(`/meeting?${params.toString()}`);
            }
        } catch (err) {
            console.error("Failed to join meeting:", err);
        } finally {
            setJoiningMeetingId(null);
        }
    };

    const myRecentAnnouncements = useMemo(() => {
        return announcements
            .sort((a: any, b: any) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime())
            .slice(0, 3);
    }, [announcements]);

    const stripTitle = (t: string) => (t || '').replace(/^\[.*?\]\s*/, '').replace(/^(Devoir|Info|Examen|Maintenance|ASSIGNMENT|EVENT)\s*—\s*/i, '');
    const getInitials = (name?: string) => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);
    const lecturerInitials = getInitials(lecturer?.fullName || lecturer?.username);
    const lecturerName = lecturer?.fullName || lecturer?.username || 'Professeur';

    if (loading) return <div className="container py-4"><SkeletonCard count={6} /></div>;

    return (
        <div className="content">
            <div className="container py-4">
                {/* Live Meetings Premium Banner */}
                {allActiveMeetings.length > 0 && (
                    <div className="mb-4" style={{
                        animation: 'fadeInSlideDown 0.4s ease-out'
                    }}>
                        <style>{`
                            @keyframes fadeInSlideDown {
                                from { opacity: 0; transform: translateY(-10px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            @keyframes pulseBlue {
                                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                            }
                            @keyframes pulseDirectCard {
                                0% { opacity: 0.7; }
                                50% { opacity: 1; }
                                100% { opacity: 0.7; }
                            }
                        `}</style>
                        <div style={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                            border: '1.5px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '16px',
                            padding: '1.25rem 1.5rem',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '12px',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    flexShrink: 0
                                }}>
                                    <span style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: 'var(--accent)',
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        animation: 'pulseBlue 2s infinite'
                                    }} />
                                    <i className="fas fa-broadcast-tower" style={{ color: 'var(--accent)', fontSize: '1.2rem' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>VISIOCONFÉRENCE ACTIVE</span>
                                        <span className="badge" style={{ background: 'var(--accent)', color: '#eff6ff', fontSize: '0.7rem', fontWeight: 900 }}>
                                            LIVE
                                        </span>
                                    </div>
                                    <div style={{ color: '#bfdbfe', fontSize: '0.85rem', marginTop: '2px' }}>
                                        {allActiveMeetings.length === 1 ? (
                                            <>
                                                Une réunion pour <strong>{allActiveMeetings[0].module?.name || 'Réunion'}</strong> est en direct. Sujet : <em>{allActiveMeetings[0].title}</em>
                                            </>
                                        ) : (
                                            <>
                                                Il y a <strong>{allActiveMeetings.length} visioconférences en direct</strong> en ce moment. Rejoignez ou gérez vos séances.
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                {allActiveMeetings.length === 1 ? (
                                    <button
                                        onClick={() => handleJoin(allActiveMeetings[0])}
                                        disabled={joiningMeetingId === allActiveMeetings[0].id}
                                        className="btn"
                                        style={{
                                            background: 'var(--accent)',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '0.6rem 1.25rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--accent-hover)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--accent)';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                    >
                                        {joiningMeetingId === allActiveMeetings[0].id ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin" /> Connexion...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-sign-in-alt" /> Rejoindre la réunion
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowAllMeetingsModal(true)}
                                        className="btn"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '0.6rem 1.25rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.transform = 'none';
                                        }}
                                    >
                                        Voir les {allActiveMeetings.length} visioconférences <i className="fas fa-arrow-right" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal of active meetings when multiple exist */}
                {showAllMeetingsModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1.5px solid var(--border)',
                            borderRadius: '20px',
                            padding: '24px',
                            maxWidth: '520px',
                            width: '90%',
                            color: 'var(--text-primary)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                            animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h5 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-video" style={{ color: 'var(--accent)' }} />
                                    Réunions actives ({allActiveMeetings.length})
                                </h5>
                                <button
                                    onClick={() => setShowAllMeetingsModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                                >
                                    <i className="fas fa-times" />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                                {allActiveMeetings.map((meeting) => (
                                    <div key={meeting.id} style={{
                                        background: 'var(--bg-hover)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>
                                                {meeting.module?.name || 'Réunion'}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                                                {meeting.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                Prof. {meeting.createdBy}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowAllMeetingsModal(false);
                                                handleJoin(meeting);
                                            }}
                                            disabled={joiningMeetingId === meeting.id}
                                            className="btn btn-sm"
                                            style={{
                                                background: 'var(--accent)',
                                                color: '#fff',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                border: 'none',
                                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                                            }}
                                        >
                                            {joiningMeetingId === meeting.id ? (
                                                <i className="fas fa-spinner fa-spin" />
                                            ) : (
                                                'Rejoindre'
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {/* Module grid */}
                {modules.length === 0 ? (
                    <div className="empty-state-box py-5 mb-4">
                        <i className="fas fa-chalkboard-teacher fa-3x mb-3" />
                        <p className="font-weight-bold">Aucun module assigné pour ce semestre.</p>
                    </div>
                ) : (
                    <div className="row mb-4">
                        {modules.map((mod: any, idx: number) => {
                            const color = CARD_COLORS[idx % CARD_COLORS.length];
                            const activeMeetings = activeMeetingsMap[mod.id] || [];
                            const hasLiveMeeting = activeMeetings.length > 0;
                            return (
                                <div key={mod.id} className="col-md-4 col-sm-6 mb-4">
                                    <Link to={`/lecturer/${mod.id}`} className="text-decoration-none">
                                        <div className="classroom-card card border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.25s ease' }}>
                                            {/* Color header */}
                                            <div className="p-4 position-relative" style={{ background: color.bg, minHeight: '120px' }}>
                                                {hasLiveMeeting && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '12px',
                                                        right: '12px',
                                                        background: 'rgba(59, 130, 246, 0.9)',
                                                        color: '#fff',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.68rem',
                                                        fontWeight: 800,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        boxShadow: '0 2px 6px rgba(59,130,246,0.3)',
                                                        animation: 'pulseDirectCard 1.6s infinite'
                                                    }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                                                        • DIRECT
                                                    </span>
                                                )}
                                                <h5 className="font-weight-bold mb-1 text-truncate" style={{ color: color.text, fontSize: '1rem', paddingRight: '2rem' }} title={stripTitle(mod.name || mod.title)}>
                                                    {stripTitle(mod.name || mod.title)}
                                                </h5>
                                                <p className="mb-0 small font-weight-bold" style={{ color: color.text, opacity: 0.85 }}>
                                                    {mod.codeEC || mod.mid} · {mod.semester}
                                                </p>
                                            </div>

                                            {/* Footer */}
                                            <div className="card-body p-3" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                                                {/* Lecturer info */}
                                                <div className="d-flex align-items-center mb-3" style={{ gap: '0.6rem' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: color.bg, color: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 800, flexShrink: 0
                                                    }}>
                                                        {lecturerInitials}
                                                    </div>
                                                    <span className="small font-weight-bold text-truncate" style={{ color: 'var(--text-secondary)' }}>{lecturerName}</span>
                                                </div>
                                                {/* Stats + icon */}
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="small text-muted">
                                                        <i className="far fa-clock mr-1" />{mod.totalCH ?? mod.duration ?? 0}h · {mod.creditsEC ?? 0} ECTS
                                                    </span>
                                                    {hasLiveMeeting ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleJoin(activeMeetings[0]);
                                                            }}
                                                            className="btn btn-xs"
                                                            style={{
                                                                background: 'var(--accent)',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                fontSize: '0.72rem',
                                                                fontWeight: 700,
                                                                padding: '4px 10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.2)'
                                                            }}
                                                        >
                                                            <i className="fas fa-play" style={{ fontSize: '0.6rem' }} /> Rejoindre
                                                        </button>
                                                    ) : (
                                                        <i className="far fa-folder text-muted" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Announcements section */}
                <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
                    <h4 className="font-weight-bold mb-0">Annonces récentes</h4>
                    <Link to="/lecturer/announcements" className="btn btn-secondary font-weight-bold btn-sm">
                        <i className="fas fa-plus mr-1" /> Publier
                    </Link>
                </div>

                {myRecentAnnouncements.length === 0 ? (
                    <div className="empty-state-box py-5 mb-4">
                        <i className="fas fa-bullhorn fa-3x mb-3" />
                        <p className="font-weight-bold">Aucune annonce publiée récemment.</p>
                    </div>
                ) : (
                    <div className="list-group list-group-flush shadow-sm mb-4">
                        {myRecentAnnouncements.map((a: any) => (
                            <Link key={a.id} to="/lecturer/announcements" className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 border-0 border-bottom">
                                <div>
                                    <h6 className="font-weight-bold mb-1">{stripTitle(a.title)}</h6>
                                    <small className="text-muted font-weight-bold">
                                        <i className="far fa-calendar-alt mr-1" />
                                        {a.createdDate ? new Date(a.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                        {a.assignmentDueDate && (
                                            <span className="ml-3 text-danger">
                                                <i className="far fa-clock mr-1" />
                                                Échéance : {new Date(a.assignmentDueDate).toLocaleDateString('fr-FR')}
                                            </span>
                                        )}
                                    </small>
                                    {a.description && <p className="mb-0 mt-2 small text-dark">{a.description}</p>}
                                </div>
                                <span className={`badge ${a.type === 'ASSIGNMENT' ? 'badge-primary' : 'badge-info'} px-2 py-1`}>
                                    {a.type === 'ASSIGNMENT' ? 'Devoir' : 'Info'}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LecturerHome;