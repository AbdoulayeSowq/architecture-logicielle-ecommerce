import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMenteeRequests, getMentorRequests, requestMentorship, updateMentorshipStatus } from "../../../services/api/gamification";
import { getModulesByStudent, getStudentsByModule, getModules } from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { StudentTabNav } from "../../../components/Student/StudentTabNav";
import PageLoading from "../../../components/Admin/PageLoading";
import { Button } from "../../../components/ui";
import { notifyError } from "../../../components/notify";

const STATUS_COLORS: Record<string, string> = {
    PENDING:   '#ffaf00',
    ACCEPTED:  'var(--accent)',
    COMPLETED: 'var(--success)',
    REJECTED:  '#ef4444',
    CANCELLED: '#ef4444',
};

const formatChatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Aujourd'hui à ${timeStr}`;
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Hier à ${timeStr}`;
    
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` à ${timeStr}`;
};

const Mentorship = () => {
    const [username, setUsername] = useState('');
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [mentorOf, setMentorOf] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
    const [form, setForm] = useState({ mentorUsername: '', moduleId: '', mentorRole: 'LECTURER' });
    const [sending, setSending] = useState(false);
    const [formMsg, setFormMsg] = useState('');
    const [studentModules, setStudentModules] = useState<any[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [moduleStudents, setModuleStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const timeout = setTimeout(() => {
            if (isMounted) setLoading(false);
        }, 8000); // 8 seconds for safety

        const loadInitialData = async () => {
            try {
                const stored = localStorage.getItem('user');
                if (!stored) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const user = JSON.parse(stored);
                const uname = user.username || user.email || '';
                if (isMounted) setUsername(uname);

                // Fetch student details to get courseId and intake
                const student = await getStudentDetailsByUsername(uname);
                if (!student) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const [sent, received, stdMods, all] = await Promise.allSettled([
                    getMenteeRequests(uname),
                    getMentorRequests(uname),
                    getModulesByStudent(uname),
                    getModules()
                ]);

                if (!isMounted) return;

                if (sent.status === 'fulfilled') {
                    const data = Array.isArray(sent.value) ? sent.value : [];
                    setMyRequests(data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
                }
                if (received.status === 'fulfilled') {
                    const data = Array.isArray(received.value) ? received.value : [];
                    setMentorOf(data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
                }
                if (stdMods.status === 'fulfilled') setStudentModules(Array.isArray(stdMods.value) ? stdMods.value : []);
                if (all.status === 'fulfilled') setAllModules(Array.isArray(all.value) ? all.value : []);
                
            } catch (err) {
                console.error("Mentorship load error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    clearTimeout(timeout);
                }
            }
        };

        loadInitialData();
        return () => { 
            isMounted = false; 
            clearTimeout(timeout);
        };
    }, []);

    const moduleMap = useMemo(() => {
        const map: Record<string, any> = {};
        (allModules || []).forEach((m: any) => { map[String(m.id)] = m; });
        return map;
    }, [allModules]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.moduleId) { setFormMsg('Veuillez sélectionner un module.'); return; }
        if (!form.mentorUsername) { setFormMsg('Veuillez sélectionner un mentor.'); return; }
        
        setSending(true); setFormMsg('');
        try {
            await requestMentorship({ 
                mentorUsername: form.mentorUsername, 
                menteeUsername: username, 
                moduleId: Number(form.moduleId), 
                mentorRole: form.mentorRole 
            });
            setFormMsg('✅ Demande envoyée !');
            setForm({ mentorUsername: '', moduleId: '', mentorRole: 'LECTURER' });
            const updated = await getMenteeRequests(username);
            const data = Array.isArray(updated) ? updated : [];
            setMyRequests(data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
        } catch (err) { 
            setFormMsg('❌ Erreur lors de l\'envoi.'); 
        } finally { 
            setSending(false); 
        }
    };

    const applyModuleAndRole = async (moduleId: string, role: string) => {
        setModuleStudents([]);
        if (!moduleId) return;
        const selectedModule = (studentModules || []).find((m: any) => String(m.id) === String(moduleId));
        if (!selectedModule) return;

        if (role === 'LECTURER') {
            setForm(p => ({ ...p, mentorUsername: selectedModule.lecturerUsername || '' }));
        } else if (role === 'STUDENT') {
            setLoadingStudents(true);
            try {
                const students = await getStudentsByModule(moduleId);
                setModuleStudents(Array.isArray(students) ? students.filter((s: any) => s.username !== username) : []);
            } catch (e) { 
                console.error(e); 
            } finally { 
                setLoadingStudents(false); 
            }
        }
    };

    const handleStatus = async (id: number, status: string) => {
        try { 
            await updateMentorshipStatus(id, status); 
            const updated = await getMentorRequests(username); 
            const data = Array.isArray(updated) ? updated : [];
            setMentorOf(data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())); 
        } catch {
            notifyError('Erreur lors de la mise à jour du statut.');
        }
    };

    const inputStyle = { background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "8px" };
    const mutedTextStyle = { color: "var(--text-secondary)" };
    const lightTextStyle = { color: "var(--text-primary)" };

    if (loading && myRequests.length === 0 && mentorOf.length === 0) return <PageLoading />;

    const currentList = activeTab === 'sent' ? myRequests : mentorOf;

    return (
        <div className="content">
            <div className="container py-4">
                <StudentPageHeader title="Mentorat" subtitle="Entraidez-vous pour progresser ensemble." icon="fa-handshake">
                    <Link to="/student" className="btn btn-outline-secondary px-4" style={{ borderRadius: "8px" }}>Retour</Link>
                </StudentPageHeader>

                <div className="row">
                    <div className="col-md-5 mb-4">
                        <StudentCard>
                            <div className="card-header p-3 border-0" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <h6 className="m-0 font-weight-bold" style={lightTextStyle}>Nouvelle demande</h6>
                            </div>
                            <form onSubmit={handleSend} className="card-body p-4">
                                <div className="form-group mb-4">
                                    <label style={mutedTextStyle} className="small font-weight-bold">MODULE</label>
                                    <select className="form-control" style={inputStyle} value={form.moduleId} 
                                        onChange={e => { 
                                            const modId = e.target.value;
                                            setForm(prev => ({ ...prev, moduleId: modId, mentorUsername: '' })); 
                                            applyModuleAndRole(modId, form.mentorRole); 
                                        }}>
                                        <option value="">Sélectionner un module</option>
                                        {(studentModules || []).map((m: any) => (
                                            <option key={m.id} value={m.id}>{m.name || m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group mb-4">
                                    <label style={mutedTextStyle} className="small font-weight-bold">TYPE DE MENTOR</label>
                                    <select className="form-control" style={inputStyle} value={form.mentorRole} 
                                        onChange={e => { 
                                            const role = e.target.value;
                                            setForm(prev => ({ ...prev, mentorRole: role, mentorUsername: '' })); 
                                            applyModuleAndRole(form.moduleId, role); 
                                        }}>
                                        <option value="LECTURER">Professeur</option>
                                        <option value="STUDENT">Étudiant</option>
                                    </select>
                                </div>
                                {form.moduleId && (
                                    <div className="form-group mb-4">
                                        <label style={mutedTextStyle} className="small font-weight-bold">CHOISIR LE MENTOR</label>
                                        {form.mentorRole === 'LECTURER' ? (
                                            <input type="text" className="form-control" style={{ ...inputStyle, opacity: 0.6 }} readOnly value={form.mentorUsername || 'Aucun professeur assigné'} />
                                        ) : (
                                            <select className="form-control" style={inputStyle} value={form.mentorUsername} onChange={e => setForm(prev => ({ ...prev, mentorUsername: e.target.value }))}>
                                                <option value="">{loadingStudents ? 'Chargement...' : 'Sélectionner un étudiant'}</option>
                                                {(moduleStudents || []).map((s: any) => (
                                                    <option key={s.username || s.id} value={s.username}>{s.firstName} {s.lastName} ({s.username})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}
                                {formMsg && <div className={`alert py-2 small ${formMsg.includes('✅') ? 'alert-success' : 'alert-danger'}`}>{formMsg}</div>}
                                <Button type="submit" className="btn-block" disabled={sending || !form.moduleId || !form.mentorUsername} loading={sending}>
                                    Envoyer la demande
                                </Button>
                            </form>
                        </StudentCard>
                    </div>

                    <div className="col-md-7">
                        <StudentCard className="border-0">
                            <StudentTabNav 
                                activeTab={activeTab}
                                onChange={(id: any) => setActiveTab(id)}
                                tabs={[
                                    { id: 'sent', label: `Mes demandes (${(myRequests || []).length})` },
                                    { id: 'received', label: `Je suis mentor (${(mentorOf || []).length})` }
                                ]}
                            />
                            <div className="card-body p-4" style={{ maxHeight: "600px", overflowY: "auto" }}>
                                {(currentList || []).length === 0 ? (
                                    <div className="text-center py-5 text-muted small">Aucune demande trouvée.</div>
                                ) : (
                                    (currentList || []).map((r: any) => {
                                        const statusColor = STATUS_COLORS[r.status] || 'var(--text-secondary)';
                                        const mod = allModules.find((m: any) => String(m.id) === String(r.moduleId) || String(m.mid) === String(r.moduleId));
                                        const mName = mod?.name || mod?.title || r.moduleName || r.moduleTitle || `Module #${r.moduleId}`;
                                        return (
                                            <div key={r.id} className="p-4 mb-3 rounded" style={{ background: "var(--bg-elevated)", border: `1px solid var(--border)`, borderLeft: `4px solid ${statusColor}` }}>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h6 className="m-0 font-weight-bold" style={lightTextStyle}>
                                                        {activeTab === 'sent' ? (r.mentorName || r.mentorUsername) : (r.menteeName || r.menteeUsername)}
                                                    </h6>
                                                    <span className="badge px-2 py-1" style={{ background: `${statusColor}15`, color: statusColor, fontSize: "0.65rem", borderRadius: "5px" }}>{r.status}</span>
                                                </div>
                                                <div style={mutedTextStyle} className="small">
                                                    <div className="mb-1"><i className="fas fa-book mr-2"></i>{mName}</div>
                                                    <div className="mb-1"><i className="fas fa-user-tag mr-2"></i>{r.mentorRole === 'LECTURER' ? 'Professeur' : 'Étudiant'}</div>
                                                    <div className="font-italic" style={{ opacity: 0.8 }}><i className="far fa-clock mr-2"></i>{formatChatDate(r.createdAt)}</div>
                                                </div>
                                                {activeTab === 'received' && r.status === 'PENDING' && (
                                                    <div className="mt-3 d-flex gap-2">
                                                        <Button size="sm" variant="primary" onClick={() => handleStatus(r.id, 'ACCEPTED')}>Accepter</Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleStatus(r.id, 'REJECTED')}>Refuser</Button>
                                                    </div>
                                                )}
                                                {activeTab === 'received' && r.status === 'ACCEPTED' && (
                                                    <div className="mt-3">
                                                        <Button size="sm" variant="primary" onClick={() => handleStatus(r.id, 'COMPLETED')}>Terminer</Button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </StudentCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mentorship;
