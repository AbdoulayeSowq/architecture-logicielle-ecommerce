import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TestCaseEditor from "../../components/Practice/TestCaseEditor";
import {
  listPracticeExercises,
  createPracticeExercise,
  updatePracticeExercise,
  deletePracticeExercise,
  getPracticeExercise,
  getPracticeStats,
  generatePracticeDraft,
  CodingExerciseInput,
  TestCaseInput,
} from "../../services/api/practice";
import { StudentCard } from "../../components/Student/StudentCard";
import { StudentPageHeader } from "../../components/Student/StudentPageHeader";
import { PageTransition, ConfirmModal } from "../../components/ui";
import { notifyError, notifySuccess } from "../../components/notify";

const emptyForm = (): CodingExerciseInput => ({
  title: "",
  description: "",
  difficulty: "MEDIUM",
  competence: "",
  starterCode: "# Écris ton code ici\n",
  referenceSolution: "",
  allowedLanguages: ["python", "java", "cpp", "javascript", "php", "dart"],
  hintsJson: '["Relis l\'énoncé.", "Pense aux cas limites."]',
  published: false,
  moduleId: null,
  testCases: [
    { input: "", expectedOutput: "", hidden: false, orderIndex: 0, weightPercent: 50 },
    { input: "", expectedOutput: "", hidden: true, orderIndex: 1, weightPercent: 50 },
  ],
});

interface Props {
  moduleId?: string;
  embedded?: boolean;
}

