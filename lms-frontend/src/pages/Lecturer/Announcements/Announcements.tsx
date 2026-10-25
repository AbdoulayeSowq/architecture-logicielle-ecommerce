import React, { useEffect, useMemo, useRef, useState } from "react";
import { getModulesByLecturer } from "../../../services/api/course";
import {
    listForLecturer,
    createAssignment,
    createEvent,
    deleteAnnouncement,
} from "../../../services/api/announcement";
import { getClasses } from "../../../services/api/university";
import { notifyError } from "../../../components/notify";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { Button, SkeletonList } from "../../../components/ui";
import webSocketService from "../../../services/WebSocketService";

type Module = {
    id: number;
    name: string;
    codeEC: string;
    teachingUnit?: { id: number; code: string; classId: number | null; name: string };
};
type AnnouncementType = 'ASSIGNMENT' | 'EVENT';

const TYPE_BADGE: Record<string, string> = {
    ASSIGNMENT: 'badge-primary',
    EVENT:      'badge-info',
    EXAM:       'badge-primary',
    MAINTENANCE:'badge-secondary',
};
const TYPE_LABEL: Record<string, string> = {
    ASSIGNMENT: 'Devoir', EVENT: 'Séance / Info',
    EXAM: 'Examen', MAINTENANCE: 'Maintenance',
};
const TYPE_ICON: Record<string, string> = {
    ASSIGNMENT: 'far fa-file-alt', EVENT: 'far fa-bell',
    EXAM: 'far fa-clock', MAINTENANCE: 'fas fa-info-circle',
};

