import React, { useEffect, useState } from "react";
import {
    getMentorRequests,
    updateMentorshipStatus,
} from "../../../services/api/gamification";
import { getModules } from "../../../services/api/course";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { StudentCard } from "../../../components/Student/StudentCard";
import { notifyError } from "../../../components/notify";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    PENDING:   { label: 'En attente', badge: 'badge-warning' },
    ACCEPTED:  { label: 'Accepté',    badge: 'badge-primary' },
    COMPLETED: { label: 'Terminé',    badge: 'badge-success' },
    REJECTED:  { label: 'Refusé',     badge: 'badge-danger' },
    CANCELED:  { label: 'Annulé',     badge: 'badge-secondary' },
};

const LecturerMentorship = () => {
    const [username, setUsername] = useState('');
    const [mentorOf, setMentorOf] = useState<any[]>([]);
    const [modules, setModules]   = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        const uname = stored ? (JSON.parse(stored).username || '') : '';
        setUsername(uname);
        if (!uname) { setLoading(false); return; }

        const loadData = async () => {
            try {
                const [reqs, mods] = await Promise.allSettled([
                    getMentorRequests(uname),
                    getModules()
                ]);

                if (reqs.status === 'fulfilled') setMentorOf(Array.isArray(reqs.value) ? reqs.value : []);
                else setError('Impossible de charger les demandes.');

                if (mods.status === 'fulfilled') setModules(Array.isArray(mods.value) ? mods.value : []);
            } catch (err) {
                console.error(err);
                setError('Une erreur est survenue.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleStatus = async (id: number, status: string) => {
        try {
            await updateMentorshipStatus(id, status);
            const updated = await getMentorRequests(username);
            setMentorOf(Array.isArray(updated) ? updated : []);
        } catch { notifyError('Erreur lors de la mise à jour.'); }
    };

    return (
        <div className="content">
            <div className="container py-4">
                <StudentPageHeader 
                    title="Mentorat & Accompagnement" 
                    subtitle="Gérez les demandes d'aide et le tutorat étudiant"
                    icon="fa-handshake"
                />



                <StudentCard title="Demandes de mentorat" icon="fa-list-ul">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="lms-spinner mx-auto" />
                            <p className="text-muted mt-3">Chargement des dossiers...</p>
                        </div>
                    ) : mentorOf.length === 0 ? (
                        <div className="empty-state-box py-5">
                            <i className="fas fa-user-graduate mb-3" />
                            <h4 className="font-weight-bold">Aucune demande</h4>
                            <p>Vous n'avez pas encore reçu de demandes d'accompagnement pour vos modules.</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column">
                            {mentorOf.map(req => {
                                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                                const mod = modules.find(m => String(m.id) === String(req.moduleId) || String(m.mid) === String(req.moduleId));
                                const moduleName = mod?.name || mod?.title || req.moduleName || req.moduleTitle || `Module #${req.moduleId}`;
                                
                                return (
                                    <div key={req.id} className="p-4 border-bottom d-flex justify-content-between align-items-center flex-wrap" style={{ gap: '1.5rem', transition: 'background 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div className="d-flex align-items-center flex-grow-1" style={{ gap: '1.25rem' }}>
                                            <div className="avatar avatar--md bg-light text-muted">
                                                <i className="fas fa-user" />
                                            </div>
                                            <div>
                                                <div className="d-flex align-items-center mb-1" style={{ gap: '0.75rem' }}>
                                                    <h4 className="m-0 font-weight-bold text-dark" style={{ fontSize: '1.05rem' }}>
                                                        {req.menteeName || req.menteeUsername}
                                                    </h4>
                                                    <span className={`badge ${status.badge} px-2 py-1 text-uppercase`} style={{ fontSize: '0.65rem' }}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="d-flex flex-wrap text-muted small mt-2" style={{ gap: '1rem' }}>
                                                    <span className="bg-light px-2 py-1 rounded">
                                                        <i className="fas fa-book-open mr-1" /> {moduleName}
                                                    </span>
                                                    <span className="bg-light px-2 py-1 rounded">
                                                        <i className="fas fa-calendar-alt mr-1" /> {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center" style={{ gap: '0.75rem' }}>
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <button className="btn btn-primary font-weight-bold" onClick={() => handleStatus(req.id, 'ACCEPTED')}>
                                                        Accepter
                                                    </button>
                                                    <button className="btn btn-outline-danger font-weight-bold" onClick={() => handleStatus(req.id, 'REJECTED')}>
                                                        Refuser
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'ACCEPTED' && (
                                                <button className="btn btn-outline-success font-weight-bold" onClick={() => handleStatus(req.id, 'COMPLETED')}>
                                                    Terminer la mission
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </StudentCard>
        </div>
    </div>
);
};

export default LecturerMentorship;
