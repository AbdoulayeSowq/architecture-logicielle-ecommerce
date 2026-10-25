import React from "react";
import { TestCaseInput } from "../../services/api/practice";

interface Props {
  testCases: TestCaseInput[];
  onChange: (cases: TestCaseInput[]) => void;
}

const emptyCase = (orderIndex: number): TestCaseInput => ({
  input: "",
  expectedOutput: "",
  hidden: false,
  orderIndex,
  weightPercent: 100,
});

const TestCaseEditor: React.FC<Props> = ({ testCases, onChange }) => {
  const update = (idx: number, field: keyof TestCaseInput, value: string | boolean | number) => {
    const next = testCases.map((tc, i) => (i === idx ? { ...tc, [field]: value } : tc));
    onChange(next);
  };

  const add = () => onChange([...testCases, emptyCase(testCases.length)]);
  const remove = (idx: number) => onChange(testCases.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0" style={{ color: "var(--text-primary)" }}>Cas de test</h6>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={add}>
          <i className="fas fa-plus me-1" /> Ajouter
        </button>
      </div>
      {testCases.map((tc, idx) => (
        <div key={idx} className="p-3 mb-2 rounded" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          <div className="d-flex justify-content-between mb-2">
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Test #{idx + 1}</span>
            {testCases.length > 1 && (
              <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => remove(idx)}>
                Supprimer
              </button>
            )}
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="small text-muted">Entrée (stdin)</label>
              <textarea
                className="form-control font-monospace"
                rows={2}
                value={tc.input}
                onChange={(e) => update(idx, "input", e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="small text-muted">Sortie attendue</label>
              <textarea
                className="form-control font-monospace"
                rows={2}
                value={tc.expectedOutput}
                onChange={(e) => update(idx, "expectedOutput", e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <div className="form-check mt-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`hidden-${idx}`}
                  checked={tc.hidden}
                  onChange={(e) => update(idx, "hidden", e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`hidden-${idx}`}>
                  Cas caché
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <label className="small text-muted">Poids %</label>
              <input
                type="number"
                className="form-control"
                min={1}
                max={100}
                value={tc.weightPercent}
                onChange={(e) => update(idx, "weightPercent", Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestCaseEditor;
