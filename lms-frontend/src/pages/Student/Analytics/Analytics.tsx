import React, { useEffect, useState } from "react";
import {
  getProfilAdaptatif,
  getRecommandations,
  getLacunesEtudiant,
  markRecommandationAsVue,
} from "../../../services/api/analytics";
import { getGamificationProfile } from "../../../services/api/gamification";
import {
  getGradesByStudentId,
  getQuizResultsByStudentId,
  getRecommendedModules,
  getLacunes as getCourseLacunes
} from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

interface ProfilAdaptatif {
  niveauGlobal: string;
  classeMoyenne: number;
  competences: Record<string, string>;
  dernierMisAJour: string;
}
interface Recommandation {
  id: number;
  typeReco: string;
  cibleId: string;
  raison: string;
  vue: boolean;
  createdAt: string;
}

const NIVEAU_CONFIG: Record<string, { label: string; badgeClass: string; pct: number }> = {
  DEBUTANT:     { label: "Débutant",       badgeClass: "badge-info",    pct: 25 },
  INTERMEDIAIRE:{ label: "Intermédiaire",  badgeClass: "badge-warning", pct: 60 },
  AVANCE:       { label: "Avancé",         badgeClass: "badge-primary", pct: 92 },
};

const RECO_ICON: Record<string, string> = {
  COURS: "fas fa-book", MODULE: "fas fa-cube",
  BADGE: "fas fa-medal", EXERCICE: "fas fa-bullseye",
};

const LVL_SKILL: Record<string, { pct: number; cls: string }> = {
  FAIBLE:    { pct: 25,  cls: "danger"  },
  MOYEN:     { pct: 55,  cls: "warning" },
  BON:       { pct: 80,  cls: "primary" },
  EXCELLENT: { pct: 100, cls: "success" },
};

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