const PracticeBuilder: React.FC<Props> = ({ moduleId, embedded = false }) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [form, setForm] = useState<CodingExerciseInput>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [aiTopic, setAiTopic] = useState("tri par fusion");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const loadList = async () => {
    const data = await listPracticeExercises({
      moduleId,
      lecturerView: true,
    });
    setExercises(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadList();
    if (moduleId) {
      setForm((f) => ({ ...f, moduleId: Number(moduleId) }));
    }
  }, [moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = async (id: number) => {
    try {
      const ex = await getPracticeExercise(id, true);
      setEditingId(id);
      setForm({
        title: ex.title,
        description: ex.description,
        difficulty: ex.difficulty || "MEDIUM",
        competence: ex.competence || "",
        starterCode: ex.starterCode || "",
        referenceSolution: ex.referenceSolution || "",
        allowedLanguages: ex.allowedLanguages || ["python", "java", "cpp", "javascript", "php", "dart"],
        hintsJson: ex.hintsJson || "",
        published: ex.published,
        moduleId: ex.moduleId || (moduleId ? Number(moduleId) : null),
        testCases: (ex.allTestCases || ex.publicTestCases || []).map((tc: TestCaseInput, i: number) => ({
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          hidden: !!tc.hidden,
          orderIndex: tc.orderIndex ?? i,
          weightPercent: tc.weightPercent || 100,
        })),
      });
      const st = await getPracticeStats(id).catch(() => null);
      setStats(st);
    } catch (e: any) {
      notifyError(e.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setStats(null);
    const base = emptyForm();
    if (moduleId) base.moduleId = Number(moduleId);
    setForm(base);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updatePracticeExercise(editingId, form);
        notifySuccess("Exercice mis à jour");
      } else {
        await createPracticeExercise(form);
        notifySuccess("Exercice créé");
      }
      resetForm();
      loadList();
    } catch (err: any) {
      notifyError(err.response?.data?.message || "Erreur de sauvegarde");
    }
    setSaving(false);
  };

  const handleDelete = (id: number) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    await deletePracticeExercise(id);
    notifySuccess("Supprimé");
    if (editingId === id) resetForm();
    loadList();
  };

  const handleGenerate = async () => {
    try {
      const res = await generatePracticeDraft(aiTopic, form.difficulty);
      if (res.draft) {
        setForm({ ...form, ...res.draft, moduleId: form.moduleId });
        notifySuccess("Brouillon généré — complétez les tests avant publication");
      }
    } catch {
      notifyError("Génération indisponible");
    }
  };

  const content = (
    <div className={embedded ? "" : "content"}>
      <div className={embedded ? "" : "container py-4"}>
        {!moduleId && !embedded && (
          <StudentPageHeader
            title="Gestion Practice"
            subtitle="Créer et publier des exercices de programmation"
          />
        )}

        <div className="row">
          <div className="col-lg-4 mb-3">
            <StudentCard className="p-3">
              <h6 style={{ color: "var(--text-primary)" }}>Exercices</h6>
              {!embedded && (
                <Link to="/lecturer/practice" className="btn btn-sm btn-link p-0 mb-2">
                  Voir tout le catalogue
                </Link>
              )}
              <ul className="list-unstyled mb-0">
                {exercises.map((ex) => (
                  <li key={ex.id} className="mb-2 d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-start"
                      onClick={() => startEdit(ex.id)}
                    >
                      {ex.title}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-danger"
                      onClick={() => handleDelete(ex.id)}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-outline-primary btn-sm mt-3 w-100" onClick={resetForm}>
                Nouvel exercice
              </button>
            </StudentCard>

            {stats && (
              <StudentCard className="p-3 mt-3">
                <h6>Statistiques</h6>
                <p className="small mb-0" style={{ color: "var(--text-secondary)" }}>
                  Soumissions: {stats.totalSubmissions}
                  <br />
                  Taux AC: {stats.acceptanceRatePercent?.toFixed(1)}%
                </p>
              </StudentCard>
            )}
          </div>

          <div className="col-lg-8">
            <StudentCard className="p-4">
              <form onSubmit={handleSave}>
                <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                  <h5 style={{ color: "var(--text-primary)" }}>
                    {editingId ? "Modifier l'exercice" : "Nouvel exercice"}
                  </h5>
                  <div className="d-flex gap-2">
                    <input
                      className="form-control form-control-sm"
                      style={{ width: 160 }}
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Thème IA"
                    />
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleGenerate}>
                      IA
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="small">Titre</label>
                  <input
                    className="form-control"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="small">Description (Markdown)</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <label className="small">Difficulté</label>
                    <select
                      className="form-control"
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    >
                      <option value="EASY">Facile</option>
                      <option value="MEDIUM">Moyen</option>
                      <option value="HARD">Difficile</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="small">Compétence</label>
                    <input
                      className="form-control"
                      value={form.competence}
                      onChange={(e) => setForm({ ...form, competence: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="small d-block mb-1">Langages autorisés</label>
                  <div className="d-flex flex-wrap gap-3">
                    {[
                      { id: "python", label: "Python" },
                      { id: "java", label: "Java" },
                      { id: "cpp", label: "C++" },
                      { id: "javascript", label: "JavaScript" },
                      { id: "php", label: "PHP" },
                      { id: "dart", label: "Dart" },
                    ].map((lang) => {
                      const isChecked = form.allowedLanguages?.includes(lang.id);
                      return (
                        <div key={lang.id} className="form-check form-check-inline">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`lang-${lang.id}`}
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              let updated = [...(form.allowedLanguages || [])];
                              if (checked) {
                                if (!updated.includes(lang.id)) updated.push(lang.id);
                              } else {
                                updated = updated.filter((l) => l !== lang.id);
                              }
                              setForm({ ...form, allowedLanguages: updated });
                            }}
                          />
                          <label className="form-check-label small" htmlFor={`lang-${lang.id}`}>
                            {lang.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mb-2">
                  <label className="small">Code de départ</label>
                  <textarea
                    className="form-control font-monospace"
                    rows={4}
                    value={form.starterCode}
                    onChange={(e) => setForm({ ...form, starterCode: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="small">Solution de référence (prof only)</label>
                  <textarea
                    className="form-control font-monospace"
                    rows={4}
                    value={form.referenceSolution}
                    onChange={(e) => setForm({ ...form, referenceSolution: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="small">Indices (JSON array de strings)</label>
                  <textarea
                    className="form-control font-monospace"
                    rows={2}
                    value={form.hintsJson}
                    onChange={(e) => setForm({ ...form, hintsJson: e.target.value })}
                  />
                </div>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="published"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="published">
                    Publié (visible aux étudiants)
                  </label>
                </div>

                <TestCaseEditor
                  testCases={form.testCases}
                  onChange={(testCases) => setForm({ ...form, testCases })}
                />

                <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>
            </StudentCard>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return content;
  return (
    <PageTransition>
      {content}
      <ConfirmModal
        show={deleteTargetId !== null}
        title="Supprimer l'exercice"
        message="Supprimer cet exercice ?"
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </PageTransition>
  );
};

export default PracticeBuilder;
