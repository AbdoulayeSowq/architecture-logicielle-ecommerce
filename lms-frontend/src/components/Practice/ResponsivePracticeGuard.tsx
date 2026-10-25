import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const ResponsivePracticeGuard: React.FC<Props> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        padding: "40px 24px",
        textAlign: "center",
        background: "var(--bg-main)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          maxWidth: "460px",
          width: "100%",
          padding: "32px",
          borderRadius: "20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            border: "2px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.2rem",
            color: "#ef4444",
            marginBottom: "8px"
          }}>
            <i className="fas fa-laptop-code" />
          </div>

          <h2 style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px",
            color: "var(--text-primary)"
          }}>
            Écran trop étroit
          </h2>

          <p style={{
            fontSize: "0.92rem",
            lineHeight: "1.6",
            color: "var(--text-secondary)",
            margin: 0
          }}>
            L'espace de pratique (éditeur de code, console et cours interactifs) nécessite un écran plus grand (ordinateur ou tablette) pour vous offrir un espace de travail confortable et fonctionnel.
          </p>

          <Link
            to="/student"
            style={{
              marginTop: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "10px",
              background: "var(--accent)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.88rem",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="fas fa-arrow-left" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ResponsivePracticeGuard;
