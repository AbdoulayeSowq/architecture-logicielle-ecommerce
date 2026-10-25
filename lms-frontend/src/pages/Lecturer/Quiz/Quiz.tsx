import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getQuizzesByModuleId,
  getModuleById,
  createQuiz,
  deleteQuiz,
  updateQuiz,
  getQuizById,
} from "../../../services/api/course";
import { askAi } from "../../../services/api/ai";
import PageLoading from "../../../components/Admin/PageLoading";
import { notifyError } from "../../../components/notify";

const LecturerQuiz = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const emptyQuestion = () => ({
    text: "", hint: "", justification: "", orderIndex: 1, points: 5, type: "SINGLE_CHOICE", competence: "", difficultyLevel: "MEDIUM",
    options: [{ text: "", correct: true }, { text: "", correct: false }],
  });

  const emptyQuiz = () => ({
    title: "", description: "", typeQuiz: "QCM", timeLimit: 30, timeLimitPerQuestion: false, documentMode: "NO_DOCS", cameraSurveillanceEnabled: false, randomizeQuestions: false, randomizeAnswers: true, maxAttempts: 3, publishDate: new Date().toISOString().slice(0, 16), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), isDraft: false, passingScore: 10.0, moduleId: id, questions: [emptyQuestion()],
  });

  const [newQuiz, setNewQuiz] = useState<any>(emptyQuiz());
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [aiPanel, setAiPanel] = useState<{ qIndex: number; prompt: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiQuestion = async (qIndex: number) => {
    if (!aiPanel || aiLoading) return;
    setAiLoading(true);
    try {
      const sysPrompt = `Tu es un assistant pédagogique. Génère UNE seule question de quiz au format JSON strict suivant ce schéma :\n{"text":"...","hint":"...","justification":"...","type":"SINGLE_CHOICE","competence":"...","options":[{"text":"...","correct":true},{"text":"...","correct":false},{"text":"...","correct":false},{"text":"...","correct":false}]}\nDemande: ${aiPanel.prompt}`;
      const raw = await askAi(sysPrompt, Number(id));
      const text = typeof raw === 'string' ? raw : (raw?.response || raw?.answer || JSON.stringify(raw));
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      const q = JSON.parse(match[0]);
      const updatedQuestions = [...newQuiz.questions];
      updatedQuestions[qIndex] = {
        ...updatedQuestions[qIndex],
        text: q.text || updatedQuestions[qIndex].text,
        hint: q.hint || '',
        justification: q.justification || '',
        competence: q.competence || updatedQuestions[qIndex].competence,
        difficultyLevel: q.difficultyLevel || updatedQuestions[qIndex].difficultyLevel,
        type: q.type || updatedQuestions[qIndex].type,
        options: q.options?.length ? q.options : updatedQuestions[qIndex].options,
      };
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
      setAiPanel(null);
    } catch {
      notifyError('Impossible de parser la réponse IA. Reformulez votre demande.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        const moduleData = await getModuleById(id);
        setModule(moduleData);
        const quizzesData = await getQuizzesByModuleId(id);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    const state = location.state as { editQuizId?: string; aiGeneratedQuiz?: any; } | null;
    if (state?.editQuizId) {
      handleEditQuiz(state.editQuizId);
      window.history.replaceState({}, document.title);
    }
    if (state?.aiGeneratedQuiz) {
      const ai = state.aiGeneratedQuiz;
      setNewQuiz({
        title: ai.title || `Quiz IA - ${module?.name || ""}`,
        description: ai.description || "Quiz généré par Intelligence Artificielle",
        typeQuiz: "QCM", timeLimit: ai.timeLimit ?? 30, timeLimitPerQuestion: false, documentMode: "NO_DOCS", cameraSurveillanceEnabled: false, randomizeQuestions: ai.randomizeQuestions ?? false, randomizeAnswers: ai.randomizeAnswers ?? true, maxAttempts: 3, publishDate: new Date().toISOString().slice(0, 16), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), isDraft: true, passingScore: ai.passingScore ?? 10.0, moduleId: id,
        questions: ai.questions && ai.questions.length > 0 ? ai.questions.map((q: any, i: number) => ({
                text: q.text || "", hint: q.hint || "", justification: q.justification || "", orderIndex: i + 1, points: q.points ?? 2, type: q.type || "SINGLE_CHOICE", competence: q.competence || "", difficultyLevel: q.difficultyLevel || "MEDIUM",
                options: (q.options || []).map((o: any) => ({ text: o.text || "", correct: !!o.correct })),
              })) : [emptyQuestion()],
      });
      setEditingQuizId(null);
      window.history.replaceState({}, document.title);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }
  }, [location.state]);

  const handleAddQuestion = () => { setNewQuiz({ ...newQuiz, questions: [...newQuiz.questions, { ...emptyQuestion(), orderIndex: newQuiz.questions.length + 1 }] }); };

  const handleRemoveQuestion = (index: number) => { if (newQuiz.questions.length > 1) setNewQuiz({ ...newQuiz, questions: newQuiz.questions.filter((_: any, i: number) => i !== index) }); };

  const handleAddOption = (qIndex: number) => { const updatedQuestions = [...newQuiz.questions]; updatedQuestions[qIndex].options.push({ text: "", correct: false }); setNewQuiz({ ...newQuiz, questions: updatedQuestions }); };

  const handleRemoveOption = (qIndex: number, oIndex: number) => { const updatedQuestions = [...newQuiz.questions]; if (updatedQuestions[qIndex].options.length > 2) { updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.filter((_: any, i: number) => i !== oIndex); setNewQuiz({ ...newQuiz, questions: updatedQuestions }); } };

  const handleQuestionChange = (index: number, field: string, value: any) => { const updatedQuestions = [...newQuiz.questions]; updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }; setNewQuiz({ ...newQuiz, questions: updatedQuestions }); };

  const handleOptionChange = (qIndex: number, oIndex: number, field: string, value: any) => { const updatedQuestions = [...newQuiz.questions]; updatedQuestions[qIndex].options[oIndex] = { ...updatedQuestions[qIndex].options[oIndex], [field]: value }; setNewQuiz({ ...newQuiz, questions: updatedQuestions }); };

  const handleCreateQuiz = async (e: any) => {
    e.preventDefault();
    const payload = { ...newQuiz, questions: newQuiz.questions.map((q: any, i: number) => ({ ...q, orderIndex: i + 1 })) };
    try {
      if (editingQuizId) await updateQuiz(editingQuizId, payload);
      else await createQuiz(payload);
      navigate(`/lecturer/${id}`, { state: { activeTab: 'quiz' } });
    } catch (error) { console.error("Error saving quiz:", error); }
  };

  const handleEditQuiz = async (quizId: string) => {
    try {
      const data = await getQuizById(quizId);
      setEditingQuizId(quizId);
      setNewQuiz({
        title: data.title || "", description: data.description || "", typeQuiz: data.typeQuiz || "QCM", timeLimit: data.timeLimit ?? 30, timeLimitPerQuestion: data.timeLimitPerQuestion ?? false, documentMode: data.documentMode || "NO_DOCS", cameraSurveillanceEnabled: data.cameraSurveillanceEnabled ?? false, randomizeQuestions: data.randomizeQuestions ?? false, randomizeAnswers: data.randomizeAnswers ?? true, maxAttempts: data.maxAttempts ?? 3,
        publishDate: data.publishDate ? data.publishDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
        dueDate: data.dueDate ? data.dueDate.slice(0, 16) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        isDraft: data.isDraft ?? false, passingScore: data.passingScore ?? 10.0, moduleId: id,
        questions: data.questions && data.questions.length > 0 ? data.questions.map((q: any, i: number) => ({
                text: q.text || "", hint: q.hint || "", justification: q.justification || "", orderIndex: q.orderIndex ?? i + 1, points: q.points ?? 5, type: q.type || "SINGLE_CHOICE", competence: q.competence || "", difficultyLevel: q.difficultyLevel || "MEDIUM",
                options: (q.options || []).map((o: any) => ({ text: o.text || "", correct: !!o.correct })),
              })) : [emptyQuestion()],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { console.error("Error loading quiz for edit:", error); }
  };

  const handleCancelEdit = () => { setEditingQuizId(null); setNewQuiz(emptyQuiz()); };

  const handleDelete = async (quizId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) {
      try { await deleteQuiz(quizId); fetchData(); } catch (error) { console.error("Error deleting quiz:", error); }
    }
  };

  if (loading && !module) return <PageLoading />;

  const valid = newQuiz.questions.length > 0;

  const renderSettings = () => (
    <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Titre du Quiz</label>
        <input type="text" className="form-control bg-light py-4 font-weight-bold" required value={newQuiz.title}
          onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Description</label>
        <textarea className="form-control bg-light" rows={3} required value={newQuiz.description}
          onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Note de réussite (/20)</label>
        <input type="number" className="form-control bg-light py-4 font-weight-bold" required value={newQuiz.passingScore} step="0.5"
          onChange={e => setNewQuiz({ ...newQuiz, passingScore: +e.target.value })} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Durée (minutes)</label>
        <div className="d-flex align-items-center bg-light rounded px-3" style={{ border: '1px solid var(--border)', height: 'calc(1.5em + .75rem + 16px)' }}>
          <i className="fas fa-clock text-muted mr-2" />
          <input type="number" className="form-control bg-transparent border-0 font-weight-bold px-0 h-100" style={{ boxShadow: 'none' }} value={newQuiz.timeLimit} min={1}
            onChange={e => setNewQuiz({ ...newQuiz, timeLimit: +e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Limiter tentatives</label>
        <div className="d-flex align-items-center mb-2" style={{ gap: '1rem' }}>
          <div className="custom-control custom-switch pt-1">
            <input type="checkbox" className="custom-control-input" id="limitAttempts" 
                   checked={newQuiz.maxAttempts !== null}
                   onChange={e => setNewQuiz({ ...newQuiz, maxAttempts: e.target.checked ? 1 : null })}/>
            <label className="custom-control-label" htmlFor="limitAttempts"></label>
          </div>
          {newQuiz.maxAttempts !== null && (
            <input type="number" className="form-control bg-light py-2" style={{ width: '80px' }} min={1}
              value={newQuiz.maxAttempts} onChange={e => setNewQuiz({ ...newQuiz, maxAttempts: +e.target.value })} />
          )}
        </div>
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Date de Publication</label>
        <input type="datetime-local" className="form-control bg-light py-4" required value={newQuiz.publishDate}
          onChange={e => setNewQuiz({ ...newQuiz, publishDate: e.target.value })} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Date limite</label>
        <input type="datetime-local" className="form-control bg-light py-4" required value={newQuiz.dueDate}
          onChange={e => setNewQuiz({ ...newQuiz, dueDate: e.target.value })} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Surveillance (Anti-triche)</label>
        <select className="form-control bg-light py-3 font-weight-bold mb-3"
          value={newQuiz.documentMode}
          onChange={e => setNewQuiz({ ...newQuiz, documentMode: e.target.value })}>
          <option value="NO_DOCS">Pas de documents (Surveillance active)</option>
          <option value="PARTIAL">Partiel (Notes)</option>
          <option value="FULL">Total (Mode libre)</option>
        </select>
        <div className="d-flex flex-column" style={{ gap: '0.5rem' }}>
          <div className="custom-control custom-checkbox">
            <input className="custom-control-input" type="checkbox" id="randomQ" checked={newQuiz.randomizeQuestions} onChange={(e) => setNewQuiz({...newQuiz, randomizeQuestions: e.target.checked})}/>
            <label className="custom-control-label small font-weight-bold text-muted" htmlFor="randomQ">Mélanger les questions</label>
          </div>
          <div className="custom-control custom-checkbox">
            <input className="custom-control-input" type="checkbox" id="cameraS" checked={newQuiz.cameraSurveillanceEnabled} onChange={(e) => setNewQuiz({...newQuiz, cameraSurveillanceEnabled: e.target.checked})}/>
            <label className="custom-control-label small font-weight-bold text-muted" htmlFor="cameraS">Surveillance caméra</label>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-top">
         <div className="d-flex justify-content-between align-items-center mb-3">
             <span className="font-weight-bold">Questions</span>
             <span className="badge badge-primary px-3 py-2 rounded-pill font-weight-bold">
               {newQuiz.questions.length}
             </span>
         </div>
         <button type="submit" disabled={!valid} className="btn btn-primary w-100 py-3 font-weight-bold shadow-sm" style={{ fontSize: '1.1rem' }}>
            {editingQuizId ? "Enregistrer les modifications" : "Publier le quiz"}
         </button>
      </div>
    </div>
  );

  const renderQuestionsCanvas = () => (
    <>
      <div className="mb-4">
        {newQuiz.questions.map((question: any, qIndex: number) => (
          <div key={qIndex} className="card bg-white shadow-sm mb-4 border border-light" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center flex-wrap" style={{ gap: '1rem' }}>
                  <span className="badge badge-primary px-3 py-2" style={{ fontSize: '1.1rem' }}>Q{qIndex + 1}</span>
                  <select className="form-control bg-light py-1 font-weight-bold" style={{ width: 'auto' }} value={question.type}
                    onChange={e => handleQuestionChange(qIndex, "type", e.target.value)}>
                    <option value="SINGLE_CHOICE">Choix unique (QCM)</option>
                    <option value="MULTIPLE_CHOICE">Choix multiple</option>
                    <option value="TRUE_FALSE">Vrai / Faux</option>
                    <option value="SHORT_ANSWER">Réponse courte</option>
                  </select>
                  <div className="d-flex align-items-center bg-light px-2 rounded border" style={{ gap: '0.5rem' }}>
                    <input type="number" className="form-control bg-transparent border-0 font-weight-bold px-1 text-center" style={{ width: '60px', fontSize: '1.1rem' }} min={1} value={question.points}
                      onChange={e => handleQuestionChange(qIndex, "points", parseInt(e.target.value))} />
                    <span className="small text-muted font-weight-bold pr-2">pts</span>
                  </div>
                </div>
                <div className="d-flex" style={{ gap: '0.5rem' }}>
                  <button type="button" className="btn btn-outline-primary btn-sm rounded" onClick={() => setAiPanel(aiPanel?.qIndex === qIndex ? null : { qIndex, prompt: '' })}>
                    <i className="fas fa-robot" /> Assistant IA
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm rounded" onClick={() => handleRemoveQuestion(qIndex)} disabled={newQuiz.questions.length === 1}>
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>

              {aiPanel?.qIndex === qIndex && (
                <div className="bg-primary-light border border-primary rounded p-3 mb-4">
                   <div className="d-flex" style={{ gap: '0.5rem' }}>
                      <input type="text" className="form-control bg-white flex-grow-1" placeholder="Demandez à l'IA (ex: génère une question sur...)"
                        value={aiPanel.prompt} onChange={e => setAiPanel({ ...aiPanel, prompt: e.target.value })} 
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAiQuestion(qIndex); } }}/>
                      <button type="button" className="btn btn-primary px-3 font-weight-bold" onClick={() => handleAiQuestion(qIndex)} disabled={aiLoading || !aiPanel.prompt.trim()}>
                        {aiLoading ? <i className="fas fa-spinner fa-spin" /> : "Go"}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setAiPanel(null)}>✕</button>
                   </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Énoncé de la question</label>
                <textarea className="form-control bg-light py-3 font-weight-bold" rows={2} required value={question.text}
                  style={{ fontSize: '1.1rem' }}
                  placeholder="Saisissez la question ici..."
                  onChange={e => handleQuestionChange(qIndex, "text", e.target.value)} />
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Compétence ciblée</label>
                  <input type="text" className="form-control bg-light py-3" required value={question.competence || ""}
                    onChange={e => handleQuestionChange(qIndex, "competence", e.target.value)}
                    placeholder="ex: SQL, Algorithmique..." />
                </div>
                <div className="col-md-6">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Niveau de difficulté <span className="text-danger">*</span></label>
                  <select className="form-control bg-light py-3" required value={question.difficultyLevel || "MEDIUM"}
                    onChange={e => handleQuestionChange(qIndex, "difficultyLevel", e.target.value)}>
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                  </select>
                </div>
              </div>

              {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") && (
                <div className="bg-light p-4 rounded border mb-4">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-3">Options de réponse (Cochez la/les bonne(s) réponse(s))</label>
                  {question.options.map((option: any, oIndex: number) => (
                    <div key={oIndex} className="d-flex mb-3 align-items-center" style={{ gap: '1rem' }}>
                      <div className="custom-control custom-checkbox pt-2 ml-2">
                        <input type={question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE" ? "radio" : "checkbox"}
                          className="custom-control-input" id={`correct-${qIndex}-${oIndex}`}
                          checked={option.correct}
                          onChange={(e) => {
                              if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") {
                                  const updatedQuestions = [...newQuiz.questions];
                                  updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.map((o: any, i: number) => ({ ...o, correct: i === oIndex }));
                                  setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                              } else {
                                  handleOptionChange(qIndex, oIndex, "correct", e.target.checked);
                              }
                          }} />
                        <label className="custom-control-label" htmlFor={`correct-${qIndex}-${oIndex}`}></label>
                      </div>
                      <input type="text" className="form-control bg-white flex-grow-1 py-4" required value={option.text}
                        placeholder={`Option ${oIndex + 1}`}
                        style={{ border: option.correct ? '2px solid var(--success)' : '1px solid var(--border)' }}
                        onChange={e => handleOptionChange(qIndex, oIndex, "text", e.target.value)} />
                      {question.type !== "TRUE_FALSE" && question.options.length > 2 && (
                          <button type="button" className="btn btn-outline-danger btn-sm rounded px-3" onClick={() => handleRemoveOption(qIndex, oIndex)}>
                            <i className="fas fa-times" />
                          </button>
                      )}
                    </div>
                  ))}
                  {question.type !== "TRUE_FALSE" && (
                      <button type="button" className="btn btn-outline-primary btn-sm font-weight-bold mt-2" onClick={() => handleAddOption(qIndex)}>
                        <i className="fas fa-plus mr-1" /> Ajouter une option
                      </button>
                  )}
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                    <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Corrigé / Feedback (Optionnel)</label>
                    <textarea className="form-control bg-light" rows={2} value={question.justification}
                      placeholder="Justification de la réponse..."
                      onChange={e => handleQuestionChange(qIndex, "justification", e.target.value)} />
                </div>
                <div className="col-md-6">
                    <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Indice (Optionnel)</label>
                    <input type="text" className="form-control bg-light py-4" value={question.hint}
                      placeholder="Indice pour aider l'étudiant..."
                      onChange={e => handleQuestionChange(qIndex, "hint", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-5 mb-5 pb-5">
         <button type="button" className="btn btn-secondary btn-lg px-5 py-3 shadow-sm font-weight-bold" style={{ borderRadius: '50px' }} onClick={handleAddQuestion}>
            <i className="fas fa-plus mr-2" /> Ajouter une nouvelle question
         </button>
      </div>
    </>
  );

  return (
    <form onSubmit={handleCreateQuiz} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
       {/* Main Canvas (Left, 75% max width) */}
       <div style={{ flex: '1', overflowY: 'auto' }}>
           <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
               {/* Header Area */}
               <div className="d-flex justify-content-between align-items-center mb-5">
                   <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
                       <button type="button" onClick={() => navigate(`/lecturer/${id}`, { state: { activeTab: 'quiz' } })} className="btn btn-light rounded-pill px-4 shadow-sm font-weight-bold text-muted">
                           <i className="fas fa-arrow-left mr-2" /> Quitter
                       </button>
                       <h3 className="m-0 font-weight-bold" style={{ color: 'var(--text-primary)' }}>
                          <i className="fas fa-edit text-primary mr-2" /> 
                          {editingQuizId ? "Modifier le Quiz" : "Création de Quiz"}
                       </h3>
                   </div>
               </div>

               {/* Render Questions */}
               {renderQuestionsCanvas()}
           </div>
       </div>

       {/* Sticky Sidebar (Right, Fixed) */}
       <div style={{ width: '380px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg-base)', padding: '2rem', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', boxShadow: '-4px 0 15px rgba(0,0,0,0.03)' }}>
          <h5 className="font-weight-bold mb-4 text-uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: '1px', fontSize: '0.9rem' }}>
             <i className="fas fa-cog mr-2" /> Paramètres du quiz
          </h5>
          {renderSettings()}
       </div>
    </form>
  );
};

export default LecturerQuiz;
