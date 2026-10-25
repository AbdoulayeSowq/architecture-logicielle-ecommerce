import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import CodeEditor from "../../components/Practice/CodeEditor";
import SubmissionResults from "../../components/Practice/SubmissionResults";
import VideoPlayer from "../../components/VideoPlayer";
import {
  getPracticeExercise,
  submitPracticeCode,
  runPracticeCode,
  getPracticeSubmissions,
  getPracticeLeaderboard,
  getPracticeHint,
  listPracticeExercises,
} from "../../services/api/practice";
import { notifyError, notifySuccess } from "../../components/notify";
import { ConfirmModal } from "../../components/ui";

const STARTERS: Record<string, string> = {
  python: "# Écris ton code ici\n\ndef solution():\n    pass\n",
  java:
    "public class Main {\n    public static void main(String[] args) {\n        // Votre code ici\n    }\n}\n",
  cpp:
    "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Votre code ici\n    return 0;\n}\n",
  javascript: "// Votre code ici\n\nfunction solution() {\n    \n}\n",
  typescript: "// Votre code ici\n\nfunction solution(): void {\n    \n}\n",
  csharp:
    "using System;\n\nclass Solution {\n    public static void Main(string[] args) {\n        // Votre code ici\n    }\n}\n",
  go:
    "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Votre code ici\n    fmt.Println(\"Hello\")\n}\n",
  c:
    "#include <stdio.h>\n\nint main() {\n    // Votre code ici\n    return 0;\n}\n",
  php: "<?php\n// Votre code ici\n\n?>\n",
  dart: "void main() {\n    // Votre code ici\n}\n",
};

const LANG_LABELS: Record<string, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  javascript: "JavaScript",
  typescript: "TypeScript",
  csharp: "C#",
  go: "Go",
  php: "PHP",
  dart: "Dart",
};

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EASY: { label: "Facile", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  MEDIUM: {
    label: "Moyen",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  HARD: { label: "Difficile", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const LANGUAGE_LABELS_MAP: Record<string, string> = {
  cpp: "C++",
  java: "Java",
  c: "C",
  csharp: "C#",
  javascript: "JavaScript",
  go: "Go",
  python: "Python3",
  python3: "Python3",
  typescript: "TypeScript"
};

interface CodeTab {
  language: string;
  code: string;
}

type MarkdownSegment =
  | { type: "markdown"; content: string }
  | { type: "codeTabs"; tabs: CodeTab[] };

const segmentMarkdown = (text: string): MarkdownSegment[] => {
  const segments: MarkdownSegment[] = [];
  const codeBlockRegex = /```(\w+)\r?\n([\s\S]*?)\r?\n```/g;
  
  let lastIndex = 0;
  let match;
  
  interface FoundBlock {
    language: string;
    code: string;
    start: number;
    end: number;
  }
  
  const blocks: FoundBlock[] = [];
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1],
      code: match[2],
      start: match.index,
      end: codeBlockRegex.lastIndex
    });
  }
  
  if (blocks.length === 0) {
    return [{ type: "markdown", content: text }];
  }
  
  interface GroupedSegment {
    type: "markdown" | "codeTabs";
    start: number;
    end: number;
    tabs?: CodeTab[];
    content?: string;
  }
  
  const grouped: GroupedSegment[] = [];
  let currentGroup: FoundBlock[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (currentGroup.length === 0) {
      currentGroup.push(block);
    } else {
      const prevBlock = currentGroup[currentGroup.length - 1];
      const middleText = text.substring(prevBlock.end, block.start);
      if (/^\s*$/.test(middleText)) {
        currentGroup.push(block);
      } else {
        grouped.push({
          type: "codeTabs",
          start: currentGroup[0].start,
          end: currentGroup[currentGroup.length - 1].end,
          tabs: currentGroup.map(b => ({ language: b.language, code: b.code }))
        });
        currentGroup = [block];
      }
    }
  }
  
  if (currentGroup.length > 0) {
    grouped.push({
      type: "codeTabs",
      start: currentGroup[0].start,
      end: currentGroup[currentGroup.length - 1].end,
      tabs: currentGroup.map(b => ({ language: b.language, code: b.code }))
    });
  }
  
  let currentIndex = 0;
  for (const group of grouped) {
    if (group.start > currentIndex) {
      segments.push({
        type: "markdown",
        content: text.substring(currentIndex, group.start)
      });
    }
    segments.push({
      type: "codeTabs",
      tabs: group.tabs!
    });
    currentIndex = group.end;
  }
  
  if (currentIndex < text.length) {
    segments.push({
      type: "markdown",
      content: text.substring(currentIndex)
    });
  }
  
  return segments;
};

