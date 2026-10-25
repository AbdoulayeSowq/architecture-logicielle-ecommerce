import React, { useState, useEffect } from "react";

interface TestResult {
  index: number;
  passed: boolean;
  stdout?: string;
  logs?: string;
  stderr?: string;
  input?: string;
  expectedOutput?: string;
  hidden?: boolean;
  executionTimeMs?: number;
}

interface Props {
  results: TestResult[];
  status?: string;
  scorePercent?: number;
  mode?: "run" | "submit";
}

const SubmissionResults: React.FC<Props> = ({
  results,
  status,
  scorePercent,
  mode,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Reset active tab when new results are received
  useEffect(() => {
    if (results && results.length > 0) {
      // Find first failed test case, otherwise default to first tab
      const firstFailedIdx = results.findIndex((r) => !r.passed);
      setActiveTab(firstFailedIdx !== -1 ? firstFailedIdx : 0);
    }
  }, [results]);

  if (!results?.length) return null;

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const accepted = status === "ACCEPTED";
  const activeResult = results[activeTab] || results[0];

  return (
    <div className="practice-results">
      {/* Summary banner */}
      {(status || scorePercent !== undefined) && (
        <div
          className="practice-results-summary"
          style={{
            borderLeft: `4px solid ${accepted ? "var(--lc-easy)" : "var(--lc-hard)"}`,
            background: accepted
              ? "rgba(0, 184, 163, 0.05)"
              : "rgba(255, 45, 85, 0.05)",
          }}
        >
          <div className="practice-results-summary-status">
            <i
              className={`fas ${accepted ? "fa-check-circle" : "fa-times-circle"}`}
              style={{ color: accepted ? "var(--lc-easy)" : "var(--lc-hard)" }}
            />
            <span
              className="practice-results-summary-label"
              style={{ color: accepted ? "var(--lc-easy)" : "var(--lc-hard)" }}
            >
              {accepted ? "Accepté !" : status?.replace(/_/g, " ") ?? "Erreur"}
            </span>
          </div>
          <div className="practice-results-summary-meta">
            <span className="practice-results-stat">
              <i className="fas fa-vial" /> {passedCount}/{totalCount} cas passés
            </span>
            {scorePercent !== undefined && (
              <span className="practice-results-stat">
                <i className="fas fa-star" /> {scorePercent}%
              </span>
            )}
            {mode && (
              <span className="practice-results-mode-badge">
                {mode === "submit" ? "Soumission" : "Exécution"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="practice-results-progress-bar">
        <div
          className="practice-results-progress-fill"
          style={{
            width: `${totalCount > 0 ? (passedCount / totalCount) * 100 : 0}%`,
            background: accepted
              ? "linear-gradient(90deg, var(--lc-easy), #00a390)"
              : "linear-gradient(90deg, var(--lc-hard), #e01b43)",
          }}
        />
      </div>

      {/* Test cases Tabs */}
      <div className="lc-result-tabs">
        {results.map((r, idx) => (
          <button
            key={r.index}
            className={`lc-result-tab-btn ${r.passed ? "passed" : "failed"} ${
              activeTab === idx ? "active" : ""
            }`}
            onClick={() => setActiveTab(idx)}
          >
            <span
              className={`lc-result-status-dot ${r.passed ? "passed" : "failed"}`}
            />
            <span>Cas {r.index + 1}</span>
            {r.hidden && <span style={{ fontSize: "0.68rem", opacity: 0.6 }}>(caché)</span>}
          </button>
        ))}
      </div>

      {/* Selected Test Case Details */}
      {activeResult && (
        <div
          className={`practice-result-item ${
            activeResult.passed ? "passed" : "failed"
          }`}
          style={{ border: "none", background: "transparent" }}
        >
          <div className="practice-result-item-header" style={{ padding: "0 4px 10px 4px" }}>
            <div className="practice-result-item-title">
              <i
                className={`fas ${
                  activeResult.passed ? "fa-check-circle" : "fa-times-circle"
                }`}
                style={{ color: activeResult.passed ? "var(--lc-easy)" : "var(--lc-hard)" }}
              />
              <span style={{ fontWeight: 700 }}>
                {activeResult.passed ? "Test Case Réussi" : "Test Case Échoué"}
              </span>
            </div>
            {activeResult.executionTimeMs != null && (
              <span className="practice-result-time">
                <i className="fas fa-clock" /> {activeResult.executionTimeMs} ms
              </span>
            )}
          </div>

          <div className="practice-result-details" style={{ padding: 0 }}>
            {activeResult.hidden ? (
              <div className="p-3 text-center" style={{ background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <i className="fas fa-eye-slash mb-2" style={{ color: "var(--text-muted)", fontSize: "1.2rem" }} />
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Ce cas de test est caché. Les détails des entrées et sorties ne sont pas disponibles publiquement.
                </p>
                {activeResult.stderr && (
                  <pre className="practice-result-code practice-result-code-err mt-2 text-start">
                    {activeResult.stderr}
                  </pre>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeResult.input != null && (
                  <div className="lc-example-card" style={{ margin: 0 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Entrée</span>
                    <pre className="practice-result-code" style={{ margin: 0, fontFamily: "inherit" }}>
                      {activeResult.input
                        ? activeResult.input.replace(/\\n/g, "\n").trim() || "(vide)"
                        : "(vide)"}
                    </pre>
                  </div>
                )}

                {activeResult.logs && activeResult.logs.trim() !== "" && (
                  <div className="lc-example-card" style={{ margin: 0 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      Stdout
                    </span>
                    <pre className="practice-result-code" style={{ margin: 0, fontFamily: "inherit", background: "rgba(255, 255, 255, 0.02)", color: "var(--text)" }}>
                      {activeResult.logs.replace(/\\n/g, '\n')}
                    </pre>
                  </div>
                )}

                {activeResult.stdout != null && (
                  <div className="lc-example-card" style={{ margin: 0 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Sortie</span>
                    <pre className="practice-result-code practice-result-code-out" style={{ margin: 0, fontFamily: "inherit" }}>
                      {activeResult.stdout ? activeResult.stdout.replace(/\\n/g, '\n') : "(vide)"}
                    </pre>
                  </div>
                )}

                {activeResult.expectedOutput != null && !activeResult.passed && (
                  <div className="lc-example-card failed" style={{ margin: 0 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Attendu</span>
                    <pre className="practice-result-code practice-result-code-expected" style={{ margin: 0, fontFamily: "inherit" }}>
                      {activeResult.expectedOutput ? activeResult.expectedOutput.replace(/\\n/g, '\n') : ""}
                    </pre>
                  </div>
                )}

                {activeResult.stderr && (
                  <div className="lc-example-card failed" style={{ margin: 0 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Message d'erreur (Stderr)</span>
                    <pre className="practice-result-code practice-result-code-err" style={{ margin: 0 }}>
                      {activeResult.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionResults;
