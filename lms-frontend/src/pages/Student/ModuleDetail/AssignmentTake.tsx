import React, { useState, useEffect, useRef } from "react";
import { submitAssignment } from "../../../services/api/course";
import { useAuth as useAuthContext } from "../../../services/AuthContext";
import { ViewModeToggle } from "../../../components/Student/ViewModeToggle";
import { StudentCard } from "../../../components/Student/StudentCard";
import { notifyWarning } from "../../../components/notify";

interface Props { assignment: any; onClose: () => void; isFullScreenMode?: boolean; }

const AssignmentTake: React.FC<Props> = ({ assignment, onClose, isFullScreenMode = false }) => {
  const { user } = useAuthContext();
  const questions = (assignment.questions || []).sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'PAGINATED' | 'SCROLLING'>('PAGINATED');
  const [flagged, setFlagged] = useState<number[]>([]);
  const [timeWarning, setTimeWarning] = useState<null | '5min' | '1min'>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mouseExitCount, setMouseExitCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    // Reprendre la session si un timer valide existe en localStorage
    const timerKey = `assignment_timer_${assignment.id}_${user?.username}`;
    try {
      const savedEnd = localStorage.getItem(timerKey);
      if (savedEnd && Number(savedEnd) > Date.now()) {
        return true; // Session en cours : reprise automatique
      }
    } catch {}
    return false;
  });
  const [mouseExitAlert, setMouseExitAlert] = useState<string | null>(null);
  const mouseAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isModalOpenRef = useRef<boolean>(false);
  const [submitConfirm, setSubmitConfirm] = useState<{ msg: string; unanswered: number } | null>(null);
  const [quitConfirm, setQuitConfirm] = useState(false);

  const answersKey = `assignment_answers_${assignment.id}_${user?.username}`;
  const [answers, setAnswers] = useState<{ [qId: number]: { text: string; optionIds: number[] } }>(() => {
    const base = questions.reduce((acc: any, q: any) => { acc[q.id] = { text: "", optionIds: [] }; return acc; }, {});
    try {
      const saved = localStorage.getItem(`assignment_answers_${assignment.id}_${user?.username}`);
      if (saved) return { ...base, ...JSON.parse(saved) };
    } catch {}
    return base;
  });

  const lastAlertTimeRef = useRef<number>(0);
  const mouseExitCountRef = useRef<number>(0);
  const hasAutoSubmittedRef = useRef<boolean>(false);
  const warnedRef = useRef<Set<string>>(new Set());
  const initialTimeRef = useRef<number | null>(null);
  const questionRefs = useRef<{ [id: number]: HTMLDivElement | null }>({});

  const doClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {}).finally(() => onClose());
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    if (!hasStarted || result) { doClose(); return; }
    isModalOpenRef.current = true;
    setQuitConfirm(true);
  };

  // Persist answers to localStorage
  useEffect(() => {
    if (!hasStarted) return;
    try { localStorage.setItem(answersKey, JSON.stringify(answers)); } catch {}
  }, [answers, hasStarted, answersKey]);

  // Warn before an accidental tab close / refresh while an attempt is in progress
  // (the "Quitter" button above already covers the deliberate in-app exit path)
  useEffect(() => {
    if (!hasStarted || result) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, result]);

  // Anti-copy in strict mode (contextmenu intentionally NOT blocked so DevTools remain accessible)
  useEffect(() => {
    if (!assignment?.strictIntegrityMode || !hasStarted) return;
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("copy", prevent);
    return () => { document.removeEventListener("copy", prevent); };
  }, [assignment, hasStarted]);

  // Track initial time once
  useEffect(() => {
    if (timeLeft !== null && initialTimeRef.current === null) {
      initialTimeRef.current = timeLeft;
    }
  }, [timeLeft]);

  // Time warning modals at 5min and 1min — only if assignment was LONGER than the threshold
  useEffect(() => {
    if (timeLeft === null || !hasStarted || initialTimeRef.current === null) return;
    const initial = initialTimeRef.current;
    if (timeLeft <= 300 && initial > 360 && !warnedRef.current.has('5min')) {
      warnedRef.current.add('5min');
      isModalOpenRef.current = true;
      setTimeWarning('5min');
    } else if (timeLeft <= 60 && initial > 90 && !warnedRef.current.has('1min')) {
      warnedRef.current.add('1min');
      isModalOpenRef.current = true;
      setTimeWarning('1min');
    }
  }, [timeLeft, hasStarted]);

  useEffect(() => {
    // Only apply integrity checks if strictIntegrityMode is active and assignment started
    if (!assignment || !assignment.strictIntegrityMode || !hasStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastAlertTimeRef.current < 1000) return;
        lastAlertTimeRef.current = now;
        setTabSwitchCount((prev) => prev + 1);
        notifyWarning(`Alerte d'intégrité : Changement d'onglet détecté !`);
      }
    };

    const handleBlur = () => {
      const now = Date.now();
      if (now - lastAlertTimeRef.current < 1000) return;
      lastAlertTimeRef.current = now;
      setTabSwitchCount((prev) => prev + 1);
      notifyWarning(`Alerte d'intégrité : Perte de focus détectée !`);
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return;
      if (isModalOpenRef.current) return;
      if (mouseExitCountRef.current >= 3) return;
      mouseExitCountRef.current += 1;
      const count = mouseExitCountRef.current;
      setMouseExitCount(count);
      const msg = count >= 3
        ? `Sortie ${count}/3 — Soumission automatique en cours !`
        : `Sortie de l'écran détectée (${count}/3) — Restez sur la page !`;
      setMouseExitAlert(msg);
      if (mouseAlertTimerRef.current) clearTimeout(mouseAlertTimerRef.current);
      mouseAlertTimerRef.current = setTimeout(() => setMouseExitAlert(null), 3500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [assignment, hasStarted]);

  useEffect(() => {
    if (mouseExitCount >= 3 && assignment?.strictIntegrityMode && hasStarted && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      handleSubmit(true);
    }
  }, [mouseExitCount, assignment, hasStarted]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timeLeft === 0 && hasStarted && !hasAutoSubmittedRef.current && !result) {
      hasAutoSubmittedRef.current = true;
      handleSubmit(true);
    }
  }, [timeLeft, hasStarted, result]);

  useEffect(() => {
    if (!hasStarted) return;
    const timeLimitMinutes = assignment.timeLimit || 0;
    if (timeLimitMinutes <= 0) {
      setTimeLeft(null);
      if (assignment.timeLimit === 0 || assignment.timeLimit === null || assignment.timeLimit === undefined) {
        console.warn(
          `[AssignmentTake] Devoir "${assignment.title}" (id=${assignment.id}) : timeLimit est ${JSON.stringify(assignment.timeLimit)}. Le timer ne sera pas affiché.`
        );
      }
      return;
    }

    const timerKey = `assignment_timer_${assignment.id}_${user?.username}`;
    let targetEnd = localStorage.getItem(timerKey);
    if (!targetEnd || Number(targetEnd) <= Date.now()) {
      const newTarget = Date.now() + timeLimitMinutes * 60 * 1000;
      localStorage.setItem(timerKey, String(newTarget));
      targetEnd = String(newTarget);
    }

    const initialSeconds = Math.max(0, Math.ceil((Number(targetEnd) - Date.now()) / 1000));
    setTimeLeft(initialSeconds);

    const timer = setInterval(() => {
      const end = localStorage.getItem(timerKey);
      if (end) {
        const seconds = Math.max(0, Math.ceil((Number(end) - Date.now()) / 1000));
        setTimeLeft(seconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [assignment, user, hasStarted]);

  const isQcm = (type: string) => type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";

  const isAnswered = (q: any) => {
    if (isQcm(q.type)) return (answers[q.id]?.optionIds || []).length > 0;
    return !!(answers[q.id]?.text || "").trim();
  };

  const toggleFlag = (qId: number) => {
    setFlagged(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
  };

  const goToQuestion = (idx: number) => {
    if (viewMode === 'PAGINATED') {
      setCurrentQuestionIndex(idx);
    } else {
      const q = questions[idx];
      if (q && questionRefs.current[q.id]) {
        questionRefs.current[q.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const toggleOption = (qId: number, optId: number, single: boolean) => {
    setAnswers(prev => {
      const cur = prev[qId].optionIds;
      const next = single
        ? (cur.includes(optId) ? [] : [optId])
        : (cur.includes(optId) ? cur.filter(id => id !== optId) : [...cur, optId]);
      return { ...prev, [qId]: { ...prev[qId], optionIds: next } };
    });
  };

  const handleTextAnswer = (qId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], text } }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (assignment.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation (uses questions[currentQuestionIndex] to avoid hoisting issue)
  useEffect(() => {
    if (!hasStarted || !!result) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (isModalOpenRef.current) return;
      const cur = questions[currentQuestionIndex];
      if (viewMode === 'PAGINATED') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextQuestion(); }
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevQuestion(); }
        if (cur && isQcm(cur.type)) {
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1) {
            const opt = (cur.options || [])[num - 1];
            if (opt) { e.preventDefault(); toggleOption(cur.id, opt.id, cur.type === 'SINGLE_CHOICE'); }
          }
        }
      }
      if ((e.key === 'f' || e.key === 'F') && cur) { e.preventDefault(); toggleFlag(cur.id); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, result, viewMode, currentQuestionIndex, answers]);

  const doSubmit = async () => {
    setSubmitConfirm(null);
    isModalOpenRef.current = false;
    await handleSubmit(false, true);
  };

  const handleSubmit = async (auto = false, confirmed = false) => {
    if (!auto && !confirmed) {
      const unanswered = questions.filter((q: any) => !isAnswered(q));
      isModalOpenRef.current = true;
      setSubmitConfirm({ msg: unanswered.length > 0
        ? `${unanswered.length} question(s) sans réponse. Voulez-vous quand même soumettre ?`
        : `Vous avez répondu à toutes les questions. Confirmer la soumission ?`,
        unanswered: unanswered.length
      });
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const timerKey = `assignment_timer_${assignment.id}_${user?.username}`;
      localStorage.removeItem(timerKey);
      localStorage.removeItem(answersKey);

      const payload = {
        assignmentId: Number(assignment.id),
        studentUsername: user?.username || "",
        answers: (assignment.questions || []).map((q: any) => ({
          questionId: Number(q.id),
          textAnswer: isQcm(q.type) ? null : (answers[q.id]?.text || ""),
          selectedOptionIds: isQcm(q.type) ? (answers[q.id]?.optionIds || []) : [],
        })),
        integrityReport: {
          mouseExitCount: mouseExitCount || 0,
          tabSwitchCount: tabSwitchCount || 0,
          autoSubmitted: auto,
          notes: flagged.length > 0 ? `Questions marquées: ${flagged.join(",")}` : "",
        }
      };
      const data = await submitAssignment(assignment.id, payload);
      setResult(data);
    } catch (err: any) {
      const backendMsg = typeof err?.response?.data === "string"
        ? err.response.data
        : err?.response?.data?.message;
      setError(backendMsg || err.message || "Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = questions.filter((q: any) => isAnswered(q)).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleStart = () => {
    setHasStarted(true);
    if (isFullScreenMode) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request failed", err);
        });
      }
    }
  };

  if (!hasStarted && !result) {
    const statItems = [
      { icon: 'fa-list-ol', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', value: String(questions.length), label: 'Questions' },
      { icon: 'fa-star', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', value: String(assignment.maxScore), label: 'Points' },
      { icon: 'fa-clock', color: 'var(--accent)', bg: 'rgba(59,130,246,0.1)', value: assignment.timeLimit > 0 ? `${assignment.timeLimit} min` : '∞', label: 'Durée' },
    ];
    return (
      <div className="d-flex flex-column align-items-center justify-content-center w-100" style={{ minHeight: '80vh', padding: '2rem' }}>
        <StudentCard className="border-0 shadow-lg text-center" style={{ maxWidth: '560px', width: '100%' }}>
          <div style={{ padding: '2.5rem 2.5rem 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'var(--btn-soft-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem', color: 'var(--accent)' }}>
              <i className="fas fa-file-signature" />
            </div>
            <h2 className="font-weight-bold mb-2" style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}>{assignment.title}</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-0">{assignment.description || 'Prêt à commencer ?'}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', padding: '2rem 2.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '1.75rem 0 0' }}>
            {statItems.map(({ icon, color, bg, value, label }) => (
              <div key={label} style={{ background: bg, borderRadius: '14px', padding: '1.25rem 0.5rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem', color: '#fff', fontSize: '1rem' }}>
                  <i className={`fas ${icon}`} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '3px' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 2.5rem 2.5rem' }}>
            {assignment.strictIntegrityMode && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '1.5rem', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <i className="fas fa-shield-alt" style={{ color: '#f59e0b', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <strong style={{ color: 'var(--warning)' }}>Mode surveillance activé</strong><br />
                  Sorties écran, perte de focus et changements d'onglet sont détectés. Copier-coller désactivé. 3 sorties = soumission automatique.
                </div>
              </div>
            )}
            <div className="d-flex justify-content-center mt-4" style={{ gap: '0.75rem' }}>
              <button className="btn btn-secondary px-4 py-2 font-weight-bold" style={{ borderRadius: '10px' }} onClick={handleClose}>Annuler</button>
              <button className="btn btn-primary px-5 py-2 font-weight-bold" style={{ borderRadius: '10px' }} onClick={handleStart}>
                <i className="fas fa-play mr-2"></i> Démarrer
              </button>
            </div>
          </div>
        </StudentCard>
      </div>
    );
  }

  if (result) {
    const score = result.score ?? 0;
    const max = assignment.maxScore ?? 20;
    const pct = Math.round((score / max) * 100);
    const passed = pct >= 50;
    const resultAnswers = result.answers || [];
    const correctCount = resultAnswers.filter((a: any) => (a.scoreAwarded ?? 0) > 0).length;
    const scoreColor = passed ? 'var(--success)' : 'var(--danger)';
    const circumference = 2 * Math.PI * 52;
    const dashOffset = circumference - (pct / 100) * circumference;

    return (
      <div className="mt-4">
        <StudentCard className="mb-4 text-center border-0">
          <div style={{ borderTop: `4px solid ${scoreColor}`, borderRadius: '12px 12px 0 0' }} />
          <div className="card-body py-5">
            {/* Circular score */}
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.75rem' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="10"
                  strokeDasharray={String(circumference)} strokeDashoffset={String(dashOffset)}
                  style={{ transition: 'stroke-dashoffset 1s ease', strokeLinecap: 'round' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: scoreColor, lineHeight: 1 }}>{pct}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Score</span>
              </div>
            </div>

            <h2 className="mb-1 font-weight-bold" style={{ color: 'var(--text-primary)' }}>
              {passed ? 'Bravo ! Devoir réussi 🎉' : 'Devoir terminé'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-4 small">{assignment.title}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
              {[
                { value: `${score.toFixed(1)} / ${max}`, label: 'Note', color: scoreColor },
                { value: `${pct}%`, label: 'Réussite', color: 'var(--text-primary)' },
                { value: `${correctCount} / ${questions.length}`, label: 'Correctes', color: 'var(--text-primary)' },
              ].map(({ value, label, color }) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem 0.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginTop: '3px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </StudentCard>

        <h4 className="mb-4 font-weight-bold d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-list-ol mr-2" style={{ color: 'var(--accent)' }}></i> Correction détaillée
        </h4>

        {resultAnswers.map((ans: any, idx: number) => {
          const qId = ans.question?.id || ans.questionId;
          const q = questions.find((q: any) => Number(q.id) === Number(qId));
          const pts = ans.scoreAwarded ?? 0;
          const isPerfect = pts === (q?.points ?? 0);
          const isCorrect = pts > 0;
          
          let statusColor = "var(--danger)";
          let statusBg = "rgba(220, 38, 38, 0.1)";
          if (isPerfect) {
              statusColor = "var(--success)";
              statusBg = "rgba(22, 163, 74, 0.1)";
          } else if (isCorrect) {
              statusColor = "var(--warning)";
              statusBg = "rgba(245, 158, 11, 0.1)";
          }

          return (
            <StudentCard key={idx} className="mb-4 border-0" style={{ borderLeft: `4px solid ${statusColor} !important` }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <h5 style={{ color: 'var(--text-primary)', fontWeight: 700, lineHeight: '1.5', margin: 0, paddingRight: '2rem' }}>
                      <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>Q{idx + 1}.</span>
                      {q?.text}
                  </h5>
                  <span className="badge flex-shrink-0 px-3 py-2" style={{ background: statusBg, color: statusColor, borderRadius: "8px", fontSize: '0.85rem' }}>
                    {pts.toFixed(1)} / {q?.points ?? "?"} pts
                  </span>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <div className="p-3 h-100 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                      <small style={{ color: 'var(--text-secondary)' }} className="font-weight-bold text-uppercase d-block mb-2">Votre réponse</small>
                      <p style={{ color: 'var(--text-primary)' }} className="mb-0">
                          {ans.textAnswer || (ans.selectedOptions?.map((o: any) => o.text).join(", ")) || <em className="text-muted">Aucune réponse</em>}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 h-100 rounded" style={{ background: statusBg, border: `1px dashed ${statusColor}` }}>
                      <small style={{ color: 'var(--text-secondary)' }} className="font-weight-bold text-uppercase d-block mb-2">Correction</small>
                      <p style={{ color: statusColor }} className="mb-0 font-weight-bold">
                        {q?.type === "ESSAY" || q?.type === "SHORT_ANSWER" ? (q.justification || "Réponse évaluée par l'IA.") : (q?.options?.filter((o: any) => o.correct).map((o: any) => o.text).join(", ") || "—")}
                      </p>
                    </div>
                  </div>
                </div>
                
                {ans.aiFeedback && (
                  <div className="mt-4 p-3 rounded" style={{ background: "var(--btn-soft-bg)", borderLeft: "4px solid var(--accent)" }}>
                    <small style={{ color: "var(--accent)" }} className="font-weight-bold text-uppercase d-block mb-2">
                        <i className="fas fa-robot mr-1"></i> Analyse de l'IA
                    </small>
                    <p style={{ color: 'var(--text-primary)' }} className="mb-0 small">{ans.aiFeedback}</p>
                  </div>
                )}
              </div>
            </StudentCard>
          );
        })}
        
        <div className="text-center mt-5 mb-3">
          <button className="btn btn-secondary btn-lg px-5" style={{ borderRadius: "10px", fontWeight: 700 }} onClick={handleClose}>
            <i className="fas fa-arrow-left mr-2"></i> Retour au module
          </button>
        </div>
      </div>
    );
  }

  const renderQuestion = (q: any, index: number) => (
    <div key={q.id} ref={(el) => { questionRefs.current[q.id] = el; }}
      className={`${viewMode === 'SCROLLING' ? 'mb-5 pb-5 border-bottom' : ''} animate__animated animate__fadeIn`}
      style={{ borderColor: 'var(--border)', userSelect: (assignment.strictIntegrityMode && hasStarted) ? 'none' : undefined }}>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <h4 className="font-weight-bold flex-grow-1 m-0" style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
          {viewMode === 'SCROLLING' && <span style={{ color: 'var(--accent)', marginRight: '0.75rem' }}>{index + 1}.</span>}
          {q.text}
        </h4>
        <div className="d-flex align-items-center flex-shrink-0 ml-3" style={{ gap: '0.5rem' }}>
          <button type="button" onClick={() => toggleFlag(q.id)}
            title={flagged.includes(q.id) ? 'Retirer le marquage' : 'Marquer pour révision'}
            style={{ background: flagged.includes(q.id) ? 'rgba(245,158,11,0.15)' : 'transparent', border: `1.5px solid ${flagged.includes(q.id) ? '#f59e0b' : 'var(--border)'}`, color: flagged.includes(q.id) ? '#f59e0b' : 'var(--text-secondary)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            <i className="fas fa-flag" />
            {!flagged.includes(q.id) && <span>Marquer</span>}
          </button>
          <span className="badge px-3 py-2" style={{ background: 'var(--btn-soft-bg)', color: 'var(--btn-soft-text)', borderRadius: '8px' }}>
            {q.points} pts
          </span>
        </div>
      </div>
      
      {q.hint && (
        <div className="mb-4 p-3 rounded d-inline-flex align-items-center" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "var(--warning)" }}>
          <i className="fas fa-lightbulb mr-2 fa-lg" />
          <span className="small font-weight-bold">Indice : {q.hint}</span>
        </div>
      )}

      <div className="mt-4">
        {q.type === "SINGLE_CHOICE" && (
          <div className="list-group" style={{ gap: '0.75rem' }}>
            {(q.options || []).map((opt: any, oi: number) => {
              const isSelected = answers[q.id]?.optionIds.includes(opt.id);
              return (
                <button key={opt.id ?? oi} type="button" 
                        className={`list-group-item list-group-item-action p-4 rounded d-flex align-items-center ${isSelected ? 'active shadow-sm' : ''}`} 
                        style={{ 
                            background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)', 
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                            color: isSelected ? '#fff' : 'var(--text-primary)',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => toggleOption(q.id, opt.id, true)}>
                  <div className="mr-3" style={{ 
                      width: '20px', height: '20px', borderRadius: '50%', 
                      border: `2px solid ${isSelected ? '#fff' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? '#fff' : 'transparent'
                  }}>
                      {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }} />}
                  </div>
                  <span className="font-weight-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}
        {q.type === "MULTIPLE_CHOICE" && (
          <div className="list-group" style={{ gap: '0.75rem' }}>
            <small style={{ color: 'var(--text-secondary)' }} className="mb-2 d-block font-weight-bold">
                <i className="fas fa-info-circle mr-1" /> Plusieurs réponses possibles
            </small>
            {(q.options || []).map((opt: any, oi: number) => {
              const isSelected = answers[q.id]?.optionIds.includes(opt.id);
              return (
                <button key={opt.id ?? oi} type="button" 
                        className={`list-group-item list-group-item-action p-4 rounded d-flex align-items-center ${isSelected ? 'active shadow-sm' : ''}`} 
                        style={{ 
                            background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)', 
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                            color: isSelected ? '#fff' : 'var(--text-primary)',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => toggleOption(q.id, opt.id, false)}>
                  <div className="mr-3" style={{ 
                      width: '20px', height: '20px', borderRadius: '4px', 
                      border: `2px solid ${isSelected ? '#fff' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? '#fff' : 'transparent'
                  }}>
                      {isSelected && <i className="fas fa-check" style={{ color: 'var(--accent)', fontSize: '12px' }} />}
                  </div>
                  <span className="font-weight-medium">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}
        {(q.type === "ESSAY" || q.type === "SHORT_ANSWER") && (
          <textarea className="form-control" rows={q.type === "ESSAY" ? 8 : 3} 
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '10px', padding: '1rem', resize: 'vertical' }} 
                    placeholder="Saisissez votre réponse ici..." 
                    value={answers[q.id]?.text || ""} onChange={e => handleTextAnswer(q.id, e.target.value)} />
        )}
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Quit confirmation modal
  const renderQuitConfirmModal = () => {
    if (!quitConfirm) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: 'var(--bg-base)', borderRadius: '18px', padding: '2.5rem 2rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1.5px solid var(--border)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem', color: '#ef4444' }}>
            <i className="fas fa-door-open" />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.6rem' }}>Quitter le devoir ?</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Vos réponses sont sauvegardées localement. <br />Vous pourrez reprendre si vous revenez sur cette page.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary px-4 font-weight-bold" style={{ borderRadius: '10px' }}
              onClick={() => { setQuitConfirm(false); isModalOpenRef.current = false; }}>
              Rester
            </button>
            <button className="btn font-weight-bold px-5"
              style={{ borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid #ef4444', color: '#ef4444' }}
              onClick={() => { setQuitConfirm(false); isModalOpenRef.current = false; doClose(); }}>
              <i className="fas fa-sign-out-alt mr-2" />Quitter
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Submit confirmation modal (replaces window.confirm to avoid mouseout false positives)
  const renderSubmitConfirmModal = () => {
    if (!submitConfirm) return null;
    const { msg, unanswered } = submitConfirm;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: 'var(--bg-base)', borderRadius: '18px', padding: '2.5rem 2rem', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1.5px solid var(--border)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: unanswered > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem', color: unanswered > 0 ? '#f59e0b' : 'var(--accent)' }}>
            <i className={`fas ${unanswered > 0 ? 'fa-exclamation-triangle' : 'fa-paper-plane'}`} />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.6rem' }}>Soumettre le devoir ?</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>{msg}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary px-4 font-weight-bold" style={{ borderRadius: '10px' }}
              onClick={() => { setSubmitConfirm(null); isModalOpenRef.current = false; }}>
              Annuler
            </button>
            <button className="btn btn-primary px-5 font-weight-bold" style={{ borderRadius: '10px' }} onClick={doSubmit}>
              <i className="fas fa-paper-plane mr-2" /> Soumettre
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Time-warning modal (5 min / 1 min)
  const renderTimeWarningModal = () => {
    if (!timeWarning) return null;
    const is5 = timeWarning === '5min';
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
        <div style={{ background: 'var(--bg-base)', borderRadius: '18px', padding: '2.5rem 2rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', border: `2px solid ${is5 ? '#f59e0b' : '#ef4444'}` }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: is5 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem', color: is5 ? '#f59e0b' : '#ef4444' }}>
            <i className={`fas ${is5 ? 'fa-exclamation-triangle' : 'fa-fire'}`} />
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.6rem' }}>
            {is5 ? '⚠️ 5 minutes restantes !' : '🔥 1 minute restante !'}
          </h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {is5
              ? `${answeredCount} question(s) répondue(s) sur ${questions.length}. Terminez vos réponses.`
              : 'Dernière minute ! Vérifiez vos réponses et soumettez.'}
          </p>
          <button className="btn btn-primary px-5 font-weight-bold" style={{ borderRadius: '10px' }} onClick={() => { setTimeWarning(null); isModalOpenRef.current = false; }}>
            Continuer l'examen
          </button>
        </div>
      </div>
    );
  };

  // Question navigation palette
  const renderPalette = () => (
    <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
      {/* Top progress stripe — Google Forms style */}
      {hasStarted && (
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '0' }}>
          <div role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}
            style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', transition: 'width 0.4s ease', borderRadius: '0 2px 2px 0' }} />
        </div>
      )}
      <div style={{ padding: '0.75rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
        <small style={{ color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap', marginRight: '4px' }}>Aller à :</small>
        {questions.map((q: any, idx: number) => {
          const ans = isAnswered(q);
          const flg = flagged.includes(q.id);
          const cur = idx === currentQuestionIndex && viewMode === 'PAGINATED';
          const bg   = cur ? 'var(--accent)' : flg ? 'rgba(245,158,11,0.12)' : ans ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-base)';
          const bdr  = cur ? 'var(--accent)' : flg ? '#f59e0b' : ans ? 'var(--accent)' : 'var(--border)';
          const clr  = cur ? '#fff'         : flg ? '#f59e0b' : ans ? 'var(--accent)' : 'var(--text-secondary)';
          return (
            <button key={q.id} type="button" onClick={() => goToQuestion(idx)}
              title={`Q${idx + 1}${ans ? ' ✓' : ''}${flg ? ' 🚩' : ''}`}
              style={{ width: '30px', height: '30px', borderRadius: '7px', border: `1.5px solid ${bdr}`, background: bg, color: clr, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', padding: 0, transition: 'all 0.12s', flexShrink: 0 }}>
              {flg ? <i className="fas fa-flag" style={{ fontSize: '0.65rem' }} /> : idx + 1}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{answeredCount}</span>/{questions.length} répondue{answeredCount > 1 ? 's' : ''}
          </span>
          {flagged.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
              <i className="fas fa-flag mr-1" />{flagged.length} marquée{flagged.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between mt-1" style={{ gap: '1rem', flexWrap: 'wrap' }}>
        <div className="d-flex align-items-center" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          {[{ c: 'var(--accent)', l: 'Répondu' }, { c: '#f59e0b', l: 'Marqué' }, { c: 'var(--accent)', l: 'Actuel' }, { c: 'var(--border)', l: 'Vide' }].map(({ c, l }) => (
            <span key={l} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: c, display: 'inline-block' }} />{l}
            </span>
          ))}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <kbd style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', fontSize: '0.65rem' }}>←→</kbd> Nav·
          <kbd style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', fontSize: '0.65rem' }}>1-4</kbd> Sélect·
          <kbd style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', fontSize: '0.65rem' }}>F</kbd> Flag
        </div>
      </div>
      </div>
    </div>
  );

  // Rendu de la Topbar
  const renderHeader = () => (
    <div className={`d-flex justify-content-between align-items-center w-100 py-3`} style={{ gap: '0.75rem', flexWrap: 'nowrap' }}>
      {/* Left: title */}
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <h3 className="font-weight-bold m-0" style={{ color: 'var(--text-primary)', fontSize: isFullScreenMode ? '1.2rem' : '1.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <i className="fas fa-file-signature mr-2" style={{ color: 'var(--accent)' }}></i>{assignment.title}
        </h3>
        <p style={{ color: 'var(--text-secondary)' }} className="m-0 font-weight-bold mt-1 small">
          {questions.length} questions · {assignment.maxScore} pts
        </p>
      </div>

      {/* Right: view toggle | divider | timer | shield | mouse alert | close */}
      <div className="d-flex align-items-center" style={{ gap: '0.5rem', flexShrink: 0 }}>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} aria-label="Mode d'affichage" />

        {/* Divider only if there is something to show after it */}
        {(timeLeft !== null || assignment.strictIntegrityMode || (!assignment.strictIntegrityMode)) && (
          <div style={{ width: '1px', height: '28px', background: 'var(--border)', margin: '0 4px' }} />
        )}

        {/* Timer — affiché dès qu'il y a une limite de temps, indépendamment du mode strict */}
        {timeLeft !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: timeLeft < 60 ? 'rgba(239,68,68,0.12)' : timeLeft < 300 ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.1)',
            border: `1.5px solid ${timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : 'var(--accent)'}`,
            color: timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : 'var(--accent)',
            padding: '6px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '1rem',
            animation: timeLeft < 60 ? 'pulse-time-assign 1s infinite alternate' : 'none',
            minWidth: '80px', justifyContent: 'center',
          }}>
            <i className={`fas fa-clock ${timeLeft < 60 ? 'fa-pulse' : ''}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}

        {/* Shield badge — mode strict actif */}
        {assignment.strictIntegrityMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: mouseExitCount >= 2 ? 'rgba(239,68,68,0.1)' : mouseExitCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.08)',
            border: `1.5px solid ${mouseExitCount >= 2 ? '#ef4444' : mouseExitCount > 0 ? '#f59e0b' : '#6366f1'}`,
            color: mouseExitCount >= 2 ? '#ef4444' : mouseExitCount > 0 ? '#f59e0b' : '#6366f1',
            padding: '6px 12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem',
          }}>
            <i className="fas fa-shield-alt" />
            <span>{mouseExitCount}/3</span>
          </div>
        )}

        {/* Badge mode libre — mode strict inactif */}
        {!assignment.strictIntegrityMode && hasStarted && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: 'rgba(34,197,94,0.08)',
            border: '1.5px solid rgba(34,197,94,0.35)',
            color: 'var(--success)',
            padding: '6px 12px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem',
          }}>
            <i className="fas fa-unlock-alt" />
            <span>Mode libre</span>
          </div>
        )}

        {/* Inline mouse-exit alert — visible in header, auto-dismisses */}
        {mouseExitAlert && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: mouseExitCount >= 3 ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)',
            border: `2px solid ${mouseExitCount >= 3 ? '#ef4444' : '#f59e0b'}`,
            color: mouseExitCount >= 3 ? '#ef4444' : 'var(--warning)',
            padding: '6px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem',
            maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            animation: 'pulse-time-assign 0.6s ease',
          }}>
            <i className={`fas ${mouseExitCount >= 3 ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}`} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{mouseExitAlert}</span>
          </div>
        )}

        {/* Prominent close / quit button */}
        <button
          onClick={handleClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid #ef4444',
            color: '#ef4444', borderRadius: '10px', padding: '6px 14px',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          title="Quitter le devoir"
        >
          <i className="fas fa-sign-out-alt" />
          <span>Quitter</span>
        </button>
      </div>
    </div>
  );

  // Rendu des actions (Sticky bottom si plein écran)
  const renderActions = () => (
    <div className="d-flex justify-content-between align-items-center flex-wrap w-100" style={{ gap: '1rem' }}>
      {viewMode === 'PAGINATED' ? (
        <>
          <button type="button" className="btn btn-secondary px-4 font-weight-bold" style={{ borderRadius: "10px" }} 
                  onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
            <i className="fas fa-chevron-left mr-2"></i> Précédent
          </button>
          <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
            {/* Quitter is always visible in header — no need to duplicate here */}
            {currentQuestionIndex < questions.length - 1 ? (
              <button type="button" className="btn btn-primary px-4 shadow-sm font-weight-bold" style={{ borderRadius: "10px" }} onClick={nextQuestion}>
                Suivant <i className="fas fa-chevron-right ml-2"></i>
              </button>
            ) : (
              <button type="button" className="btn btn-primary px-5 font-weight-bold shadow-sm" style={{ borderRadius: "10px" }} onClick={() => handleSubmit()} disabled={submitting}>
                {submitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>} Terminer
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-secondary px-4 font-weight-bold" style={{ borderRadius: "10px" }} onClick={handleClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary px-5 font-weight-bold shadow-sm" style={{ borderRadius: "10px" }} onClick={() => handleSubmit()} disabled={submitting}>
              {submitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>} Soumettre mon devoir
          </button>
        </>
      )}
    </div>
  );

  if (isFullScreenMode) {
     return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)', overflow: 'auto' }}>
           <style dangerouslySetInnerHTML={{__html: `
              @keyframes pulse-time-assign {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                100% { transform: scale(1.05); box-shadow: 0 0 10px 4px rgba(239, 68, 68, 0.2); }
              }
            `}} />
           {renderQuitConfirmModal()}
           {renderSubmitConfirmModal()}
           {renderTimeWarningModal()}
           {/* Sticky Header */}
           <div style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
                 {renderHeader()}
              </div>
           </div>

           {/* Main Content */}
           <div style={{ flex: 1, padding: '2rem 1.5rem 8rem 1.5rem' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <StudentCard className="border-0 shadow-sm">
                    {renderPalette()}
                    {viewMode === 'PAGINATED' && (
                      <div className="card-header border-0 py-3 px-4 px-md-5" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                        <div className="d-flex justify-content-between align-items-center" style={{ gap: '1rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }} className="font-weight-bold flex-shrink-0">
                            Question {currentQuestionIndex + 1} <span style={{ opacity: 0.5 }}>/ {questions.length}</span>
                          </span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden', maxWidth: '180px' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: '99px', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="card-body p-4 p-md-5">
                      {error && <div className="alert alert-danger mb-4 border-0 shadow-sm" style={{ borderRadius: '10px' }}><i className="fas fa-exclamation-circle mr-2"/>{error}</div>}
                      {viewMode === 'PAGINATED' ? (
                          currentQuestion ? renderQuestion(currentQuestion, currentQuestionIndex) : <div className="text-center py-5" style={{ color: 'var(--text-primary)' }}><h4>Fin du devoir</h4></div>
                      ) : (
                          <div>{questions.map((q: any, idx: number) => renderQuestion(q, idx))}</div>
                      )}
                    </div>
                  </StudentCard>
              </div>
           </div>

           {/* Sticky Footer */}
           {!result && (
               <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, background: 'var(--bg-base)', borderTop: '1px solid var(--border)', boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '1rem 0' }}>
                  <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
                     {renderActions()}
                  </div>
               </div>
           )}
        </div>
     );
  }

  // Fallback / Inline mode
  return (
    <div className="mt-2">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-time-assign {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          100% { transform: scale(1.05); box-shadow: 0 0 10px 4px rgba(239, 68, 68, 0.2); }
        }
      `}} />
      {renderQuitConfirmModal()}
      {renderSubmitConfirmModal()}
      {renderTimeWarningModal()}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 0.5rem', marginBottom: '1rem' }}>
        {renderHeader()}
      </div>

      <StudentCard className="border-0 shadow-sm">
        {renderPalette()}
        {viewMode === 'PAGINATED' && (
          <div className="card-header border-0 py-3 px-4 px-md-5" style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
            <div className="d-flex justify-content-between align-items-center" style={{ gap: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }} className="font-weight-bold flex-shrink-0">
                Question {currentQuestionIndex + 1} <span style={{ opacity: 0.5 }}>/ {questions.length}</span>
              </span>
              <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden', maxWidth: '180px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: '99px', transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>
        )}

        <div className="card-body p-4 p-md-5">
          {error && <div className="alert alert-danger mb-4 border-0 shadow-sm" style={{ borderRadius: '10px' }}><i className="fas fa-exclamation-circle mr-2"/>{error}</div>}
          {viewMode === 'PAGINATED' ? (
              currentQuestion ? renderQuestion(currentQuestion, currentQuestionIndex) : <div className="text-center py-5" style={{ color: 'var(--text-primary)' }}><h4>Fin du devoir</h4></div>
          ) : (
              <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }} className="custom-scrollbar pr-3">
                {questions.map((q: any, idx: number) => renderQuestion(q, idx))}
              </div>
          )}
        </div>

        <div className="card-footer border-0 p-4 p-md-5" style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
          {renderActions()}
        </div>
      </StudentCard>
    </div>
  );
};

export default AssignmentTake;