const EditorialCodeTabs: React.FC<{ tabs: CodeTab[] }> = ({ tabs }) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTab = tabs[activeTabIdx] || tabs[0];

  const handleCopy = () => {
    if (!activeTab) return;
    navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLangLabel = (lang: string) => {
    const l = lang.toLowerCase();
    return LANGUAGE_LABELS_MAP[l] || lang;
  };

  return (
    <div className="editorial-code-container" style={{
      border: "1px solid var(--accent-border)",
      borderRadius: "10px",
      background: "var(--bg-elevated)",
      overflow: "hidden",
      margin: "20px 0",
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        padding: "0 16px",
        height: "44px"
      }}>
        <div style={{ display: "flex", gap: "6px", height: "100%", alignItems: "flex-end" }}>
          {tabs.map((tab, idx) => {
            const isActive = idx === activeTabIdx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTabIdx(idx)}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  border: "1px solid transparent",
                  borderBottom: isActive ? "1px solid var(--bg-card)" : "1px solid transparent",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                  outline: "none",
                  marginBottom: "-1px",
                  zIndex: 2
                }}
              >
                {getLangLabel(tab.language)}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "5px 10px",
            color: "var(--text-primary)",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <i className={copied ? "fas fa-check" : "far fa-copy"} style={{ color: copied ? "#22c55e" : "inherit" }} />
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      <div style={{
        display: "flex",
        fontFamily: "'Fira Code', 'Consolas', monospace",
        fontSize: "0.84rem",
        lineHeight: "1.6",
        background: "var(--bg-card)",
        overflowX: "auto",
        padding: "16px 0"
      }}>
        <div style={{
          userSelect: "none",
          textAlign: "right",
          color: "var(--text-muted)",
          padding: "0 16px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          opacity: 0.4
        }}>
          {activeTab.code.split("\n").map((_, i) => (
            <div key={i} style={{ height: "1.6em" }}>{i + 1}</div>
          ))}
        </div>

        <pre style={{
          margin: 0,
          padding: "0 16px",
          color: "var(--text-primary)",
          background: "transparent",
          border: "none",
          flex: 1,
          whiteSpace: "pre",
          overflow: "visible"
        }}>
          <code>{activeTab.code}</code>
        </pre>
      </div>
    </div>
  );
};

type LeftTab = "description" | "editorial" | "solutions" | "submissions";

