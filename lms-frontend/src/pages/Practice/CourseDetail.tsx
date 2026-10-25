import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { COURSES, Chapter, Lesson } from "./courseData";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FlatLesson extends Lesson {
  chapterIndex: number;
  lessonIndex: number;
  globalIndex: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flattenLessons(chapters: Chapter[]): FlatLesson[] {
  const flat: FlatLesson[] = [];
  let globalIndex = 0;
  chapters.forEach((ch, ci) => {
    ch.lessons.forEach((lesson, li) => {
      flat.push({ ...lesson, chapterIndex: ci, lessonIndex: li, globalIndex: globalIndex++ });
    });
  });
  return flat;
}

function getLessonIcon(lesson: Lesson, completed: boolean): React.ReactNode {
  if (lesson.type === "quiz") {
    return (
      <span className={`cd-lesson-checkbox quiz ${completed ? "checked" : ""}`}>
        <i className="fas fa-question" />
      </span>
    );
  }
  if (lesson.type === "exercise") {
    return (
      <span className={`cd-lesson-checkbox exercise ${completed ? "checked" : ""}`}>
        {completed ? <i className="fas fa-check" /> : <span className="cd-ex-dot" />}
      </span>
    );
  }
  // article
  return (
    <span className={`cd-lesson-checkbox article ${completed ? "checked" : ""}`}>
      {completed ? <i className="fas fa-check" /> : null}
    </span>
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar: React.FC<{
  chapters: Chapter[];
  activeLessonId: string;
  completedIds: Set<string>;
  onSelect: (lessonId: string) => void;
  collapsed: boolean;
}> = ({ chapters, activeLessonId, completedIds, onSelect, collapsed }) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(["introduction", "arrays-strings"]));

  const toggleChapter = (chId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(chId) ? next.delete(chId) : next.add(chId);
      return next;
    });
  };

  // Auto-expand the chapter containing the active lesson
  useEffect(() => {
    chapters.forEach(ch => {
      if (ch.lessons.some(l => l.id === activeLessonId)) {
        setExpandedChapters(prev => new Set<string>(Array.from(prev).concat(ch.id)));
      }
    });
  }, [activeLessonId, chapters]);

  if (collapsed) return null;

  return (
    <aside className="cd-sidebar">
      <div className="cd-sidebar-scroll">
        {chapters.map((ch) => {
          const isExpanded = expandedChapters.has(ch.id);
          const chCompleted = ch.lessons.filter(l => completedIds.has(l.id)).length;

          return (
            <div key={ch.id} className="cd-chapter">
              <button
                className="cd-chapter-header"
                onClick={() => toggleChapter(ch.id)}
              >
                <div className="cd-chapter-info">
                  <span className="cd-chapter-title">{ch.title}</span>
                  <span className="cd-chapter-desc">{ch.description}</span>
                  <span className="cd-chapter-count">{chCompleted}/{ch.lessons.length} complétés</span>
                </div>
                <i className={`fas fa-chevron-${isExpanded ? "down" : "right"} cd-chapter-arrow`} />
              </button>

              {isExpanded && (
                <ul className="cd-lessons-list">
                  {ch.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLessonId;
                    const isDone = completedIds.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <button
                          className={`cd-lesson-btn ${isActive ? "active" : ""}`}
                          onClick={() => onSelect(lesson.id)}
                        >
                          {getLessonIcon(lesson, isDone)}
                          <span className="cd-lesson-title">
                            {lesson.type === "article" && <span className="cd-type-badge art">A</span>}
                            {lesson.type === "exercise" && <span className="cd-type-badge ex">E</span>}
                            {lesson.type === "quiz" && <span className="cd-type-badge quiz">Q</span>}
                            {lesson.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

// ─── Main CourseDetail Component ──────────────────────────────────────────────
const CourseDetail: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();

  const course = courseId ? COURSES[courseId] : null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`course_completed_${courseId}`);
      return new Set<string>(saved ? JSON.parse(saved) : ["testimonials", "big-o", "two-pointers"]);
    } catch {
      return new Set<string>(["testimonials", "big-o", "two-pointers"]);
    }
  });

  const allLessons = course ? flattenLessons(course.chapters) : [];
  const firstLesson = allLessons[0];

  // Determine active lesson
  const activeLessonId = lessonId || firstLesson?.id || "";
  const activeLesson = allLessons.find(l => l.id === activeLessonId);
  const activeIndex = allLessons.findIndex(l => l.id === activeLessonId);

  const prevLesson = allLessons[activeIndex - 1];
  const nextLesson = allLessons[activeIndex + 1];

  const handleSelectLesson = useCallback((lid: string) => {
    navigate(`/student/practice/explore/${courseId}/${lid}`);
  }, [navigate, courseId]);

  const markComplete = () => {
    if (!activeLessonId) return;
    const next = new Set(completedIds);
    next.add(activeLessonId);
    setCompletedIds(next);
    localStorage.setItem(`course_completed_${courseId}`, JSON.stringify(Array.from(next)));
  };

  if (!course) {
    return (
      <div className="cd-not-found">
        <i className="fas fa-exclamation-triangle fa-3x mb-3" style={{ color: "var(--lc-medium)" }} />
        <h3>Cours introuvable</h3>
        <Link to="/student/practice#explore" className="btn btn-primary mt-3">
          ← Retour à Explore
        </Link>
      </div>
    );
  }

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(l => completedIds.has(l.id)).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="cd-root">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="cd-topbar">
        <div className="cd-topbar-left">
          <Link to="/student/practice#explore" className="cd-back-btn">
            <i className="fas fa-chevron-left me-1" />
            Retour au chapitre
          </Link>
          <button
            className="cd-sidebar-toggle"
            onClick={() => setSidebarCollapsed(p => !p)}
            title="Masquer/Afficher la sidebar"
          >
            <i className="fas fa-bars" />
          </button>
        </div>

        <div className="cd-topbar-center">
          <div className="cd-topbar-progress">
            <div className="cd-topbar-progress-bar">
              <div className="cd-topbar-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="cd-topbar-progress-text">{progressPct}%</span>
          </div>
        </div>

        <div className="cd-topbar-right">
          <button
            className="cd-nav-btn"
            disabled={!prevLesson}
            onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
          >
            <i className="fas fa-chevron-left me-1" /> Précédent
          </button>
          <button
            className="cd-nav-btn primary"
            disabled={!nextLesson}
            onClick={() => nextLesson && handleSelectLesson(nextLesson.id)}
          >
            Suivant <i className="fas fa-chevron-right ms-1" />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="cd-body">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <Sidebar
            chapters={course.chapters}
            activeLessonId={activeLessonId}
            completedIds={completedIds}
            onSelect={handleSelectLesson}
            collapsed={false}
          />
        )}

        {/* Main Content */}
        <main className="cd-main">
          {activeLesson ? (
            <div className="cd-article">
              <div className="cd-article-header">
                <div className="cd-article-type-label">
                  {activeLesson.type === "article" && <><i className="fas fa-file-alt me-2" />Article</>}
                  {activeLesson.type === "exercise" && <><i className="fas fa-code me-2" />Exercice</>}
                  {activeLesson.type === "quiz" && <><i className="fas fa-question-circle me-2" />Quiz</>}
                </div>
                <h1 className="cd-article-title">{activeLesson.title}</h1>
              </div>

              <div className="cd-article-body">
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isBlock = match || String(children).includes("\n");
                      if (isBlock) {
                        return (
                          <div className="cd-code-block">
                            {match && <span className="cd-code-lang">{match[1]}</span>}
                            <pre><code className={className} {...props}>{children}</code></pre>
                          </div>
                        );
                      }
                      return <code className="cd-inline-code" {...props}>{children}</code>;
                    },
                    blockquote({ children }: any) {
                      return <div className="cd-blockquote">{children}</div>;
                    },
                    table({ children }: any) {
                      return <div className="cd-table-wrapper"><table>{children}</table></div>;
                    },
                    h1({ children }: any) {
                      return <h1 className="cd-h1">{children}</h1>;
                    },
                    h2({ children }: any) {
                      return <h2 className="cd-h2">{children}</h2>;
                    },
                    h3({ children }: any) {
                      return <h3 className="cd-h3">{children}</h3>;
                    },
                  }}
                >
                  {activeLesson.content || `# ${activeLesson.title}\n\nCe chapitre/exercice est disponible gratuitement. Le contenu détaillé est en cours de rédaction.`}
                </ReactMarkdown>
              </div>

              {/* Footer navigation */}
              <div className="cd-article-footer">
                {!completedIds.has(activeLessonId) && (
                  <button className="cd-mark-done-btn" onClick={markComplete}>
                    <i className="fas fa-check me-2" />
                    Marquer comme complété
                  </button>
                )}
                {completedIds.has(activeLessonId) && (
                  <span className="cd-already-done">
                    <i className="fas fa-check-circle me-2" style={{ color: "var(--lc-easy)" }} />
                    Complété
                  </span>
                )}
                <div className="cd-footer-nav">
                  <button
                    className="cd-nav-btn"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
                  >
                    <i className="fas fa-chevron-left me-1" /> Précédent
                  </button>
                  <button
                    className="cd-nav-btn primary"
                    disabled={!nextLesson}
                    onClick={() => { markComplete(); nextLesson && handleSelectLesson(nextLesson.id); }}
                  >
                    Suivant <i className="fas fa-chevron-right ms-1" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="cd-not-found">
              <i className="fas fa-exclamation-triangle fa-3x mb-3" style={{ color: "var(--lc-medium)" }} />
              <h3>Leçon introuvable</h3>
              <Link to={`/student/practice/explore/${courseId}`} className="btn btn-primary mt-3">
                Continuer le cours
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseDetail;
