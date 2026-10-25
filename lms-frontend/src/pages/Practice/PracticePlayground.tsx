import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import CodeEditor from "../../components/Practice/CodeEditor";
import SubmissionResults from "../../components/Practice/SubmissionResults";
import { runPracticePlayground } from "../../services/api/practice";
import { notifyError } from "../../components/notify";

const STARTERS: Record<string, string> = {
  python: "# Écris ton code ici\n\ndef main():\n    print('Hello World')\n\nif __name__ == '__main__':\n    main()\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World\" << endl;\n    return 0;\n}\n",
  javascript: "console.log('Hello World');\n",
  c: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello World\\n\");\n    return 0;\n}\n",
  php: "<?php\n// Votre code ici\necho \"Hello World\\n\";\n?>\n",
  dart: "void main() {\n    print('Hello World');\n}\n",
};

const LANG_LABELS: Record<string, string> = {
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  javascript: "JavaScript",
  php: "PHP",
  dart: "Dart",
};

const langs = ["python", "java", "cpp", "c", "javascript", "php", "dart"];

const PracticePlayground: React.FC<{ basePath?: string }> = ({
  basePath = "/student/practice",
}) => {
  const [code, setCode] = useState(STARTERS["python"]);
  const [language, setLanguage] = useState("python");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const consoleRef = useRef<HTMLDivElement>(null);

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



  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setConsoleOpen(true);
    try {
      const res = await runPracticePlayground({ sourceCode: code, language });
      setResult({ ...res, mode: "run" });
    } catch (e: any) {
      notifyError(e.response?.data?.message || "Erreur d'exécution");
    }
    setRunning(false);
  };

  return (
    <div className="practice-ide-root">
      <div className="practice-ide-topbar">
        <div className="practice-ide-topbar-left">
          <Link to={basePath} className="practice-ide-back-btn">
            <i className="fas fa-chevron-left" />
            <span>Catalogue</span>
          </Link>
          <div className="practice-ide-title-bar">
            <span className="practice-ide-exercise-title">Playground (Bac à sable)</span>
            <span className="practice-ide-badge" style={{ color: "#3b82f6", background: "rgba(59,130,246,0.12)" }}>
              <i className="fas fa-flask" /> Mode Libre
            </span>
          </div>
        </div>
      </div>

      <div className="practice-ide-body">
        <div style={{ width: "100%", height: "100%" }}>
          <Allotment vertical defaultSizes={[65, 35]}>
            <Allotment.Pane minSize={100}>
              <div className="practice-ide-panel practice-ide-right-panel">
                <div className="practice-ide-editor-toolbar">
                  <div className="practice-ide-lang-selector-wrapper">
                    <i className="fas fa-code practice-ide-lang-icon" />
                    <select
                      className="practice-ide-lang-selector"
                      value={language}
                      onChange={(e) => {
                        const lang = e.target.value;
                        setLanguage(lang);
                        if (!code.trim() || Object.values(STARTERS).some((s) => code === s)) {
                          setCode(STARTERS[lang] || "");
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
                      onClick={() => setCode(STARTERS[language] || "")}
                    >
                      <i className="fas fa-undo" />
                    </button>
                    <button
                      className="practice-ide-btn practice-ide-btn-run"
                      onClick={handleRun}
                      disabled={running}
                    >
                      {running ? (
                        <><i className="fas fa-circle-notch fa-spin" /> Exécution...</>
                      ) : (
                        <><i className="fas fa-play" /> Exécuter</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="practice-ide-editor-area">
                  <CodeEditor value={code} onChange={setCode} language={language} height="100%" />
                </div>
              </div>
            </Allotment.Pane>
            
            <Allotment.Pane minSize={100}>
              <div className="practice-ide-console" ref={consoleRef}>
                <button
                  className="practice-ide-console-header"
                  onClick={() => setConsoleOpen((v) => !v)}
                >
                  <span>
                    <i className="fas fa-terminal" /> Console
                    {result && (
                      <span
                        className="practice-ide-console-badge"
                        style={{ color: result.status === "ACCEPTED" ? "var(--lc-easy)" : "var(--lc-hard)" }}
                      >
                        {result.status === "ACCEPTED" ? " ✓ Exécuté" : ` ✗ Erreur`}
                      </span>
                    )}
                  </span>
                  <i className={`fas fa-chevron-${consoleOpen ? "down" : "up"}`} />
                </button>
                {consoleOpen && (
                  <div className="practice-ide-console-body">
                    {running ? (
                      <div className="practice-ide-console-running">
                        <i className="fas fa-circle-notch fa-spin" /> Exécution en cours...
                      </div>
                    ) : result ? (
                      <SubmissionResults
                        results={result.results || []}
                        status={result.status}
                        scorePercent={100}
                        mode="run"
                      />
                    ) : (
                      <div className="practice-ide-console-empty">
                        <i className="fas fa-play-circle" />
                        <span>Exécutez votre code pour voir les résultats.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>
    </div>
  );
};

export default PracticePlayground;
