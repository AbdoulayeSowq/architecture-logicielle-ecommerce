import BreadCrumb from "../../../components/Admin/Breadcrumb";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses, getModules, getQuizResultsByModuleId, getLacunes } from "../../../services/api/course";
import { getStudents, getLecturers } from "../../../services/api/user";
import { getCycles, getClasses, getDepartments } from "../../../services/api/university";
import { getAllAnnouncements } from "../../../services/api/announcement";
import { getAtRiskStudents } from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";
import { useAuth } from "../../../services/AuthContext";
import api from "../../../services/api/api";

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const BAR_PALETTE = ['var(--success)', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];
const RISK_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b'];

type Stats = {
    students: number; lecturers: number; courses: number;
    cycles: number; classes: number; departments: number; modules: number;
};

type ModuleAnalytic = {
    moduleId: number;
    moduleName: string;
    codeEC: string;
    avgScore: number;
    passRate: number;
    totalAttempts: number;
    totalStudents: number;
};

const computeTrend = (items: any[], dateField = 'createdDate', months = 12) => {
    const trend = Array(months).fill(0);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    items.forEach((it: any) => {
        const raw = it[dateField] || it.createdAt || it.created_date;
        if (!raw) return;
        const dt = new Date(raw);
        if (dt < start) return;
        const idx = (dt.getFullYear() - start.getFullYear()) * 12 + (dt.getMonth() - start.getMonth());
        if (idx >= 0 && idx < months) trend[idx]++;
    });
    return trend;
};

const growthPct = (trend: number[]) => {
    const curr = trend[trend.length - 1];
    const prev = trend[trend.length - 2] ?? 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
};

const ScoreBar = ({ value, max = 20, color = 'var(--accent)' }: { value: number; max?: number; color?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 36, textAlign: 'right' }}>
            {value.toFixed(1)}
        </span>
    </div>
);

const ROLE_HERO: Record<string, { subtitle: string; icon: string; color: string }> = {
    CHEF_DEPT:   { subtitle: 'Tableau de bord de votre département', icon: 'fa-building', color: '#3b82f6' },
    RESP_PEDAGO: { subtitle: 'Tableau de bord de vos classes supervisées', icon: 'fa-chalkboard-teacher', color: '#3b82f6' },
    SCOLARITE:   { subtitle: 'Gestion académique et administrative', icon: 'fa-university', color: '#f59e0b' },
    ADMIN:       { subtitle: "Vue d'ensemble de votre plateforme LMS en temps réel.", icon: 'fa-shield-alt', color: '#8b5cf6' },
};

