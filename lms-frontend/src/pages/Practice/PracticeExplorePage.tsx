import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../../components/ui";

// ─── Course Data ─────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  subtitle: string;
  chapters: number;
  items: number;
  progress: number;
  gradient: string;
  icon: string;
  accentColor: string;
  shape: "circles" | "grid" | "waves" | "dots" | "hexagons" | "lines";
}

const ALL_COURSES: Course[] = [
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Cours Crash Course",
    chapters: 13,
    items: 149,
    progress: 0,
    gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
    icon: "fa-project-diagram",
    accentColor: "#a78bfa",
    shape: "circles",
  },
  {
    id: "system-design",
    title: "System Design for Interviews and Beyond",
    subtitle: "Cours Crash Course",
    chapters: 16,
    items: 81,
    progress: 0,
    gradient: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
    icon: "fa-server",
    accentColor: "#34d399",
    shape: "hexagons",
  },
  {
    id: "beginner",
    title: "The Beginner's Guide to Algorithms",
    subtitle: "Collection d'introduction",
    chapters: 4,
    items: 17,
    progress: 12,
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
    icon: "fa-lightbulb",
    accentColor: "#fdba74",
    shape: "waves",
  },
  {
    id: "top-interview",
    title: "Top Interview Questions",
    subtitle: "Easy Collection",
    chapters: 9,
    items: 48,
    progress: 0,
    gradient: "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
    icon: "fa-star",
    accentColor: "#67e8f9",
    shape: "dots",
  },
  {
    id: "dp",
    title: "Dynamic Programming",
    subtitle: "Explication détaillée",
    chapters: 6,
    items: 55,
    progress: 0,
    gradient: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
    icon: "fa-brain",
    accentColor: "#5eead4",
    shape: "circles",
  },
  {
    id: "arrays",
    title: "Arrays 101",
    subtitle: "Introduction aux structures",
    chapters: 6,
    items: 31,
    progress: 0,
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
    icon: "fa-th",
    accentColor: "#93c5fd",
    shape: "grid",
  },
  {
    id: "cheatsheets",
    title: "Cheatsheets",
    subtitle: "Référence rapide",
    chapters: 1,
    items: 3,
    progress: 0,
    gradient: "linear-gradient(135deg, #3730a3 0%, #4338ca 50%, #6366f1 100%)",
    icon: "fa-file-alt",
    accentColor: "#a5b4fc",
    shape: "lines",
  },
  {
    id: "sql",
    title: "SQL Language",
    subtitle: "Explication détaillée",
    chapters: 4,
    items: 36,
    progress: 0,
    gradient: "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)",
    icon: "fa-database",
    accentColor: "#38bdf8",
    shape: "hexagons",
  },
  {
    id: "graph",
    title: "Graph",
    subtitle: "Explication détaillée",
    chapters: 6,
    items: 58,
    progress: 0,
    gradient: "linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)",
    icon: "fa-sitemap",
    accentColor: "#86efac",
    shape: "lines",
  },
  {
    id: "heap",
    title: "Heap",
    subtitle: "Explication détaillée",
    chapters: 4,
    items: 28,
    progress: 0,
    gradient: "linear-gradient(135deg, #9d174d 0%, #be185d 50%, #db2777 100%)",
    icon: "fa-layer-group",
    accentColor: "#f9a8d4",
    shape: "dots",
  },
  {
    id: "bit-manip",
    title: "Bit Manipulation",
    subtitle: "Explication détaillée",
    chapters: 3,
    items: 22,
    progress: 0,
    gradient: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)",
    icon: "fa-microchip",
    accentColor: "#fcd34d",
    shape: "grid",
  },
];

// ─── SVG Background Shapes ────────────────────────────────────────────────────

