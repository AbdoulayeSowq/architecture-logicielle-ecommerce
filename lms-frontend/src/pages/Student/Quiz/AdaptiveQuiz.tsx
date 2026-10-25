import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../services/AuthContext";
import {
  startAdaptiveSession,
  getNextAdaptiveQuestion,
  submitAdaptiveAnswer,
  completeAdaptiveSession,
  getAdaptiveSessionsByModule,
} from "../../../services/api/analytics";
import { getModuleById } from "../../../services/api/course";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import PageLoading from "../../../components/Admin/PageLoading";
import { notifyError } from "../../../components/notify";

const renderMarkdown = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h6 key={i} style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.4rem' }}>{line.slice(3)}</h6>;
    if (line.startsWith('# ')) return <h5 key={i} style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.4rem' }}>{line.slice(2)}</h5>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ color: 'var(--text-secondary)', paddingLeft: '1rem', marginBottom: '0.25rem' }}>• {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</div>;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const rendered = parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p);
    return line.trim() === '' ? <div key={i} style={{ height: '0.5rem' }} /> : <p key={i} style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem', lineHeight: 1.6 }}>{rendered}</p>;
  });
};

const DIFFICULTY_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  EASY:   { label: "Facile",   color: "var(--success)", icon: "fa-seedling" },
  MEDIUM: { label: "Moyen",   color: "#f59e0b",        icon: "fa-fire" },
  HARD:   { label: "Difficile", color: "var(--danger)", icon: "fa-bolt" },
};

