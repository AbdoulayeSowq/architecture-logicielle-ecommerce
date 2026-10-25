import React, { useState, useEffect } from "react";
import { createAssignment, updateAssignment, getAssignmentById } from "../../../services/api/course";
import { askAi, generateQuizAi } from "../../../services/api/ai";
import { notifySuccess } from "../../../components/notify";
import { StudentCard } from "../../../components/Student/StudentCard";
import { Button } from "../../../components/ui";

interface Props { 
  moduleId: string | number; 
  assignmentId?: string | number;
  onSuccess: () => void; 
  onCancel: () => void;
  isFullScreenMode?: boolean;
}

const emptyOption = () => ({ text: "", correct: false });
const emptyQuestion = () => ({
  text: "", points: 4, type: "ESSAY", hint: "", justification: "", competence: "", difficultyLevel: "MEDIUM",
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
});

const DEFAULT_CFG = { singleQcm: 2, multiQcm: 1, openQ: 2, maxScore: 20 };

const AssignmentBuilder: React.FC<Props> = ({ moduleId, assignmentId, onSuccess, onCancel, isFullScreenMode = false }) => {
  const [step, setStep] = useState<"config" | "form">(assignmentId ? "form" : "config");
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [form, setForm] = useState({
    title: "", description: "",
    maxScore: DEFAULT_CFG.maxScore,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    timeLimit: 0,
    strictIntegrityMode: true,
    isAiGenerated: false,
    questions: [emptyQuestion()],
  });
  const [loading, setLoading] = useState(!!assignmentId);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPanel, setAiPanel] = useState<{ idx: number | null; prompt: string; loading: boolean }>({ idx: null, prompt: "", loading: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentId) {
      const load = async () => {
        try {
          const a = await getAssignmentById(assignmentId);
          setForm({
            title: a.title,
            description: a.description,
            maxScore: a.maxScore,
            dueDate: a.dueDate ? a.dueDate.slice(0, 16) : form.dueDate,
            timeLimit: a.timeLimit || 0,
            strictIntegrityMode: !!a.strictIntegrityMode,
            isAiGenerated: false,
            questions: a.questions?.length ? a.questions.map((q: any) => ({
              ...q,
              competence: q.competence || "",
              difficultyLevel: q.difficultyLevel || "MEDIUM",
              options: q.options?.length ? q.options.map((o: any) => ({ text: o.text || "", correct: !!o.correct })) : [emptyOption(), emptyOption()]
            })) : [emptyQuestion()]
          });
        } catch (e: any) { setError("Erreur lors du chargement : " + e.message); }
        setLoading(false);
      };
      load();
    }
  }, [assignmentId]);

  const totalPts = form.questions.reduce((s, q) => s + (Number(q.points) || 0), 0);
  const valid = totalPts === form.maxScore;

  const updateQ = (idx: number, patch: Partial<typeof form.questions[0]>) =>
    setForm(f => { const qs = [...f.questions]; qs[idx] = { ...qs[idx], ...patch }; return { ...f, questions: qs }; });

  const updateOpt = (qi: number, oi: number, patch: Partial<{ text: string; correct: boolean }>) =>
    setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], options: qs[qi].options.map((o, i) => i === oi ? { ...o, ...patch } : o) }; return { ...f, questions: qs }; });

  const addOpt = (qi: number) =>
    setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], options: [...qs[qi].options, emptyOption()] }; return { ...f, questions: qs }; });

  const removeOpt = (qi: number, oi: number) =>
    setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, i) => i !== oi) }; return { ...f, questions: qs }; });

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  const removeQuestion = (idx: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));

  const handleGenerateAi = async () => {
    setAiLoading(true); setError(null);
    const total = cfg.singleQcm + cfg.multiQcm + cfg.openQ;
    if (total === 0) { setAiLoading(false); return; }

    const ptsBase = Math.floor(cfg.maxScore / total);
    const remainder = cfg.maxScore % total;

    const context =
      `# CONSIGNES DE GÉNÉRATION\n` +
      `Tu DOIS générer un devoir avec EXACTEMENT ${total} questions.\n` +
      `- ${cfg.singleQcm} SINGLE_CHOICE\n` +
      `- ${cfg.multiQcm} MULTIPLE_CHOICE\n` +
      `- ${cfg.openQ} ESSAY\n\n` +
      `Chaque question doit valoir environ ${ptsBase} points.\n` +
      `C'est CRITIQUE : Ton tableau 'questions' doit contenir ${total} éléments. Ne t'arrête pas à 3.\n` +
      `Réponds UNIQUEMENT avec le JSON.`;
    try {
      const res = await generateQuizAi(Number(moduleId), context);
      const aiQs = res?.questions || [];
      
      const questions = Array.from({ length: total }).map((_, i) => {
        const q = aiQs[i] || {};
        const points = (i === total - 1) ? (ptsBase + remainder) : ptsBase;
        
        let type = q.type;
        if (!type) {
            if (i < cfg.singleQcm) type = "SINGLE_CHOICE";
            else if (i < cfg.singleQcm + cfg.multiQcm) type = "MULTIPLE_CHOICE";
            else type = "ESSAY";
        }

        return {
          text: q.text || `Question ${i + 1} (À compléter)`,
          type: type,
          points: points,
          hint: q.hint || "",
          justification: q.justification || "",
          competence: q.competence || "",
          difficultyLevel: q.difficultyLevel || "MEDIUM",
          options: (q.options || [emptyOption(), emptyOption(), emptyOption(), emptyOption()]).map((o: any) => ({ 
            text: o.text || "", 
            correct: !!o.correct 
          })),
        };
      });

      setForm(f => ({
        ...f, maxScore: cfg.maxScore, isAiGenerated: true,
        title: res.title || f.title || "Devoir de cours", 
        description: res.description || f.description || "Veuillez répondre aux questions suivantes.", 
        questions,
      }));
      setStep("form");
    } catch (e: any) { setError("Erreur génération : " + e.message); }
    setAiLoading(false);
  };

  const openAiPanel = (idx: number) => setAiPanel({ idx, prompt: "", loading: false });
  const closeAiPanel = () => setAiPanel({ idx: null, prompt: "", loading: false });

  const askQuestionAi = async () => {
    if (aiPanel.idx === null) return;
    setAiPanel(p => ({ ...p, loading: true }));
    const q = form.questions[aiPanel.idx];
    const prompt =
      `Génère une question de devoir en JSON avec les champs: text, type (${q.type}), hint, justification` +
      (q.type !== "ESSAY" ? `, options:[{text,correct}]` : "") +
      `. Sujet demandé: "${aiPanel.prompt}". Réponds UNIQUEMENT en JSON valide.`;
    try {
      const raw: string = await askAi(prompt, Number(moduleId));
      const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const gen = JSON.parse(raw.slice(start, end + 1));
        updateQ(aiPanel.idx, {
          text: gen.text || q.text,
          hint: gen.hint || q.hint,
          justification: gen.justification || q.justification,
          competence: gen.competence || q.competence,
          difficultyLevel: gen.difficultyLevel || q.difficultyLevel,
          options: gen.options?.length ? gen.options.map((o: any) => ({ text: o.text || "", correct: !!o.correct })) : q.options,
        });
      }
    } catch (e: any) { setError("Erreur IA : " + e.message); }
    setAiPanel(p => ({ ...p, loading: false }));
    closeAiPanel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError(`La somme des points (${totalPts}) doit être égale au score maximum (${form.maxScore}).`);
      return;
    }
    setSaving(true); setError(null);
    try {
      const formattedDate = form.dueDate.length === 16 ? `${form.dueDate}:00` : form.dueDate;
      const payload = { 
        ...form, 
        dueDate: formattedDate,
        moduleId: Number(moduleId), 
        questions: form.questions.map((q, i) => ({ ...q, orderIndex: i + 1 })) 
      };
      
      if (assignmentId) {
        await updateAssignment(assignmentId, payload);
        notifySuccess("Devoir mis à jour !");
      } else {
        await createAssignment(payload);
        notifySuccess("Devoir créé !");
      }
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <div className="lms-spinner mx-auto" />
        <p className="mt-3 text-muted font-weight-bold">Chargement de l'éditeur...</p>
      </div>
    );
  }

  if (step === "config") {
    return (
      <StudentCard title="Assistant de Devoir IA" icon="fa-magic">
        <div className="p-2">
          {error && <div className="alert alert-danger font-weight-bold mb-4">{error}</div>}
          
          <div className="row">
            <div className="col-md-3">
              <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Score total</label>
              <input type="number" className="form-control bg-light py-2" value={cfg.maxScore} min={1}
                onChange={e => setCfg(c => ({ ...c, maxScore: +e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">QCM (Unique)</label>
              <input type="number" className="form-control bg-light py-2" value={cfg.singleQcm} min={0}
                onChange={e => setCfg(c => ({ ...c, singleQcm: +e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">QCM (Multiple)</label>
              <input type="number" className="form-control bg-light py-2" value={cfg.multiQcm} min={0}
                onChange={e => setCfg(c => ({ ...c, multiQcm: +e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Questions ouvertes</label>
              <input type="number" className="form-control bg-light py-2" value={cfg.openQ} min={0}
                onChange={e => setCfg(c => ({ ...c, openQ: +e.target.value }))} />
            </div>
          </div>

          <div className="mt-4 p-3 bg-light rounded border">
            <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
               <i className="fas fa-info-circle text-primary" />
               <span className="small font-weight-bold">Résumé :</span>
               <span className="small text-muted">{cfg.singleQcm + cfg.multiQcm + cfg.openQ} questions pour un total de {cfg.maxScore} points.</span>
            </div>
          </div>

          <div className="mt-5 d-flex" style={{ gap: '1rem' }}>
            <Button className="flex-grow-1" onClick={handleGenerateAi} disabled={aiLoading || (cfg.singleQcm + cfg.multiQcm + cfg.openQ) === 0} loading={aiLoading} leftIcon={<i className="fas fa-magic"></i>}>
              Générer avec l'IA
            </Button>
            <Button variant="secondary" className="flex-grow-1" onClick={() => { setForm(f => ({ ...f, maxScore: cfg.maxScore })); setStep("form"); }} leftIcon={<i className="fas fa-keyboard"></i>}>
              Créer manuellement
            </Button>
            <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          </div>
        </div>
      </StudentCard>
    );
  }

  const renderSettings = () => (
    <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Titre du devoir</label>
        <input type="text" className="form-control bg-light py-4 font-weight-bold" required value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Date limite</label>
        <input type="datetime-local" className="form-control bg-light py-4" required value={form.dueDate}
          onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Score maximum</label>
        <input type="number" className="form-control bg-light py-4 font-weight-bold" required value={form.maxScore}
          onChange={e => setForm(f => ({ ...f, maxScore: +e.target.value }))} />
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Durée (minutes, 0 = illimité)</label>
        <div className="d-flex align-items-center bg-light rounded px-3" style={{ border: '1px solid var(--border)', height: 'calc(1.5em + .75rem + 16px)' }}>
          <i className="fas fa-clock text-muted mr-2" />
          <input type="number" className="form-control bg-transparent border-0 font-weight-bold px-0 h-100" style={{ boxShadow: 'none' }} value={form.timeLimit} min={0}
            onChange={e => setForm(f => ({ ...f, timeLimit: +e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Surveillance (Anti-triche)</label>
        <div className="d-flex align-items-center bg-light rounded px-3 mb-2" style={{ border: '1px solid var(--border)', height: 'calc(1.5em + .75rem + 16px)' }}>
          <i className="fas fa-shield-alt text-muted mr-2" />
          <select className="form-control bg-transparent border-0 font-weight-bold px-0 h-100" style={{ boxShadow: 'none', cursor: 'pointer' }}
            value={form.strictIntegrityMode ? "yes" : "no"}
            onChange={e => setForm(f => ({ ...f, strictIntegrityMode: e.target.value === "yes" }))}>
            <option value="yes">Oui (Surveillance active)</option>
            <option value="no">Non (Documents autorisés)</option>
          </select>
        </div>
        {form.strictIntegrityMode ? (
          <div className="alert alert-danger m-0 py-2 px-3 small font-weight-bold d-flex align-items-center" style={{ borderRadius: '8px', gap: '8px', border: '1px solid #f5c2c7' }}>
            <i className="fas fa-exclamation-triangle text-danger" /> Sorties d'écran détectées
          </div>
        ) : (
          <div className="alert alert-success m-0 py-2 px-3 small font-weight-bold d-flex align-items-center" style={{ borderRadius: '8px', gap: '8px', border: '1px solid #badbcc' }}>
            <i className="fas fa-check-circle text-success" /> Mode libre
          </div>
        )}
      </div>
      <div>
        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Consignes pédagogiques</label>
        <textarea className="form-control bg-light" rows={4} required value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      
      <div className="mt-4 pt-4 border-top">
         <div className="d-flex justify-content-between align-items-center mb-3">
             <span className="font-weight-bold">Total des points</span>
             <span className={`badge ${valid ? 'badge-primary-soft text-primary' : 'badge-danger-soft text-danger'} px-3 py-2 rounded-pill font-weight-bold`}>
               {totalPts} / {form.maxScore}
             </span>
         </div>
         <Button type="submit" disabled={saving || !valid} loading={saving} className="w-100 py-3" style={{ fontSize: '1.1rem' }}>
            {assignmentId ? "Enregistrer les modifications" : "Publier le devoir"}
         </Button>
      </div>
    </div>
  );

  const renderQuestionsCanvas = () => (
    <>
      <div className="mb-4">
        {form.questions.map((q, qi) => (
          <div key={qi} className="card bg-white shadow-sm mb-4 border border-light" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center flex-wrap" style={{ gap: '1rem' }}>
                  <span className="badge badge-primary px-3 py-2" style={{ fontSize: '1.1rem' }}>Q{qi + 1}</span>
                  <select className="form-control bg-light py-1 font-weight-bold" style={{ width: 'auto' }} value={q.type}
                    onChange={e => updateQ(qi, { type: e.target.value, options: q.options.length ? q.options : [emptyOption(), emptyOption()] })}>
                    <option value="SINGLE_CHOICE">Choix unique (QCM)</option>
                    <option value="MULTIPLE_CHOICE">Choix multiple</option>
                    <option value="ESSAY">Question ouverte</option>
                    <option value="SHORT_ANSWER">Réponse courte</option>
                  </select>
                  <div className="d-flex align-items-center bg-light px-2 rounded border" style={{ gap: '0.5rem' }}>
                    <input type="number" className="form-control bg-transparent border-0 font-weight-bold px-1 text-center" style={{ width: '60px', fontSize: '1.1rem' }} min={1} value={q.points}
                      onChange={e => updateQ(qi, { points: +e.target.value })} />
                    <span className="small text-muted font-weight-bold pr-2">pts</span>
                  </div>
                </div>
                <div className="d-flex" style={{ gap: '0.5rem' }}>
                  <button type="button" className="btn btn-outline-primary btn-sm rounded" onClick={() => aiPanel.idx === qi ? closeAiPanel() : openAiPanel(qi)}>
                    <i className="fas fa-robot" /> Assistant IA
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm rounded" onClick={() => removeQuestion(qi)} disabled={form.questions.length === 1}>
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>

              {aiPanel.idx === qi && (
                <div className="bg-primary-light border border-primary rounded p-3 mb-4">
                   <div className="d-flex" style={{ gap: '0.5rem' }}>
                      <input type="text" className="form-control bg-white flex-grow-1" placeholder="Demandez à l'IA (ex: génère une question sur...)"
                        value={aiPanel.prompt} onChange={e => setAiPanel(p => ({ ...p, prompt: e.target.value }))} />
                      <button type="button" className="btn btn-primary px-3 font-weight-bold" onClick={askQuestionAi} disabled={aiPanel.loading || !aiPanel.prompt.trim()}>
                        {aiPanel.loading ? <i className="fas fa-spinner fa-spin" /> : "Go"}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={closeAiPanel}>✕</button>
                   </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Énoncé de la question</label>
                <textarea className="form-control bg-light py-3 font-weight-bold" rows={2} required value={q.text}
                  style={{ fontSize: '1.1rem' }}
                  placeholder="Saisissez la question ici..."
                  onChange={e => updateQ(qi, { text: e.target.value })} />
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">
                    Compétence ciblée
                  </label>
                  <input type="text" className="form-control bg-light py-3" value={q.competence || ""}
                    onChange={e => updateQ(qi, { competence: e.target.value })}
                    placeholder="ex: SQL, Algorithmique, Réseaux..." />
                </div>
                <div className="col-md-6">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">
                    Niveau de difficulté <span className="text-danger">*</span>
                  </label>
                  <select className="form-control bg-light py-3" required value={q.difficultyLevel || "MEDIUM"}
                    onChange={e => updateQ(qi, { difficultyLevel: e.target.value })}>
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                  </select>
                </div>
              </div>

              {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                <div className="bg-light p-4 rounded border mb-4">
                  <label className="text-muted small font-weight-bold text-uppercase d-block mb-3">Options de réponse (Cochez la/les bonne(s) réponse(s))</label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="d-flex mb-3 align-items-center" style={{ gap: '1rem' }}>
                      <div className="custom-control custom-checkbox pt-2 ml-2">
                        <input type={q.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                          className="custom-control-input" id={`opt-${qi}-${oi}`}
                          checked={opt.correct}
                          onChange={e => {
                            if (q.type === "SINGLE_CHOICE") {
                              setForm(f => { const qs = [...f.questions]; qs[qi] = { ...qs[qi], options: qs[qi].options.map((o, i) => ({ ...o, correct: i === oi })) }; return { ...f, questions: qs }; });
                            } else {
                              updateOpt(qi, oi, { correct: e.target.checked });
                            }
                          }} />
                        <label className="custom-control-label" htmlFor={`opt-${qi}-${oi}`}></label>
                      </div>
                      <input type="text" className="form-control bg-white flex-grow-1 py-4" required value={opt.text}
                        placeholder={`Option ${oi + 1}`}
                        style={{ border: opt.correct ? '2px solid var(--success)' : '1px solid var(--border)' }}
                        onChange={e => updateOpt(qi, oi, { text: e.target.value })} />
                      <button type="button" className="btn btn-outline-danger btn-sm rounded px-3" onClick={() => removeOpt(qi, oi)} disabled={q.options.length <= 2}>
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary btn-sm font-weight-bold mt-2" onClick={() => addOpt(qi)}>
                    <i className="fas fa-plus mr-1" /> Ajouter une option
                  </button>
                </div>
              )}

              <div>
                <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Corrigé / Feedback (Optionnel)</label>
                <textarea className="form-control bg-light" rows={2} value={q.justification}
                  placeholder="Éléments de réponse ou justification..."
                  onChange={e => updateQ(qi, { justification: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-5 mb-5 pb-5">
         <button type="button" className="btn btn-secondary btn-lg px-5 py-3 shadow-sm font-weight-bold" style={{ borderRadius: '50px' }} onClick={addQuestion}>
            <i className="fas fa-plus mr-2" /> Ajouter une nouvelle question
         </button>
      </div>
    </>
  );

  if (isFullScreenMode) {
     return (
       <form onSubmit={handleSubmit} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
          {/* Main Canvas (Left, 75% max width) */}
          <div style={{ flex: '1', overflowY: 'auto' }}>
              <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
                  {/* Header Area */}
                  <div className="d-flex justify-content-between align-items-center mb-5">
                      <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
                          <button type="button" onClick={onCancel} className="btn btn-light rounded-pill px-4 shadow-sm font-weight-bold text-muted">
                              <i className="fas fa-arrow-left mr-2" /> Quitter
                          </button>
                          <h3 className="m-0 font-weight-bold" style={{ color: 'var(--text-primary)' }}>
                             <i className="fas fa-edit text-primary mr-2" /> 
                             {assignmentId ? "Modifier le Devoir" : "Création de Devoir"}
                          </h3>
                      </div>
                      <div className="d-flex align-items-center" style={{ gap: '1rem' }}>
                          <button type="button" className="btn btn-outline-primary font-weight-bold rounded-pill shadow-sm" onClick={() => setStep('config')}>
                             <i className="fas fa-magic mr-2" /> Assistant IA
                          </button>
                      </div>
                  </div>

                  {error && <div className="alert alert-danger font-weight-bold mb-4 shadow-sm" style={{ borderRadius: '12px' }}>{error}</div>}

                  {/* Render Questions */}
                  {renderQuestionsCanvas()}
              </div>
          </div>

          {/* Sticky Sidebar (Right, Fixed) */}
          <div style={{ width: '380px', flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg-base)', padding: '2rem', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', boxShadow: '-4px 0 15px rgba(0,0,0,0.03)' }}>
             <h5 className="font-weight-bold mb-4 text-uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: '1px', fontSize: '0.9rem' }}>
                <i className="fas fa-cog mr-2" /> Paramètres du devoir
             </h5>
             {renderSettings()}
          </div>
       </form>
     );
  }

  return (
    <StudentCard 
      title={assignmentId ? "Modifier le Devoir" : "Éditeur de Devoir"} 
      icon="fa-edit"
      actions={
        <div className={`badge ${valid ? 'badge-success-soft text-success' : 'badge-danger-soft text-danger'} px-3 py-2 rounded-pill font-weight-bold`}>
          {totalPts} / {form.maxScore} points
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2">
        {error && <div className="alert alert-danger font-weight-bold mb-4">{error}</div>}

        <div className="row mb-4">
           {/* Legacy settings rendering for inline mode */}
           <div className="col-12">
               {renderSettings()}
           </div>
        </div>

        <div>
           {renderQuestionsCanvas()}
        </div>
      </form>
    </StudentCard>
  );
};

export default AssignmentBuilder;