const PracticeSolve: React.FC<{ basePath?: string }> = ({
  basePath = "/student/practice",
}) => {
  const { exerciseId } = useParams();
  const [exercise, setExercise] = useState<any>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(1);
  const [hintLoading, setHintLoading] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [editorialSubTab, setEditorialSubTab] = useState<"article" | "video">("article");
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
  const consoleRef = useRef<HTMLDivElement>(null);
  const [siblingIds, setSiblingIds] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const contentWrapper = document.querySelector(".content-wrapper") as HTMLElement;
    let oldHeight = "";
    let oldOverflow = "";
    if (contentWrapper) {
      oldHeight = contentWrapper.style.height;
      oldOverflow = contentWrapper.style.overflow;
      contentWrapper.style.height = "calc(100vh - 61px)";
      contentWrapper.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
      if (contentWrapper) {
        contentWrapper.style.height = oldHeight;
        contentWrapper.style.overflow = oldOverflow;
      }
    };
  }, []);

  const load = async () => {
    if (!exerciseId) return;
    setLoading(true);
    try {
      const ex = await getPracticeExercise(exerciseId);
      setExercise(ex);
      const langs = ex.allowedLanguages?.length
        ? ex.allowedLanguages
        : ["python", "java", "cpp", "csharp", "javascript", "typescript", "go", "php", "dart"];
      const lang = langs[0];
      setLanguage(lang);
      setCode((ex.languageStarterCodes && ex.languageStarterCodes[lang]) || ex.starterCode || STARTERS[lang] || "");
      const [hist, board] = await Promise.all([
        getPracticeSubmissions(exerciseId).catch(() => []),
        getPracticeLeaderboard(exerciseId).catch(() => []),
      ]);
      setHistory(Array.isArray(hist) ? hist : []);
      setLeaderboard(Array.isArray(board) ? board : []);

      // Auto-populate solved list if user has solved it previously
      if (Array.isArray(hist)) {
        const solved = JSON.parse(localStorage.getItem("solved_exercises") || "[]");
        const hasAccepted = hist.some((s: any) => s.status === "ACCEPTED");
        if (hasAccepted && !solved.includes(exerciseId)) {
          solved.push(exerciseId);
          localStorage.setItem("solved_exercises", JSON.stringify(solved));
        }
      }
    } catch (e: any) {
      notifyError(e.response?.data?.message || "Exercice introuvable");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  useEffect(() => {
    const fetchSiblings = async () => {
      try {
        const allEx = await listPracticeExercises({
          moduleId: exercise?.moduleId || undefined
        });
        if (Array.isArray(allEx)) {
          const idx = allEx.findIndex((e: any) => e.id.toString() === exerciseId);
          if (idx !== -1) {
            setSiblingIds({
              prev: idx > 0 ? allEx[idx - 1].id.toString() : null,
              next: idx < allEx.length - 1 ? allEx[idx + 1].id.toString() : null,
            });
          }
        }
      } catch (err) {
        console.error("Error loading siblings", err);
      }
    };
    if (exerciseId && exercise) {
      fetchSiblings();
    }
  }, [exerciseId, exercise]);



  const handleRun = async () => {
    if (!exerciseId) return;
    setRunning(true);
    setResult(null);
    setConsoleOpen(true);
    setConsoleTab("result");
    try {
      const res = await runPracticeCode(exerciseId, {
        sourceCode: code,
        language,
      });
      setResult({ ...res, mode: "run" });
    } catch (e: any) {
      notifyError(e.response?.data?.message || "Erreur d'exécution");
    }
    setRunning(false);
  };

  const handleSubmit = () => {
    if (!exerciseId) return;
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!exerciseId) return;
    setShowSubmitConfirm(false);
    setSubmitting(true);
    setResult(null);
    setConsoleOpen(true);
    setConsoleTab("result");
    try {
      const res = await submitPracticeCode(exerciseId, {
        sourceCode: code,
        language,
      });
      setResult({ ...res, mode: "submit" });
      if (res.status === "ACCEPTED") {
        notifySuccess("🎉 Bravo ! Tous les tests sont passés.");
        const solved = JSON.parse(localStorage.getItem("solved_exercises") || "[]");
        if (!solved.includes(exerciseId)) {
          solved.push(exerciseId);
          localStorage.setItem("solved_exercises", JSON.stringify(solved));
        }
      }
      load();
    } catch (e: any) {
      notifyError(e.response?.data?.message || "Erreur de soumission");
    }
    setSubmitting(false);
  };

  const handleHint = async () => {
    if (!exerciseId) return;
    setHintLoading(true);
    try {
      const res = await getPracticeHint(exerciseId, hintLevel);
      setHints((prev) => [...prev, res.hint]);
      setHintLevel((l) => l + 1);
      setLeftTab("description");
    } catch (e: any) {
      notifyError(e.response?.data?.message || "Indice non disponible");
    }
    setHintLoading(false);
  };

  if (loading) {
    return (
      <div className="practice-ide-loading">
        <div className="practice-ide-spinner">
          <i className="fas fa-circle-notch fa-spin" />
          <span>Chargement de l'exercice...</span>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="practice-ide-loading">
        <div className="text-center">
          <i
            className="fas fa-exclamation-triangle fa-2x mb-3"
            style={{ color: "#f59e0b" }}
          />
          <p style={{ color: "var(--text-secondary)" }}>
            Exercice introuvable.
          </p>
          <Link to={basePath} className="btn btn-primary btn-sm">
            ← Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const langs = exercise.allowedLanguages?.length
    ? exercise.allowedLanguages
    : ["python", "java", "cpp", "javascript", "php", "dart"];
  const diff = DIFFICULTY_CONFIG[exercise.difficulty] || {
    label: exercise.difficulty,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.12)",
  };

  return (
    <div className="practice-ide-root">
      {/* ── Top bar ── */}
      <div className="practice-ide-topbar">
        <div className="practice-ide-topbar-left">
          <Link to={basePath} className="practice-ide-back-btn">
            <i className="fas fa-chevron-left" />
            <span>Liste des exercices</span>
          </Link>
          
          <div className="lc-topbar-nav ms-3 me-3">
            <Link
              to={siblingIds.prev ? `${basePath}/${siblingIds.prev}` : "#"}
              className={`lc-topbar-nav-btn ${!siblingIds.prev ? "disabled" : ""}`}
              onClick={(e) => !siblingIds.prev && e.preventDefault()}
              title="Exercice précédent"
            >
              <i className="fas fa-chevron-left" />
            </Link>
            <Link
              to={siblingIds.next ? `${basePath}/${siblingIds.next}` : "#"}
              className={`lc-topbar-nav-btn ${!siblingIds.next ? "disabled" : ""}`}
              onClick={(e) => !siblingIds.next && e.preventDefault()}
              title="Exercice suivant"
            >
              <i className="fas fa-chevron-right" />
            </Link>
          </div>

          <div className="practice-ide-title-bar">
            <span className="practice-ide-exercise-title">{exercise.title}</span>
            <span
              className="practice-ide-badge"
              style={{ color: diff.color, background: diff.bg }}
            >
              {diff.label}
            </span>
            {exercise.competence && (
              <span className="practice-ide-badge practice-ide-badge-competence">
                {exercise.competence}
              </span>
            )}
          </div>
        </div>
        <div className="practice-ide-topbar-actions">
          <button
            className="practice-ide-btn practice-ide-btn-hint"
            onClick={handleHint}
            disabled={hintLoading}
            title="Obtenir un indice"
          >
            <i className="fas fa-lightbulb" />
            {hintLoading ? " Chargement..." : " Indice"}
          </button>
          <button
            className="practice-ide-btn practice-ide-btn-run"
            onClick={handleRun}
            disabled={running || submitting}
          >
            {running ? (
              <>
                <i className="fas fa-circle-notch fa-spin" /> Exécution...
              </>
            ) : (
              <>
                <i className="fas fa-play" /> Exécuter
              </>
            )}
          </button>
          <button
            className="practice-ide-btn practice-ide-btn-submit"
            onClick={handleSubmit}
            disabled={running || submitting}
          >
            {submitting ? (
              <>
                <i className="fas fa-circle-notch fa-spin" /> Soumission...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane" /> Soumettre
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="practice-ide-body">
        <Allotment defaultSizes={[420, 680]}>
          {/* LEFT PANEL */}
          <Allotment.Pane minSize={280}>
            <div className="practice-ide-panel practice-ide-left-panel">
              {/* Left tab bar */}
              <div className="practice-ide-tabs">
                {(
                  [
                    { id: "description", icon: "fa-align-left", label: "Description" },
                    {
                      id: "editorial",
                      icon: "fa-book-open",
                      label: "Éditorial",
                    },
                    {
                      id: "solutions",
                      icon: "fa-trophy",
                      label: "Classement",
                    },
                    {
                      id: "submissions",
                      icon: "fa-history",
                      label: `Soumissions${history.length ? ` (${history.length})` : ""}`,
                    },
                  ] as { id: LeftTab; icon: string; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    className={`practice-ide-tab${leftTab === t.id ? " active" : ""}`}
                    onClick={() => setLeftTab(t.id)}
                  >
                    <i className={`fas ${t.icon}`} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="practice-ide-panel-content">
                {/* DESCRIPTION TAB */}
                {leftTab === "description" && (
                  <div className="practice-ide-description">
                    <div className="practice-ide-problem-header">
                      <h2 className="practice-ide-problem-title">
                        {exercise.title}
                      </h2>
                      <div className="practice-ide-problem-meta">
                        <span
                          className="practice-ide-badge"
                          style={{ color: diff.color, background: diff.bg }}
                        >
                          {diff.label}
                        </span>
                        {exercise.competence && (
                          <span className="practice-ide-badge practice-ide-badge-competence">
                            <i className="fas fa-tag" /> {exercise.competence}
                          </span>
                        )}
                        {exercise.testCaseCount != null && (
                          <span className="practice-ide-badge">
                            <i className="fas fa-vial" />{" "}
                            {exercise.testCaseCount} tests
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="practice-ide-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {exercise.description || ""}
                      </ReactMarkdown>
                    </div>

                    {/* Collapsible Hints list inside Description */}
                    {(() => {
                      let hintsList: string[] = [];
                      try {
                        if (exercise.hintsJson) {
                          hintsList = JSON.parse(exercise.hintsJson);
                        }
                      } catch (e) {
                        console.error("Error parsing hintsJson", e);
                      }
                      if (hintsList.length === 0) return null;
                      return (
                        <div className="practice-ide-hints-section mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                          <h4 className="practice-ide-section-title">
                            <i className="fas fa-lightbulb" /> Indices
                          </h4>
                          {hintsList.map((hintText, index) => {
                            const isUnlocked = index < hints.length;
                            return (
                              <details key={index} className="lc-details lc-hint-details mb-2">
                                <summary className="lc-summary" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px" }}>
                                  <i className="fas fa-lightbulb" style={{ color: "var(--lc-easy)" }} />
                                  <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Indice {index + 1}</span>
                                </summary>
                                <div className="lc-details-content p-3" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderTop: "none", borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px" }}>
                                  {isUnlocked ? (
                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>{hints[index]}</p>
                                  ) : (
                                    <div className="text-center py-1">
                                      <button
                                        className="practice-ide-btn practice-ide-btn-hint btn-sm"
                                        onClick={handleHint}
                                        disabled={hintLoading}
                                        style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                                      >
                                        {hintLoading ? (
                                          <><i className="fas fa-circle-notch fa-spin me-2" />Déverrouillage...</>
                                        ) : (
                                          <><i className="fas fa-unlock me-2" />Déverrouiller l'indice {index + 1}</>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* EDITORIAL TAB */}
                {leftTab === "editorial" && (
                  <div className="practice-ide-editorial" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div className="practice-ide-editorial-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "16px" }}>
                      <h4 className="practice-ide-section-title" style={{ margin: 0 }}>
                        <i className="fas fa-book-open" /> Solution Officielle
                      </h4>
                      {exercise.videoUrl && (
                        <div style={{ display: "flex", gap: "8px", background: "rgba(255, 255, 255, 0.03)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                          <button
                            onClick={() => setEditorialSubTab("article")}
                            style={{
                              padding: "6px 12px",
                              background: editorialSubTab === "article" ? "var(--bg-elevated)" : "none",
                              border: editorialSubTab === "article" ? "1px solid var(--border)" : "1px solid transparent",
                              color: editorialSubTab === "article" ? "var(--text)" : "var(--text-secondary)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <i className="fas fa-file-alt" /> Article
                          </button>
                          <button
                            onClick={() => setEditorialSubTab("video")}
                            style={{
                              padding: "6px 12px",
                              background: editorialSubTab === "video" ? "var(--bg-elevated)" : "none",
                              border: editorialSubTab === "video" ? "1px solid var(--border)" : "1px solid transparent",
                              color: editorialSubTab === "video" ? "var(--text)" : "var(--text-secondary)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <i className="fas fa-video" style={{ color: editorialSubTab === "video" ? "#ef4444" : "inherit" }} /> Solution Vidéo
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="practice-ide-editorial-body" style={{ flex: 1, overflowY: "auto" }}>
                      {editorialSubTab === "video" && exercise.videoUrl ? (
                        <div className="practice-editorial-video" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", background: "#000" }}>
                            <VideoPlayer url={exercise.videoUrl} />
                          </div>
                          <div>
                            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: 700 }}>
                              {exercise.videoTitle || "Explication vidéo de la solution"}
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                              {exercise.videoDescription || "Visionnez cette vidéo explicative étape par étape pour comprendre comment résoudre ce problème de manière optimale."}
                            </p>
                          </div>
                        </div>
                      ) : exercise.editorial ? (
                        <div className="practice-ide-markdown" style={{ fontSize: "0.86rem", lineHeight: "1.6" }}>
                          {segmentMarkdown(exercise.editorial).map((seg, sIdx) => {
                            if (seg.type === "markdown") {
                              return (
                                <ReactMarkdown key={sIdx} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                  {seg.content}
                                </ReactMarkdown>
                              );
                            } else {
                              return <EditorialCodeTabs key={sIdx} tabs={seg.tabs} />;
                            }
                          })}
                        </div>
                      ) : (
                        <div className="practice-ide-empty">
                          <i className="fas fa-book-open fa-2x mb-2" />
                          <p>Aucun éditorial écrit disponible pour cet exercice.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SOLUTIONS (LEADERBOARD) TAB */}
                {leftTab === "solutions" && (
                  <div className="practice-ide-leaderboard">
                    <h4 className="practice-ide-section-title">
                      <i className="fas fa-trophy" /> Classement des étudiants
                    </h4>
                    {leaderboard.length === 0 ? (
                      <div className="practice-ide-empty">
                        <i className="fas fa-trophy fa-2x mb-2" />
                        <p>Le classement est vide pour l'instant.</p>
                      </div>
                    ) : (
                      <ol className="practice-ide-leaderboard-list">
                        {leaderboard.map((e: any) => {
                          const medal =
                            e.rank === 1
                              ? "🥇"
                              : e.rank === 2
                              ? "🥈"
                              : e.rank === 3
                              ? "🥉"
                              : `#${e.rank}`;
                          return (
                            <li
                              key={e.rank}
                              className={`practice-ide-leaderboard-item${e.rank <= 3 ? " top" : ""}`}
                            >
                              <span className="practice-ide-leaderboard-rank">
                                {medal}
                              </span>
                              <span className="practice-ide-leaderboard-name">
                                {e.studentId}
                              </span>
                              <span className="practice-ide-leaderboard-score">
                                {e.scorePercent ?? "—"}%
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                )}

                {/* SUBMISSIONS (HISTORY) TAB */}
                {leftTab === "submissions" && (
                  <div className="practice-ide-history">
                    <h4 className="practice-ide-section-title">
                      <i className="fas fa-history" /> Historique des soumissions
                    </h4>
                    {history.length === 0 ? (
                      <div className="practice-ide-empty">
                        <i className="fas fa-inbox fa-2x mb-2" />
                        <p>Aucune soumission pour l'instant.</p>
                      </div>
                    ) : (
                      <ul className="practice-ide-history-list">
                        {history.map((h: any) => {
                          const accepted = h.status === "ACCEPTED";
                          return (
                            <li key={h.id} className="practice-ide-history-item">
                              <div className="practice-ide-history-status">
                                <i
                                  className={`fas ${accepted ? "fa-check-circle" : "fa-times-circle"}`}
                                  style={{
                                    color: accepted ? "#22c55e" : "#ef4444",
                                  }}
                                />
                                <span
                                  className="practice-ide-history-label"
                                  style={{
                                    color: accepted ? "#22c55e" : "#ef4444",
                                  }}
                                >
                                  {accepted
                                    ? "Accepté"
                                    : h.status?.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div className="practice-ide-history-meta">
                                <span className="practice-ide-history-score">
                                  {h.scorePercent ?? "—"}%
                                </span>
                                <span className="practice-ide-history-date">
                                  {new Date(h.submittedAt).toLocaleString()}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Allotment.Pane>

          {/* RIGHT PANEL */}
          <Allotment.Pane minSize={340}>
            <Allotment vertical defaultSizes={[65, 35]}>
              {/* Code editor */}
              <Allotment.Pane minSize={100}>
                <div className="practice-ide-panel practice-ide-right-panel">
                  {/* Editor toolbar */}
                  <div className="practice-ide-editor-toolbar">
                    <div className="practice-ide-lang-selector-wrapper">
                      <i className="fas fa-code practice-ide-lang-icon" />
                      <select
                        className="practice-ide-lang-selector"
                        value={language}
                        onChange={(e) => {
                          const lang = e.target.value;
                          setLanguage(lang);
                          const isStarterCode = 
                            !code.trim() ||
                            Object.values(STARTERS).some((s) => code === s) ||
                            (exercise.starterCode && code === exercise.starterCode) ||
                            (exercise.languageStarterCodes && Object.values(exercise.languageStarterCodes).some((s) => code === s));
                          if (isStarterCode) {
                            setCode(
                              (exercise.languageStarterCodes && exercise.languageStarterCodes[lang]) || exercise.starterCode || STARTERS[lang] || ""
                            );
                          }
                        }}
                      >
                        {langs.map((l: string) => (
                          <option key={l} value={l}>
                            {LANG_LABELS[l] || l}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="practice-ide-editor-actions">
                      <button
                        className="practice-ide-tool-btn"
                        title="Réinitialiser le code"
                        onClick={() =>
                          setCode(
                            (exercise.languageStarterCodes && exercise.languageStarterCodes[language])
                            || exercise.starterCode
                            || STARTERS[language]
                            || ""
                          )
                        }
                      >
                        <i className="fas fa-undo" />
                      </button>
                    </div>
                  </div>

                  {/* Monaco Editor filling the rest */}
                  <div className="practice-ide-editor-area">
                    <CodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      height="100%"
                    />
                  </div>
                </div>
              </Allotment.Pane>

              {/* Console / Results */}
              <Allotment.Pane minSize={100}>
                <div className="practice-ide-console" ref={consoleRef}>
                  <div className="practice-ide-console-header-container" style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                    <div style={{ display: "flex" }}>
                       <button
                         className="practice-ide-console-tab"
                         onClick={() => { setConsoleTab("testcase"); setConsoleOpen(true); }}
                         style={{ padding: "10px 16px", background: "none", border: "none", color: consoleTab === "testcase" ? "var(--text)" : "var(--text-secondary)", borderBottom: consoleTab === "testcase" ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                       >
                         <i className="fas fa-check-square" style={{ color: consoleTab === "testcase" ? "var(--lc-easy)" : "inherit" }} /> Testcase
                       </button>
                       <button
                         className="practice-ide-console-tab"
                         onClick={() => { setConsoleTab("result"); setConsoleOpen(true); }}
                         style={{ padding: "10px 16px", background: "none", border: "none", color: consoleTab === "result" ? "var(--text)" : "var(--text-secondary)", borderBottom: consoleTab === "result" ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                       >
                         <i className="fas fa-terminal" style={{ color: consoleTab === "result" ? "var(--lc-easy)" : "inherit" }} /> Test Result
                         {result && (
                           <span style={{ marginLeft: "4px" }}>
                             <i className={`fas fa-circle`} style={{ fontSize: "0.6rem", color: result.status === "ACCEPTED" ? "var(--lc-easy)" : "var(--lc-hard)" }} />
                           </span>
                         )}
                       </button>
                    </div>
                    <button
                      onClick={() => setConsoleOpen((v) => !v)}
                      style={{ padding: "0 16px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", height: "100%" }}
                    >
                      <i className={`fas fa-chevron-${consoleOpen ? "down" : "up"}`} />
                    </button>
                  </div>

                  {consoleOpen && (
                    <div className="practice-ide-console-body" style={{ height: "calc(100% - 40px)", overflowY: "auto" }}>
                      {consoleTab === "testcase" ? (
                        <div className="practice-ide-testcases p-3">
                           {exercise?.publicTestCases?.length > 0 ? (
                             <>
                               <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                 {exercise.publicTestCases.map((tc: any, i: number) => (
                                   <button 
                                     key={i} 
                                     onClick={() => setActiveTestCaseTab(i)}
                                     className="practice-ide-btn btn-sm" 
                                     style={{ 
                                       background: activeTestCaseTab === i ? "var(--bg-elevated)" : "rgba(255,255,255,0.05)", 
                                       border: activeTestCaseTab === i ? "1px solid var(--border)" : "1px solid transparent", 
                                       color: activeTestCaseTab === i ? "var(--text)" : "var(--text-secondary)",
                                       borderRadius: "4px",
                                       padding: "6px 12px",
                                       fontWeight: 600
                                     }}
                                   >
                                     Case {i + 1}
                                   </button>
                                 ))}
                               </div>
                               {exercise.publicTestCases[activeTestCaseTab] && (
                                 <div>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Entrée :</div>
                                    <pre style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "6px", fontSize: "0.85rem", border: "1px solid var(--border)", whiteSpace: "pre-wrap", color: "var(--text)", fontFamily: "monospace" }}>
                                      {exercise.publicTestCases[activeTestCaseTab].input}
                                    </pre>
                                 </div>
                               )}
                             </>
                           ) : (
                             <div className="practice-ide-console-empty text-muted">
                               Aucun cas de test public disponible.
                             </div>
                           )}
                        </div>
                      ) : (
                        running || submitting ? (
                          <div className="practice-ide-console-running" style={{ padding: "20px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="fas fa-circle-notch fa-spin" />
                            {running ? "Exécution en cours..." : "Soumission en cours..."}
                          </div>
                        ) : result ? (
                          <SubmissionResults
                            results={result.results || []}
                            status={result.status}
                            scorePercent={result.scorePercent}
                            mode={result.mode}
                          />
                        ) : (
                          <div className="practice-ide-console-empty" style={{ padding: "20px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="fas fa-play-circle" />
                            <span>
                              Exécutez ou soumettez votre code pour voir les résultats.
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
        </Allotment>
      </div>

      <ConfirmModal
        show={showSubmitConfirm}
        title="Soumettre la solution"
        message="Soumettre votre solution pour évaluation complète ?"
        confirmLabel="Soumettre"
        onConfirm={confirmSubmit}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
};

export default PracticeSolve;
