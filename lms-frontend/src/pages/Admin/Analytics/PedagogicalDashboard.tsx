import React, { useState, useEffect, useMemo } from 'react';
import { getAttendanceSessions, getAtRiskStudents } from '../../../services/api/course';
import { useAuth } from '../../../services/AuthContext';
import { getLecturerDetailsByUsername } from '../../../services/api/user';

// Normalize class name for matching
const normalizeClassName = (name: string): string => {
    return (name || '').toLowerCase().replace(/[-_\s]/g, '');
};

// Derive a readable class label from classCode
const classCodeToLabel = (code: string): string => {
    if (!code) return '';
    const stripped = code.replace(/\d+$/, '');
    const match = stripped.match(/^([A-Z]+\d+)([A-Z]+)$/);
    if (match) return `${match[1]} ${match[2]}`;
    return stripped;
};

const PedagogicalDashboard: React.FC = () => {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
    const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [lecturerInfo, setLecturerInfo] = useState<any>(null);

    // Load lecturer details to get supervised classes/dept
    useEffect(() => {
        if (user?.username) {
            getLecturerDetailsByUsername(user.username).then(setLecturerInfo).catch(() => null);
        }
    }, [user?.username]);

    // Get role constraints
    const myRoleConstraints = useMemo(() => {
        const currentRole = role === 'CHEF_DEPT' ? 'CHEF_DEPT' : role === 'RESP_PEDAGO' ? 'RESP_PEDAGO' : null;
        if (!currentRole) return { role: null, deptCode: null, supervisedClasses: [] };

        if (currentRole === 'CHEF_DEPT') {
            let deptCode = (lecturerInfo?.supervisedDepartmentCode || '').trim();
            if (!deptCode) {
                const dept = (lecturerInfo?.department || '');
                if (dept.includes('(') && dept.includes(')')) {
                    deptCode = dept.substring(dept.indexOf('(') + 1, dept.indexOf(')')).trim();
                } else {
                    deptCode = dept.trim();
                }
            }
            return { role: currentRole, deptCode: deptCode.toLowerCase(), supervisedClasses: [] };
        }

        if (currentRole === 'RESP_PEDAGO') {
            const supervisedClasses = (lecturerInfo?.supervisedClassName || '')
                .split(',')
                .map((c: string) => c.trim())
                .filter((c: string) => c);
            return { role: currentRole, deptCode: null, supervisedClasses };
        }

        return { role: null, deptCode: null, supervisedClasses: [] };
    }, [role, lecturerInfo]);

    // Load sessions + at-risk data
    useEffect(() => {
        loadData();
    }, [myRoleConstraints]);

    const loadData = async () => {
        setLoading(true);
        try {
            const sessions = await getAttendanceSessions();
            setAttendanceSessions(sessions || []);

            if (user?.username) {
                const risk = await getAtRiskStudents(user.username).catch(() => []);
                setAtRiskStudents(risk || []);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter attendance sessions based on role constraints
    const filteredSessions = useMemo(() => {
        let base = attendanceSessions;
        
        if (myRoleConstraints.role === 'CHEF_DEPT' && myRoleConstraints.deptCode) {
            const code = myRoleConstraints.deptCode.toLowerCase().trim();
            base = base.filter((s: any) => {
                const normCode = normalizeClassName(s.classCode || '');
                if (normCode && normCode.includes(code)) return true;
                return false;
            });
        }
        
        if (myRoleConstraints.role === 'RESP_PEDAGO' && myRoleConstraints.supervisedClasses.length > 0) {
            const targets = myRoleConstraints.supervisedClasses.map(normalizeClassName);
            base = base.filter((s: any) => {
                const normCode = normalizeClassName(s.classCode || '');
                if (normCode) {
                    return targets.some((t: string) => normCode.startsWith(t) || t.startsWith(normCode));
                }
                return false;
            });
        }
        
        return base;
    }, [attendanceSessions, myRoleConstraints]);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const totalSessions = filteredSessions.length;
        const totalPresent = filteredSessions.reduce((sum, s) => sum + (s.presentCount || 0), 0);
        const totalAbsent = filteredSessions.reduce((sum, s) => sum + (s.absentCount || 0), 0);
        const totalStudents = totalPresent + totalAbsent;
        const attendanceRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : '0';
        
        const atRiskCount = atRiskStudents.length;
        
        // Get unique modules
        const uniqueModules = new Set(filteredSessions.map(s => s.moduleName));
        
        return {
            attendanceRate,
            atRiskCount,
            totalSessions,
            activeModules: uniqueModules.size
        };
    }, [filteredSessions, atRiskStudents]);

    // Get unique classes from filtered sessions
    const uniqueClasses = useMemo(() => {
        const map = new Map<string, string>();
        filteredSessions.forEach(s => {
            if (s.classCode) {
                const label = classCodeToLabel(s.classCode);
                if (label) map.set(s.classCode, label);
            }
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [filteredSessions]);

    // Get unique modules for selected class
    const uniqueModules = useMemo(() => {
        const set = new Set<string>();
        filteredSessions.forEach(s => {
            const sessionClassKey = s.classCode || '';
            const matchesClass = !selectedClass || sessionClassKey === selectedClass;
            if (s.moduleName && matchesClass) set.add(s.moduleName);
        });
        return Array.from(set).sort();
    }, [filteredSessions, selectedClass]);

    // Filter sessions by class and module
    const displaySessions = useMemo(() => {
        return filteredSessions.filter(s => {
            const sessionClassKey = s.classCode || '';
            const matchesClass = !selectedClass || sessionClassKey === selectedClass;
            const matchesModule = !selectedModule || (s.moduleName && s.moduleName === selectedModule);
            return matchesClass && matchesModule;
        });
    }, [filteredSessions, selectedClass, selectedModule]);

    const attendanceRateNum = parseFloat(kpis.attendanceRate);
    const attendanceColor = attendanceRateNum >= 75 ? '#16a34a' : attendanceRateNum >= 50 ? '#d97706' : '#dc2626';
    const attendanceBg = attendanceRateNum >= 75 ? 'rgba(22,163,74,0.08)' : attendanceRateNum >= 50 ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)';
    const attendanceBorder = attendanceRateNum >= 75 ? '#16a34a' : attendanceRateNum >= 50 ? '#d97706' : '#dc2626';

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="text-muted small">Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4 px-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                        Analytics
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                        {myRoleConstraints.role === 'RESP_PEDAGO'
                            ? `Responsable Pédagogique · ${myRoleConstraints.supervisedClasses.join(', ') || 'Aucune classe assignée'}`
                            : `Chef de Département · ${myRoleConstraints.deptCode?.toUpperCase() || ''}`}
                    </p>
                </div>
                <button onClick={loadData} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" style={{ borderRadius: '8px' }}>
                    <i className="fas fa-sync-alt" style={{ fontSize: '0.75rem' }}></i>
                    Actualiser
                </button>
            </div>

            {/* KPI Cards — Premium Design */}
            <div className="row g-3 mb-4">
                {/* Taux de présence */}
                <div className="col-6 col-lg-3">
                    <div style={{
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '14px',
                        padding: '20px 22px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
                        borderTop: `3px solid ${attendanceBorder}`,
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 16, right: 16, background: attendanceBg, borderRadius: '8px', padding: '6px 8px' }}>
                            <i className="fas fa-user-check" style={{ color: attendanceColor, fontSize: '0.9rem' }}></i>
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
                            Présence Moy.
                        </p>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: attendanceColor, lineHeight: 1, marginBottom: '6px' }}>
                            {kpis.attendanceRate}%
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                            sur {kpis.totalSessions} séances
                        </p>
                    </div>
                </div>

                {/* Étudiants à risque */}
                <div className="col-6 col-lg-3">
                    <div style={{
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '14px',
                        padding: '20px 22px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
                        borderTop: `3px solid ${kpis.atRiskCount > 0 ? '#ef4444' : '#10b981'}`,
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 16, right: 16, background: kpis.atRiskCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '6px 8px' }}>
                            <i className={`fas ${kpis.atRiskCount > 0 ? 'fa-exclamation-triangle' : 'fa-shield-alt'}`} style={{ color: kpis.atRiskCount > 0 ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}></i>
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
                            Alertes Actives
                        </p>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: kpis.atRiskCount > 0 ? '#ef4444' : '#10b981', lineHeight: 1, marginBottom: '6px' }}>
                            {kpis.atRiskCount}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                            {kpis.atRiskCount === 0 ? 'Aucun risque détecté' : 'étudiant(s) à surveiller'}
                        </p>
                    </div>
                </div>

                {/* Séances réalisées */}
                <div className="col-6 col-lg-3">
                    <div style={{
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '14px',
                        padding: '20px 22px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
                        borderTop: '3px solid #6366f1',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(99,102,241,0.08)', borderRadius: '8px', padding: '6px 8px' }}>
                            <i className="fas fa-calendar-check" style={{ color: '#6366f1', fontSize: '0.9rem' }}></i>
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
                            Séances
                        </p>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', lineHeight: 1, marginBottom: '6px' }}>
                            {kpis.totalSessions}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                            avec émargement
                        </p>
                    </div>
                </div>

                {/* Modules actifs */}
                <div className="col-6 col-lg-3">
                    <div style={{
                        background: 'var(--bg-card, #fff)',
                        borderRadius: '14px',
                        padding: '20px 22px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
                        borderTop: '3px solid #0ea5e9',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(14,165,233,0.08)', borderRadius: '8px', padding: '6px 8px' }}>
                            <i className="fas fa-book-open" style={{ color: '#0ea5e9', fontSize: '0.9rem' }}></i>
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
                            Modules
                        </p>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9', lineHeight: 1, marginBottom: '6px' }}>
                            {kpis.activeModules}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                            {uniqueClasses.length} classe{uniqueClasses.length > 1 ? 's' : ''} suivie{uniqueClasses.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Early Warning System */}
            <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border, #f0f0f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '8px', padding: '5px 8px' }}>
                            <i className="fas fa-bell" style={{ color: '#f59e0b', fontSize: '0.85rem' }}></i>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            Early Warning System
                        </span>
                    </div>
                    {atRiskStudents.length > 0 && (
                        <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px' }}>
                            {atRiskStudents.length} alerte{atRiskStudents.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div style={{ padding: '16px 22px' }}>
                    {atRiskStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '1.4rem' }}></i>
                            </div>
                            <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0, fontSize: '0.875rem' }}>
                                Aucun étudiant à risque détecté
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border, #f0f0f0)' }}>
                                        <th style={{ fontWeight: 600, color: 'var(--text-muted, #6b7280)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', border: 0 }}>Étudiant</th>
                                        <th style={{ fontWeight: 600, color: 'var(--text-muted, #6b7280)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', border: 0 }}>Classe</th>
                                        <th style={{ fontWeight: 600, color: 'var(--text-muted, #6b7280)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', border: 0 }}>Risque</th>
                                        <th style={{ fontWeight: 600, color: 'var(--text-muted, #6b7280)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', border: 0 }}>Motifs</th>
                                        <th style={{ border: 0 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atRiskStudents.map((student, index) => {
                                        const score = student.riskScore || 0;
                                        const riskColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
                                        const riskBg = score >= 70 ? '#fee2e2' : score >= 40 ? '#fef3c7' : '#d1fae5';
                                        const riskLabel = score >= 70 ? 'Élevé' : score >= 40 ? 'Modéré' : 'Faible';
                                        const initials = (student.fullName || student.username || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--border, #f5f5f5)' }}>
                                                <td style={{ padding: '12px 8px 12px 0' }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>{initials}</span>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{student.fullName || student.username}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9ca3af)' }}>{student.username}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ background: 'var(--bg-hover, #f3f4f6)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                                                        {student.level || '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span style={{ background: riskBg, color: riskColor, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                                                            {riskLabel}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', fontWeight: 500 }}>{score}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ maxWidth: '240px' }}>
                                                    {student.reasons?.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {student.reasons.slice(0, 2).map((reason: string, i: number) => (
                                                                <span key={i} style={{ background: 'var(--bg-hover, #f3f4f6)', color: 'var(--text-secondary)', fontSize: '0.7rem', padding: '2px 7px', borderRadius: '5px' }}>
                                                                    {reason}
                                                                </span>
                                                            ))}
                                                            {student.reasons.length > 2 && (
                                                                <span style={{ background: 'var(--bg-hover, #f3f4f6)', color: 'var(--text-muted, #6b7280)', fontSize: '0.7rem', padding: '2px 7px', borderRadius: '5px' }}>
                                                                    +{student.reasons.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : <span style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '0.8rem' }}>—</span>}
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm" style={{ borderRadius: '8px', fontSize: '0.75rem', padding: '4px 12px', background: 'transparent', border: '1px solid var(--border, #e5e7eb)', color: 'var(--text-secondary)' }}>
                                                        <i className="fas fa-paper-plane me-1" style={{ fontSize: '0.65rem' }}></i>
                                                        Message
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Attendance tracking by class & module */}
            <div style={{ background: 'var(--bg-card, #fff)', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border, #f0f0f0)' }}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: '8px', padding: '5px 8px' }}>
                                <i className="fas fa-chart-bar" style={{ color: '#6366f1', fontSize: '0.85rem' }}></i>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                Suivi Assiduité
                            </span>
                        </div>
                        {/* Class tabs */}
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                onClick={() => { setSelectedClass(''); setSelectedModule(''); }}
                                style={{
                                    fontSize: '0.78rem', fontWeight: 600, padding: '5px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: !selectedClass ? '#6366f1' : 'var(--bg-hover, #f3f4f6)',
                                    color: !selectedClass ? '#fff' : 'var(--text-secondary)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                Toutes
                            </button>
                            {uniqueClasses.map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => { setSelectedClass(key); setSelectedModule(''); }}
                                    style={{
                                        fontSize: '0.78rem', fontWeight: 600, padding: '5px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        background: selectedClass === key ? '#6366f1' : 'var(--bg-hover, #f3f4f6)',
                                        color: selectedClass === key ? '#fff' : 'var(--text-secondary)',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Module sub-filter */}
                    {selectedClass && uniqueModules.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-3">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', alignSelf: 'center', marginRight: '4px' }}>Module :</span>
                            <button
                                onClick={() => setSelectedModule('')}
                                style={{
                                    fontSize: '0.72rem', fontWeight: 600, padding: '3px 12px', borderRadius: '6px', border: '1px solid var(--border, #e5e7eb)', cursor: 'pointer',
                                    background: !selectedModule ? '#6366f1' : 'transparent',
                                    color: !selectedModule ? '#fff' : 'var(--text-secondary)',
                                }}
                            >
                                Tous
                            </button>
                            {uniqueModules.map(mod => (
                                <button
                                    key={mod}
                                    onClick={() => setSelectedModule(mod)}
                                    style={{
                                        fontSize: '0.72rem', fontWeight: 600, padding: '3px 12px', borderRadius: '6px', border: '1px solid var(--border, #e5e7eb)', cursor: 'pointer',
                                        background: selectedModule === mod ? '#6366f1' : 'transparent',
                                        color: selectedModule === mod ? '#fff' : 'var(--text-secondary)',
                                    }}
                                >
                                    {mod}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '8px 22px 22px' }}>
                    {displaySessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ background: 'var(--bg-hover, #f3f4f6)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <i className="fas fa-inbox" style={{ color: 'var(--text-muted, #9ca3af)', fontSize: '1.2rem' }}></i>
                            </div>
                            <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0, fontSize: '0.875rem' }}>
                                Aucune séance pour cette sélection
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive mt-2">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border, #f0f0f0)' }}>
                                        {['Date', 'Module', 'Enseignant', 'Présents', 'Absents', 'Taux'].map(h => (
                                            <th key={h} style={{ fontWeight: 600, color: 'var(--text-muted, #6b7280)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', border: 0 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displaySessions.map((session, index) => {
                                        const total = (session.presentCount || 0) + (session.absentCount || 0);
                                        const rate = total > 0 ? Math.round((session.presentCount / total) * 100) : 0;
                                        const rateColor = rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
                                        return (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--border, #f5f5f5)' }}>
                                                <td style={{ padding: '12px 8px 12px 0' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{session.date}</div>
                                                    {session.sessionTitle && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #9ca3af)' }}>{session.sessionTitle}</div>}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{session.moduleName}</div>
                                                    {session.classCode && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #9ca3af)' }}>{classCodeToLabel(session.classCode)}</div>}
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{session.lecturerName || '—'}</td>
                                                <td>
                                                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', fontWeight: 700, fontSize: '0.82rem', padding: '2px 10px', borderRadius: '6px' }}>
                                                        {session.presentCount}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontWeight: 700, fontSize: '0.82rem', padding: '2px 10px', borderRadius: '6px' }}>
                                                        {session.absentCount}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{ flex: 1, background: 'var(--bg-hover, #f3f4f6)', borderRadius: '10px', height: '6px', overflow: 'hidden', minWidth: '60px' }}>
                                                            <div style={{ width: `${rate}%`, height: '100%', background: rateColor, borderRadius: '10px', transition: 'width 0.3s' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: rateColor, minWidth: '34px' }}>{rate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PedagogicalDashboard;