const ShapeOverlay: React.FC<{ shape: Course["shape"]; accent: string }> = ({ shape, accent }) => {
  const opacity = 0.12;
  if (shape === "circles") {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        <circle cx="160" cy="20" r="50" fill={accent} fillOpacity={opacity} />
        <circle cx="180" cy="90" r="35" fill={accent} fillOpacity={opacity * 0.6} />
        <circle cx="20" cy="100" r="25" fill={accent} fillOpacity={opacity * 0.4} />
      </svg>
    );
  }
  if (shape === "grid") {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        {[0, 1, 2, 3, 4].map(i => [0, 1, 2, 3].map(j => (
          <rect key={`${i}-${j}`} x={120 + i * 16} y={j * 30} width="10" height="10" rx="2" fill={accent} fillOpacity={opacity} />
        )))}
      </svg>
    );
  }
  if (shape === "waves") {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        <path d="M 100 40 Q 130 20 160 40 Q 190 60 200 40" stroke={accent} strokeWidth="2" fill="none" strokeOpacity={opacity * 2} />
        <path d="M 100 60 Q 130 40 160 60 Q 190 80 200 60" stroke={accent} strokeWidth="2" fill="none" strokeOpacity={opacity * 2} />
        <path d="M 100 80 Q 130 60 160 80 Q 190 100 200 80" stroke={accent} strokeWidth="2" fill="none" strokeOpacity={opacity * 2} />
        <circle cx="170" cy="50" r="30" fill={accent} fillOpacity={opacity * 0.5} />
      </svg>
    );
  }
  if (shape === "dots") {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        {[0, 1, 2, 3, 4, 5].map(i => [0, 1, 2, 3, 4].map(j => (
          <circle key={`${i}-${j}`} cx={110 + i * 15} cy={10 + j * 25} r="3" fill={accent} fillOpacity={opacity * 1.5} />
        )))}
      </svg>
    );
  }
  if (shape === "hexagons") {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        <polygon points="170,10 185,20 185,40 170,50 155,40 155,20" fill={accent} fillOpacity={opacity} />
        <polygon points="150,45 165,55 165,75 150,85 135,75 135,55" fill={accent} fillOpacity={opacity * 0.6} />
        <polygon points="185,55 200,65 200,85 185,95 170,85 170,65" fill={accent} fillOpacity={opacity * 0.4} />
      </svg>
    );
  }
  if (shape === "lines") {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        <line x1="120" y1="0" x2="200" y2="80" stroke={accent} strokeWidth="1.5" strokeOpacity={opacity * 2} />
        <line x1="140" y1="0" x2="200" y2="60" stroke={accent} strokeWidth="1.5" strokeOpacity={opacity * 1.5} />
        <line x1="160" y1="0" x2="200" y2="40" stroke={accent} strokeWidth="1.5" strokeOpacity={opacity} />
        <circle cx="175" cy="30" r="25" fill={accent} fillOpacity={opacity * 0.5} />
      </svg>
    );
  }
  return null;
};

// ─── Course Card ──────────────────────────────────────────────────────────────

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/student/practice/explore/${course.id}`);
  };

  return (
    <div
      className="explore-course-card"
      style={{ background: course.gradient, transform: hovered ? "translateY(-4px) scale(1.02)" : "none", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.2)", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <ShapeOverlay shape={course.shape} accent={course.accentColor} />

      <div className="explore-course-content">
        <div className="explore-course-subtitle">{course.subtitle}</div>
        <div className="explore-course-title">{course.title}</div>
      </div>

      <div className="explore-course-footer">
        <div className="explore-course-meta">
          <span><i className="fas fa-book-open me-1" />{course.chapters} Chapitres</span>
          <span><i className="fas fa-tasks me-1" />{course.items} Items</span>
          {course.progress > 0 && (
            <span style={{ color: "#4ade80" }}>{course.progress}%</span>
          )}
        </div>
        <button
          className="explore-course-play"
          title="Commencer"
          style={{ background: "rgba(255,255,255,0.2)" }}
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
        >
          <i className="fas fa-play" />
        </button>
      </div>

      {course.progress > 0 && (
        <div className="explore-course-progress-bar">
          <div style={{ width: `${course.progress}%`, background: course.accentColor, height: "100%", borderRadius: "2px", transition: "width 0.5s ease" }} />
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PracticeExplorePage: React.FC = () => {
  return (
    <PageTransition>
      <div className="explore-page">
        <div className="explore-section" style={{ marginTop: "10px" }}>
          <div className="explore-cards-grid">
            {ALL_COURSES.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PracticeExplorePage;
