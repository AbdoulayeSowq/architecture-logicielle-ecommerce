import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPracticeExercises } from "../../services/api/practice";
import { StudentPageHeader } from "../../components/Student/StudentPageHeader";
import { StudentCard } from "../../components/Student/StudentCard";
import { PageTransition } from "../../components/ui";

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; class: string }> = {
  EASY: { label: "Facile", color: "var(--lc-easy)", class: "easy" },
  MEDIUM: { label: "Moyen", color: "var(--lc-medium)", class: "medium" },
  HARD: { label: "Difficile", color: "var(--lc-hard)", class: "hard" },
};

const PracticeCatalog: React.FC<{ moduleId?: string; basePath?: string; embedded?: boolean }> = ({
  moduleId,
  basePath = "/student/practice",
  embedded = false,
}) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("");
  const [competence, setCompetence] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  useEffect(() => {
    // Load solved exercises from localStorage
    try {
      const solved = JSON.parse(localStorage.getItem("solved_exercises") || "[]");
      setSolvedIds(solved.map((id: any) => id.toString()));
    } catch (e) {
      setSolvedIds([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await listPracticeExercises({
        moduleId,
        difficulty: difficulty || undefined,
        competence: competence || undefined,
      });
      setExercises(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, [moduleId, difficulty, competence]);

  // Client-side filtering for ultra-responsive search
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.competence?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics for the progress panel
  const totalCount = exercises.length;
  const solvedCount = exercises.filter((ex) => solvedIds.includes(ex.id.toString())).length;

  const easyExercises = exercises.filter((ex) => ex.difficulty === "EASY");
  const easySolved = easyExercises.filter((ex) => solvedIds.includes(ex.id.toString())).length;

  const mediumExercises = exercises.filter((ex) => ex.difficulty === "MEDIUM");
  const mediumSolved = mediumExercises.filter((ex) => solvedIds.includes(ex.id.toString())).length;

  const hardExercises = exercises.filter((ex) => ex.difficulty === "HARD");
  const hardSolved = hardExercises.filter((ex) => solvedIds.includes(ex.id.toString())).length;

  // Donut chart stroke-dasharray properties
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = totalCount > 0 ? circumference - (solvedCount / totalCount) * circumference : circumference;

  const inner = (
    <div className={embedded ? "" : "content"}>
      <div className={embedded ? "" : "container py-4"}>
        {!moduleId && !embedded && (
          <StudentPageHeader
            title="Entraînement Algorithmique"
            subtitle="Affûtez vos compétences en programmation avec notre compilateur interactif"
          />
        )}

        <div className="lc-problems-layout">
          {/* LEFT: Filters and Problem List Table */}
          <div>
            <div className="lc-filters-card">
              <div className="row g-2 align-items-center">
                <div className="col-md-5">
                  <div className="lc-search-input">
                    <i className="fas fa-search" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par titre ou tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-control"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="">Difficulté (Toutes)</option>
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setDifficulty("");
                      setCompetence("");
                      setSearchQuery("");
                    }}
                  >
                    <i className="fas fa-sync-alt" /> Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <StudentCard className="p-5 text-center">
                <i className="fas fa-circle-notch fa-spin fa-2x mb-3" style={{ color: "var(--accent)" }} />
                <p style={{ color: "var(--text-secondary)" }}>Chargement des exercices...</p>
              </StudentCard>
            ) : filteredExercises.length === 0 ? (
              <StudentCard className="p-5 text-center">
                <i className="fas fa-code fa-3x mb-3" style={{ color: "var(--text-muted)" }} />
                <p style={{ color: "var(--text-secondary)" }}>Aucun exercice ne correspond à vos filtres.</p>
              </StudentCard>
            ) : (
              <div className="lc-table-card">
                <table className="lc-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px", textAlign: "center" }}>Statut</th>
                      <th>Titre de l'exercice</th>
                      <th>Compétence / Tag</th>
                      <th>Difficulté</th>
                      <th style={{ width: "100px", textAlign: "center" }}>Tests</th>
                      <th style={{ width: "120px", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExercises.map((ex) => {
                      const isSolved = solvedIds.includes(ex.id.toString());
                      const diffInfo = DIFFICULTY_CONFIG[ex.difficulty] || {
                        label: ex.difficulty,
                        color: "var(--text-muted)",
                        class: "",
                      };

                      return (
                        <tr key={ex.id}>
                          <td style={{ textAlign: "center" }}>
                            {isSolved ? (
                              <i className="fas fa-check-circle lc-status-icon solved" title="Résolu" />
                            ) : (
                              <i className="far fa-circle lc-status-icon todo" title="Non résolu" />
                            )}
                          </td>
                          <td>
                            <Link to={`${basePath}/${ex.id}`} className="lc-problem-title-link">
                              {ex.title}
                            </Link>
                          </td>
                          <td>
                            {ex.competence ? (
                              <span className="lc-tag">
                                <i className="fas fa-tag fa-xs me-1" /> {ex.competence}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                color: diffInfo.color,
                                fontWeight: 700,
                                fontSize: "0.8rem",
                              }}
                            >
                              {diffInfo.label}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                              {ex.testCaseCount}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              to={`${basePath}/${ex.id}`}
                              className={`btn btn-sm ${
                                isSolved ? "btn-outline-success" : "btn-primary"
                              }`}
                              style={{ borderRadius: "20px", padding: "4px 14px", fontSize: "0.78rem" }}
                            >
                              {isSolved ? "Revoir" : "Résoudre"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: Stats and Playground Quick Launcher */}
          <div>
            {/* Progression Card */}
            <div className="lc-progress-card">
              <h5 className="lc-progress-card-title">
                <i className="fas fa-chart-pie" /> Progression
              </h5>
              <div className="lc-progress-widget">
                <div className="lc-progress-circle-wrapper">
                  <svg className="lc-progress-circle-svg" viewBox="0 0 80 80">
                    <circle className="lc-progress-circle-bg" cx="40" cy="40" r={radius} />
                    <circle
                      className="lc-progress-circle-fill"
                      cx="40"
                      cy="40"
                      r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ stroke: solvedCount > 0 ? "var(--lc-easy)" : "var(--border)" }}
                    />
                  </svg>
                  <div className="lc-progress-circle-text">
                    <div className="lc-progress-number">{solvedCount}</div>
                    <div className="lc-progress-total">sur {totalCount}</div>
                  </div>
                </div>

                <div className="lc-progress-details">
                  <div className="lc-progress-bar-row">
                    <div className="lc-progress-row-header">
                      <span className="lc-progress-row-label easy">Facile</span>
                      <span className="lc-progress-row-count">
                        {easySolved}<span>/{easyExercises.length}</span>
                      </span>
                    </div>
                    <div className="lc-progress-bar-bg">
                      <div
                        className="lc-progress-bar-fill easy"
                        style={{
                          width: `${
                            easyExercises.length > 0 ? (easySolved / easyExercises.length) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="lc-progress-bar-row">
                    <div className="lc-progress-row-header">
                      <span className="lc-progress-row-label medium">Moyen</span>
                      <span className="lc-progress-row-count">
                        {mediumSolved}<span>/{mediumExercises.length}</span>
                      </span>
                    </div>
                    <div className="lc-progress-bar-bg">
                      <div
                        className="lc-progress-bar-fill medium"
                        style={{
                          width: `${
                            mediumExercises.length > 0
                              ? (mediumSolved / mediumExercises.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="lc-progress-bar-row">
                    <div className="lc-progress-row-header">
                      <span className="lc-progress-row-label hard">Difficile</span>
                      <span className="lc-progress-row-count">
                        {hardSolved}<span>/{hardExercises.length}</span>
                      </span>
                    </div>
                    <div className="lc-progress-bar-bg">
                      <div
                        className="lc-progress-bar-fill hard"
                        style={{
                          width: `${
                            hardExercises.length > 0 ? (hardSolved / hardExercises.length) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions / Playground */}
            <div className="lc-action-card">
              <h6 className="lc-action-card-title">
                <i className="fas fa-terminal" style={{ color: "var(--accent)" }} /> Bac à sable libre
              </h6>
              <p className="lc-action-card-text">
                Besoin de tester un algorithme ou d'écrire du code à la volée ? Accédez à notre compilateur en ligne libre.
              </p>
              <Link to={`${basePath}/playground`} className="btn btn-sm btn-primary w-100 mt-1" style={{ borderRadius: "8px" }}>
                <i className="fas fa-play fa-xs me-1" /> Ouvrir le Playground
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return inner;
  return <PageTransition>{inner}</PageTransition>;
};

export default PracticeCatalog;
