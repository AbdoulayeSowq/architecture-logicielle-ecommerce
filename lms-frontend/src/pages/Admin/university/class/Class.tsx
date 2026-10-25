import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { deleteClass, getClasses, getClassesByDepartmentId, getDepartmentById } from "../../../../services/api/university";
import { getTeachingUnitsByClassId, getModulesByTeachingUnit, getModulesByDepartmentId } from "../../../../services/api/course";
import { getLecturerDetailsByUsername } from "../../../../services/api/user";
import PageLoading from "../../../../components/Admin/PageLoading";

type ClassStats = {
    moduleCount: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progressPct: number;
};

const computeStatus = (m: any): 'completed' | 'in_progress' | 'not_started' => {
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

const normalizeClassName = (name: string) => {
    return (name || '').toLowerCase().replace(/[-_\s]/g, '');
};

const Class = () => {
    const [classData, setClassData] = useState<any[]>([]);
    const [statsMap, setStatsMap] = useState<Record<string, ClassStats>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const levelFilter = (searchParams.get('q') || '').trim().toUpperCase();
    const departmentId = (searchParams.get('department') || '').trim();
    const [departmentInfo, setDepartmentInfo] = useState<any>(null);
    const [myRoleConstraints, setMyRoleConstraints] = useState<{role: string, deptCode?: string, classNames?: string[]}>({ role: '' });

    useEffect(() => {
        const role = localStorage.getItem('role') || '';
        const stored = localStorage.getItem('user');
        const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';

        if (role === 'CHEF_DEPT' || role === 'RESP_PEDAGO') {
            getLecturerDetailsByUsername(uname).then((me: any) => {
                if (!me) {
                    // Si pas de profil, initialiser avec un rôle mais sans classes (bloque la vue globale)
                    setMyRoleConstraints({ role, deptCode: '', classNames: [] });
                    return;
                }
                setMyRoleConstraints({
                    role,
                    deptCode: me.supervisedDepartmentCode || '',
                    classNames: (me.supervisedClassName || '').split(',').map((c: string) => c.trim().toLowerCase()).filter(Boolean),
                });
            }).catch(() => {
                // En cas d'erreur API, bloquer la vue globale en réinitialisant avec rôle mais sans données
                setMyRoleConstraints({ role, deptCode: '', classNames: [] });
            });
        }
    }, []);

    // Redirect RESP_PEDAGO to class details if only one supervised class
    useEffect(() => {
        if (myRoleConstraints.role === 'RESP_PEDAGO' && myRoleConstraints.classNames && myRoleConstraints.classNames.length === 1 && !departmentId && !levelFilter) {
            const targetClass = myRoleConstraints.classNames[0];
            const matchingClass = classData.find((c: any) => normalizeClassName(c.name) === normalizeClassName(targetClass));
            if (matchingClass) {
                navigate(`/admin/university/class/${matchingClass.id}/details`, { replace: true });
            }
        }
    }, [myRoleConstraints, classData, departmentId, levelFilter, navigate]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setStatsMap({});
            setDepartmentInfo(null);

            try {
                let all: any[] = [];
                if (departmentId) {
                    const [deptClasses, deptInfo] = await Promise.allSettled([
                        getClassesByDepartmentId(departmentId),
                        getDepartmentById(departmentId),
                    ]);
                    
                    if (deptClasses.status === 'fulfilled') {
                        all = Array.isArray(deptClasses.value) ? deptClasses.value : [];
                    }
                    if (deptInfo.status === 'fulfilled' && !cancelled) {
                        setDepartmentInfo(deptInfo.value);
                    }
                    
                    const info = deptInfo.status === 'fulfilled' ? deptInfo.value : null;
                    all = all.map((c: any) => ({ ...c, department: info || c.department }));
                } else {
                    const data = await getClasses();
                    all = Array.isArray(data) ? data : [];
                }
                
                if (!cancelled) {
                    setClassData(all);
                }

                if (departmentId) {
                    const allModules = await getModulesByDepartmentId(departmentId);
                    const modulesList = Array.isArray(allModules) ? allModules : [];
                    
                    const newStatsMap: Record<string, ClassStats> = {};
                    all.forEach((c: any) => {
                        const classModules = modulesList.filter((m: any) => 
                            m.teachingUnit && String(m.teachingUnit.classId) === String(c.id)
                        );
                        
                        let completed = 0, inProgress = 0, notStarted = 0;
                        classModules.forEach((m: any) => {
                            const s = computeStatus(m);
                            if (s === 'completed') completed++;
                            else if (s === 'in_progress') inProgress++;
                            else notStarted++;
                        });
                        
                        const total = classModules.length;
                        newStatsMap[c.id] = {
                            moduleCount: total,
                            completed, inProgress, notStarted,
                            progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
                        };
                    });
                    
                    if (!cancelled) setStatsMap(newStatsMap);
                } else {
                    const visible = levelFilter
                        ? all.filter((c: any) => {
                            const name = (c.name || '').toUpperCase().trim();
                            return name === levelFilter || name.startsWith(levelFilter + ' ') || name.startsWith(levelFilter + '-');
                        })
                        : all;

                    await Promise.allSettled(visible.map(async (c: any) => {
                        try {
                            const tus = await getTeachingUnitsByClassId(c.id);
                            const list = Array.isArray(tus) ? tus : [];
                            const moduleLists = await Promise.all(list.map((tu: any) => getModulesByTeachingUnit(tu.id)));
                            const modules = moduleLists.flat().filter(Boolean);
                            let completed = 0, inProgress = 0, notStarted = 0;
                            modules.forEach((m: any) => {
                                const s = computeStatus(m);
                                if (s === 'completed') completed++;
                                else if (s === 'in_progress') inProgress++;
                                else notStarted++;
                            });
                            const total = modules.length;
                            if (!cancelled) {
                                setStatsMap(prev => ({
                                    ...prev,
                                    [c.id]: {
                                        moduleCount: total,
                                        completed, inProgress, notStarted,
                                        progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
                                    }
                                }));
                            }
                        } catch { /* silent */ }
                    }));
                }
            } catch (err) {
                console.error("Error in Class load:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [levelFilter, departmentId]);

    const filteredClasses = useMemo(() => {
        let base = [];
        if (departmentId) base = classData;
        else if (!levelFilter) base = classData;
        else {
            base = classData.filter((c: any) => {
                const name = (c.name || '').toUpperCase().trim();
                return name === levelFilter || name.startsWith(levelFilter + ' ') || name.startsWith(levelFilter + '-');
            });
        }

        // Filtre strict par rôle d'administration fine
        if (myRoleConstraints.role === 'CHEF_DEPT' && myRoleConstraints.deptCode) {
            const code = myRoleConstraints.deptCode.toLowerCase().trim();
            base = base.filter((c: any) => {
                const name = (c.name || '').toLowerCase().trim();
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
            // Toujours filtrer, même si classNames est vide (retourne [] et non toutes les classes)
            const targets = (myRoleConstraints.classNames || []).map(normalizeClassName);
            if (targets.length === 0) {
                base = []; // Pas de classes assignées → liste vide (jamais la vue globale)
            } else {
                base = base.filter((c: any) => {
                    const normName = normalizeClassName(c.name);
                    return targets.includes(normName);
                });
            }
        } else if (myRoleConstraints.role === 'CHEF_DEPT') {
            // Chef de département sans code assigné → liste vide
            base = [];
        }

        if (searchTerm.trim()) {
            const lowSearch = searchTerm.toLowerCase().trim();
            base = base.filter((c: any) => 
                (c.name || '').toLowerCase().includes(lowSearch) ||
                (c.description || '').toLowerCase().includes(lowSearch)
            );
        }

        return [...base].sort((a, b) => {
            const nameA = (a.name || '').toUpperCase().trim();
            const nameB = (b.name || '').toUpperCase().trim();
            if (nameA === 'TC1') return -1;
            if (nameB === 'TC1') return 1;
            if (nameA === 'TC2') return nameB === 'TC1' ? 1 : -1;
            if (nameB === 'TC2') return nameA === 'TC1' ? -1 : 1;
            const extractDICLevel = (name: string) => {
                const m = name.match(/DIC(\d)/);
                return m ? parseInt(m[1]) : 99;
            };
            const lvA = extractDICLevel(nameA);
            const lvB = extractDICLevel(nameB);
            if (lvA !== lvB) return lvA - lvB;
            return nameA.localeCompare(nameB);
        });
    }, [classData, levelFilter, departmentId, searchTerm, myRoleConstraints]);

    const globalStats = useMemo(() => {
        let tot = 0, done = 0, inP = 0;
        filteredClasses.forEach((c: any) => {
            const s = statsMap[c.id];
            if (s) { tot += s.moduleCount; done += s.completed; inP += s.inProgress; }
        });
        return { tot, done, inP };
    }, [filteredClasses, statsMap]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette classe ?')) return;
        setLoading(true);
        try {
            await deleteClass(id);
            const data = await getClasses();
            setClassData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error deleting class:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && classData.length === 0) return <PageLoading />;

    // Titre dynamique selon le rôle
    const role = localStorage.getItem('role') || '';
    const isRespPedago = role === 'RESP_PEDAGO';

    let heroTitle = 'Toutes les classes';
    let heroSubtitle = "Vue globale des classes de l'établissement";
    let breadcrumbPage = 'Classes';

    if (isRespPedago) {
        heroTitle = filteredClasses.length > 1 ? 'Mes Classes' : 'Ma Classe';
        heroSubtitle = filteredClasses.length === 0
            ? 'Aucune classe supervisée pour le moment'
            : 'Suivi de vos classes supervisées';
        breadcrumbPage = heroTitle;
    } else if (departmentId && departmentInfo) {
        // Supprime l'abréviation entre parenthèses à la fin (ex: "(GIT)")
        heroTitle = (departmentInfo.name || '').replace(/\s*\(.*\)$/, '');
        heroSubtitle = 'Cycle Ingénieur — Suivi des niveaux et des modules';
        breadcrumbPage = departmentInfo.abbreviation || 'Département';
    } else if (levelFilter) {
        heroTitle = `Niveau ${levelFilter}`;
        heroSubtitle = `Classes de niveau ${levelFilter} (tous départements confondus)`;
        breadcrumbPage = levelFilter;
    }

    return (
        <section className="content" style={{ padding: '2rem 1rem' }}>
            {/* BreadCrumb removed per user request */}
            
            <div className="container-fluid">
                <div style={{ 
                    background: 'var(--bg-card)', 
                    borderRadius: '20px', 
                    padding: '2rem', 
                    marginBottom: '2rem',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {location.state?.fromDashboard && (
                            <button 
                                onClick={() => window.history.back()} 
                                style={{ 
                                    width: '42px', height: '42px', borderRadius: '12px', border: '1px solid var(--border)',
                                    background: 'var(--bg-base)', color: 'var(--text-primary)', cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        )}
                        <div>
                            <h2 style={{ margin: '0', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.85rem' }}>{heroTitle}</h2>
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{heroSubtitle}</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1.5rem' }}>
                        {[
                            { val: filteredClasses.length, label: 'Classes' },
                            { val: globalStats.tot, label: 'Modules' },
                            { val: globalStats.done, label: 'Terminés' }
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.val}</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {!departmentId && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{
                            flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center',
                            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0 1rem'
                        }}>
                            <i className="fas fa-search" style={{ color: 'var(--text-muted)', marginRight: '0.75rem' }}></i>
                            <input
                                type="text" placeholder="Quelle classe recherchez-vous ?"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 0', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                            />
                        </div>
                        {myRoleConstraints.role !== 'RESP_PEDAGO' && myRoleConstraints.role !== 'CHEF_DEPT' && (
                            <button
                                onClick={() => navigate("/admin/university/class/new")}
                                style={{
                                    padding: '0.8rem 1.5rem', background: 'var(--accent)', color: 'white',
                                    border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                                }}
                            >
                                <i className="fas fa-plus"></i> Nouvelle classe
                            </button>
                        )}
                    </div>
                )}

                {filteredClasses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                        <i className="fas fa-info-circle" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>
                            {isRespPedago
                                ? "Aucune classe ne vous a encore été assignée. Contactez l\u2019administrateur."
                                : 'Aucune classe trouvée.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                        gap: '1.5rem' 
                    }}>
                        {filteredClasses.map((cls: any) => {
                            const stats = statsMap[cls.id];
                            const pct = stats?.progressPct ?? 0;
                            return (
                                <div key={cls.id} style={{ 
                                    background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border)',
                                    padding: '1.5rem', transition: 'all 0.2s ease', cursor: 'pointer'
                                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} 
                                   onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                                   onClick={() => navigate(`/admin/university/class/${cls.id}/details`)}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{cls.name}</h4>
                                    </div>

                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Avancement</span>
                                            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: '10px', transition: 'width 0.5s' }}></div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: '12px', padding: '0.75rem' }}>
                                        <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 750, color: 'var(--text-primary)' }}>{stats?.moduleCount ?? 0}</div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modules</div>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 750, color: 'var(--accent)' }}>{stats?.completed ?? 0}</div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Finis</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Class;