const AdaptiveQuiz = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  // Session active
  const [session, setSession] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      setLoading(true);
      try {
        const [mod, hist] = await Promise.all([
          getModuleById(id),
          getAdaptiveSessionsByModule(user.username, parseInt(id)),
        ]);
        setModule(mod);
        setSessions(hist);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const handleStart = async () => {
    if (!user || !id) return;
    setQuestionLoading(true);
    setFinishing(false);
    try {
      const s = await startAdaptiveSession(user.username, parseInt(id));
      setSession(s);
      setAnsweredCount(0);
      setSessionResult(null);
      setAnswerResult(null);
      await loadNextQuestion(s.id);
    } catch (e: any) {
      notifyError("Impossible de démarrer la session : " + (e.response?.data || e.message));
    } finally {
      setQuestionLoading(false);
    }
  };

  const loadNextQuestion = async (sessionId: number) => {
    if (!user) return;
    setQuestionLoading(true);
    setAnswerResult(null);
    setSelectedOptionId(null);
    setTextAnswer("");
    const q = await getNextAdaptiveQuestion(sessionId, user.username);
    if (q == null) {
      await finishSession(sessionId);
    } else {
      setQuestion(q);
    }
    setQuestionLoading(false);
  };

  const handleSubmitAnswer = async () => {
    if (!user || !session || !question) return;
    setSubmitting(true);
    try {
      const result = await submitAdaptiveAnswer(session.id, user.username, {
        questionId: question.id,
        selectedOptionId: selectedOptionId ?? undefined,
        textAnswer: textAnswer || undefined,
      });
      setAnswerResult(result);

      const newCount = answeredCount + 1;
      setAnsweredCount(newCount);

      // Si c'était la dernière question, finir automatiquement après un délai
      if (newCount >= (session.totalQuestions || 10)) {
        setTimeout(() => finishSession(session.id), 1200);
      }
    } catch (e: any) {
      notifyError("Erreur lors de la soumission : " + (e.response?.data || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const finishSession = async (sessionId: number) => {
    if (!user || finishing) return;
    setFinishing(true);
    try {
      const result = await completeAdaptiveSession(sessionId, user.username);
      setSessionResult(result);
      setSession(null);
      setQuestion(null);
      setAnswerResult(null);
      if (id) {
        const hist = await getAdaptiveSessionsByModule(user.username, parseInt(id));
        setSessions(hist);
      }
    } catch (_) {
      // Session déjà complétée — récupérer quand même le résultat depuis l'historique
      if (id) {
        try {
          const hist = await getAdaptiveSessionsByModule(user.username, parseInt(id));
          setSessions(hist);
          if (hist.length > 0) setSessionResult(hist[0]);
        } catch (_) {}
      }
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <PageLoading />;

  // ── Résultat de session ──────────────────────────────────
  if (sessionResult) {
    const score = sessionResult.scorePercent ?? 0;
    const passed = score >= 60;
    const correct = sessionResult.correctCount ?? 0;
    const total = sessionResult.answeredCount ?? 0;
    return (
      <div className="content">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-6">
              <div style={{
                background: 'var(--bg-card)', borderRadius: '20px',
                border: '1px solid var(--border)', overflow: 'hidden',
              }}>
                {/* Header coloré */}
                <div style={{
                  background: passed
                    ? 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05))'
                    : 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(220,38,38,0.05))',
                  borderBottom: `1px solid ${passed ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.25rem',
                    background: passed ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`fas ${passed ? 'fa-trophy' : 'fa-brain'}`} style={{
                      fontSize: '2rem',
                      color: passed ? 'var(--success)' : 'var(--danger)',
                    }} />
                  </div>
                  <h2 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', fontSize: '1.5rem' }}>
                    {passed ? 'Session réussie !' : 'Session terminée'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    {module?.name} — Parcours Adaptatif
                  </p>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '1px', background: 'var(--border)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {[
                    { value: `${score.toFixed(1)}%`, label: 'Score', color: passed ? 'var(--success)' : 'var(--danger)' },
                    { value: `${correct} / ${total}`, label: 'Correctes', color: 'var(--text-primary)' },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      background: 'var(--bg-card)', padding: '1.25rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.3rem' }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {/* Recommandations IA */}
                  {sessionResult.aiRecommendations ? (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff', borderRadius: '8px', padding: '2px 10px',
                          fontSize: '0.72rem', fontWeight: 700,
                        }}>
                          <i className="fas fa-robot mr-1" />Analyse IA
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>{renderMarkdown(sessionResult.aiRecommendations)}</div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(var(--accent-rgb, 37,99,235),0.06)',
                      border: '1px solid var(--border)',
                      borderLeft: '3px solid var(--accent)',
                      borderRadius: '8px', padding: '0.9rem 1rem', marginBottom: '1.25rem',
                    }}>
                      <small style={{ color: 'var(--text-secondary)' }}>
                        <i className="fas fa-info-circle mr-1" style={{ color: 'var(--accent)' }} />
                        Tes lacunes et ton profil adaptatif ont été mis à jour automatiquement.
                      </small>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-outline-secondary font-weight-bold flex-grow-1"
                      style={{ borderRadius: '10px', padding: '0.65rem' }}
                      onClick={() => setSessionResult(null)}>
                      <i className="fas fa-history mr-2" />Historique
                    </button>
                    <button
                      className="btn btn-primary font-weight-bold flex-grow-1"
                      style={{ borderRadius: '10px', padding: '0.65rem' }}
                      onClick={handleStart}>
                      <i className="fas fa-redo mr-2" />Nouvelle session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Session active ───────────────────────────────────────
  if (session) {
    const diff = DIFFICULTY_LABEL[question?.difficultyLevel ?? "EASY"];
    const progress = session.totalQuestions > 0 ? (answeredCount / session.totalQuestions) * 100 : 0;

    return (
      <div className="content">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-md-10">
              {/* Header session */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap" style={{ gap: "1rem" }}>
                <div>
                  <h3 className="font-weight-bold m-0 mb-1" style={{ color: "var(--text-primary)" }}>
                    <i className="fas fa-brain mr-2" style={{ color: "var(--accent)" }} />
                    Parcours Adaptatif
                  </h3>
                  <small style={{ color: "var(--text-secondary)" }}>{module?.name}</small>
                </div>
                <button className="btn btn-sm btn-outline-secondary font-weight-bold" style={{ borderRadius: 8 }}
                  onClick={() => finishSession(session.id)}>
                  <i className="fas fa-stop-circle mr-1" />Terminer
                </button>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <small className="font-weight-bold" style={{ color: "var(--text-secondary)" }}>
                    Question {Math.min(answeredCount + 1, session.totalQuestions)} / {session.totalQuestions}
                  </small>
                  {diff && (
                    <small className="font-weight-bold" style={{ color: diff.color }}>
                      <i className={`fas ${diff.icon} mr-1`} />{diff.label}
                    </small>
                  )}
                </div>
                <div className="progress" style={{ height: 8, borderRadius: 4, background: "var(--border)" }}>
                  <div className="progress-bar" style={{ width: `${progress}%`, borderRadius: 4, background: "var(--accent)", transition: "width 0.3s" }} />
                </div>
              </div>

              {questionLoading ? (
                <StudentCard className="border-0">
                  <div className="card-body py-5 text-center">
                    <i className="fas fa-spinner fa-spin fa-2x mb-3" style={{ color: "var(--accent)" }} />
                    <p style={{ color: "var(--text-secondary)" }}>Sélection de la prochaine question...</p>
                  </div>
                </StudentCard>
              ) : !question ? (
                <StudentCard className="border-0">
                  <div className="card-body py-5 text-center">
                    <i className="fas fa-exclamation-triangle fa-2x mb-3" style={{ color: "var(--warning)" }} />
                    <h5 style={{ color: "var(--text-primary)" }}>Aucune question disponible</h5>
                    <p style={{ color: "var(--text-secondary)" }}>
                      Ce module ne contient pas encore de questions pour le parcours adaptatif.<br />
                      Les questions doivent être ajoutées via les quiz du module.
                    </p>
                    <button className="btn btn-secondary mt-2" onClick={() => { setSession(null); setQuestion(null); }}>
                      <i className="fas fa-arrow-left mr-2" />Retour
                    </button>
                  </div>
                </StudentCard>
              ) : question ? (
                <StudentCard className="border-0">
                  <div className="card-body p-4 p-md-5">
                    {/* Résultat de la réponse précédente */}
                    {answerResult && (
                      <>
                        <div className="mb-4 p-3 rounded d-flex align-items-center" style={{
                          background: answerResult.correct ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                          border: `1px solid ${answerResult.correct ? "var(--success)" : "var(--danger)"}`,
                          color: answerResult.correct ? "var(--success)" : "var(--danger)"
                        }}>
                          <i className={`fas ${answerResult.correct ? "fa-check-circle" : "fa-times-circle"} mr-2 fa-lg`} />
                          <span className="font-weight-bold">
                            {answerResult.correct ? "Bonne réponse !" : "Réponse incorrecte"}
                          </span>
                        </div>
                        {!answerResult.correct && question?.justification && (
                          <div className="mb-3 p-3 rounded" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <small className="font-weight-bold" style={{ color: 'var(--accent)' }}>
                              <i className="fas fa-graduation-cap mr-1" />Explication :
                            </small>
                            <p className="mb-0 mt-1 small" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{question.justification}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="d-flex align-items-center mb-3" style={{ gap: '0.75rem' }}>
                      {question.aiGenerated && (
                        <span style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff', borderRadius: 8, padding: '2px 10px',
                          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em'
                        }}>
                          <i className="fas fa-sparkles mr-1" style={{ fontSize: '0.65rem' }} />IA
                        </span>
                      )}
                    </div>
                    <h4 className="font-weight-bold mb-4" style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {question.text}
                    </h4>

                    {question.hint && (
                      <div className="mb-4 p-3 rounded d-inline-flex align-items-center" style={{
                        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--warning)"
                      }}>
                        <i className="fas fa-lightbulb mr-2" />
                        <span className="small font-weight-bold">Indice : {question.hint}</span>
                      </div>
                    )}

                    {/* Options QCM */}
                    {question.options && question.options.length > 0 && (
                      <div className="list-group" style={{ gap: "0.75rem" }}>
                        {question.options.map((opt: any) => {
                          const isSel = selectedOptionId === String(opt.id);
                          return (
                            <button key={opt.id} type="button"
                              disabled={!!answerResult}
                              className="list-group-item list-group-item-action p-4 rounded d-flex align-items-center"
                              style={{
                                background: isSel ? "var(--accent)" : "var(--bg-elevated)",
                                border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                                color: isSel ? "#fff" : "var(--text-primary)",
                                transition: "all 0.2s ease",
                                opacity: answerResult ? 0.7 : 1,
                              }}
                              onClick={() => setSelectedOptionId(String(opt.id))}>
                              <div className="mr-3" style={{
                                width: 20, height: 20, borderRadius: "50%",
                                border: `2px solid ${isSel ? "#fff" : "var(--border)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: isSel ? "#fff" : "transparent"
                              }}>
                                {isSel && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />}
                              </div>
                              <span className="font-weight-medium">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Texte libre */}
                    {(!question.options || question.options.length === 0) && (
                      <textarea className="form-control" rows={4}
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "1rem" }}
                        placeholder="Saisissez votre réponse..."
                        value={textAnswer}
                        disabled={!!answerResult}
                        onChange={(e) => setTextAnswer(e.target.value)} />
                    )}
                  </div>

                  <div className="card-footer border-0 p-4 d-flex justify-content-end" style={{ background: "var(--bg-base)", borderTop: "1px solid var(--border) !important" }}>
                    {!answerResult ? (
                      <button className="btn btn-primary px-5 font-weight-bold" style={{ borderRadius: 10 }}
                        disabled={submitting || (!selectedOptionId && !textAnswer.trim())}
                        onClick={handleSubmitAnswer}>
                        {submitting
                          ? <><i className="fas fa-spinner fa-spin mr-2" />Envoi...</>
                          : <><i className="fas fa-paper-plane mr-2" />Valider</>}
                      </button>
                    ) : answeredCount < (session.totalQuestions || 10) ? (
                      <button className="btn btn-primary px-5 font-weight-bold" style={{ borderRadius: 10 }}
                        disabled={questionLoading}
                        onClick={() => loadNextQuestion(session.id)}>
                        {questionLoading
                          ? <><i className="fas fa-spinner fa-spin mr-2" />Chargement...</>
                          : <><i className="fas fa-chevron-right mr-2" />Question suivante</>}
                      </button>
                    ) : (
                      <button className="btn btn-secondary px-5 font-weight-bold" style={{ borderRadius: 10 }} disabled>
                        <i className="fas fa-spinner fa-spin mr-2" />Calcul des résultats...
                      </button>
                    )}
                  </div>
                </StudentCard>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Accueil / Historique ─────────────────────────────────
  return (
    <div className="content">
      <div className="container py-4">
        <StudentPageHeader
          title="Parcours Adaptatif"
          subtitle="Questions adaptées à ton niveau. Difficulté ajustée en temps réel."
          icon="fa-brain"
        />

        {/* CTA */}
        <div className="row mb-4">
          <div className="col-12">
            <StudentCard className="border-0" style={{ borderLeft: "4px solid var(--accent) !important" }}>
              <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap" style={{ gap: "1rem" }}>
                <div>
                  <h5 className="font-weight-bold mb-1" style={{ color: "var(--text-primary)" }}>
                    <i className="fas fa-play-circle mr-2" style={{ color: "var(--accent)" }} />
                    Nouvelle session — {module?.name}
                  </h5>
                  <p className="m-0 small" style={{ color: "var(--text-secondary)" }}>
                    10 questions adaptées à tes lacunes — mix IA + cours.
                  </p>
                </div>
                <button className="btn btn-primary px-4 font-weight-bold" style={{ borderRadius: 10 }}
                  onClick={handleStart} disabled={questionLoading}>
                  {questionLoading
                    ? <><i className="fas fa-spinner fa-spin mr-2" />Chargement...</>
                    : <><i className="fas fa-rocket mr-2" />Démarrer</>}
                </button>
              </div>
            </StudentCard>
          </div>
        </div>

        {/* Historique */}
        <h5 className="font-weight-bold mb-3" style={{ color: "var(--text-primary)" }}>
          <i className="fas fa-history mr-2" style={{ color: "var(--accent)" }} />
          Mes sessions passées
        </h5>
        {sessions.length === 0 ? (
          <div className="empty-state-box py-5">
            <i className="fas fa-brain mb-3" style={{ fontSize: "3rem", color: "var(--border)" }} />
            <p style={{ color: "var(--text-secondary)" }} className="font-weight-bold m-0">
              Aucune session pour l'instant. Lance ta première !
            </p>
          </div>
        ) : (
          <div className="row">
            {sessions.map((s: any) => {
              const score = s.scorePercent ?? 0;
              const passed = score >= 60;
              const diff = DIFFICULTY_LABEL[s.currentDifficulty ?? "EASY"];
              return (
                <div key={s.id} className="col-md-4 mb-4">
                  <StudentCard className="border-0 h-100">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className="badge px-2 py-1" style={{
                          background: s.status === "COMPLETED" ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                          color: s.status === "COMPLETED" ? "var(--success)" : "#f59e0b",
                          borderRadius: 8, fontSize: "0.7rem"
                        }}>
                          {s.status === "COMPLETED" ? "Terminée" : "En cours"}
                        </span>
                        {diff && (
                          <small style={{ color: diff.color }} className="font-weight-bold">
                            <i className={`fas ${diff.icon} mr-1`} />{diff.label}
                          </small>
                        )}
                      </div>
                      <h4 className="font-weight-bold mb-0" style={{ color: passed ? "var(--success)" : "var(--danger)" }}>
                        {score.toFixed(1)}%
                      </h4>
                      <small style={{ color: "var(--text-secondary)" }}>
                        {s.correctCount ?? 0} / {s.answeredCount ?? 0} correctes
                      </small>
                      <p className="mt-3 mb-0 small" style={{ color: "var(--text-secondary)" }}>
                        <i className="fas fa-calendar mr-1" />
                        {s.startedAt ? new Date(s.startedAt).toLocaleDateString("fr-FR") : "—"}
                      </p>
                    </div>
                  </StudentCard>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveQuiz;
