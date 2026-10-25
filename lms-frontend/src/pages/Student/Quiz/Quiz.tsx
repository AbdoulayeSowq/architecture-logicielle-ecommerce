import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  getQuizzesByModuleId,
  getModuleById,
  getQuizById,
  submitQuiz,
  getQuizResultsByStudentId,
} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";
import { useAuth } from "../../../services/AuthContext";
import { generateRemediation } from "../../../services/api/ai";
import { ViewModeToggle } from "../../../components/Student/ViewModeToggle";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { StudentCard } from "../../../components/Student/StudentCard";
import { notifyWarning, notifyError } from "../../../components/notify";

const StudentQuiz = () => {
  const { moduleId, quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'PAGINATED' | 'SCROLLING'>('PAGINATED');
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [mouseExitCount, setMouseExitCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [resultDetail, setResultDetail] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationData, setRemediationData] = useState<any>(null);
  const [showRemediation, setShowRemediation] = useState(false);
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const isModalOpenRef = useRef<boolean>(false);
  const hasQuittedRef = useRef<boolean>(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (moduleId) {
        const moduleData = moduleId && moduleId !== "modules" ? await getModuleById(moduleId) : null;
        setModule(moduleData);
        const quizzesData = await getQuizzesByModuleId(moduleId);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);

        if (user?.username) {
          const results = await getQuizResultsByStudentId(user.username);
          setStudentResults(Array.isArray(results) ? results : []);
        }
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleId]);

  useEffect(() => {
    // Ne pas relancer le quiz si l'étudiant a volontairement quitté
    if (hasQuittedRef.current) return;
    if (quizId && quizzes.length > 0 && !activeQuiz && !resultDetail) {
      startQuiz(quizId);
    } else if (!quizId && !loading && !activeQuiz && !resultDetail) {
      navigate(`/student/${moduleId}`, { state: { activeTab: 'quiz' } });
    }
  }, [quizId, quizzes, activeQuiz, loading, resultDetail, navigate, moduleId]);

  useEffect(() => {
    if (!activeQuiz || activeQuiz.documentMode !== "NO_DOCS" || !!resultDetail) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isModalOpenRef.current) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          notifyWarning(`Alerte d'intégrité : Changement d'onglet détecté ! (${next})`);
          return next;
        });
      }
    };

    const handleBlur = () => {
      if (isModalOpenRef.current) return;
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        notifyWarning(`Alerte d'intégrité : Perte de focus sur la fenêtre ! (${next})`);
        return next;
      });
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return;
      if (isModalOpenRef.current) return;
      setMouseExitCount((prev) => {
        const next = prev + 1;
        if (next <= 3) {
          notifyWarning(`Alerte d'intégrité (${next}/3) : Ne quittez pas l'écran de l'examen !`);
        }
        return next;
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [activeQuiz, resultDetail]);

  useEffect(() => {
    if (mouseExitCount >= 3 && activeQuiz && activeQuiz.documentMode === "NO_DOCS" && !isSubmitting && !resultDetail) {
      handleSubmitQuiz(true);
    }
  }, [mouseExitCount, activeQuiz, isSubmitting, resultDetail]);

  useEffect(() => {
    if (!activeQuiz || timeLeft === null) return;

    if (timeLeft <= 0) {
      notifyWarning("Temps écoulé ! Soumission automatique du quiz...");
      handleSubmitQuiz(true);
      return;
    }

    const timer = setInterval(() => {
      const timerKey = `quiz_timer_${activeQuiz.id}_${user?.username}`;
      const targetEnd = localStorage.getItem(timerKey);
      
      if (targetEnd) {
        const remaining = Math.max(0, Math.ceil((Number(targetEnd) - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, user]); // Suppression de timeLeft des dépendances pour éviter de recréer l'intervalle chaque seconde

  // Warn before an accidental tab close / refresh while a quiz attempt is in progress
  // (the "Quitter" button above already covers the deliberate in-app exit path)
  useEffect(() => {
    if (!activeQuiz || resultDetail) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeQuiz, resultDetail]);

  const startQuiz = async (quizId: string) => {
    try {
      const quizData = await getQuizById(quizId);
      console.log("QuizData reçu du backend:", quizData); // Ajout du console.log
      if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        notifyError("Ce quiz n'a pas de questions ou n'a pas pu être chargé.");
        return;
      }
      let questions = [...quizData.questions];
      if (quizData.randomizeQuestions) questions.sort(() => Math.random() - 0.5);
      if (quizData.randomizeAnswers) {
        questions = questions.map((q) => ({
          ...q,
          options: Array.isArray(q.options) ? [...q.options].sort(() => Math.random() - 0.5) : [],
        }));
      }
      setActiveQuiz({ ...quizData, questions });
      setCurrentQuestionIndex(0);
      setAnswers(questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: null,
        selectedOptionIds: [],
        textAnswer: "",
      })));
      setStartTime(new Date());
      setMouseExitCount(0);
      setTabSwitchCount(0);
      
      const timeLimitMinutes = quizData.timeLimit || 0;
      if (timeLimitMinutes > 0) {
        const timerKey = `quiz_timer_${quizData.id}_${user?.username}`;
        let targetEnd = localStorage.getItem(timerKey);
        
        // Si le timer existant est déjà expiré ou inexistant, on en crée un nouveau
        if (!targetEnd || Number(targetEnd) <= Date.now()) {
          const newTarget = Date.now() + timeLimitMinutes * 60 * 1000;
          localStorage.setItem(timerKey, String(newTarget));
          targetEnd = String(newTarget);
        }
        
        const initialSeconds = Math.max(0, Math.ceil((Number(targetEnd) - Date.now()) / 1000));
        setTimeLeft(initialSeconds);
      } else {
        setTimeLeft(null);
      }
      
      setAutoSubmitted(false);
    } catch (error) {
      console.error("Error starting quiz:", error);
      notifyError("Erreur lors du chargement du quiz.");
    }
  };

  const selectAnswer = (index: number, optionId: number, isMultiple = false) => {
    const updatedAnswers = [...answers];
    if (isMultiple) {
      const currentSelected = updatedAnswers[index].selectedOptionIds || [];
      const newSelected = currentSelected.includes(optionId)
        ? currentSelected.filter((id: number) => id !== optionId)
        : [...currentSelected, optionId];
      updatedAnswers[index] = { ...updatedAnswers[index], selectedOptionIds: newSelected };
    } else {
      updatedAnswers[index] = { ...updatedAnswers[index], selectedOptionId: optionId };
    }
    setAnswers(updatedAnswers);
  };

  const handleTextAnswer = (index: number, text: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = { ...updatedAnswers[index], textAnswer: text };
    setAnswers(updatedAnswers);
  };

  const nextQuestion = () => {
    if (activeQuiz?.questions && currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((prev) => prev - 1);
  };

  const handleSubmitQuiz = async (auto = false) => {
    if (!user || !activeQuiz) return;
    if (isSubmitting) return;

    try {
      const timerKey = `quiz_timer_${activeQuiz.id}_${user?.username}`;
      localStorage.removeItem(timerKey);

      const formattedAnswers = answers.filter((a) => a.questionId !== null);
      const submissionData = {
        quizId: Number(activeQuiz.id), // Convertir en nombre pour le backend
        studentId: user.username,
        answers: formattedAnswers,
        integrityReport: {
          mouseExitCount: mouseExitCount || 0, // S'assurer que c'est un nombre
          tabSwitchCount: tabSwitchCount || 0, // S'assurer que c'est un nombre
          autoSubmitted: auto,
          suspiciousVideoSegments: [], // Toujours envoyer une liste vide si pas de segments
          notes: "", // Toujours envoyer une chaîne vide si pas de notes
        },
      };
      setIsSubmitting(true);
      const detail = await submitQuiz(submissionData);
      setIsSubmitting(false);
      if (detail) {
        setResultDetail(detail);
        setActiveQuiz(null);
      } else {
        notifyError("La soumission a échoué.");
      }
    } catch (error: any) {
      setIsSubmitting(false);
      notifyError("Erreur lors de la soumission : " + (error.message || "Erreur inconnue"));
    }
  };

  const closeResult = () => {
    hasQuittedRef.current = true;
    setResultDetail(null);
    navigate(`/student/${moduleId}`, { state: { activeTab: 'quiz' } });
  };

  const handleQuitQuiz = () => {
    // Si le quiz est en cours (non soumis), demander confirmation
    isModalOpenRef.current = true;
    setShowQuitConfirm(true);
  };

  const confirmQuit = () => {
    hasQuittedRef.current = true;
    setShowQuitConfirm(false);
    isModalOpenRef.current = false;
    // Nettoyer le timer si présent
    if (activeQuiz) {
      const timerKey = `quiz_timer_${activeQuiz.id}_${user?.username}`;
      localStorage.removeItem(timerKey);
    }
    navigate(`/student/${moduleId}`, { state: { activeTab: 'quiz' } });
  };

  const cancelQuit = () => {
    setShowQuitConfirm(false);
    isModalOpenRef.current = false;
  };

  const handleGetRemediation = async () => {
    if (!resultDetail || !user) return;
    setRemediationLoading(true);
    try {
      const wrongQuestions = (resultDetail.questions || [])
        .filter((q: any) => !q.isCorrect)
        .map((q: any) => ({
          questionText: q.questionText || q.text || "",
          competence: q.competence || "",
          justification: q.justification || "",
          correctAnswer: q.correctAnswerText || "",
        }));
      const moduleIdNum = moduleId ? parseInt(moduleId) : 0;
      const payload = {
        studentId: user.username,
        moduleId: moduleIdNum,
        quizResultId: resultDetail.resultId || resultDetail.id,
        quizTitle: resultDetail.quizTitle || "Quiz",
        wrongQuestions,
      };
      const data = await generateRemediation(payload);
      setRemediationData(data);
      setShowRemediation(true);
    } catch (err: any) {
      notifyError("Impossible de générer le parcours : " + (err.message || "Erreur inconnue"));
    } finally {
      setRemediationLoading(false);
    }
  };

  if (loading && !module) return <PageLoading />;

  if (resultDetail) {
    const { score, scoreOnTwenty, passed, questions = [] } = resultDetail;
    const correctCount = questions.filter((q: any) => q.isCorrect).length;
    return (
      <div className="content">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-md-10">
              <StudentCard 
                className="mb-4 text-center border-0" 
                style={{ borderTop: `4px solid ${passed ? 'var(--success)' : 'var(--danger)'} !important` }}
              >
                <div className="card-body py-5">
                  <div style={{
                      width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1.5rem',
                      background: passed ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                      color: passed ? 'var(--success)' : 'var(--danger)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem'
                  }}>
                      <i className={`fas ${passed ? "fa-trophy" : "fa-times"}`} />
                  </div>
                  
                  <h2 className="mb-2 font-weight-bold" style={{ color: 'var(--text-primary)' }}>
                    {passed ? "Bravo ! Quiz réussi 🎉" : "Résultat du Quiz"}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }} className="mb-5">{resultDetail.quizTitle}</p>
                  
                  <div className="row text-center mb-0 justify-content-center">
                    <div className="col-md-3">
                      <h3 style={{ color: passed ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>{scoreOnTwenty != null ? `${scoreOnTwenty}/20` : "-"}</h3>
                      <small style={{ color: 'var(--text-secondary)' }} className="text-uppercase font-weight-bold">Note</small>
                    </div>
                    <div className="col-md-3">
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{score != null ? `${score.toFixed(1)}%` : "-"}</h3>
                      <small style={{ color: 'var(--text-secondary)' }} className="text-uppercase font-weight-bold">Pourcentage</small>
                    </div>
                    <div className="col-md-3">
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{correctCount} / {questions.length}</h3>
                      <small style={{ color: 'var(--text-secondary)' }} className="text-uppercase font-weight-bold">Correctes</small>
                    </div>
                    <div className="col-md-3">
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{resultDetail.attemptNumber}</h3>
                      <small style={{ color: 'var(--text-secondary)' }} className="text-uppercase font-weight-bold">Tentative</small>
                    </div>
                  </div>
                </div>
              </StudentCard>

              <h4 className="mb-4 font-weight-bold d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-list-ol mr-2" style={{ color: 'var(--accent)' }}></i> Correction détaillée
              </h4>

              {questions.map((q: any, idx: number) => {
                let statusColor = q.isCorrect ? "var(--success)" : "var(--danger)";
                let statusBg = q.isCorrect ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)";

                return (
                  <StudentCard key={q.questionId} className="mb-4 border-0" style={{ borderLeft: `4px solid ${statusColor} !important` }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <h5 style={{ color: 'var(--text-primary)', fontWeight: 700, lineHeight: '1.5', margin: 0, paddingRight: '2rem' }}>
                            <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>Q{idx + 1}.</span>
                            {q.text}
                        </h5>
                        <span className="badge flex-shrink-0 px-3 py-2" style={{ background: statusBg, color: statusColor, borderRadius: "8px", fontSize: '0.85rem' }}>
                          {q.isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      
                      <div className="row">
                        {q.options && q.options.length > 0 ? (
                          <div className="col-12">
                            <div className="list-group mb-3" style={{ gap: '0.75rem' }}>
                              {q.options.map((opt: any) => {
                                const isStudentChoice = q.selectedOptionId === opt.id || (q.selectedOptionIds && q.selectedOptionIds.includes(opt.id));
                                let borderCol = "var(--border)";
                                let bgCol = "var(--bg-elevated)";
                                let textCol = "var(--text-primary)";
                                let icon = "fa-circle";
                                
                                if (opt.correct) { 
                                  borderCol = "var(--success)"; 
                                  bgCol = "rgba(22, 163, 74, 0.1)"; 
                                  textCol = "var(--success)"; 
                                  icon = "fa-check-circle";
                                } else if (isStudentChoice) { 
                                  borderCol = "var(--danger)"; 
                                  bgCol = "rgba(220, 38, 38, 0.1)"; 
                                  textCol = "var(--danger)"; 
                                  icon = "fa-times-circle";
                                }

                                return (
                                  <div key={opt.id} className="list-group-item rounded p-3 d-flex align-items-center" style={{ background: bgCol, border: `1px solid ${borderCol}`, color: textCol }}>
                                    <i className={`fas ${icon} mr-3`}></i>
                                    {opt.text}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {q.textAnswer && (
                          <div className="col-md-6 mb-3 mb-md-0">
                            <div className="p-3 h-100 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                              <small style={{ color: 'var(--text-secondary)' }} className="font-weight-bold text-uppercase d-block mb-2">Votre réponse</small>
                              <p style={{ color: 'var(--text-primary)' }} className="mb-0">{q.textAnswer}</p>
                            </div>
                          </div>
                        )}
                        
                        {q.justification && (
                          <div className={q.textAnswer ? "col-md-6" : "col-12"}>
                            <div className="p-3 h-100 rounded" style={{ background: "var(--btn-soft-bg)", borderLeft: "4px solid var(--accent)" }}>
                              <small style={{ color: "var(--accent)" }} className="font-weight-bold text-uppercase d-block mb-2">
                                  <i className="fas fa-info-circle mr-1"></i> Justification
                              </small>
                              <p style={{ color: 'var(--text-primary)' }} className="mb-0 small">{q.justification}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </StudentCard>
                );
              })}
              
              <div className="text-center mt-5 mb-3">
                <button className="btn btn-secondary btn-lg px-5" style={{ borderRadius: "10px", fontWeight: 700 }} onClick={closeResult}>
                  <i className="fas fa-arrow-left mr-2"></i> Retour au module
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderQuestion = (q: any, index: number) => {
    const currentAnswer = answers[index] || {};
    return (
      <div key={q.id} className={`${viewMode === 'SCROLLING' ? 'mb-5 pb-5 border-bottom' : ''} animate__animated animate__fadeIn`} style={{ borderColor: 'var(--border)' }}>
        <div className="d-flex justify-content-between align-items-start mb-4">
          <h4 className="font-weight-bold flex-grow-1 m-0" style={{ color: 'var(--text-primary)', lineHeight: "1.5" }}>
            {viewMode === 'SCROLLING' && <span style={{ color: 'var(--accent)', marginRight: '0.75rem' }}>{index + 1}.</span>}
            {q.text}
          </h4>
          <span className="badge ml-3 flex-shrink-0 px-3 py-2" style={{ background: 'var(--btn-soft-bg)', color: 'var(--btn-soft-text)', borderRadius: '8px' }}>
              {q.points} pts
          </span>
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
                const isSelected = currentAnswer.selectedOptionId === opt.id;
                return (
                  <button key={opt.id ?? oi} type="button" 
                          className={`list-group-item list-group-item-action p-4 rounded d-flex align-items-center ${isSelected ? 'active shadow-sm' : ''}`} 
                          style={{ 
                              background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)', 
                              border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                              color: isSelected ? '#fff' : 'var(--text-primary)',
                              transition: 'all 0.2s ease'
                          }}
                          onClick={() => selectAnswer(index, opt.id)}>
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
                const isSelected = currentAnswer.selectedOptionIds?.includes(opt.id);
                return (
                  <button key={opt.id ?? oi} type="button" 
                          className={`list-group-item list-group-item-action p-4 rounded d-flex align-items-center ${isSelected ? 'active shadow-sm' : ''}`} 
                          style={{ 
                              background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)', 
                              border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                              color: isSelected ? '#fff' : 'var(--text-primary)',
                              transition: 'all 0.2s ease'
                          }}
                          onClick={() => selectAnswer(index, opt.id, true)}>
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
          {(q.type === "SHORT_ANSWER" || q.type === "ESSAY") && (
            <textarea className="form-control" rows={q.type === "ESSAY" ? 8 : 3} 
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '10px', padding: '1rem', resize: 'vertical' }} 
                      placeholder="Saisissez votre réponse ici..." 
                      value={currentAnswer.textAnswer || ""} onChange={(e) => handleTextAnswer(index, e.target.value)} />
          )}
        </div>
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (activeQuiz) {
    const questionsList = activeQuiz.questions || [];
    const currentQuestion = questionsList[currentQuestionIndex];
    const progress = questionsList.length > 0 ? ((currentQuestionIndex + 1) / questionsList.length) * 100 : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
          {/* Modale de confirmation de sortie */}
          {showQuitConfirm && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'var(--bg-base)', borderRadius: '18px', padding: '2.5rem 2rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: '1.5px solid var(--border)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem', color: '#ef4444' }}>
                  <i className="fas fa-door-open" />
                </div>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '0.6rem' }}>Quitter le quiz ?</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                  Vos réponses en cours ne seront <strong>pas sauvegardées</strong>.<br />Le quiz comptera comme abandonné.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button className="btn btn-secondary px-4 font-weight-bold" style={{ borderRadius: '10px' }} onClick={cancelQuit}>
                    Continuer le quiz
                  </button>
                  <button className="btn font-weight-bold px-5"
                    style={{ borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1.5px solid #ef4444', color: '#ef4444' }}
                    onClick={confirmQuit}>
                    <i className="fas fa-sign-out-alt mr-2" />Quitter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Topbar */}
          <div style={{ 
              position: 'sticky', top: 0, zIndex: 100, 
              background: 'var(--bg-base)', borderBottom: '1px solid var(--border)',
              padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
              <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
                  <button type="button" onClick={handleQuitQuiz} className="btn btn-light rounded-pill px-3 shadow-sm font-weight-bold text-muted" title="Quitter le quiz" aria-label="Quitter le quiz">
                      <i className="fas fa-times" />
                  </button>
                  <div>
                      <h4 className="m-0 font-weight-bold" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                          <i className="fas fa-vial mr-2 text-primary" /> {activeQuiz.title}
                      </h4>
                      <div className="small font-weight-bold text-muted mt-1">
                          Question {currentQuestionIndex + 1} sur {questionsList.length}
                      </div>
                  </div>
              </div>
              
              <div className="d-flex align-items-center" style={{ gap: '1.5rem' }}>
                  {timeLeft !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : timeLeft < 300 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : 'var(--accent)'}`,
                      color: timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : 'var(--accent)',
                      padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem',
                      animation: timeLeft < 60 ? 'pulse-time 1s infinite alternate' : 'none',
                    }}>
                      <i className={`fas fa-clock ${timeLeft < 60 ? 'fa-pulse' : ''}`} />
                      <span>{formatTime(timeLeft)}</span>
                    </div>
                  )}
                  {activeQuiz.documentMode === "NO_DOCS" && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: mouseExitCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      border: `1px solid ${mouseExitCount > 0 ? '#f59e0b' : '#6366f1'}`,
                      color: mouseExitCount > 0 ? '#f59e0b' : '#6366f1',
                      padding: '8px 14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      <i className="fas fa-shield-alt" />
                      <span>Alertes : {mouseExitCount}/3</span>
                    </div>
                  )}
                  <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
              </div>
          </div>

          {/* Main Canvas */}
          <div style={{ flex: '1', overflowY: 'auto' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', paddingBottom: '150px' }}>
                  {viewMode === 'PAGINATED' && (
                      <div className="mb-5">
                          <div className="progress flex-grow-1" style={{ height: "8px", borderRadius: "4px", background: "var(--border)" }}>
                              <div className="progress-bar" role="progressbar" style={{ width: `${progress}%`, borderRadius: "4px", background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
                          </div>
                      </div>
                  )}
                  
                  {viewMode === 'PAGINATED' ? renderQuestion(currentQuestion, currentQuestionIndex) : 
                    <div className="custom-scrollbar">
                        {questionsList.map((q: any, idx: number) => renderQuestion(q, idx))}
                    </div>
                  }
              </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-base)', borderTop: '1px solid var(--border)',
              padding: '1rem 2rem', display: 'flex', justifyContent: 'center',
              boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
          }}>
              <div style={{ maxWidth: '900px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {viewMode === 'PAGINATED' ? (
                      <>
                          <button className="btn btn-secondary px-4 py-2 font-weight-bold" style={{ borderRadius: "8px" }} onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                              <i className="fas fa-chevron-left mr-2"></i> Précédent
                          </button>
                          
                          {currentQuestionIndex < questionsList.length - 1 ? 
                              <button className="btn btn-primary px-5 py-2 shadow-sm font-weight-bold" style={{ borderRadius: "8px" }} onClick={nextQuestion}>
                                  Suivant <i className="fas fa-chevron-right ml-2"></i>
                              </button> :
                              <button className="btn btn-primary px-5 py-2 font-weight-bold shadow-sm" style={{ borderRadius: "8px", background: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleSubmitQuiz()}>
                                  {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>} Soumettre
                              </button>
                          }
                      </>
                  ) : (
                      <>
                          <div /> {/* Spacer for alignment */}
                          <button className="btn btn-primary px-5 py-3 font-weight-bold shadow-sm" style={{ borderRadius: "8px", background: 'var(--success)', borderColor: 'var(--success)', fontSize: '1.1rem' }} onClick={() => handleSubmitQuiz()} disabled={isSubmitting}>
                              {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2"></i>} Soumettre le quiz
                          </button>
                      </>
                  )}
              </div>
          </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="text-center py-5 mt-5">
        <i className="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
        <h4 className="text-muted">Redirection...</h4>
      </div>
    </div>
  );
};

export default StudentQuiz;
