import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getModulesByStudent, getRecommendedModules } from "../../../services/api/course";
import { getStudentDetailsByUsername, getContacts } from "../../../services/api/user";
import { SkeletonCard, EmptyState, PageTransition } from "../../../components/ui";
import { getActiveModuleMeetings, joinMeeting as apiJoinMeeting } from "../../../services/api/meeting";


// Google Classroom-inspired palette — rotates per module index
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

const Home = () => {
    const navigate = useNavigate();

    const [modules, setModules] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMeetingsMap, setActiveMeetingsMap] = useState<Record<number, any[]>>({});
    const [joiningMeetingId, setJoiningMeetingId] = useState<number | null>(null);
    const [showAllMeetingsModal, setShowAllMeetingsModal] = useState(false);

    useEffect(() => {
        const go = async () => {
            try {
                const stored = localStorage.getItem('user');
                const userObj = stored ? JSON.parse(stored) : null;
                const uname = userObj ? (userObj.username || userObj.email || '') : '';
                
                if (!uname) {
                    setLoading(false);
                    return;
                }
                // Fetch modules, contacts and recommendations in parallel
                const [list, contactList, recList] = await Promise.all([
                    getModulesByStudent(uname),
                    getContacts().catch(() => []),
                    getRecommendedModules(uname).catch(() => [])
                ]);
                const studentModules = Array.isArray(list) ? list : [];
                setModules(studentModules);
                setContacts(Array.isArray(contactList) ? contactList : []);
                setRecommendations(Array.isArray(recList) ? recList : []);

                if (studentModules.length > 0) {
                    const meetingsResults = await Promise.all(
                        studentModules.map(mod => getActiveModuleMeetings(mod.id).catch(() => []))
                    );
                    const meetingsMap: Record<number, any[]> = {};
                    studentModules.forEach((mod, idx) => {
                        meetingsMap[mod.id] = meetingsResults[idx] || [];
                    });
                    setActiveMeetingsMap(meetingsMap);
                }
            } catch (e) { 
                console.error("Error fetching student home data:", e); 
                setModules([]);
            }
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
            const uname = userObj ? (userObj.username || userObj.email || '') : 'Étudiant';
            
            const userRole = (userObj && userObj.roles && userObj.roles.includes('LECTURER')) ? 'LECTURER' : 'STUDENT';
            const role = userRole === 'LECTURER' ? 'HOST' : 'PARTICIPANT';

            const result = await apiJoinMeeting(meeting.id, { roomName: meeting.roomName, role });
            if (result) {
                const isHost = meeting.createdBy === uname;
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

    const stripCode = (title?: string) => (title || '').replace(/^\[.*?\]\s*/, '');
    const getInitials = (name?: string) => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);

    const getLecturerName = (mod: any) => {
        let name = mod.lecturerFullName;
        if (!name) {
            const contact = contacts.find(c => c.username === mod.lecturerUsername);
            name = contact ? contact.displayName : (mod.lecturerUsername || 'Professeur');
        }
        // Aggressive cleanup for any role markers
        return name.replace(/\s*\(Prof\)$/i, '')
                   .replace(/\s*\(Etudiant\)$/i, '')
                   .replace(/^Admin:\s*/i, '')
                   .trim();
    };

    if (loading) return <div className="container py-5"><SkeletonCard count={6} /></div>;

    return (
        <PageTransition>
            <div className="container py-5">
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
                                        <span>COURS EN DIRECT</span>
                                        <span className="badge" style={{ background: 'var(--accent)', color: '#eff6ff', fontSize: '0.7rem', fontWeight: 900 }}>
                                            LIVE
                                        </span>
                                    </div>
                                    <div style={{ color: '#bfdbfe', fontSize: '0.85rem', marginTop: '2px' }}>
                                        {allActiveMeetings.length === 1 ? (
                                            <>
                                                Le module <strong>{allActiveMeetings[0].module?.name || 'Réunion'}</strong> est actuellement en direct. Sujet : <em>{allActiveMeetings[0].title}</em>
                                            </>
                                        ) : (
                                            <>
                                                Il y a <strong>{allActiveMeetings.length} cours en direct</strong> en ce moment. Rejoignez votre séance interactive.
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
                                                <i className="fas fa-sign-in-alt" /> Rejoindre le cours
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
                                        Voir les {allActiveMeetings.length} cours <i className="fas fa-arrow-right" />
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
                                    Cours en direct ({allActiveMeetings.length})
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

                {/* Adaptive Learning Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-5">
                        <div className="d-flex align-items-center mb-4">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mr-3" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                                <i className="fas fa-magic text-white" />
                            </div>
                            <div>
                                <h4 className="font-weight-bold mb-0" style={{ color: 'var(--text-primary)' }}>Recommandations IA</h4>
                                <p className="text-muted small mb-0">Modules suggérés pour renforcer vos compétences</p>
                            </div>
                        </div>
                        <div className="row">
                            {recommendations.map((rec: any) => (
                                <div key={rec.id} className="col-md-6 mb-3">
                                    <Link to={`/student/${rec.id}`} className="text-decoration-none">
                                        <div className="card h-100 border-0 shadow-sm hover-lift" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--accent-border)' }}>
                                            <div className="card-body d-flex align-items-center p-3">
                                                <div className="mr-3 rounded-lg d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                                    <i className="fas fa-graduation-cap fa-lg" />
                                                </div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <h6 className="font-weight-bold mb-1 text-truncate" style={{ color: 'var(--text-primary)' }}>{rec.name}</h6>
                                                    <div className="d-flex align-items-center">
                                                        <span className="badge badge-soft-primary mr-2" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontSize: '0.65rem' }}>Optimisation</span>
                                                        <span className="text-muted small text-truncate">Basé sur vos derniers résultats</span>
                                                    </div>
                                                </div>
                                                <i className="fas fa-chevron-right text-muted ml-2" />
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="d-flex align-items-center mb-4">
                    <h4 className="font-weight-bold mb-0" style={{ color: 'var(--text-primary)' }}>Mes Modules</h4>
                </div>
                {/* Adaptive Learning Banner — visible sur chaque module */}
                {modules.length > 0 && (
                    <div className="mb-4">
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '16px',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <i className="fas fa-brain" style={{ color: '#fff', fontSize: '1.1rem' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                        Parcours Adaptatif
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        Questions adaptées à ton niveau — difficulté ajustée en temps réel par l'IA
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {modules.slice(0, 3).map((mod: any) => (
                                    <Link
                                        key={mod.id}
                                        to={`/student/${mod.id}/adaptive-quiz`}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            color: '#fff',
                                            borderRadius: '10px',
                                            padding: '0.45rem 1rem',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <i className="fas fa-rocket" style={{ fontSize: '0.7rem' }} />
                                        {stripCode(mod.name || mod.title).slice(0, 20)}{(mod.name || mod.title || '').length > 20 ? '…' : ''}
                                    </Link>
                                ))}
                                {modules.length > 3 && (
                                    <span style={{
                                        background: 'rgba(99,102,241,0.12)',
                                        color: '#6366f1',
                                        borderRadius: '10px',
                                        padding: '0.45rem 0.75rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                    }}>
                                        +{modules.length - 3} modules
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {modules.length === 0 ? (
                    <EmptyState
                        icon="fa-layer-group"
                        title="Aucun module assigne"
                        description="Vous n'etes inscrit a aucun module pour le moment. Contactez votre administration."
                    />
                ) : (
                    <div className="row mb-4">
                        {modules.map((mod: any, idx: number) => {
                            const color = CARD_COLORS[idx % CARD_COLORS.length];
                            // Use whatever the module provides — fullName fields first, fallback to username
                            const lecturerName = getLecturerName(mod);
                            const initials = getInitials(lecturerName);
                            const activeMeetings = activeMeetingsMap[mod.id] || [];
                            const hasLiveMeeting = activeMeetings.length > 0;
                            return (
                                <div key={mod.id} className="col-md-4 col-sm-6 mb-4">
                                    <Link to={`/student/${mod.id}`} className="text-decoration-none">
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
                                                <h5 className="font-weight-bold mb-1 text-truncate" style={{ color: color.text, fontSize: '1rem', paddingRight: '2rem' }} title={stripCode(mod.name || mod.title)}>
                                                    {stripCode(mod.name || mod.title)}
                                                </h5>
                                                <p className="mb-0 small font-weight-bold" style={{ color: color.text, opacity: 0.85 }}>
                                                    {mod.codeEC || mod.mid}
                                                </p>
                                            </div>

                                            {/* Footer */}
                                            <div className="card-body p-3" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                                                {/* Lecturer info */}
                                                <div className="d-flex align-items-center mb-3" style={{ gap: '0.6rem' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: color.bg,
                                                        color: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 800, flexShrink: 0
                                                    }}>
                                                        {initials}
                                                    </div>
                                                    <span className="small font-weight-bold text-truncate" style={{ color: 'var(--text-secondary)' }}>{lecturerName}</span>
                                                </div>
                                                {/* Stats */}
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="d-flex" style={{ gap: '1rem' }}>
                                                        <span className="small text-muted"><i className="far fa-clock mr-1" />{mod.totalCH ?? mod.duration ?? 0}h</span>
                                                        <span className="small text-muted"><i className="far fa-star mr-1" />{mod.creditsEC ?? mod.credits ?? 0} ECTS</span>
                                                    </div>
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
            </div>
            <style>{`
                .classroom-card:hover {
                    transform: translateY(-4px) !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
                }
            `}</style>
        </PageTransition>
    );
};

export default Home;