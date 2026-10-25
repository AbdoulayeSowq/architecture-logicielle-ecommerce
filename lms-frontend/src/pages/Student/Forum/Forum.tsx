import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getForumThreadsByModuleId, getModuleById, createForumThread } from "../../../services/api/course";
import { useAuth } from "../../../services/AuthContext";
import { getStudentDetailsByUsername, getLecturerDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { Button } from "../../../components/ui";

const StudentForum = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [threads, setThreads] = useState<any[]>([]);
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newThread, setNewThread] = useState({ title: '', content: '', authorId: '', authorName: '', moduleId: id });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (id) {
                const moduleData = id && id !== 'modules' ? await getModuleById(id) : null;
                setModule(moduleData);
                const threadsData = await getForumThreadsByModuleId(id);
                setThreads(Array.isArray(threadsData) ? threadsData : []);
            }
        } catch (error) {
            console.error("Error fetching forum threads:", error);
            setThreads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            if (user) {
                const role = localStorage.getItem('role');
                let details: any;
                try {
                    if (role === 'STUDENT') details = await getStudentDetailsByUsername(user.username);
                    else if (role === 'LECTURER') details = await getLecturerDetailsByUsername(user.username);
                } catch (e) {}
                setNewThread(prev => ({ ...prev, authorId: user.username, authorName: details?.fullName || user.username }));
            }
        };
        load();
        fetchData();
    }, [id, user]);

    const handleCreateThread = async (e: any) => {
        e.preventDefault();
        try {
            await createForumThread(newThread);
            setShowCreateModal(false);
            setNewThread({ title: '', content: '', authorId: user?.username || '', authorName: newThread.authorName || user?.username || '', moduleId: id });
            fetchData();
        } catch (error) { console.error("Error creating thread:", error); }
    };

    const stripCode = (title: string) => (title || '').replace(/^\[.*?\]\s*/, '');
    const lightText = { color: "var(--text-primary)" };
    const mutedText = { color: "var(--text-secondary)" };
    const inputStyle = { background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "10px" };

    if (loading && !module) return <PageLoading />;

    return (
        <div className="content">
            <div className="container py-5">
                <div className="d-flex align-items-center mb-4" style={{ gap: '1rem' }}>
                    <button
                        onClick={() => navigate(`/student/${id}`, { state: { activeTab: 'forum' } })}
                        className="btn btn-secondary"
                        style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-arrow-left" />
                    </button>
                    <StudentPageHeader
                        title={`Forum · ${stripCode(module?.name || module?.title || '')}`}
                        subtitle="Posez vos questions et échangez avec vos pairs et professeurs"
                        icon="fa-comments"
                    />
                </div>

                <div className="d-flex justify-content-end mb-4">
                    <Button onClick={() => setShowCreateModal(true)} leftIcon={<i className="fas fa-plus"></i>}>
                        Nouvelle discussion
                    </Button>
                </div>

                <StudentCard title="Discussions" icon="fa-stream">
                    {threads.length === 0 ? (
                        <div className="empty-state-box py-5">
                            <i className="fas fa-comments mb-3" />
                            <h4 style={{ ...lightText, fontWeight: 700 }}>Aucune discussion</h4>
                            <p style={mutedText}>Soyez le premier à lancer une discussion sur ce module.</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column">
                            {threads.map((thread: any) => (
                                <Link
                                    key={thread.id}
                                    to={`/student/${id}/forum/thread/${thread.id}`}
                                    className="forum-thread-row p-4 border-bottom text-decoration-none d-flex align-items-start"
                                    style={{ gap: '1rem', transition: 'background 0.2s ease' }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '50%', background: 'var(--btn-soft-bg)',
                                        color: 'var(--btn-soft-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '1rem', flexShrink: 0
                                    }}>
                                        <i className="fas fa-user" />
                                    </div>
                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="d-flex justify-content-between align-items-start mb-1" style={{ gap: '1rem' }}>
                                            <h5 className="mb-0 font-weight-bold text-truncate" style={{ ...lightText, fontSize: '0.95rem' }}>
                                                {thread.title}
                                                {thread.solution && (
                                                    <span className="ml-2 badge" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--success)', fontSize: '0.6rem', padding: '3px 8px', borderRadius: '20px', fontWeight: 700 }}>
                                                        <i className="fas fa-check mr-1" /> Résolu
                                                    </span>
                                                )}
                                            </h5>
                                            <div className="d-flex flex-shrink-0" style={{ gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <span><i className="fas fa-eye mr-2" />{thread.viewCount || 0}</span>
                                                <span><i className="fas fa-thumbs-up mr-2" />{thread.upvoteCount || 0}</span>
                                                <span><i className="fas fa-comment mr-2" />{thread.postCount || 0}</span>
                                            </div>
                                        </div>
                                        <p className="mb-1 small" style={{ ...mutedText, lineHeight: '1.5' }}>
                                            {(thread.content || '').substring(0, 120)}...
                                        </p>
                                        <small style={{ ...mutedText, fontSize: '0.75rem' }}>
                                            Par <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{thread.authorName}</span> · {new Date(thread.createdAt).toLocaleDateString('fr-FR')}
                                        </small>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </StudentCard>
            </div>

            {/* Create Thread Modal */}
            {showCreateModal && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}
                    onClick={() => setShowCreateModal(false)}
                >
                    <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '520px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleCreateThread}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                                    <i className="fas fa-pen mr-2" style={{ color: 'var(--accent)' }} /> Nouvelle discussion
                                </h3>
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)} style={{ fontSize: '1.5rem', padding: '0.25rem' }}>
                                    &times;
                                </Button>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <div className="form-group mb-4">
                                    <label className="small font-weight-bold text-uppercase mb-2 d-block" style={mutedText}>Titre</label>
                                    <input type="text" className="form-control py-3" style={inputStyle} required
                                        value={newThread.title} onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                                        placeholder="Résumez votre question en une ligne" />
                                </div>
                                <div className="form-group mb-0">
                                    <label className="small font-weight-bold text-uppercase mb-2 d-block" style={mutedText}>Message</label>
                                    <textarea className="form-control" rows={5} style={{ ...inputStyle, resize: 'vertical' }} required
                                        value={newThread.content} onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                                        placeholder="Détaillez votre question ou message..." />
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-base)', display: 'flex', gap: '0.75rem' }}>
                                <Button variant="secondary" className="flex-fill" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                                <Button variant="primary" className="flex-fill" type="submit" leftIcon={<i className="fas fa-paper-plane"></i>}>
                                    Publier
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .forum-thread-row:hover { background: var(--bg-hover) !important; }
            `}</style>
        </div>
    );
};

export default StudentForum;