const Dashboard = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const activeRole = role || localStorage.getItem('role') || 'ADMIN';
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ students: 0, lecturers: 0, courses: 0, cycles: 0, classes: 0, departments: 0, modules: 0 });
    const [students, setStudents] = useState<any[]>([]);
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [signupTrend, setSignupTrend] = useState<number[]>(Array(12).fill(0));
    const [lecturerTrend, setLecturerTrend] = useState<number[]>(Array(12).fill(0));
    const [deptDistribution, setDeptDistribution] = useState<{ name: string; count: number; pct: number }[]>([]);
    const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytic[]>([]);
    const [topLacunes, setTopLacunes] = useState<{ competence: string; count: number; pct: number }[]>([]);
    const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
    const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'modules' | 'lacunes' | 'risk'>('modules');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsData, lecturersData, coursesData, cyclesData, classesData, depsData, modulesData, annData] = await Promise.all([
                getStudents(), getLecturers(), getCourses(), getCycles(), getClasses(), getDepartments(), getModules(),
                getAllAnnouncements().catch(() => []),
            ]);
            const studentsArr = Array.isArray(studentsData) ? studentsData : [];
            const lecturersArr = Array.isArray(lecturersData) ? lecturersData : [];
            const annArr = Array.isArray(annData) ? annData : [];
            const modulesArr = Array.isArray(modulesData) ? modulesData : [];

            setStudents(studentsArr);
            setLecturers(lecturersArr);
            setAnnouncements(annArr);
            setStats({
                students: studentsArr.length,
                lecturers: lecturersArr.length,
                courses: Array.isArray(coursesData) ? coursesData.length : 0,
                cycles: Array.isArray(cyclesData) ? cyclesData.length : 0,
                classes: Array.isArray(classesData) ? classesData.length : 0,
                departments: Array.isArray(depsData) ? depsData.length : 0,
                modules: modulesArr.length,
            });

            setSignupTrend(computeTrend(studentsArr));
            setLecturerTrend(computeTrend(lecturersArr));

            const counts: Record<string, number> = {};
            studentsArr.forEach((s: any) => {
                const dept = (s.department && String(s.department).trim()) || 'Non assigné';
                counts[dept] = (counts[dept] || 0) + 1;
            });
            const total = studentsArr.length || 1;
            setDeptDistribution(
                Object.entries(counts)
                    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6)
            );

            // Analytics asynchrones (non bloquantes)
            fetchAnalytics(modulesArr, lecturersArr);
        } catch (error: any) {
            console.error("Dashboard data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async (modulesArr: any[], lecturersArr: any[]) => {
        setAnalyticsLoading(true);
        try {
            // 1. Module analytics — quiz results par module
            const moduleResults = await Promise.all(
                modulesArr.slice(0, 20).map(async (mod: any) => {
                    try {
                        const results = await getQuizResultsByModuleId(mod.id);
                        if (!results || results.length === 0) return null;
                        const scores = results.map((r: any) => r.score ?? 0);
                        const avgScorePercent = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
                        const avgScoreOn20 = avgScorePercent / 5; // Convert from percentage (out of 100) to out of 20
                        const passed = results.filter((r: any) => r.passed === true).length;
                        const passRate = Math.round((passed / results.length) * 100);
                        const uniqueStudents = new Set(results.map((r: any) => r.studentId)).size;
                        return {
                            moduleId: mod.id,
                            moduleName: mod.name || mod.title || 'Module',
                            codeEC: mod.codeEC || '',
                            avgScore: Math.round(avgScoreOn20 * 10) / 10,
                            passRate,
                            totalAttempts: results.length,
                            totalStudents: uniqueStudents,
                        } as ModuleAnalytic;
                    } catch { return null; }
                })
            );
            const validModules = moduleResults.filter(Boolean) as ModuleAnalytic[];
            setModuleAnalytics(validModules.sort((a, b) => b.totalAttempts - a.totalAttempts));

            // 2. Top lacunes globales — agréger depuis tous les étudiants (sample)
            const sampleStudents = lecturersArr.length > 0
                ? await api.get('/course/adaptive/lacunes/all').then(r => r.data).catch(() => null)
                : null;

            if (!sampleStudents) {
                // Fallback: fetch lacunes pour les 10 premiers étudiants
                const studentSample = (await getStudents().catch(() => [])).slice(0, 15);
                const allLacunes: any[] = [];
                await Promise.all(studentSample.map(async (s: any) => {
                    const uname = s.username || s.email;
                    if (!uname) return;
                    const l = await getLacunes(uname).catch(() => []);
                    if (Array.isArray(l)) allLacunes.push(...l);
                }));
                buildTopLacunes(allLacunes);
            } else {
                buildTopLacunes(Array.isArray(sampleStudents) ? sampleStudents : []);
            }

            // 3. Étudiants à risque — depuis le premier lecturer
            if (lecturersArr.length > 0) {
                const risks: any[] = [];
                await Promise.all(lecturersArr.slice(0, 5).map(async (lec: any) => {
                    const uname = lec.username || lec.email;
                    if (!uname) return;
                    const r = await getAtRiskStudents(uname).catch(() => []);
                    if (Array.isArray(r)) risks.push(...r);
                }));
                // Dédupliquer par studentId
                const seen = new Set<string>();
                const unique = risks.filter(r => {
                    const key = r.studentId || r.username;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setAtRiskStudents(unique.slice(0, 10));
            }
        } catch (e) {
            console.error('Analytics fetch error:', e);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const buildTopLacunes = (allLacunes: any[]) => {
        const counts: Record<string, number> = {};
        allLacunes.forEach((l: any) => {
            const comp = l.competence;
            if (!comp) return;
            counts[comp] = (counts[comp] || 0) + 1;
        });
        const total = allLacunes.length || 1;
        setTopLacunes(
            Object.entries(counts)
                .map(([competence, count]) => ({ competence, count, pct: Math.round((count / total) * 100) }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
        );
    };

    useEffect(() => {
        if (activeRole === 'CHEF_DEPT') {
            navigate('/admin/university/department', { replace: true });
            return;
        }
        if (activeRole === 'RESP_PEDAGO') {
            navigate('/admin/university/class', { replace: true });
            return;
        }
        fetchData();
    }, [activeRole]);

    const statCards = useMemo(() => {
        const studentGrowth = growthPct(signupTrend);
        const lecturerGrowth = growthPct(lecturerTrend);
        const allCards = [
            { label: "Étudiants", value: stats.students, icon: "fas fa-user-graduate", color: "var(--accent)", link: "/admin/student/enrolled", growth: studentGrowth },
            { label: "Professeurs", value: stats.lecturers, icon: "fas fa-chalkboard-teacher", color: "#f59e0b", link: "/admin/lecturer/all", growth: lecturerGrowth, adminOnly: true },
            { label: "Modules", value: stats.modules, icon: "fas fa-layer-group", color: "#8b5cf6", link: "/admin/university/module" },
            { label: "Classes", value: stats.classes, icon: "fas fa-school", color: "#3b82f6", link: "/admin/university/class" },
            { label: "Départements", value: stats.departments, icon: "fas fa-sitemap", color: "#0ea5e9", link: "/admin/university/department" },
        ];
        return activeRole === 'SCOLARITE'
            ? allCards.filter(c => !(c as any).adminOnly)
            : allCards;
    }, [stats, signupTrend, lecturerTrend, activeRole]);

    const recentStudents = useMemo(() => [...students]
        .filter(s => s.createdDate)
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, 5), [students]);

    const recentAnnouncements = useMemo(() => [...announcements]
        .sort((a, b) => new Date(b.createdDate || b.createdAt || 0).getTime() - new Date(a.createdDate || a.createdAt || 0).getTime())
        .slice(0, 5), [announcements]);

    if (loading) return <PageLoading />;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const username = user?.username || 'Admin';

    const avgPassRate = moduleAnalytics.length > 0
        ? Math.round(moduleAnalytics.reduce((s, m) => s + m.passRate, 0) / moduleAnalytics.length)
        : null;
    const avgScore = moduleAnalytics.length > 0
        ? (moduleAnalytics.reduce((s, m) => s + m.avgScore, 0) / moduleAnalytics.length).toFixed(1)
        : null;
    const totalAttempts = moduleAnalytics.reduce((s, m) => s + m.totalAttempts, 0);

    return (
        <section className="content" style={{ padding: '2rem 0' }}>
            <div className="container-fluid">
                {/* Hero */}
                <div className="card mb-4 border-0">
                    <div className="card-body py-4 px-4 d-flex flex-wrap justify-content-between align-items-center border-bottom">
                        <div>
                            <small className="text-muted-custom text-uppercase font-weight-bold">
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </small>
                            <h2 className="mb-1 mt-1 text-primary-custom font-weight-bold">{greeting}, {username} 👋</h2>
                            <p className="mb-0 text-secondary">
                                <i className={`fas ${ROLE_HERO[activeRole]?.icon || 'fa-tachometer-alt'} mr-1`}
                                   style={{ color: ROLE_HERO[activeRole]?.color || 'var(--accent)' }} />
                                {ROLE_HERO[activeRole]?.subtitle || "Vue d'ensemble de votre plateforme LMS."}
                            </p>
                        </div>
                        <button onClick={fetchData} className="btn btn-outline-secondary btn-sm mt-2 mt-md-0">
                            <i className="fas fa-sync-alt mr-1" />Actualiser
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="row mb-2">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="col-lg-2 col-md-4 col-6 mb-4">
                            <Link to={stat.link} state={{ fromDashboard: true }} className="text-decoration-none">
                                <div className="stat-card" style={{ borderLeft: `3px solid ${stat.color}` }}>
                                    <div className="stat-card__icon" style={{ color: stat.color, background: `${stat.color}18` }}>
                                        <i className={stat.icon} />
                                    </div>
                                    <div>
                                        <p className="stat-card__value">{stat.value}</p>
                                        <p className="stat-card__label">{stat.label}</p>
                                        {typeof stat.growth === 'number' && (
                                            <small className={stat.growth >= 0 ? 'text-success' : 'text-danger'} style={{ fontSize: '0.7rem' }}>
                                                <i className={`fas fa-arrow-${stat.growth >= 0 ? 'up' : 'down'} mr-1`} />
                                                {Math.abs(stat.growth)}%
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                    {/* KPI analytics inline */}
                    {!analyticsLoading && avgPassRate !== null && (
                        <>
                            <div className="col-lg-2 col-md-4 col-6 mb-4">
                                <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                                    <div className="stat-card__icon" style={{ color: 'var(--success)', background: 'rgba(22,163,74,0.1)' }}>
                                        <i className="fas fa-check-circle" />
                                    </div>
                                    <div>
                                        <p className="stat-card__value">{avgPassRate}%</p>
                                        <p className="stat-card__label">Taux réussite</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-2 col-md-4 col-6 mb-4">
                                <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                                    <div className="stat-card__icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                                        <i className="fas fa-star-half-alt" />
                                    </div>
                                    <div>
                                        <p className="stat-card__value">{avgScore}/20</p>
                                        <p className="stat-card__label">Moy. quiz</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-2 col-md-4 col-6 mb-4">
                                <div className="stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
                                    <div className="stat-card__icon" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                                        <i className="fas fa-exclamation-triangle" />
                                    </div>
                                    <div>
                                        <p className="stat-card__value">{atRiskStudents.length}</p>
                                        <p className="stat-card__label">À risque</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── ANALYTICS SECTION ── */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
                        <div>
                            <h3 className="card-title mb-0 font-weight-bold">
                                <i className="fas fa-chart-bar mr-2" style={{ color: 'var(--accent)' }} />
                                Analytics Pédagogiques
                            </h3>
                            <small className="text-muted">
                                {analyticsLoading ? 'Chargement...' : `${moduleAnalytics.length} modules analysés — ${totalAttempts} tentatives quiz`}
                            </small>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {(['modules', 'lacunes', 'risk'] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveAnalyticsTab(tab)}
                                    className="btn btn-sm font-weight-bold"
                                    style={{
                                        borderRadius: '8px',
                                        background: activeAnalyticsTab === tab ? 'var(--accent)' : 'var(--bg-elevated)',
                                        color: activeAnalyticsTab === tab ? '#fff' : 'var(--text-secondary)',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.75rem',
                                    }}>
                                    {tab === 'modules' && <><i className="fas fa-layer-group mr-1" />Modules</>}
                                    {tab === 'lacunes' && <><i className="fas fa-exclamation-circle mr-1" />Lacunes</>}
                                    {tab === 'risk' && <><i className="fas fa-user-times mr-1" />À risque {atRiskStudents.length > 0 && <span className="badge badge-danger ml-1" style={{ fontSize: '0.65rem' }}>{atRiskStudents.length}</span>}</>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        {analyticsLoading ? (
                            <div className="text-center py-5">
                                <i className="fas fa-spinner fa-spin fa-2x mb-3" style={{ color: 'var(--accent)', opacity: 0.5 }} />
                                <p className="text-muted small mb-0">Calcul des analytics en cours...</p>
                            </div>
                        ) : (
                            <>
                                {/* TAB: Modules */}
                                {activeAnalyticsTab === 'modules' && (
                                    moduleAnalytics.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="fas fa-chart-bar fa-2x mb-3" style={{ color: 'var(--border)' }} />
                                            <p className="text-muted small mb-0">Aucun résultat de quiz enregistré pour le moment.</p>
                                            <small className="text-muted">Les analytics apparaîtront dès que des étudiants soumettront des quiz.</small>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                        <th style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 0 }}>Module</th>
                                                        <th style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 0 }}>Moy. /20</th>
                                                        <th style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 0 }}>Taux réussite</th>
                                                        <th style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 0 }}>Tentatives</th>
                                                        <th style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 0 }}>Étudiants</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {moduleAnalytics.map((m) => {
                                                        const scoreColor = m.avgScore >= 14 ? 'var(--success)' : m.avgScore >= 10 ? '#f59e0b' : '#ef4444';
                                                        const passColor = m.passRate >= 70 ? 'var(--success)' : m.passRate >= 50 ? '#f59e0b' : '#ef4444';
                                                        return (
                                                            <tr key={m.moduleId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                <td style={{ border: 0, padding: '0.75rem 0.5rem' }}>
                                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.moduleName}</div>
                                                                    <small style={{ color: 'var(--text-secondary)' }}>{m.codeEC}</small>
                                                                </td>
                                                                <td style={{ border: 0, padding: '0.75rem 0.5rem', minWidth: 140 }}>
                                                                    <ScoreBar value={m.avgScore} color={scoreColor} />
                                                                </td>
                                                                <td style={{ border: 0, padding: '0.75rem 0.5rem' }}>
                                                                    <span style={{
                                                                        background: `${passColor}18`,
                                                                        color: passColor,
                                                                        borderRadius: '6px',
                                                                        padding: '2px 10px',
                                                                        fontWeight: 700,
                                                                        fontSize: '0.8rem',
                                                                    }}>
                                                                        {m.passRate}%
                                                                    </span>
                                                                </td>
                                                                <td style={{ border: 0, padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                                    {m.totalAttempts}
                                                                </td>
                                                                <td style={{ border: 0, padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                                    {m.totalStudents}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                )}

                                {/* TAB: Lacunes */}
                                {activeAnalyticsTab === 'lacunes' && (
                                    topLacunes.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="fas fa-check-circle fa-2x mb-3" style={{ color: 'var(--success)', opacity: 0.5 }} />
                                            <p className="text-muted small mb-0">Aucune lacune détectée pour le moment.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-muted small mb-3">
                                                <i className="fas fa-info-circle mr-1" />
                                                Compétences les plus souvent lacunaires parmi les étudiants analysés.
                                            </p>
                                            <div className="row">
                                                {topLacunes.map((l, idx) => (
                                                    <div key={l.competence} className="col-md-6 mb-3">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                                                <i className="fas fa-exclamation-circle mr-1" style={{ color: RISK_COLORS[idx % RISK_COLORS.length] }} />
                                                                {l.competence}
                                                            </span>
                                                            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                                {l.count} étudiant{l.count > 1 ? 's' : ''} <span className="text-muted">({l.pct}%)</span>
                                                            </span>
                                                        </div>
                                                        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${l.pct}%`, height: '100%',
                                                                background: RISK_COLORS[idx % RISK_COLORS.length],
                                                                borderRadius: 3, transition: 'width 0.6s ease',
                                                            }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* TAB: À risque */}
                                {activeAnalyticsTab === 'risk' && (
                                    atRiskStudents.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="fas fa-shield-alt fa-2x mb-3" style={{ color: 'var(--success)', opacity: 0.5 }} />
                                            <p className="text-muted small mb-0">Aucun étudiant à risque détecté.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-muted small mb-3">
                                                <i className="fas fa-info-circle mr-1" />
                                                Étudiants identifiés comme à risque de décrochage par les enseignants.
                                            </p>
                                            <div className="table-responsive">
                                                <table className="table table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                                                    <thead>
                                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                            {['Étudiant', 'Module', 'Score moyen', 'Présence', 'Risque'].map(h => (
                                                                <th key={h} style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 0 }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {atRiskStudents.map((s: any, idx: number) => {
                                                            const riskLevel = s.riskScore >= 70 ? 'Élevé' : s.riskScore >= 40 ? 'Moyen' : 'Faible';
                                                            const riskColor = s.riskScore >= 70 ? '#ef4444' : s.riskScore >= 40 ? '#f59e0b' : '#3b82f6';
                                                            return (
                                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                                    <td style={{ border: 0, padding: '0.75rem 0.5rem' }}>
                                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                            {s.studentName || s.studentId || '—'}
                                                                        </div>
                                                                        <small style={{ color: 'var(--text-secondary)' }}>{s.studentId}</small>
                                                                    </td>
                                                                    <td style={{ border: 0, padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                                                                        {s.moduleName || '—'}
                                                                    </td>
                                                                    <td style={{ border: 0, padding: '0.75rem 0.5rem' }}>
                                                                        {s.averageScore != null ? (
                                                                            <span style={{ fontWeight: 700, color: s.averageScore >= 50 ? 'var(--success)' : '#ef4444' }}>
                                                                                {Number(s.averageScore / 5).toFixed(1)}/20
                                                                            </span>
                                                                        ) : <span className="text-muted">—</span>}
                                                                    </td>
                                                                    <td style={{ border: 0, padding: '0.75rem 0.5rem' }}>
                                                                        {s.attendanceRate != null ? (
                                                                            <span style={{ fontWeight: 700, color: s.attendanceRate >= 75 ? 'var(--success)' : '#ef4444' }}>
                                                                                {s.attendanceRate}%
                                                                            </span>
                                                                        ) : <span className="text-muted">—</span>}
                                                                    </td>
                                                                    <td style={{ border: 0, padding: '0.75rem 0.5rem' }}>
                                                                        <span style={{
                                                                            background: `${riskColor}18`, color: riskColor,
                                                                            borderRadius: '6px', padding: '2px 10px',
                                                                            fontWeight: 700, fontSize: '0.78rem',
                                                                        }}>
                                                                            {riskLevel}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Dept distribution */}
                <div className="row">
                    <div className="col-lg-12 mb-4">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-transparent border-0 py-3">
                                <h3 className="card-title mb-0 font-weight-bold">Répartition par département</h3>
                                <small className="text-muted">Top {deptDistribution.length} — {stats.students} étudiants</small>
                            </div>
                            <div className="card-body pt-0">
                                {deptDistribution.length === 0 ? (
                                    <p className="text-muted small mb-0">Aucun étudiant enregistré.</p>
                                ) : (
                                    <div className="row">
                                        {deptDistribution.map((d, idx) => (
                                            <div key={d.name} className="col-md-4 mb-3">
                                                <div className="d-flex justify-content-between mb-1 small">
                                                    <span className="text-truncate" style={{ maxWidth: '70%' }} title={d.name}>{d.name}</span>
                                                    <span className="font-weight-bold">{d.count} <span className="text-muted">({d.pct}%)</span></span>
                                                </div>
                                                <div className="progress" style={{ height: '6px', background: 'var(--bg-elevated, #f1f5f9)' }}>
                                                    <div className="progress-bar" style={{ width: `${d.pct}%`, background: BAR_PALETTE[idx % BAR_PALETTE.length] }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent activity */}
                <div className="row">
                    <div className="col-lg-7">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0 font-weight-bold">
                                    <i className="fas fa-bullhorn mr-2 text-warning" />Annonces récentes
                                </h3>
                                <Link to="/admin/announcements" className="btn btn-sm btn-outline-primary">Voir tout</Link>
                            </div>
                            <div className="card-body p-0">
                                {recentAnnouncements.length === 0 ? (
                                    <p className="text-muted small p-3 mb-0">Aucune annonce pour le moment.</p>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {recentAnnouncements.map((a: any) => (
                                            <li key={a.id} className="list-group-item d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1 mr-3">
                                                    <div className="d-flex align-items-center mb-1">
                                                        <span className={`badge badge-${a.type === 'EXAM' ? 'danger' : a.type === 'ASSIGNMENT' ? 'primary' : a.type === 'EVENT' ? 'success' : 'secondary'} mr-2`}>
                                                            {a.type || 'ANNONCE'}
                                                        </span>
                                                        <strong className="text-truncate">{a.title || 'Sans titre'}</strong>
                                                    </div>
                                                    {a.content && <small className="text-muted d-block text-truncate" style={{ maxWidth: '500px' }}>{a.content}</small>}
                                                </div>
                                                <small className="text-muted text-nowrap">
                                                    {a.createdDate ? new Date(a.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                                                </small>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-5">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                                <h3 className="card-title mb-0 font-weight-bold">
                                    <i className="fas fa-user-plus mr-2 text-primary" />Nouveaux étudiants
                                </h3>
                                <Link to="/admin/student/enrolled" className="btn btn-sm btn-outline-primary">Voir tout</Link>
                            </div>
                            <div className="card-body p-0">
                                {recentStudents.length === 0 ? (
                                    <p className="text-muted small p-3 mb-0">Aucun étudiant récent.</p>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {recentStudents.map((s: any) => {
                                            const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username || s.email || '—';
                                            const initials = name.split(' ').map((p: string) => p[0]).filter(Boolean).slice(0, 1).join('').toUpperCase() || '?';
                                            return (
                                                <li key={s.id || s.username} className="list-group-item d-flex align-items-center">
                                                    <div className="avatar mr-3">{initials}</div>
                                                    <div className="flex-grow-1">
                                                        <div className="font-weight-bold">{name}</div>
                                                        <small className="text-muted">{s.department || 'Département non assigné'}</small>
                                                    </div>
                                                    <small className="text-muted">
                                                        {s.createdDate ? new Date(s.createdDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
                                                    </small>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Dashboard;
