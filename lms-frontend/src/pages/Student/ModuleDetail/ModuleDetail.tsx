import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMaterialsByModuleId, getModuleById, getAssignmentsByModule, getQuizzesByModuleId, getForumThreadsByModuleId, createForumThread, upvoteThread, getStudentAttendanceHistory } from "../../../services/api/course";
import VideoPlayer from "../../../components/VideoPlayer";
import PdfViewer from "../../../components/PdfViewer";
import { getStudentDetailsByUsername, getLecturerDetailsByUsername } from "../../../services/api/user";
import { useAuth as useAuthContext } from "../../../services/AuthContext";
import { SkeletonCard, Breadcrumbs, PageTransition } from "../../../components/ui";
import AssignmentTake from "./AssignmentTake";
import PracticeCatalog from "../../Practice/PracticeCatalog";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { StudentTabNav } from "../../../components/Student/StudentTabNav";
import QRScanner from "../../../components/Student/QRScanner";
import MeetingList from "../../Meeting/MeetingList";
import { notifyError } from "../../../components/notify";
import { getActiveModuleMeetings, joinMeeting } from "../../../services/api/meeting";
import api from "../../../services/api/api";
import webSocketService from "../../../services/WebSocketService";

const formatSessionDate = (dateString?: string, durationMinutes?: number) => {
  if (!dateString) return "Non programmée";
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const startStr = date.toLocaleDateString('fr-FR', options);
    if (durationMinutes) {
      const endDate = new Date(date.getTime() + durationMinutes * 60000);
      const endStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `${startStr} (fin à ${endStr})`;
    }
    return startStr;
  } catch (e) {
    return dateString;
  }
};

const StudentModuleDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState<'materials' | 'quiz' | 'adaptive-quiz' | 'assignments' | 'practice' | 'forum' | 'attendance' | 'lessons'>('materials');
    const [module, setModule] = useState<any>(null);
    const [materials, setMaterials] = useState<any[]>([]);
    const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
    const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);

    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: '', content: '', authorId: '', authorName: '', moduleId: id });
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [activeMeetings, setActiveMeetings] = useState<any[]>([]);
    const [activeLesson, setActiveLesson] = useState<any | null>(null);

    const fetchActiveMeetings = async () => {
        if (id) {
            const meetings = await getActiveModuleMeetings(Number(id));
            setActiveMeetings(meetings || []);
        }
    };

    const handleJoinLive = async (meeting: any) => {
        try {
            const role = 'PARTICIPANT';
            const joinRes = await joinMeeting(meeting.id, { roomName: meeting.roomName, role });
            if (joinRes) {
                const isHost = 'false';
                const params = new URLSearchParams({
                    token: joinRes.token,
                    url: joinRes.livekitUrl,
                    room: meeting.roomName,
                    meetingId: meeting.id.toString(),
                    isHost: isHost,
                    moduleId: id || '',
                });
                navigate(`/meeting?${params.toString()}`);
            }
        } catch (e: any) {
            console.error("Error joining live meeting:", e);
            notifyError("Erreur lors de la connexion au Live: " + e.message);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (id) {
                const moduleData = await getModuleById(id);
                setModule(moduleData);
                if (activeTab === 'materials') {
                    const data = await getMaterialsByModuleId(id);
                    setMaterials(Array.isArray(data) ? data : []);
                } else if (activeTab === 'quiz') {
                    const data = await getQuizzesByModuleId(id);
                    setQuizzes(Array.isArray(data) ? data : []);
                } else if (activeTab === 'assignments') {
                    const data = await getAssignmentsByModule(id);
                    setAssignments(Array.isArray(data) ? data : []);
                } else if (activeTab === 'forum') {
                    const data = await getForumThreadsByModuleId(id);
                    setThreads(Array.isArray(data) ? data : []);
                } else if (activeTab === 'lessons') {
                    const res = await api.get(`/course/module/${id}/sessions`);
                    setLessons(Array.isArray(res.data) ? res.data : []);
                    await fetchActiveMeetings();
                } else if (activeTab === 'attendance' && user) {
                    const data = await getStudentAttendanceHistory(user.username);
                    // On filtre pour ce module spécifique et on trie du plus récent au plus ancien
                    const filtered = Array.isArray(data) ? data.filter((h: any) => h.moduleName === moduleData.name) : [];
                    setAttendanceHistory(filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                }
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    // Souscription temps réel: meeting démarré / terminé
    useEffect(() => {
        if (!id) return;
        const startId = `meeting-started-${id}`;
        const endId   = `meeting-ended-${id}`;
        webSocketService.subscribeTopic(startId, `/topic/module/${id}/meeting-started`, (meeting: any) => {
            setActiveMeetings(prev => prev.some(m => m.id === meeting.id) ? prev : [meeting, ...prev]);
        });
        webSocketService.subscribeTopic(endId, `/topic/module/${id}/meeting-ended`, (meeting: any) => {
            setActiveMeetings(prev => prev.filter(m => m.id !== meeting.id));
        });
        return () => {
            webSocketService.unsubscribeTopic(startId);
            webSocketService.unsubscribeTopic(endId);
        };
    }, [id]);

    useEffect(() => { if (location.state?.activeTab) setActiveTab(location.state.activeTab); }, [location.state]);
    useEffect(() => {
        const resolveIdentity = async () => {
            if (user) {
                const role = localStorage.getItem('role');
                let details: any;
                try {
                    if (role === 'ROLE_STUDENT') details = await getStudentDetailsByUsername(user.username);
                    else if (role === 'ROLE_LECTURER') details = await getLecturerDetailsByUsername(user.username);
                } catch (e) { console.error(e); }
                setNewThread(prev => ({ ...prev, authorId: user.username, authorName: details?.fullName || user.username }));
            }
        };
        resolveIdentity();
        fetchData();
    }, [id, activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateThread = async (e: any) => {
        e.preventDefault();
        try {
            await createForumThread(newThread);
            setShowCreateModal(false);
            setNewThread({ title: '', content: '', authorId: user?.username || '', authorName: user?.username || '', moduleId: id });
            fetchData();
        } catch (error) { console.error(error); }
    };

    const stripCode = (title: string) => (title || '').replace(/^\[.*?\]\s*/, '');
    const lightTextStyle = { color: "var(--text-primary)" };
    const mutedTextStyle = { color: "var(--text-secondary)" };

    // Anti-infinite loading
    if (loading && !module) return <div className="container py-4"><SkeletonCard count={4} /></div>;

    return (
        <PageTransition>
        <div className="content">
            <div className="container py-4">
                <Breadcrumbs items={[
                    { label: 'Mes Modules', path: '/student' },
                    { label: stripCode(module?.name || module?.title) || 'Module' },
                ]} />
                <StudentPageHeader 
                    title={stripCode(module?.name || module?.title)}
                    subtitle={`${module?.semester || ''} · ${module?.level || ''} · ${module?.creditsEC ?? 0} ECTS`}
                />

                {/* Live Meetings */}
                {id && !isNaN(Number(id)) && user && (
                    <div className="mb-4">
                        <MeetingList moduleId={Number(id)} userRole="STUDENT" username={user.username} />
                    </div>
                )}

                <StudentCard className="border-0">
                    <StudentTabNav 
                        activeTab={activeTab}
                        onChange={(id) => { setActiveTab(id); }}
                        tabs={[
                            { id: 'materials', icon: 'fa-book', label: 'Supports' },
                            { id: 'lessons', icon: 'fa-chalkboard-teacher', label: 'Séances' },
                            { id: 'quiz', icon: 'fa-question-circle', label: 'Quiz' },
                            { id: 'adaptive-quiz', icon: 'fa-brain', label: 'Parcours Adaptatif' },
                            { id: 'assignments', icon: 'fa-file-signature', label: 'Devoirs' },
                            { id: 'practice', icon: 'fa-code', label: 'Practice' },
                            { id: 'forum', icon: 'fa-comments', label: 'Forum' },
                            { id: 'attendance', icon: 'fa-qrcode', label: 'Émargement' }
                        ]}
                    />
                    <div className="card-body p-4">
                        {activeTab === 'materials' && (
                            <div className="row">
                                {materials.length === 0 ? (
                                    <div className="col-12 empty-state-box py-5"><i className="fas fa-folder-open fa-3x mb-3 text-muted"></i><p style={mutedTextStyle}>Aucun support disponible.</p></div>
                                ) : (
                                    materials.map((m: any) => (
                                        <div key={m.id} className="col-md-6 mb-3">
                                            {m.type?.toUpperCase() === 'VIDEO' ? (
                                                <button
                                                    onClick={() => setVideoModal({ url: m.fileUrl, title: m.title })}
                                                    className="material-card d-flex align-items-center p-3 rounded text-decoration-none w-100"
                                                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", gap: '1rem', transition: 'all 0.2s ease', display: 'flex', cursor: 'pointer' }}
                                                >
                                                    <div style={{
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        color: 'var(--accent)',
                                                        width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        <i className="fas fa-video fa-lg"></i>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h6 className="mb-0 font-weight-bold text-truncate" style={lightTextStyle}>{m.title}</h6>
                                                        <small style={mutedTextStyle}>{m.description || "Support de cours"}</small>
                                                    </div>
                                                    <i className="fas fa-play fa-sm flex-shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                                </button>
                                            ) : m.type?.toUpperCase() === 'PDF' ? (
                                                <button
                                                    onClick={() => setPdfModal({ url: m.fileUrl, title: m.title })}
                                                    className="material-card d-flex align-items-center p-3 rounded text-decoration-none w-100"
                                                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", gap: '1rem', transition: 'all 0.2s ease', display: 'flex', cursor: 'pointer' }}
                                                >
                                                    <div style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        <i className="fas fa-file-pdf fa-lg"></i>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h6 className="mb-0 font-weight-bold text-truncate" style={lightTextStyle}>{m.title}</h6>
                                                        <small style={mutedTextStyle}>{m.description || "Support de cours"}</small>
                                                    </div>
                                                    <i className="fas fa-file fa-sm flex-shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                                </button>
                                            ) : (
                                                <a
                                                    href={m.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="material-card d-flex align-items-center p-3 rounded text-decoration-none"
                                                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", gap: '1rem', transition: 'all 0.2s ease', display: 'flex' }}
                                                >
                                                    <div style={{
                                                        background: 'rgba(6, 182, 212, 0.1)',
                                                        color: '#06b6d4',
                                                        width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        <i className="fas fa-link fa-lg"></i>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h6 className="mb-0 font-weight-bold text-truncate" style={lightTextStyle}>{m.title}</h6>
                                                        <small style={mutedTextStyle}>{m.description || "Support de cours"}</small>
                                                    </div>
                                                    <i className="fas fa-external-link-alt fa-sm flex-shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'adaptive-quiz' && (
                            <div className="text-center py-5">
                                <i className="fas fa-brain fa-3x mb-3" style={{ color: 'var(--accent)', opacity: 0.3 }} />
                                <h5 className="font-weight-bold mb-2" style={{ color: 'var(--text-primary)' }}>Parcours Adaptatif</h5>
                                <p style={{ color: 'var(--text-secondary)' }} className="mb-4">
                                    Questions ajustées à ton niveau en temps réel.
                                </p>
                                <Link
                                    to={`/student/${id}/adaptive-quiz`}
                                    className="btn btn-primary px-5 font-weight-bold"
                                    style={{ borderRadius: 10 }}
                                >
                                    <i className="fas fa-rocket mr-2" />Démarrer
                                </Link>
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <div className="row">
                                {quizzes.length === 0 ? (
                                    <div className="col-12 empty-state-box py-5"><i className="fas fa-question-circle fa-3x mb-3 text-muted"></i><p style={mutedTextStyle}>Aucun quiz disponible.</p></div>
                                ) : (
                                    quizzes.map((q: any) => (
                                        <div key={q.id} className="col-md-6 mb-3">
                                            <Link
                                                to={`/student/${id}/quiz/${q.id}`}
                                                className="assignment-card d-block rounded text-decoration-none"
                                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", overflow: 'hidden', transition: 'all 0.2s ease' }}
                                            >
                                                <div style={{ height: '5px', background: 'var(--accent)' }} />
                                                <div className="p-4">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="font-weight-bold mb-0" style={lightTextStyle}>{q.title}</h6>
                                                        <span className="badge ml-2 flex-shrink-0 px-2 py-1" style={{ background: "var(--btn-soft-bg)", color: "var(--btn-soft-text)", fontSize: '0.7rem', borderRadius: '8px' }}>{q.timeLimit} min</span>
                                                    </div>
                                                    <p className="small mt-2 mb-0" style={mutedTextStyle}>{q.description || 'Testez vos connaissances.'}</p>
                                                </div>
                                                <div className="px-4 pb-3">
                                                    <small className="font-weight-bold" style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
                                                        <i className="fas fa-arrow-right mr-1" /> Commencer le quiz
                                                    </small>
                                                </div>
                                            </Link>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'assignments' && (

                            <div className="row">
                                {assignments.length === 0 ? (
                                    <div className="col-12 empty-state-box py-5"><i className="fas fa-file-signature fa-3x mb-3 text-muted"></i><p style={mutedTextStyle}>Aucun devoir disponible.</p></div>
                                ) : (
                                    assignments.map((a: any) => (
                                        <div key={a.id} className="col-md-6 mb-3">
                                            <div
                                                className="assignment-card rounded h-100"
                                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", cursor: 'pointer', transition: 'all 0.2s ease', overflow: 'hidden' }}
                                                onClick={() => navigate(`/student/${id}/assignment/${a.id}/take`)}
                                            >
                                                {/* Colored top strip */}
                                                <div style={{ height: '5px', background: 'var(--accent)' }} />
                                                <div className="p-4">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="font-weight-bold mb-0" style={lightTextStyle}>{a.title}</h6>
                                                        <span className="badge px-2 py-1 ml-2 flex-shrink-0" style={{ background: "var(--btn-soft-bg)", color: "var(--btn-soft-text)", fontSize: '0.7rem', borderRadius: '8px' }}>{a.maxScore} pts</span>
                                                    </div>
                                                    <p className="small mt-2 mb-0" style={mutedTextStyle}>{a.description || 'Cliquez pour commencer le devoir.'}</p>
                                                </div>
                                                <div className="px-4 pb-3">
                                                    <small className="font-weight-bold" style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
                                                        <i className="fas fa-arrow-right mr-1" /> Commencer
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'practice' && id && (
                            <PracticeCatalog moduleId={id} basePath="/student/practice" embedded />
                        )}

                        {activeTab === 'forum' && (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 style={lightTextStyle} className="m-0">Discussions</h5>
                                    <button className="btn btn-primary btn-sm px-4" style={{ borderRadius: "20px" }} onClick={() => setShowCreateModal(true)}><i className="fas fa-plus mr-2"></i>Nouveau</button>
                                </div>
                                {threads.length === 0 ? (
                                    <div className="text-center py-5"><i className="fas fa-comments fa-3x mb-3 text-muted"></i><p style={mutedTextStyle}>Soyez le premier à poser une question !</p></div>
                                ) : (
                                    <div className="list-group">
                                        {threads.map((t: any) => (
                                            <Link key={t.id} to={`/student/${id}/forum/thread/${t.id}`} className="list-group-item border-0 mb-3 p-4" style={{ background: "var(--bg-elevated)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                                <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                                                    <h6 className="mb-0 font-weight-bold" style={lightTextStyle}>{t.title} {t.hasSolution && <i className="fas fa-check-circle text-success ml-2"></i>}</h6>
                                                    <div className="d-flex small" style={{ ...mutedTextStyle, gap: '1.5rem' }}>
                                                        <span><i className="fas fa-eye mr-2"></i>{t.viewCount}</span>
                                                        <span><i className="fas fa-thumbs-up mr-2 text-primary"></i>{t.upvoteCount}</span>
                                                    </div>
                                                </div>
                                                <p className="small mb-3" style={mutedTextStyle}>{(t.content || '').substring(0, 120)}...</p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <small className="text-primary font-weight-bold">{t.authorName}</small>
                                                    <small style={mutedTextStyle}>{t.createdAt && new Date(t.createdAt).toLocaleDateString()}</small>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'lessons' && (
                            <div className="row">
                                <div className="col-md-5 mb-4">
                                    <h6 className="font-weight-bold mb-3" style={lightTextStyle}>Liste des Séances</h6>
                                    {lessons.length === 0 ? (
                                        <div className="text-center py-5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                            <i className="fas fa-calendar-times fa-2x mb-2 text-muted"></i>
                                            <p className="small m-0" style={mutedTextStyle}>Aucune séance planifiée.</p>
                                        </div>
                                    ) : (
                                        <div className="list-group" style={{ gap: '0.5rem' }}>
                                            {lessons.map((lesson: any) => {
                                                const isSelected = activeLesson?.id === lesson.id || (!activeLesson && lessons[0].id === lesson.id);
                                                const isOnline = lesson.format === 'online';
                                                const activeMeeting = isOnline ? activeMeetings.find((m: any) => m.roomName === lesson.meetingRoomName) : null;
                                                
                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => setActiveLesson(lesson)}
                                                        className="list-group-item list-group-item-action border-0 p-3 text-left rounded d-flex justify-content-between align-items-center"
                                                        style={{
                                                            background: isSelected ? 'var(--btn-soft-bg)' : 'var(--bg-elevated)',
                                                            borderLeft: isSelected ? '4px solid var(--accent)' : '4px solid transparent',
                                                            transition: 'all 0.2s ease',
                                                            borderRadius: '8px'
                                                        }}
                                                    >
                                                        <div>
                                                            <div className="d-flex align-items-center mb-1" style={{ gap: '0.5rem' }}>
                                                                <span className="badge font-weight-bold" style={{
                                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                                    color: 'rgb(99, 102, 241)',
                                                                    fontSize: '0.65rem',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px'
                                                                }}>{lesson.type || 'Séance'}</span>
                                                                <span className="badge font-weight-bold" style={{
                                                                    background: isOnline ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                    color: isOnline ? 'rgb(59, 130, 246)' : 'rgb(245, 158, 11)',
                                                                    fontSize: '0.65rem',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px'
                                                                }}>{isOnline ? 'En ligne' : 'Présentiel'}</span>
                                                                {activeMeeting && (
                                                                    <span className="badge font-weight-bold badge-pulse" style={{
                                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                                        color: 'rgb(239, 68, 68)',
                                                                        fontSize: '0.65rem',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '6px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'rgb(239, 68, 68)', borderRadius: '50%', display: 'inline-block' }}></span>
                                                                        LIVE ACTIF
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="font-weight-bold text-truncate" style={{ ...lightTextStyle, fontSize: '0.9rem', maxWidth: '220px' }}>{lesson.title}</div>
                                                            <small style={{ ...mutedTextStyle, fontSize: '0.75rem' }} className="d-block mt-1">
                                                                <i className="far fa-clock mr-1" />
                                                                {formatSessionDate(lesson.scheduledDate).split(' à ')[0]}
                                                            </small>
                                                        </div>
                                                        <i className="fas fa-chevron-right text-muted" style={{ opacity: 0.5 }} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="col-md-7">
                                    {(() => {
                                        const currentLesson = activeLesson || lessons[0];
                                        if (!currentLesson) {
                                            return (
                                                <div className="text-center py-5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                                    <i className="fas fa-info-circle fa-2x mb-2 text-muted"></i>
                                                    <p className="small m-0" style={mutedTextStyle}>Sélectionnez une séance pour voir les détails.</p>
                                                </div>
                                            );
                                        }
                                        
                                        const isOnline = currentLesson.format === 'online';
                                        const activeMeeting = isOnline ? activeMeetings.find((m: any) => m.roomName === currentLesson.meetingRoomName) : null;
                                        
                                        return (
                                            <div className="p-4 rounded shadow-sm h-100 d-flex flex-column justify-content-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <div className="d-flex align-items-center mb-2" style={{ gap: '0.5rem' }}>
                                                                <span className="badge" style={{
                                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                                    color: 'rgb(99, 102, 241)',
                                                                    fontSize: '0.7rem',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '8px'
                                                                }}>{currentLesson.type || 'Séance'}</span>
                                                                <span className="badge" style={{
                                                                    background: isOnline ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                    color: isOnline ? 'rgb(59, 130, 246)' : 'rgb(245, 158, 11)',
                                                                    fontSize: '0.7rem',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '8px'
                                                                }}>{isOnline ? 'En ligne' : 'Présentiel'}</span>
                                                            </div>
                                                            <h5 className="font-weight-bold mb-1" style={lightTextStyle}>{currentLesson.title}</h5>
                                                        </div>
                                                    </div>
                                                    
                                                    <hr style={{ borderColor: 'var(--border)' }} className="my-3" />
                                                    
                                                    <div className="mb-4" style={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
                                                        <div>
                                                            <label className="x-small font-weight-bold text-muted uppercase d-block mb-1" style={{ letterSpacing: '0.05em' }}>Date et Heure</label>
                                                            <div className="d-flex align-items-center" style={{ ...lightTextStyle, gap: '0.5rem' }}>
                                                                <i className="far fa-calendar-alt text-primary mr-1" />
                                                                <span>{formatSessionDate(currentLesson.scheduledDate, currentLesson.duration)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {currentLesson.objectives && (
                                                            <div>
                                                                <label className="x-small font-weight-bold text-muted uppercase d-block mb-1" style={{ letterSpacing: '0.05em' }}>Objectifs</label>
                                                                <p className="small mb-0" style={{ ...lightTextStyle, whiteSpace: 'pre-line' }}>{currentLesson.objectives}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--border)' }}>
                                                    {isOnline ? (
                                                        activeMeeting ? (
                                                            <div>
                                                                <div className="alert alert-info d-flex align-items-center p-3 mb-3" style={{ borderRadius: '10px', gap: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                                    <i className="fas fa-video text-primary fa-lg" />
                                                                    <div className="small text-primary">
                                                                        <strong>Visioconférence active !</strong> L'enseignant a démarré la séance. Rejoignez le salon de visioconférence maintenant.
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleJoinLive(activeMeeting)}
                                                                    className="btn btn-primary btn-block py-2 font-weight-bold"
                                                                    style={{ borderRadius: '10px', background: 'var(--accent) !important', borderColor: 'var(--accent) !important' }}
                                                                >
                                                                    <i className="fas fa-sign-in-alt mr-2" />Rejoindre le Live
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="alert alert-warning d-flex align-items-center p-3 mb-0" style={{ borderRadius: '10px', gap: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                                <i className="fas fa-clock text-warning fa-lg" />
                                                                <div className="small text-warning">
                                                                    <strong>En attente de l'enseignant.</strong> Le cours commencera dès que le professeur se connectera au salon Live.
                                                                </div>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="d-flex align-items-center p-3" style={{ borderRadius: '10px', gap: '0.75rem', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                                                            <i className="fas fa-map-marker-alt text-primary fa-lg" />
                                                            <div className="small" style={mutedTextStyle}>
                                                                Cette séance se déroulera en présentiel dans votre salle de classe habituelle.
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="row">
                                <div className="col-md-5 mb-4">
                                    <div className="p-4 rounded shadow-sm" style={{ background: 'var(--bg-base)', border: '1px dashed var(--accent)' }}>
                                        <h6 className="font-weight-bold mb-3" style={lightTextStyle}>Scanner un émargement</h6>
                                        <QRScanner studentId={user?.username || ''} onSuccess={fetchData} />
                                    </div>
                                </div>
                                <div className="col-md-7">
                                    <h6 className="font-weight-bold mb-3" style={lightTextStyle}>Mon historique pour ce module</h6>
                                    {attendanceHistory.length === 0 ? (
                                        <div className="text-center py-5 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                            <i className="fas fa-history fa-2x mb-2 text-muted"></i>
                                            <p className="small m-0" style={mutedTextStyle}>Aucun émargement enregistré.</p>
                                        </div>
                                    ) : (
                                        <div className="list-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                            {attendanceHistory.map((h: any, idx: number) => (
                                                <div key={idx} className="list-group-item border-0 p-3 mb-1 d-flex justify-content-between align-items-center" style={{ background: 'var(--bg-elevated)' }}>
                                                    <div className="d-flex align-items-center">
                                                        <div className="mr-3 text-primary">
                                                            <i className="fas fa-check-circle fa-lg"></i>
                                                        </div>
                                                        <div>
                                                            <div className="font-weight-bold x-small" style={lightTextStyle}>{new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                            <div className="text-primary x-small font-weight-bold">PRÉSENT</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <small style={mutedTextStyle} className="d-block x-small">Enseignant</small>
                                                        <small className="font-weight-bold" style={lightTextStyle}>{h.lecturerName || 'Non spécifié'}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </StudentCard>
            </div>

            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <StudentCard className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title font-weight-bold" style={lightTextStyle}>Nouvelle discussion</h5>
                                <button type="button" className="close" style={lightTextStyle} onClick={() => setShowCreateModal(false)}><span>&times;</span></button>
                            </div>
                            <form onSubmit={handleCreateThread}>
                                <div className="modal-body py-4">
                                    <div className="form-group mb-4">
                                        <label style={mutedTextStyle} className="small font-weight-bold">TITRE</label>
                                        <input type="text" className="form-control" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} required value={newThread.title} onChange={(e) => setNewThread({ ...newThread, title: e.target.value })} placeholder="Sujet de votre question" />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label style={mutedTextStyle} className="small font-weight-bold">DESCRIPTION</label>
                                        <textarea className="form-control" style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }} rows={5} required value={newThread.content} onChange={(e) => setNewThread({ ...newThread, content: e.target.value })} placeholder="Détaillez votre problème..."></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button type="button" className="btn btn-link text-muted mr-3" onClick={() => setShowCreateModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary px-5" style={{ borderRadius: "20px" }}>Publier</button>
                                </div>
                            </form>
                        </StudentCard>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {videoModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setVideoModal(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h5 style={{ margin: 0, fontWeight: 700 }}>{videoModal.title}</h5>
                            <button
                                onClick={() => setVideoModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <VideoPlayer url={videoModal.url} autoplay />
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {pdfModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setPdfModal(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            maxWidth: '1000px',
                            width: '100%',
                            maxHeight: '95vh',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h5 style={{ margin: 0, fontWeight: 700 }}>{pdfModal.title}</h5>
                            <button
                                onClick={() => setPdfModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '85vh', overflow: 'auto' }}>
                            <PdfViewer url={pdfModal.url} height="75vh" />
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .assignment-card:hover {
                    border-color: var(--accent) !important;
                    box-shadow: 0 4px 20px var(--accent-light);
                    transform: translateY(-2px);
                }
                .material-card:hover {
                    border-color: var(--accent) !important;
                    box-shadow: 0 4px 16px var(--accent-light);
                    transform: translateY(-1px);
                }
                .forum-thread-row:hover { background: var(--bg-hover) !important; }
            `}</style>
        </div>
        </PageTransition>
    );
};

export default StudentModuleDetail;
