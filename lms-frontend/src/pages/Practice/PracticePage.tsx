import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PracticeCatalog from "./PracticeCatalog";
import PracticeExplorePage from "./PracticeExplorePage";

type Tab = "library" | "explore";

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL hash or default to library
  const getInitialTab = (): Tab => {
    if (location.hash === "#explore") return "explore";
    return "library";
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    navigate(`/student/practice${tab === "explore" ? "#explore" : ""}`, { replace: true });
  };

  return (
    <div className="practice-page-root">
      {/* ── Tab Navigation Bar ───────────────────────────────────────────────── */}
      <div className="practice-tab-nav">
        <div className="container" style={{ maxWidth: "100%", padding: "0 1.5rem" }}>
          <div className="practice-tab-inner">
            <div className="practice-tabs">
              <button
                className={`practice-tab-btn ${activeTab === "library" ? "active" : ""}`}
                onClick={() => handleTabChange("library")}
                id="tab-library"
              >
                <i className="fas fa-list-alt me-2" />
                Library
              </button>
              <button
                className={`practice-tab-btn ${activeTab === "explore" ? "active" : ""}`}
                onClick={() => handleTabChange("explore")}
                id="tab-explore"
              >
                <i className="fas fa-compass me-2" />
                Explore
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <div className={`practice-tab-content ${activeTab}`}>
        {activeTab === "library" && <PracticeCatalog />}
        {activeTab === "explore" && <PracticeExplorePage />}
      </div>
    </div>
  );
};

export default PracticePage;