const LecturerAnnouncements = () => {
    const [username, setUsername]             = useState('');
    const [modules, setModules]               = useState<Module[]>([]);
    const [announcements, setAnnouncements]   = useState<any[]>([]);
    const [allClasses, setAllClasses]         = useState<any[]>([]);
    const [loading, setLoading]               = useState(true);
    const [showModal, setShowModal]           = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [type, setType]                     = useState<AnnouncementType>('ASSIGNMENT');
    const [message, setMessage]               = useState('');
    const [dueDate, setDueDate]               = useState('');
    const [eventDate, setEventDate]           = useState('');
    const [eventTime, setEventTime]           = useState('');
    const [eventLocation, setEventLocation]   = useState('');
    const [submitting, setSubmitting]         = useState(false);
    
    // Search and filters
    const [searchTerm, setSearchTerm]         = useState('');
    const [filterType, setFilterType]         = useState('ALL');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try { const u = JSON.parse(stored); setUsername(u.username || u.email || ''); }
            catch { /* noop */ }
        }
    }, []);

    useEffect(() => { if (username) fetchAll(); }, [username]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [mods, classesResp] = await Promise.all([
                getModulesByLecturer(username).catch(() => []),
                getClasses().catch(() => []),
            ]);
            
            const lecturerModules = Array.isArray(mods) ? mods : [];
            setModules(lecturerModules);
            setAllClasses(Array.isArray(classesResp) ? classesResp : []);

            const classIds = new Set<string>();
            const courseCodes = new Set<string>();
            lecturerModules.forEach((m: any) => {
                if (m.teachingUnit?.classId) classIds.add(String(m.teachingUnit.classId));
                if (m.teachingUnit?.code) courseCodes.add(m.teachingUnit.code);
            });

            const anns = await listForLecturer(Array.from(classIds), Array.from(courseCodes), username).catch(() => []);
            setAnnouncements(Array.isArray(anns) ? anns : []);
        } finally { setLoading(false); }
    };

    const myScope = useMemo(() => {
        const classIds = new Set<string>();
        const courseCodes = new Set<string>();
        modules.forEach(m => {
            if (m.teachingUnit?.classId) classIds.add(String(m.teachingUnit.classId));
            if (m.teachingUnit?.code) courseCodes.add(m.teachingUnit.code);
        });
        return { classIds, courseCodes };
    }, [modules]);
    const myScopeRef = useRef(myScope);
    useEffect(() => { myScopeRef.current = myScope; }, [myScope]);

    /* Temps réel: nouvelle annonce via STOMP */
    useEffect(() => {
        const topicId = 'announcements-lecturer';
        webSocketService.subscribeTopic(topicId, '/topic/announcements', (a: any) => {
            const audience: string = (a.targetAudience || '').toUpperCase();
            const { classIds, courseCodes } = myScopeRef.current;
            const isRelevant =
                audience === 'ALL' ||
                audience === 'LECTURERS' ||
                (audience === 'CLASS'  && classIds.has(String(a.targetId))) ||
                (audience === 'COURSE' && courseCodes.has(String(a.targetId)));
            if (!isRelevant) return;
            setAnnouncements(prev => prev.some(x => x.id === a.id) ? prev : [a, ...prev]);
        });
        return () => webSocketService.unsubscribeTopic(topicId);
    }, []);

    const myAnnouncements = useMemo(() =>
        announcements
            .filter((a: any) => {
                if (filterType !== 'ALL' && a.type !== filterType) return false;
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    const titleMatch = (a.title || '').toLowerCase().includes(term);
                    const descMatch = (a.description || '').toLowerCase().includes(term);
                    return titleMatch || descMatch;
                }
                return true;
            })
            .sort((a: any, b: any) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()),
    [announcements, filterType, searchTerm]);

    const selectedModule = modules.find(m => String(m.id) === selectedModuleId);

    const resetForm = () => {
        setSelectedModuleId(''); setType('ASSIGNMENT'); setMessage('');
        setDueDate(''); setEventDate(''); setEventTime(''); setEventLocation('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule || !selectedModule.teachingUnit?.classId || !message.trim()) {
            notifyError('Veuillez remplir tous les champs requis'); return;
        }
        setSubmitting(true);
        try {
            const title = selectedModule.name;
            if (type === 'ASSIGNMENT') {
                await createAssignment({
                    title, description: message, type: 'ASSIGNMENT', targetAudience: 'CLASS',
                    targetId: String(selectedModule.teachingUnit.classId),
                    assignmentCourseCode: selectedModule.teachingUnit.code,
                    assignmentDueDate: dueDate || null,
                    assignmentInstructions: message, assignmentInstructor: username,
                });
            } else {
                await createEvent({
                    title, description: message, type: 'EVENT', targetAudience: 'CLASS',
                    targetId: String(selectedModule.teachingUnit.classId),
                    eventDate: eventDate || null, eventTime: eventTime || null,
                    eventLocation: eventLocation || null, eventOrganizer: username,
                });
            }
            setShowModal(false); resetForm(); await fetchAll();
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Supprimer cette annonce ?')) return;
        await deleteAnnouncement(String(id)); await fetchAll();
    };

    const classLabelForTargetId = (targetId: string) => {
        const cls = allClasses.find((c: any) => String(c.id) === String(targetId));
        if (cls && cls.name) return cls.name;
        
        const mod = modules.find(m => String(m.teachingUnit?.classId) === String(targetId));
        return mod?.teachingUnit?.name || `Classe #${targetId}`;
    };



    return (
        <div className="content">
            <div className="container py-2">
                <StudentPageHeader
                    title="Communication & Annonces"
                    subtitle="Informez vos étudiants en temps réel"
                    icon="fa-bullhorn"
                    actions={
                        <Button
                            size="sm"
                            onClick={() => { resetForm(); setShowModal(true); }}
                            disabled={modules.length === 0}
                            leftIcon={<i className="fas fa-plus" />}
                        >
                            Publier une annonce
                        </Button>
                    }
                />

                {/* Filters and Search Bar */}
                <div className="row mb-4">
                    <div className="col-md-7 mb-2 mb-md-0">
                        <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
                            {['ALL', 'ASSIGNMENT', 'EVENT'].map(f => (
                                <Button
                                    key={f}
                                    size="sm"
                                    variant={filterType === f ? 'primary' : 'outline'}
                                    onClick={() => setFilterType(f)}
                                    style={{ borderRadius: '20px' }}
                                >
                                    {f === 'ALL' ? 'Toutes les annonces' : TYPE_LABEL[f] || f}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '8px 0 0 8px', borderColor: 'var(--border)' }}>
                                    <i className="fas fa-search text-muted"></i>
                                </span>
                            </div>
                            <input 
                                type="text" 
                                className="form-control border-left-0" 
                                placeholder="Rechercher par titre, contenu..." 
                                style={{ borderRadius: '0 8px 8px 0', borderColor: 'var(--border)', boxShadow: 'none' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Feed */}
                <div className="card shadow-sm mb-4 border-0">
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 font-weight-bold">
                            <i className="fas fa-history mr-2 text-muted" />Fil d'actualité
                        </h5>
                        <span className="badge badge-light" style={{ color: 'var(--text-secondary)' }}>{myAnnouncements.length} annonce(s)</span>
                    </div>

                    {loading ? (
                        <SkeletonList count={5} />
                    ) : myAnnouncements.length === 0 ? (
                        <div className="empty-state-box m-3">
                            <i className="fas fa-bullhorn" />
                            <p>Aucune annonce publiée. Partagez des informations avec vos étudiants.</p>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush">
                            {myAnnouncements.map((a: any) => {
                                const badgeClass = TYPE_BADGE[a.type] || 'badge-secondary';
                                const label      = TYPE_LABEL[a.type] || a.type;
                                const icon       = TYPE_ICON[a.type]  || 'fas fa-info';
                                const mine       = a.assignmentInstructor === username || a.eventOrganizer === username;
                                const targetLabel = a.targetAudience === 'CLASS' ? classLabelForTargetId(a.targetId) : a.targetAudience;
                                const cleanTitle = (a.title || '').replace(/^(Devoir|Info|Examen|Maintenance|ASSIGNMENT|EVENT)\s*—\s*/i, '');
                                return (
                                    <div key={a.id} className="list-group-item d-flex align-items-start border-0 border-bottom py-4">
                                        <div className="mr-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '10px', background: a.type === 'ASSIGNMENT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)' }}>
                                            <i className={`${icon}`} style={{ color: a.type === 'ASSIGNMENT' ? 'var(--accent)' : '#6b7280', fontSize: '1.2rem' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="d-flex align-items-center justify-content-between flex-wrap mb-1" style={{ gap: 8 }}>
                                                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                                                    <strong className="mb-0 font-weight-bold" style={{ fontSize: "1.05rem", color: 'var(--text-primary)' }}>{cleanTitle}</strong>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                        {label}
                                                    </span>
                                                </div>
                                                <small className="text-muted">
                                                    {a.createdDate ? (() => {
                                                        const d = new Date(a.createdDate);
                                                        return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}`;
                                                    })() : ''}
                                                </small>
                                            </div>
                                            {a.description && <p className="mb-2 mt-2 text-dark">{a.description}</p>}
                                            <div className="d-flex flex-wrap align-items-center" style={{ gap: '8px 16px' }}>
                                                <small className="text-muted"><i className="fas fa-users mr-1" />{targetLabel}</small>
                                                {a.assignmentDueDate && <small className="text-danger"><i className="far fa-calendar mr-1" />Échéance : {new Date(a.assignmentDueDate).toLocaleDateString('fr-FR')}</small>}
                                                {a.eventDate && <small className="text-muted font-weight-bold"><i className="far fa-calendar mr-1" />{new Date(a.eventDate).toLocaleDateString('fr-FR')}{a.eventTime ? ` à ${a.eventTime}` : ''}</small>}
                                                {a.eventLocation && <small className="text-muted"><i className="fas fa-map-marker-alt mr-1" />{a.eventLocation}</small>}
                                                {/* Le bouton supprimer a été retiré conformément aux règles d'audit */}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div
                        className="fade show d-flex align-items-center justify-content-center" 
                        style={{ 
                            backgroundColor: 'rgba(0,0,0,0.6)', 
                            position: 'fixed', 
                            inset: 0, 
                            zIndex: 1050,
                            backdropFilter: 'blur(4px)'
                        }}
                        onClick={() => !submitting && setShowModal(false)}
                    >
                        <div 
                            className="shadow-lg border-0" 
                            style={{ 
                                width: '100%', 
                                maxWidth: 550, 
                                borderRadius: '20px',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                overflow: 'hidden'
                            }} 
                            onClick={e => e.stopPropagation()}
                        >
                            <form onSubmit={handleSubmit}>
                                <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ background: 'rgba(37, 99, 235, 0.05)' }}>
                                    <h5 className="font-weight-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                        <i className="fas fa-bullhorn mr-2 text-primary"></i> Nouvelle Annonce
                                    </h5>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowModal(false)}
                                        leftIcon={<i className="fas fa-times" />}
                                        style={{ fontSize: '1.2rem', padding: '0.5rem' }}
                                    />
                                </div>
                                <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    <div className="form-group mb-4">
                                        <label className="small font-weight-bold text-uppercase text-muted mb-2">Choisir le module</label>
                                        <select 
                                            className="form-control" 
                                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: '50px', borderRadius: '10px' }}
                                            value={selectedModuleId} 
                                            onChange={e => setSelectedModuleId(e.target.value)} 
                                            required
                                        >
                                            <option value="">— Choisir un module —</option>
                                            {modules.map(m => (
                                                <option key={m.id} value={m.id} disabled={!m.teachingUnit?.classId}>
                                                    {m.name} ({m.codeEC})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="small font-weight-bold text-uppercase text-muted mb-2">Type de publication</label>
                                        <div className="d-flex" style={{ gap: 12 }}>
                                            {(['ASSIGNMENT', 'EVENT'] as AnnouncementType[]).map(t => (
                                                <Button
                                                    key={t}
                                                    variant={type === t ? 'primary' : 'outline'}
                                                    className="flex-fill font-weight-bold"
                                                    onClick={() => setType(t)}
                                                    leftIcon={<i className={TYPE_ICON[t]} />}
                                                >
                                                    {TYPE_LABEL[t]}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="small font-weight-bold text-uppercase text-muted mb-2">Message / Consignes</label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '10px', padding: '15px' }}
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            required
                                            placeholder={type === 'ASSIGNMENT' ? "Instructions pour le devoir..." : "Détails de l'annonce..."}
                                        />
                                    </div>

                                    {type === 'ASSIGNMENT' ? (
                                        <div className="form-group mb-0">
                                            <label className="small font-weight-bold text-uppercase text-muted mb-2">Date d'échéance</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: '50px', borderRadius: '10px' }}
                                                value={dueDate}
                                                onChange={e => setDueDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    ) : (
                                        <div className="row">
                                            <div className="col-6 form-group mb-3">
                                                <label className="small font-weight-bold text-uppercase text-muted mb-2">Date</label>
                                                <input type="date" className="form-control" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: '50px', borderRadius: '10px' }} value={eventDate} onChange={e => setEventDate(e.target.value)} />
                                            </div>
                                            <div className="col-6 form-group mb-3">
                                                <label className="small font-weight-bold text-uppercase text-muted mb-2">Heure</label>
                                                <input type="time" className="form-control" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: '50px', borderRadius: '10px' }} value={eventTime} onChange={e => setEventTime(e.target.value)} />
                                            </div>
                                            <div className="col-12 form-group mb-0">
                                                <label className="small font-weight-bold text-uppercase text-muted mb-2">Lieu ou Lien de réunion</label>
                                                <input type="text" className="form-control" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', height: '50px', borderRadius: '10px' }} value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Ex: Salle A102 ou lien Zoom" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-top d-flex" style={{ gap: 15, background: 'rgba(37, 99, 235, 0.02)' }}>
                                    <Button variant="secondary" className="flex-fill font-weight-bold" onClick={() => setShowModal(false)}>Annuler</Button>
                                    <Button variant="primary" className="flex-fill font-weight-bold" type="submit" loading={submitting}>
                                        Publier l'annonce
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    </div>
);
};

export default LecturerAnnouncements;
