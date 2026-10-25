import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClassById, updateClass } from "../../../../services/api/university";
import { getTeachingUnitsByClassId, getModulesByTeachingUnit } from "../../../../services/api/course";
import { SaveButton } from "../../../../components/Admin/ButtonIndicator";
import PageLoading from "../../../../components/Admin/PageLoading";
import { getLecturers } from "../../../../services/api/user";
import { StudentCard } from "../../../../components/Student/StudentCard";
import { Button } from "../../../../components/ui";

type ModuleStatus = 'completed' | 'in_progress' | 'not_started';

const computeModuleStatus = (m: any): ModuleStatus => {
    if (m.isValidated) return 'completed';
    const total = m.totalCH || 0;
    const done = m.completedHours || 0;
    if (total > 0 && done >= total) return 'completed';
    if (done > 0) return 'in_progress';
    const now = Date.now();
    const start = m.startDate ? new Date(m.startDate).getTime() : null;
    const end = m.endDate ? new Date(m.endDate).getTime() : null;
    if (end && now > end) return 'completed';
    if (start && now >= start) return 'in_progress';
    return 'not_started';
};

const computeModuleProgress = (m: any): number => {
    if (m.isValidated) return 100;
    const total = m.totalCH || 0;
    const done = m.completedHours || 0;
    if (total > 0) return Math.min(100, Math.round((done / total) * 100));
    const start = m.startDate ? new Date(m.startDate).getTime() : null;
    const end = m.endDate ? new Date(m.endDate).getTime() : null;
    const now = Date.now();
    if (!start || !end) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
};

const STATUS_CONFIG: Record<ModuleStatus, { label: string; badge: string }> = {
    completed:   { label: 'Terminé',    badge: 'badge-primary' },
    in_progress: { label: 'En cours',   badge: 'badge-warning' },
    not_started: { label: 'À venir',    badge: 'badge-secondary' },
};

const ClassDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [classData, setClassData] = useState<any>({ id: '', clid: '', name: '', description: '', createdDate: '' });
    const [teachingUnits, setTeachingUnits] = useState<any[]>([]);
    const [modulesByUE, setModulesByUE] = useState<Record<string, any[]>>({});
    const [modulesLoading, setModulesLoading] = useState(true);
    const [lecturersMap, setLecturersMap] = useState<Record<string, string>>({});
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [selectedRespPedago, setSelectedRespPedago] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'modules' | 'details'>('modules');

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        getLecturers().then(data => {
            if (Array.isArray(data)) {
                const map: Record<string, string> = {};
                data.forEach(l => {
                    const rawName = `${l.firstName || ''} ${l.lastName || ''}`.trim() || l.username;
                    map[l.username] = rawName.replace(/\s*\(Prof\)$/i, '')
                                            .replace(/\s*\(Etudiant\)$/i, '')
                                            .replace(/^Admin:\s*/i, '')
                                            .trim();
                });
                setLecturersMap(map);
                setLecturers(data);
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!id) return;
        getClassById(id).then((data) => {
            setClassData(data);
            setLoading(false);
        });
    }, [id]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setModulesLoading(true);
            try {
                const tus = await getTeachingUnitsByClassId(id);
                const tusList = Array.isArray(tus) ? tus : [];
                if (cancelled) return;
                setTeachingUnits(tusList);
                const moduleEntries = await Promise.all(
                    tusList.map(async (tu: any) => {
                        const mods = await getModulesByTeachingUnit(tu.id);
                        return [String(tu.id), Array.isArray(mods) ? mods : []] as [string, any[]];
                    })
                );
                if (cancelled) return;
                setModulesByUE(Object.fromEntries(moduleEntries));
            } finally {
                if (!cancelled) setModulesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClassData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleAssignRespPedago = async () => {
        if (!selectedRespPedago) return;
        setIsSaving(true);
        try {
            await fetch(`/api/user/lecturer/${selectedRespPedago}/supervised-class`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supervisedClassName: classData.name })
            });
            alert('Responsable Pédagogique assigné avec succès');
            setSelectedRespPedago('');
        } catch (error) {
            console.error('Error assigning responsible pedagogical:', error);
            alert('Erreur lors de l\'assignation');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (id) await updateClass(id, classData);
        setTimeout(() => setIsSaving(false), 800);
    };

    const allModules = useMemo(() => Object.values(modulesByUE).flat(), [modulesByUE]);

    const stats = useMemo(() => {
        let completed = 0, inProgress = 0, notStarted = 0;
        let totalCH = 0, totalCredits = 0;
        allModules.forEach((m: any) => {
            const s = computeModuleStatus(m);
            if (s === 'completed') completed++;
            else if (s === 'in_progress') inProgress++;
            else notStarted++;
            totalCH += m.totalCH || 0;
            totalCredits += m.creditsEC || 0;
        });
        const total = allModules.length;
        const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, inProgress, notStarted, totalCH, totalCredits, progressPct };
    }, [allModules]);

    if (loading) return <PageLoading />;

    return (
        <div className="content">
            <div className="container-fluid py-4">
                {/* Header Card */}
                <div className="card mb-4">
                    <div className="card-body d-flex flex-wrap justify-content-between align-items-center" style={{ gap: '2rem' }}>
                        <div className="d-flex align-items-center" style={{ gap: '1.5rem' }}>
                            <Button variant="secondary" onClick={() => window.history.back()}>
                                <i className="fas fa-arrow-left" />
                            </Button>
                            <div>
                                <h2 className="mb-0 font-weight-bold" style={{ fontSize: '1.75rem' }}>{classData.name}</h2>
                                {classData.department && (
                                    <div className="text-muted small font-weight-bold mt-1 d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                        <i className="fas fa-building" /> {classData.department.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ minWidth: '240px' }}>
                            <div className="d-flex justify-content-between align-items-end mb-2">
                                <div>
                                    <div className="small font-weight-bold text-muted text-uppercase">Progression</div>
                                    <div className="font-weight-bold" style={{ fontSize: '1.25rem' }}>{stats.progressPct}% complété</div>
                                </div>
                                <div className="small font-weight-bold text-primary">{stats.completed} / {stats.total} modules</div>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${stats.progressPct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="row mb-4">
                    {[
                        { label: 'Modules',    val: stats.total,        icon: 'fa-layer-group'  },
                        { label: 'Terminés',   val: stats.completed,    icon: 'fa-check-circle' },
                        { label: 'En cours',   val: stats.inProgress,   icon: 'fa-spinner'      },
                        { label: 'Unités (UE)',val: teachingUnits.length,icon: 'fa-book'        },
                        { label: 'Crédits',    val: stats.totalCredits, icon: 'fa-award'        }
                    ].map((s, i) => (
                        <div className="col" key={i} style={{ minWidth: 160, marginBottom: '1rem' }}>
                            <div className="stat-card">
                                <div className="stat-card__icon"><i className={`fas ${s.icon}`} /></div>
                                <div>
                                    <p className="stat-card__value">{s.val}</p>
                                    <p className="stat-card__label">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button
                            className={`nav-link font-weight-bold border-0 bg-transparent ${activeTab === 'modules' ? 'active' : ''}`}
                            onClick={() => setActiveTab('modules')}
                            style={{ borderBottom: activeTab === 'modules' ? '3px solid var(--accent)' : '3px solid transparent', color: activeTab === 'modules' ? 'var(--accent)' : 'var(--text-secondary)' }}
                        >
                            Modules & Avancement
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link font-weight-bold border-0 bg-transparent ${activeTab === 'details' ? 'active' : ''}`}
                            onClick={() => setActiveTab('details')}
                            style={{ borderBottom: activeTab === 'details' ? '3px solid var(--accent)' : '3px solid transparent', color: activeTab === 'details' ? 'var(--accent)' : 'var(--text-secondary)' }}
                        >
                            Informations Générales
                        </button>
                    </li>
                </ul>

                {/* Content */}
                {activeTab === 'modules' ? (
                    <div>
                        {modulesLoading ? (
                            <div className="text-center py-5">
                                <div className="lms-spinner mx-auto" />
                                <p className="text-muted mt-3">Analyse du curriculum...</p>
                            </div>
                        ) : (
                            teachingUnits.map(tu => {
                                const modules = modulesByUE[String(tu.id)] || [];
                                return (
                                    <div key={tu.id} className="table-card mb-4">
                                        <div className="table-card__header d-flex flex-wrap align-items-center justify-content-between" style={{ gap: '1rem' }}>
                                            <h5 className="table-card__title m-0">
                                                <i className="fas fa-book mr-2" />
                                                {tu.codeUE} — {tu.name}
                                            </h5>
                                            <div className="d-flex text-muted small font-weight-bold" style={{ gap: '1rem' }}>
                                                <span><i className="fas fa-calendar-alt mr-1" />{tu.semester || 'Semestre non défini'}</span>
                                                <span><i className="fas fa-award mr-1" />{tu.creditsUE} Crédits</span>
                                                <span><i className="fas fa-layer-group mr-1" />{modules.length} Modules</span>
                                            </div>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th>Code</th>
                                                        <th>Module</th>
                                                        <th>Enseignant</th>
                                                        <th className="text-center">Volume (H)</th>
                                                        <th>Statut</th>
                                                        <th style={{ width: '180px' }}>Avancement</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {modules.map(m => {
                                                        const status = computeModuleStatus(m);
                                                        const pct = computeModuleProgress(m);
                                                        const cfg = STATUS_CONFIG[status];
                                                        return (
                                                            <tr key={m.id}>
                                                                <td className="align-middle"><code className="badge badge-light">{m.codeEC}</code></td>
                                                                <td className="align-middle">
                                                                    <Link to={`/admin/university/module/${m.id}/details`} className="font-weight-bold text-dark">{m.name}</Link>
                                                                </td>
                                                                <td className="align-middle small">
                                                                    {m.lecturerUsername ? (
                                                                        <><i className="fas fa-user-tie text-muted mr-1" />{m.lecturerFullName || lecturersMap[m.lecturerUsername] || m.lecturerUsername}</>
                                                                    ) : (
                                                                        <span className="text-muted">Non assigné</span>
                                                                    )}
                                                                </td>
                                                                <td className="align-middle text-center small">
                                                                    <span className="font-weight-bold">{m.totalCH || 0}h</span>
                                                                    <span className="d-block text-muted">{m.cmHours}/{m.tdHours}/{m.tpHours}</span>
                                                                </td>
                                                                <td className="align-middle">
                                                                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                                                                </td>
                                                                <td className="align-middle">
                                                                    <div className="d-flex align-items-center" style={{ gap: '0.75rem' }}>
                                                                        <div className="progress-track flex-grow-1 m-0">
                                                                            <div className={`progress-fill bg-${cfg.badge.split('-')[1]}`} style={{ width: `${pct}%` }} />
                                                                        </div>
                                                                        <span className="small font-weight-bold" style={{ width: '30px' }}>{pct}%</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-md-8">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0"><i className="fas fa-edit mr-2 text-muted" /> Édition de la classe</h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleUpdate}>
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label className="text-muted small font-weight-bold text-uppercase">Identifiant Système</label>
                                                <input className="form-control" value={classData.clid || ''} disabled />
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label className="text-muted small font-weight-bold text-uppercase">Date de création</label>
                                                <input className="form-control" value={classData.createdDate ? new Date(classData.createdDate).toLocaleString() : ''} disabled />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="text-muted small font-weight-bold text-uppercase">Nom de la classe</label>
                                            <input className="form-control" name="name" value={classData.name || ''} onChange={handleChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-muted small font-weight-bold text-uppercase">Description / Notes</label>
                                            <textarea className="form-control" name="description" value={classData.description || ''} onChange={handleChange} rows={4} />
                                        </div>
                                        {role === 'CHEF_DEPT' && (
                                            <div className="form-group mt-4 pt-3 border-top">
                                                <label className="text-muted small font-weight-bold text-uppercase">Assigner Responsable Pédagogique</label>
                                                <div className="d-flex" style={{ gap: '0.5rem' }}>
                                                    <select
                                                        className="form-control"
                                                        value={selectedRespPedago}
                                                        onChange={(e) => setSelectedRespPedago(e.target.value)}
                                                    >
                                                        <option value="">Sélectionner un enseignant...</option>
                                                        {lecturers.map((l: any) => (
                                                            <option key={l.username} value={l.username}>
                                                                {l.firstName} {l.lastName} ({l.username})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={handleAssignRespPedago}
                                                        disabled={!selectedRespPedago || isSaving}
                                                    >
                                                        {isSaving ? 'Assignation...' : 'Assigner'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="d-flex mt-4 pt-3 border-top" style={{ gap: '1rem' }}>
                                            <SaveButton isSaving={isSaving} onClick={handleUpdate} />
                                            <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>Annuler</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassDetails;
