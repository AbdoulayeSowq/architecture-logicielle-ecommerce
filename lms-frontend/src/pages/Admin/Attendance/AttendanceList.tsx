import React, { useEffect, useMemo, useState } from 'react';
import { getAttendanceSessions } from '../../../services/api/course';
import api from '../../../services/api/api';
import PageLoading from '../../../components/Admin/PageLoading';
import { toast } from 'react-toastify';
import { getLecturerDetailsByUsername } from '../../../services/api/user';

const normalizeClassName = (name: string) => {
    return (name || '').toLowerCase().replace(/[-_\s]/g, '');
};

// Derive a readable class label from classCode, e.g. "DIC1GIT3441" -> "DIC1 GIT"
const classCodeToLabel = (code: string): string => {
    if (!code) return '';
    const stripped = code.replace(/\d+$/, ''); // remove trailing digits: DIC1GIT3441 -> DIC1GIT
    // Insert space before the department suffix (e.g. GIT, GI)
    const match = stripped.match(/^([A-Z]+\d+)([A-Z]+)$/);
    if (match) return `${match[1]} ${match[2]}`;
    return stripped;
};

const AdminAttendanceList = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [sessionReport, setSessionReport] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [role, setRole] = useState<string>('');
    const [myRoleConstraints, setMyRoleConstraints] = useState<{
        role: string;
        deptCode: string;
        classNames: string[];
    }>({ role: '', deptCode: '', classNames: [] });
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedModule, setSelectedModule] = useState<string>('');

    useEffect(() => {
        const activeRole = localStorage.getItem('role') || '';
        setRole(activeRole);
        const stored = localStorage.getItem('user');
        const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';

        if (activeRole === 'CHEF_DEPT' || activeRole === 'RESP_PEDAGO') {
            getLecturerDetailsByUsername(uname).then((me: any) => {
                if (me) {
                    setMyRoleConstraints({
                        role: activeRole,
                        deptCode: me.supervisedDepartmentCode || '',
                        classNames: (me.supervisedClassName || '').split(',').map((c: string) => c.trim().toLowerCase()).filter(Boolean),
                    });
                }
            }).catch(() => {});
        }
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await getAttendanceSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (session: any) => {
        setSelectedSession(session);
        setLoadingReport(true);
        try {
            // On transmet la date de la séance pour récupérer le bon rapport (même dans le passé)
            const response = await api.get(`/course/attendance/report/${session.moduleId}?date=${session.date}`);
            setSessionReport(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération du rapport");
        } finally {
            setLoadingReport(false);
        }
    };

    const allowedSessions = useMemo(() => {
        let base = sessions;

        if (myRoleConstraints.role === 'CHEF_DEPT' && myRoleConstraints.deptCode) {
            const code = myRoleConstraints.deptCode.toLowerCase().trim();
            base = base.filter((s: any) => {
                // Try classCode first (e.g. "DIC1GIT3441" contains dept code "git")
                const normCode = normalizeClassName(s.classCode || '');
                if (normCode && normCode.includes(code)) return true;
                // Fallback: level suffix matching
                const name = (s.level || '').toLowerCase().trim();
                let suffix = '';
                if (name.includes('-')) {
                    suffix = name.substring(name.lastIndexOf('-') + 1).trim();
                } else if (name.includes(' ')) {
                    suffix = name.substring(name.lastIndexOf(' ') + 1).trim();
                } else {
                    return name.endsWith(code);
                }
                return suffix === code || code.includes(suffix) || suffix.includes(code);
            });
        } else if (myRoleConstraints.role === 'RESP_PEDAGO') {
            const targets = (myRoleConstraints.classNames || []).map(normalizeClassName);
            if (targets.length === 0) {
                base = [];
            } else {
                base = base.filter((s: any) => {
                    // Use classCode for reliable matching:
                    // classCode="DIC1GIT3441" normalized="dic1git3441"
                    // target="dic1git" => startsWith match => true
                    const normCode = normalizeClassName(s.classCode || '');
                    if (normCode) {
                        return targets.some((t: string) => normCode.startsWith(t) || t.startsWith(normCode));
                    }
                    // Fallback to level if classCode not available
                    const normLevel = normalizeClassName(s.level || '');
                    return targets.some((t: string) => normLevel === t || t.startsWith(normLevel) || normLevel.startsWith(t));
                });
            }
        }

        return base;
    }, [sessions, myRoleConstraints]);

    // Classes uniques présentes dans les sessions autorisées
    // Prefer classCode-derived label (e.g. "DIC1 GIT") over raw level ("DIC1")
    const uniqueClasses = useMemo(() => {
        const map = new Map<string, string>(); // key=normalized classCode or level, value=display label
        allowedSessions.forEach(s => {
            if (s.classCode) {
                const label = classCodeToLabel(s.classCode);
                if (label) map.set(s.classCode, label);
            } else if (s.level) {
                map.set(s.level.toUpperCase(), s.level.toUpperCase());
            }
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [allowedSessions]);

    // Modules uniques de la classe sélectionnée
    const uniqueModules = useMemo(() => {
        const set = new Set<string>();
        allowedSessions.forEach(s => {
            const sessionClassKey = s.classCode || (s.level ? s.level.toUpperCase() : '');
            const matchesClass = !selectedClass || sessionClassKey === selectedClass;
            if (s.moduleName && matchesClass) set.add(s.moduleName);
        });
        return Array.from(set).sort();
    }, [allowedSessions, selectedClass]);

    const filteredSessions = useMemo(() => {
        return allowedSessions.filter(s => {
            const sessionClassKey = s.classCode || (s.level ? s.level.toUpperCase() : '');
            const matchesClass = !selectedClass || sessionClassKey === selectedClass;
            const matchesModule = !selectedModule || (s.moduleName && s.moduleName === selectedModule);
            const matchesSearch = !searchTerm || 
                (s.moduleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.lecturerName || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesClass && matchesModule && matchesSearch;
        });
    }, [allowedSessions, selectedClass, selectedModule, searchTerm]);

    if (loading) return <PageLoading />;

    return (
        <div className="content">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="font-weight-bold m-0" style={{ color: 'var(--text-primary)' }}>
                        <i className="fas fa-clipboard-check text-primary mr-2"></i>
                        Historique des Séances d'Émargement
                    </h4>
                    <div className="input-group" style={{ maxWidth: '300px' }}>
                        <input 
                            type="text" 
                            className="form-control rounded-pill" 
                            placeholder="Rechercher un module..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {!selectedSession && (
                    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', background: 'var(--bg-card)' }}>
                        <div className="card-body p-4">
                            {/* Class Filtering Row */}
                            <div className="mb-4">
                                <label className="text-muted small font-weight-bold text-uppercase d-block mb-3">
                                    <i className="fas fa-graduation-cap mr-2"></i>Filtrer par Classe
                                </label>
                                <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
                                    <button 
                                        className={`btn btn-sm rounded-pill px-4 py-2 font-weight-bold transition-all ${!selectedClass ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                        onClick={() => { setSelectedClass(''); setSelectedModule(''); }}
                                    >
                                        Toutes les classes
                                    </button>
                                    {uniqueClasses.map(([key, label]) => (
                                        <button 
                                            key={key}
                                            className={`btn btn-sm rounded-pill px-4 py-2 font-weight-bold transition-all ${selectedClass === key ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                            onClick={() => { setSelectedClass(key); setSelectedModule(''); }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Module Filtering Row */}
                            <div>
                                <label className="text-muted small font-weight-bold text-uppercase d-block mb-3">
                                    <i className="fas fa-book mr-2"></i>Filtrer par Module
                                </label>
                                <div className="d-flex flex-wrap" style={{ gap: '0.5rem' }}>
                                    <button 
                                        className={`btn btn-sm rounded-pill px-4 py-2 font-weight-bold transition-all ${!selectedModule ? 'btn-secondary shadow-sm' : 'btn-outline-secondary'}`}
                                        onClick={() => setSelectedModule('')}
                                    >
                                        Tous les modules
                                    </button>
                                    {uniqueModules.map(mod => (
                                        <button 
                                            key={mod}
                                            className={`btn btn-sm rounded-pill px-4 py-2 font-weight-bold transition-all ${selectedModule === mod ? 'btn-secondary shadow-sm' : 'btn-outline-secondary'}`}
                                            onClick={() => setSelectedModule(mod)}
                                        >
                                            {mod}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!selectedSession ? (
                    <div className="row">
                        {filteredSessions.length === 0 ? (
                            <div className="col-12 text-center py-5">
                                <i className="fas fa-calendar-times fa-3x mb-3 text-muted"></i>
                                <p className="text-muted">Aucune séance d'émargement enregistrée.</p>
                            </div>
                        ) : (
                            filteredSessions.map((s, idx) => (
                                <div key={idx} className="col-md-6 col-lg-4 mb-4">
                                    <div 
                                        className="card h-100 shadow-sm border-0 session-card" 
                                        style={{ borderRadius: '15px', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => handleViewDetails(s)}
                                    >
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="badge badge-pill badge-primary px-3 py-1">{s.classCode ? classCodeToLabel(s.classCode) : (s.level || '')}</div>
                                                <div className="text-muted small">
                                                    <i className="far fa-calendar-alt mr-1"></i>
                                                    {new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <h5 className="font-weight-bold mb-1" style={{ color: 'var(--text-primary)' }}>{s.moduleName}</h5>
                                            <p className="text-muted small mb-4">
                                                <i className="fas fa-chalkboard-teacher mr-2"></i>
                                                {s.lecturerName || 'Enseignant non spécifié'}
                                            </p>
                                            
                                            <div className="d-flex align-items-center justify-content-between mt-auto">
                                                <div className="d-flex align-items-center">
                                                    <div className="mr-3">
                                                        <div className="h5 font-weight-bold mb-0 text-success">{s.presentCount}</div>
                                                        <div className="x-small text-muted uppercase">Présents</div>
                                                    </div>
                                                    <div className="border-left pl-3">
                                                        <div className="h5 font-weight-bold mb-0 text-danger">{s.absentCount}</div>
                                                        <div className="x-small text-muted uppercase">Absents</div>
                                                    </div>
                                                </div>
                                                <div className="text-primary font-weight-bold small">
                                                    Détails <i className="fas fa-chevron-right ml-1"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="animate__animated animate__fadeIn">
                        <button className="btn btn-link text-muted mb-4 p-0" onClick={() => setSelectedSession(null)}>
                            <i className="fas fa-arrow-left mr-2"></i> Retour à la liste
                        </button>

                        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', background: 'var(--bg-elevated)' }}>
                            <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h4 className="font-weight-bold mb-1">{selectedSession.moduleName}</h4>
                                    <p className="text-muted m-0">Séance du {new Date(selectedSession.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                <span className="badge badge-pill badge-primary px-4 py-2">{selectedSession.classCode ? classCodeToLabel(selectedSession.classCode) : (selectedSession.level || '')}</span>
                                </div>
                            </div>
                        </div>

                        {loadingReport ? <PageLoading /> : (
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '15px' }}>
                                        <div className="card-header bg-white border-0 py-3">
                                            <h6 className="font-weight-bold m-0 text-primary">
                                                <i className="fas fa-check-circle mr-2"></i>
                                                Liste des Présents ({sessionReport?.present?.length || 0})
                                            </h6>
                                        </div>
                                        <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <ul className="list-group list-group-flush">
                                                {sessionReport?.present?.map((s: any) => (
                                                    <li key={s.username} className="list-group-item d-flex align-items-center py-3">
                                                        <div className="avatar-circle mr-3" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                                                            {s.fullName[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-weight-bold small">{s.fullName}</div>
                                                            <div className="text-muted x-small">@{s.username}</div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '15px' }}>
                                        <div className="card-header bg-white border-0 py-3">
                                            <h6 className="font-weight-bold m-0 text-danger">
                                                <i className="fas fa-times-circle mr-2"></i>
                                                Liste des Absents ({sessionReport?.absent?.length || 0})
                                            </h6>
                                        </div>
                                        <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <ul className="list-group list-group-flush">
                                                {sessionReport?.absent?.map((s: any) => (
                                                    <li key={s.username} className="list-group-item d-flex align-items-center py-3">
                                                        <div className="avatar-circle mr-3" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                                                            {s.fullName[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-weight-bold small">{s.fullName}</div>
                                                            <div className="text-muted x-small">@{s.username}</div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <style>{`
                .session-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                    border: 1px solid var(--accent) !important;
                }
                .avatar-circle {
                    width: 36px; height: 36px; border-radius: 50%;
                    display: flex; alignItems: center; justifyContent: center;
                    font-size: 0.9rem; font-weight: bold;
                    flex-shrink: 0;
                    margin-top: 5px;
                    margin-bottom: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .success-soft { background: rgba(40, 167, 69, 0.1); color: #28a745; }
                .danger-soft { background: rgba(220, 53, 69, 0.1); color: #dc3545; }
            `}</style>
        </div>
    );
};

export default AdminAttendanceList;
