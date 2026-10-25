import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getForumThreadById, createForumPost, upvoteThread, upvotePost } from "../../../services/api/course";
import { useAuth } from "../../../services/AuthContext";
import { getStudentDetailsByUsername, getLecturerDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";

const ThreadDetails = () => {
    const { id, threadId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [thread, setThread] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fullName, setFullName] = useState('');

    const fetchThread = async () => {
        setLoading(true);
        try {
            if (threadId) {
                const threadData = await getForumThreadById(threadId, user.username);
                setThread(threadData);
            }
        } catch (error) { console.error("Error fetching thread:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchThread();
        fetchCurrentUserFullName();
    }, [threadId]);

    const fetchCurrentUserFullName = async () => {
        if (!user?.username) return;
        try {
            const role = localStorage.getItem('role');
            let details: any;
            if (role === 'ROLE_STUDENT') details = await getStudentDetailsByUsername(user.username);
            else if (role === 'ROLE_LECTURER') details = await getLecturerDetailsByUsername(user.username);
            setFullName(details?.fullName || user.username);
        } catch (e) { setFullName(user.username); }
    };

    const handleReply = async (e: any) => {
        e.preventDefault();
        if (!newPost.trim() || !user || !thread) return;
        setSubmitting(true);
        try {
            await createForumPost({ content: newPost, authorId: user.username, authorName: fullName || user.username, threadId: thread.id, parentPostId: null });
            setNewPost('');
            fetchThread();
        } catch (error) { console.error("Error creating post:", error); }
        finally { setSubmitting(false); }
    };

    const handleUpvoteThread = async () => {
        if (user && thread) { try { await upvoteThread(thread.id.toString(), user.username); fetchThread(); } catch (error) { console.error(error); } }
    };

    const handleUpvotePost = async (postId: number) => {
        if (user) { try { await upvotePost(postId.toString(), user.username); fetchThread(); } catch (error) { console.error(error); } }
    };

    if (loading) return <PageLoading />;

    const isLecturer = localStorage.getItem('role') === 'ROLE_LECTURER';
    const backUrl = isLecturer ? `/lecturer/${id}` : `/student/${id}`;
    const lightText = { color: "var(--text-primary)" };
    const mutedText = { color: "var(--text-secondary)" };
    const inputStyle = { background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "10px" };

    const getInitials = (name: string) => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 1);

    return (
        <div className="content">
            <div className="container py-5">
                {/* Header */}
                <div className="d-flex align-items-start mb-5" style={{ gap: '1rem' }}>
                    <button
                        onClick={() => navigate(backUrl, { state: { activeTab: 'forum' } })}
                        className="btn btn-secondary flex-shrink-0"
                        style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '6px' }}
                    >
                        <i className="fas fa-arrow-left" />
                    </button>
                    <StudentPageHeader
                        title={thread?.title}
                        subtitle={`Discussion · par ${thread?.authorName} · ${thread?.createdAt ? new Date(thread.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}`}
                        icon="fa-comments"
                    />
                </div>

                {/* Original Post */}
                <StudentCard className="mb-4 border-0" style={{ borderLeft: '4px solid var(--accent) !important' }}>
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="d-flex align-items-center" style={{ gap: '0.75rem' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%', background: 'var(--btn-soft-bg)',
                                    color: 'var(--btn-soft-text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.95rem', flexShrink: 0
                                }}>
                                    {getInitials(thread?.authorName || '')}
                                </div>
                                <div>
                                    <div className="font-weight-bold" style={lightText}>{thread?.authorName}</div>
                                    <div className="small" style={mutedText}>{thread?.createdAt && new Date(thread.createdAt).toLocaleString('fr-FR')}</div>
                                </div>
                            </div>
                            <button
                                className="btn btn-soft-primary btn-sm font-weight-bold px-3"
                                style={{ borderRadius: '20px' }}
                                onClick={handleUpvoteThread}
                            >
                                <i className="fas fa-thumbs-up mr-2" />{thread?.upvoteCount || 0}
                            </button>
                        </div>
                        <div className="p-4 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                            {thread?.content}
                        </div>
                        {thread?.tag && (
                            <div className="mt-3">
                                <span className="badge px-3 py-1" style={{ background: 'var(--btn-soft-bg)', color: 'var(--btn-soft-text)', borderRadius: '20px', fontSize: '0.7rem' }}>
                                    <i className="fas fa-tag mr-1" /> {thread.tag}
                                </span>
                            </div>
                        )}
                    </div>
                </StudentCard>

                {/* Replies Header */}
                <div className="d-flex align-items-center mb-4" style={{ gap: '0.75rem' }}>
                    <h5 className="m-0 font-weight-bold" style={lightText}>
                        <i className="fas fa-comments mr-2" style={{ color: 'var(--accent)' }} />
                        Réponses ({thread?.posts?.length || 0})
                    </h5>
                </div>

                {/* Posts / Replies */}
                <div className="mb-5">
                    {thread?.posts && thread.posts.filter((post: any) => !post.parentPostId).length > 0 ? (
                        <div className="d-flex flex-column" style={{ gap: '1rem' }}>
                            {thread.posts.filter((post: any) => !post.parentPostId).map((post: any) => (
                                <StudentCard key={post.id} className="border-0">
                                    <div className="card-body p-4">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center" style={{ gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-elevated)',
                                                    color: 'var(--text-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
                                                }}>
                                                    {getInitials(post.authorName)}
                                                </div>
                                                <div>
                                                    <div className="font-weight-bold small" style={lightText}>{post.authorName}</div>
                                                    <div className="small" style={{ ...mutedText, fontSize: '0.7rem' }}>{post.createdAt && new Date(post.createdAt).toLocaleString('fr-FR')}</div>
                                                </div>
                                            </div>
                                            <button className="btn btn-link p-0 text-decoration-none small font-weight-bold" style={{ color: 'var(--accent)' }} onClick={() => handleUpvotePost(post.id)}>
                                                <i className="fas fa-thumbs-up mr-1" />{post.upvoteCount || 0}
                                            </button>
                                        </div>
                                        <p className="mb-3" style={{ ...lightText, lineHeight: '1.6', fontSize: '0.9rem' }}>{post.content}</p>

                                        {/* Sub-replies */}
                                        {post.replies && post.replies.length > 0 && (
                                            <div className="mt-3 pl-4" style={{ borderLeft: '3px solid var(--border)' }}>
                                                {post.replies.map((reply: any) => (
                                                    <div key={reply.id} className="mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--border)' }}>
                                                        <div className="d-flex align-items-center mb-1" style={{ gap: '0.5rem' }}>
                                                            <strong className="small" style={lightText}>{reply.authorName}</strong>
                                                            <small style={{ ...mutedText, fontSize: '0.7rem' }}>{reply.createdAt && new Date(reply.createdAt).toLocaleString('fr-FR')}</small>
                                                        </div>
                                                        <p className="mb-0 small" style={{ ...mutedText, lineHeight: '1.5' }}>{reply.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </StudentCard>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-box py-5">
                            <i className="fas fa-comment-dots mb-3" />
                            <p className="font-weight-bold" style={mutedText}>Soyez le premier à répondre à cette discussion.</p>
                        </div>
                    )}
                </div>

                {/* Reply Form */}
                <StudentCard className="border-0">
                    <div className="card-body p-4">
                        <h5 className="font-weight-bold mb-4" style={lightText}>
                            <i className="fas fa-reply mr-2" style={{ color: 'var(--accent)' }} /> Ajouter une réponse
                        </h5>
                        <form onSubmit={handleReply}>
                            <div className="form-group mb-4">
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    style={{ ...inputStyle, lineHeight: '1.6', resize: 'vertical' }}
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    placeholder="Rédigez une réponse claire et constructive..."
                                    required
                                />
                            </div>
                            <div className="d-flex justify-content-end">
                                <button type="submit" className="btn btn-primary font-weight-bold px-5" style={{ borderRadius: '10px' }} disabled={submitting}>
                                    {submitting
                                        ? <><i className="fas fa-spinner fa-spin mr-2" />Envoi en cours...</>
                                        : <><i className="fas fa-paper-plane mr-2" />Publier ma réponse</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </StudentCard>
            </div>
        </div>
    );
};

export default ThreadDetails;