const avg = (arr: number[]) => {
  const valid = arr.filter(n => typeof n === "number" && !isNaN(n));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

const Analytics: React.FC = () => {
  const [loading, setLoading]       = useState(true);
  const [username, setUsername]     = useState("");
  const [profil, setProfil]         = useState<ProfilAdaptatif | null>(null);
  const [recos, setRecos]           = useState<Recommandation[]>([]);
  const [courseRecos, setCourseRecos] = useState<any[]>([]);
  const [gami, setGami]             = useState<any>(null);
  const [grades, setGrades]         = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [student, setStudent]       = useState<any>(null);
  const [lacunes, setLacunes]       = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem("user");
        const uname = stored ? JSON.parse(stored).username || JSON.parse(stored).email : "";
        setUsername(uname);
        
        // Fetch base info
        const [profilData, recosData, gamiData, studentData, lacunesData] = await Promise.all([
          getProfilAdaptatif(uname),
          getRecommandations(uname),
          getGamificationProfile(uname).catch(() => null),
          getStudentDetailsByUsername(uname).catch(() => null),
          getLacunesEtudiant(uname).catch(() => []),
        ]);

        setProfil(profilData);
        setRecos(Array.isArray(recosData) ? recosData : []);
        setGami(gamiData);
        setStudent(studentData);
        setLacunes(Array.isArray(lacunesData) ? lacunesData : []);

        if (studentData?.username) {
          // Fetch course-service recommendations and grades
          const [g, q, cRecos, cLacunes] = await Promise.all([
            getGradesByStudentId(String(studentData.id)).catch(() => []),
            getQuizResultsByStudentId(uname).catch(() => []),
            getRecommendedModules(uname).catch(() => []),
            getCourseLacunes(uname).catch(() => [])
          ]);
          
          setGrades(Array.isArray(g) ? g : []);
          setQuizResults(Array.isArray(q) ? q : []);
          setCourseRecos(Array.isArray(cRecos) ? cRecos : []);
          
          // Merge lacunes from both sources if unique
          if (Array.isArray(cLacunes) && cLacunes.length > 0) {
            setLacunes(prev => {
              const existing = new Set(prev.map(l => l.competence?.toLowerCase()));
              const filtered = cLacunes.filter(l => !existing.has(l.competence?.toLowerCase()));
              return [...prev, ...filtered];
            });
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  if (loading) return <PageLoading />;

  const avgGrade = avg(grades.map(g => g.grade));
  const avgQuiz  = avg(quizResults.map(q => q.scorePercentage || (q.score / q.totalPoints * 100) || 0));
  const xpInLevel = gami ? gami.xpPoints % 100 : 0;
  const niveauCfg = profil?.niveauGlobal ? NIVEAU_CONFIG[profil.niveauGlobal] : null;

  return (
    <div className="page-content py-4">
      {/* Page title */}
      <div className="mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Mes Analyses</h1>
        <p className="text-muted mb-0">{student?.fullName || username}</p>
      </div>

      {/* ── Gamification stats ── */}
      {gami && (
        <div className="row mb-4 px-2">
          {[
            { label: "Niveau", value: `Niv. ${gami.level}`, pct: xpInLevel },
            { label: "Points XP", value: `${gami.xpPoints} XP`, pct: xpInLevel },
            { label: "Série active", value: `🔥 ${gami.currentStreak} jours`, pct: Math.min(gami.currentStreak * 10, 100) },
          ].map(s => (
            <div className="col-md-4 mb-3 px-2" key={s.label}>
              <div className="stat-card h-100 shadow-sm border-0" style={{ background: 'var(--bg-card)', borderRadius: '12px' }}>
                <div className="w-100">
                  <p className="stat-card__label text-uppercase mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{s.label}</p>
                  <p className="stat-card__value mb-2" style={{ fontSize: '1.5rem' }}>{s.value}</p>
                  <div className="progress" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)' }}>
                    <div className="progress-bar" style={{ width: `${s.pct}%`, background: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Notes & Quiz ── */}
      <div className="row mb-4 px-2">
        <div className="col-md-6 mb-3 px-2">
          <div className="stat-card h-100 shadow-sm border-0" style={{ background: 'var(--bg-card)', borderRadius: '12px' }}>
            <div className="w-100">
              <p className="stat-card__label text-uppercase mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Moyenne des notes</p>
              <p className="stat-card__value mb-2" style={{ fontSize: '1.5rem' }}>{grades.length ? `${avgGrade.toFixed(1)}/20` : "—"}</p>
              <div className="progress" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)' }}>
                <div className="progress-bar" style={{ width: `${grades.length ? (avgGrade / 20) * 100 : 0}%`, background: 'var(--success)' }} />
              </div>
              <small className="text-muted mt-2 d-block">{grades.length} note(s) enregistrée(s)</small>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3 px-2">
          <div className="stat-card h-100 shadow-sm border-0" style={{ background: 'var(--bg-card)', borderRadius: '12px' }}>
            <div className="w-100">
              <p className="stat-card__label text-uppercase mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Score moyen aux quiz</p>
              <p className="stat-card__value mb-2" style={{ fontSize: '1.5rem' }}>{quizResults.length ? `${avgQuiz.toFixed(0)}%` : "—"}</p>
              <div className="progress" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)' }}>
                <div className="progress-bar" style={{ width: `${avgQuiz}%`, background: 'var(--accent)' }} />
              </div>
              <small className="text-muted mt-2 d-block">{quizResults.length} quiz complété(s)</small>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profil Adaptatif ── */}
      {profil ? (
        <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-header border-0 bg-transparent pt-4 px-4">
            <h5 className="font-weight-bold mb-0">
              <i className="fas fa-chart-line mr-2 text-primary" />
              Profil Académique
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-4 mb-4 mb-md-0">
                <label className="mb-2">NIVEAU GLOBAL</label>
                <div className="mb-3">
                  {niveauCfg && <span className={`badge px-3 py-2 ${niveauCfg.badgeClass}`} style={{ borderRadius: '8px' }}>{niveauCfg.label}</span>}
                </div>
                <div className="progress mb-4" style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)' }}>
                  <div className="progress-bar" style={{ width: `${niveauCfg?.pct ?? 0}%`, background: 'var(--accent)' }} />
                </div>
                {profil.classeMoyenne != null && (
                  <div className="mt-4">
                    <label className="mb-2">MOYENNE DE CLASSE</label>
                    <p className="h3 font-weight-bold mb-2">{profil.classeMoyenne.toFixed(1)}<small className="text-muted">/20</small></p>
                    <div className="progress" style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)' }}>
                      <div className="progress-bar" style={{ width: `${(profil.classeMoyenne / 20) * 100}%`, background: 'var(--info)' }} />
                    </div>
                  </div>
                )}
                <p className="text-muted small mt-4 mb-0">Mis à jour le {fmtDate(profil.dernierMisAJour)}</p>
              </div>

              {profil.competences && Object.keys(profil.competences).length > 0 && (
                <div className="col-md-8">
                  <label className="mb-3">COMPÉTENCES ÉVALUÉES</label>
                  <div className="d-flex flex-column" style={{ gap: '1.25rem' }}>
                    {Object.entries(profil.competences).map(([name, level]) => {
                      const cfg = LVL_SKILL[level.toUpperCase()] ?? LVL_SKILL.MOYEN;
                      return (
                        <div key={name}>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="small font-weight-bold" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                            <span className={`small font-weight-bold text-${cfg.cls}`}>{level}</span>
                          </div>
                          <div className="progress" style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)' }}>
                            <div className="progress-bar" style={{ width: `${cfg.pct}%`, background: `var(--${cfg.cls === 'primary' ? 'accent' : cfg.cls})` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state-box mb-4 border-0 shadow-sm py-5" style={{ background: 'var(--bg-card)', borderRadius: '16px' }}>
          <i className="fas fa-chart-line fa-2x mb-3 text-muted" />
          <p className="text-muted">Votre profil académique sera généré automatiquement au fil de vos quiz.</p>
        </div>
      )}

      {/* ── Lacunes ── */}
      {lacunes.length > 0 && (
        <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <div className="card-header border-0 bg-transparent pt-4 px-4">
            <h5 className="font-weight-bold mb-0">
              <i className="fas fa-exclamation-triangle mr-2 text-warning" />
              Lacunes identifiées ({lacunes.length})
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="d-flex flex-wrap" style={{ gap: '10px' }}>
              {lacunes.map((l: any) => (
                <div
                  key={l.id || l.competence}
                  className="px-3 py-2 d-flex align-items-center"
                  style={{ 
                    background: l.niveau === 'FAIBLE' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(217, 119, 6, 0.08)', 
                    color: l.niveau === 'FAIBLE' ? 'var(--danger)' : 'var(--warning)',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: `1px solid ${l.niveau === 'FAIBLE' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)'}`
                  }}
                >
                  <i className="fas fa-exclamation-circle mr-2" />
                  {l.competence}
                </div>
              ))}
            </div>
            <p className="text-muted small mt-3 mb-0">
              <i className="fas fa-info-circle mr-2" />
              Le système a identifié ces points d'amélioration basés sur vos récents quiz. Consultez les suggestions ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* ── Recommandations ── */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="card-header border-0 bg-transparent pt-4 px-4">
          <h5 className="font-weight-bold mb-0">
            <i className="fas fa-lightbulb mr-2 text-warning" />
            Recommandations personnalisées
          </h5>
        </div>
        <div className="card-body p-4">
          {recos.length === 0 && courseRecos.length === 0 ? (
            <div className="empty-state-box border-0 py-5">
              <i className="fas fa-folder-open fa-2x mb-3 text-muted" />
              <p className="text-muted">Aucune recommandation pour l'instant.</p>
            </div>
          ) : (
            <div className="d-flex flex-column" style={{ gap: '1rem' }}>
              {/* Render Course-Service Adaptive Recos first */}
              {courseRecos.map((m: any) => (
                <div
                  key={`course-${m.id}`}
                  className="p-3 d-flex align-items-start hover-lift border-left"
                  style={{ 
                    gap: 16, 
                    borderLeftColor: 'var(--accent)', 
                    borderLeftWidth: 4,
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px'
                  }}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'var(--bg-card)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    <i className="fas fa-layer-group" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: 8 }}>
                      <span className="badge badge-primary" style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.65rem' }}>PRIORITÉ</span>
                      <span className="badge badge-light" style={{ fontSize: '0.65rem' }}>MODULE SUGGÉRÉ</span>
                    </div>
                    <p className="mb-1 font-weight-bold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.name || m.title}</p>
                    <p className="mb-0 text-muted small">Basé sur votre parcours, ce module vous aidera à consolider vos acquis en <strong>{m.tags || "votre filière"}</strong>.</p>
                  </div>
                  <i className="fas fa-chevron-right text-muted align-self-center ml-2" />
                </div>
              ))}

              {/* Render User-Service Recos */}
              {recos.slice(0, 8).map(reco => (
                <div
                  key={reco.id}
                  onClick={async () => {
                    if (!reco.vue) {
                      await markRecommandationAsVue(reco.id);
                      setRecos(prev => prev.map(r => r.id === reco.id ? { ...r, vue: true } : r));
                    }
                  }}
                  className={`p-3 d-flex align-items-start hover-lift ${!reco.vue ? 'border-left' : ''}`}
                  style={{ 
                    cursor: reco.vue ? 'default' : 'pointer', 
                    gap: 16, 
                    borderLeftColor: !reco.vue ? 'var(--accent)' : 'transparent', 
                    borderLeftWidth: 4,
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px'
                  }}
                >
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px', background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                    <i className={`${RECO_ICON[reco.typeReco] ?? 'fas fa-lightbulb'}`} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: 8 }}>
                      <span className="badge badge-primary">{reco.typeReco}</span>
                      {!reco.vue && <span className="badge badge-success">Nouveau</span>}
                      <small className="text-muted ml-auto">{fmtDate(reco.createdAt)}</small>
                    </div>
                    <p className="mb-0 font-weight-medium" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{reco.raison || "Recommandation basée sur votre profil"}</p>
                  </div>
                  <i className="fas fa-chevron-right text-muted align-self-center ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
