import React, { useEffect, useState } from "react";
import { getGradesByStudentId, getQuizResultsByStudentId, getModules } from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import { SkeletonTable, EmptyState, PageTransition } from "../../../components/ui";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";

const Grades = () => {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState<any | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchAllResults = async () => {
            try {
                const stored = localStorage.getItem('user');
                if (!stored) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const user = JSON.parse(stored);
                const username = user.username || user.email || '';
                
                // Fetch student details first
                const student = await getStudentDetailsByUsername(username);
                if (!student && isMounted) {
                    setLoading(false);
                    return;
                }

                // Fetch other data in parallel safely
                const results = await Promise.allSettled([
                    getGradesByStudentId(student.id),
                    getQuizResultsByStudentId(student.username),
                    getModules()
                ]);

                const gradesData = results[0].status === 'fulfilled' ? results[0].value : [];
                const quizData = results[1].status === 'fulfilled' ? results[1].value : [];
                const allModules = results[2].status === 'fulfilled' ? results[2].value : [];

                const moduleMap: Record<string, any> = {};
                if (Array.isArray(allModules)) {
                    allModules.forEach((m: any) => { moduleMap[String(m.id)] = m; });
                }

                const normalizedGrades = (Array.isArray(gradesData) ? gradesData : []).map((g: any) => {
                    const mod = allModules.find((m: any) => String(m.id) === String(g.moduleId) || String(m.mid) === String(g.moduleId));
                    return {
                        id: `grade-${g.id}`,
                        title: mod?.name || mod?.title || g.moduleName || `Module #${g.moduleId}`,
                        moduleCode: mod?.mid || mod?.code || "N/A",
                        score: g.score,
                        maxScore: 20,
                        type: "NOTE FINALE",
                        date: g.createdDate,
                        comments: g.comments,
                        mention: g.grade
                    };
                });

                const normalizedQuizzes = (Array.isArray(quizData) ? quizData : []).map((q: any) => {
                    const mod = allModules.find((m: any) => String(m.id) === String(q.quiz?.moduleId) || String(m.mid) === String(q.quiz?.moduleId));
                    return {
                        id: `quiz-${q.id}`,
                        title: q.quiz?.title || "Quiz",
                        moduleCode: mod?.name || mod?.title || q.quiz?.module?.mid || "QUIZ",
                        score: q.score,
                        maxScore: 100,
                        type: "QUIZ",
                        date: q.completedDate,
                        comments: q.passed ? "Réussi" : "Échec",
                        mention: q.passed ? "ADMIS" : "A REFAIRE"
                    };
                });

                if (isMounted) {
                    const all = [...normalizedGrades, ...normalizedQuizzes].sort((a, b) => {
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        return dateB - dateA;
                    });
                    setResults(all);
                }
            } catch (error) {
                console.error("Error fetching academic results:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAllResults();
        return () => { isMounted = false; };
    }, []);

    // Anti-infinite loading: only show spinner if loading and no results yet
    if (loading && results.length === 0) return <div className="container py-5"><SkeletonTable rows={6} cols={5} /></div>;

    return (
        <PageTransition>
        <div className="content" style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
            <div className="container py-5">
                <StudentPageHeader 
                    title="Mes Résultats" 
                    subtitle="Consultez votre relevé de notes et vos performances académiques" 
                    icon="fa-file-alt"
                />

                {results.length === 0 ? (
                    <EmptyState
                        icon="fa-file-alt"
                        title="Aucune note disponible"
                        description="Vos notes apparaitront ici apres vos evaluations et quiz."
                    />
                ) : (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 font-weight-bold text-uppercase text-muted small px-4 py-3">Évaluation</th>
                                            <th className="border-0 font-weight-bold text-uppercase text-muted small px-4 py-3">Module</th>
                                            <th className="border-0 font-weight-bold text-uppercase text-muted small px-4 py-3">Date</th>
                                            <th className="border-0 font-weight-bold text-uppercase text-muted small px-4 py-3 text-center">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res: any) => {
                                            const isQuiz = res.type === "QUIZ";
                                            const pct = isQuiz ? res.score : (res.score / res.maxScore) * 100;
                                            const isSuccess = pct >= 60; // 12/20
                                            
                                            return (
                                                <tr 
                                                    key={res.id} 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setSelectedResult(res)}
                                                >
                                                    <td className="px-4 py-3 align-middle">
                                                        <span className="font-weight-bold">{res.title}</span>
                                                        <br />
                                                        <small className="text-muted">{res.type}</small>
                                                    </td>
                                                    <td className="px-4 py-3 align-middle text-muted">
                                                        {res.moduleCode}
                                                    </td>
                                                    <td className="px-4 py-3 align-middle text-muted">
                                                        {res.date ? new Date(res.date).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 align-middle text-center">
                                                        <span className={isSuccess ? 'text-success' : 'text-danger'}>
                                                            {res.score}
                                                        </span>
                                                        <span className="text-muted"> / {res.maxScore}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Grade Detail Modal */}
            {selectedResult && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setSelectedResult(null)}
                >
                    <div 
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '100%',
                            color: 'var(--text-primary)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h5 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>
                                Détails de l'évaluation
                            </h5>
                            <button
                                onClick={() => setSelectedResult(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Évaluation</small>
                                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '4px' }}>{selectedResult.title}</div>
                            </div>

                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Module</small>
                                <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: '4px' }}>{selectedResult.moduleCode}</div>
                            </div>

                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Type</small>
                                <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: '4px' }}>
                                    <span className="badge badge-primary px-3 py-1">{selectedResult.type}</span>
                                </div>
                            </div>

                            <div>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Date</small>
                                <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: '4px' }}>
                                    {selectedResult.date ? new Date(selectedResult.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                </div>
                            </div>

                            <div style={{ 
                                background: 'var(--bg-hover)', 
                                padding: '16px', 
                                borderRadius: '12px',
                                textAlign: 'center',
                                border: '1px solid var(--border)'
                            }}>
                                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Note obtenue</small>
                                <div style={{ 
                                    fontSize: '2.5rem', 
                                    fontWeight: 800, 
                                    marginTop: '8px',
                                    color: (selectedResult.type === "QUIZ" ? selectedResult.score : (selectedResult.score / selectedResult.maxScore) * 100) >= 60 ? 'var(--success)' : 'var(--danger)'
                                }}>
                                    {selectedResult.score}
                                    <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-muted)' }}> / {selectedResult.maxScore}</span>
                                </div>
                                {selectedResult.mention && (
                                    <div style={{ 
                                        marginTop: '8px', 
                                        fontWeight: 600, 
                                        fontSize: '0.9rem',
                                        color: (selectedResult.type === "QUIZ" ? selectedResult.score : (selectedResult.score / selectedResult.maxScore) * 100) >= 60 ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                        {selectedResult.mention}
                                    </div>
                                )}
                            </div>

                            {selectedResult.comments && (
                                <div>
                                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Commentaires</small>
                                    <div style={{ fontWeight: 500, fontSize: '0.95rem', marginTop: '4px', fontStyle: 'italic' }}>
                                        {selectedResult.comments}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </PageTransition>
    );
}

export default Grades;

