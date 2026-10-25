const fs = require('fs');
const file = 'src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace S.property with classNames
const replacements = {
  'style={S.backBtn}': 'className="btn btn-link text-muted p-0 mb-3 font-weight-bold text-decoration-none"',
  'style={S.card}': 'className="card shadow-sm border-0 mb-3"',
  'style={{ ...S.card,': 'className="card shadow-sm border-0 mb-3" style={{',
  'style={{...S.card,': 'className="card shadow-sm border-0 mb-3" style={{',
  'style={S.cardBody}': 'className="card-body p-4"',
  'style={S.cardTitle}': 'className="font-weight-bold mb-2"',
  'style={S.content}': 'className="container py-4"',
  'style={S.dangerBtn}': 'className="btn btn-outline-danger btn-sm font-weight-bold rounded"',
  'style={S.emptyState}': 'className="empty-state-box py-5 text-center"',
  'style={S.flexBetween}': 'className="d-flex justify-content-between align-items-center mb-4"',
  'style={S.formGroup}': 'className="form-group mb-4"',
  'style={S.header}': 'className="bg-dark text-white py-4"',
  'style={S.headerGreet}': 'className="text-muted small font-weight-bold text-uppercase mb-2"',
  'style={S.headerInner}': 'className="container"',
  'style={S.headerTitle}': 'className="font-weight-bold m-0"',
  'style={S.input}': 'className="form-control bg-light py-2"',
  'style={S.label}': 'className="text-muted small font-weight-bold text-uppercase d-block mb-2"',
  'style={S.modal}': 'className="modal-content border-0 shadow-lg p-4 rounded-lg"',
  'style={S.modalOverlay}': 'className="modal-backdrop fade show d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 1050 }}',
  'style={S.outlineBtn}': 'className="btn btn-outline-primary font-weight-bold rounded"',
  'style={{ ...S.outlineBtn,': 'className="btn btn-outline-primary font-weight-bold rounded" style={{',
  'style={{...S.outlineBtn,': 'className="btn btn-outline-primary font-weight-bold rounded" style={{',
  'style={S.primaryBtn}': 'className="btn btn-primary font-weight-bold rounded"',
  'style={{ ...S.primaryBtn,': 'className="btn btn-primary font-weight-bold rounded" style={{',
  'style={{...S.primaryBtn,': 'className="btn btn-primary font-weight-bold rounded" style={{',
  'style={S.secondaryBtn}': 'className="btn btn-secondary font-weight-bold rounded"',
  'style={S.sectionTitle}': 'className="font-weight-bold m-0 d-flex align-items-center"',
  'style={S.tabBtn}': 'className="btn btn-link font-weight-bold text-decoration-none"',
  '...S.tabBtn,': ''
};

for (const [key, val] of Object.entries(replacements)) {
  content = content.split(key).join(val);
}

// remove S definition at the bottom
const sStart = content.lastIndexOf('const S: any = {');
if (sStart !== -1) {
  const sEnd = content.indexOf('};', sStart);
  if (sEnd !== -1) {
    content = content.substring(0, sStart) + content.substring(sEnd + 2);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log("Replaced S object styling");
