import re

with open('src/pages/Lecturer/Home/Home.tsx', 'r') as f:
    content = f.read()

# Replace lecturer modules UI
old_modules_ui = """                    <div className="row mb-4">
                        {modules.map((mod: any) => (
                            <div key={mod.id} className="col-md-4 mb-3">
                                <div className="card shadow-sm border-0 h-100">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="badge badge-primary">{mod.codeEC || mod.mid}</span>
                                            <span className="badge badge-light">{mod.semester}</span>
                                        </div>
                                        <h5 className="font-weight-bold mb-3">{stripTitle(mod.name || mod.title)}</h5>
                                        <Link to={`/lecturer/${mod.id}`} className="btn btn-outline-primary font-weight-bold mt-auto">
                                            Gérer le module
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>"""

new_modules_ui = """                    <div className="row mb-4">
                        {modules.map((mod: any) => (
                            <div key={mod.id} className="col-md-4 mb-4">
                                <Link to={`/lecturer/${mod.id}`} className="text-decoration-none text-dark">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div className="card-header bg-primary text-white p-4 border-0" style={{ minHeight: '120px' }}>
                                            <h4 className="font-weight-bold mb-1 text-truncate" title={stripTitle(mod.name || mod.title)}>{stripTitle(mod.name || mod.title)}</h4>
                                            <p className="mb-0 text-white-50">{mod.codeEC || mod.mid} • {mod.semester}</p>
                                        </div>
                                        <div className="card-body bg-white d-flex align-items-end justify-content-end p-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                            <i className="far fa-folder text-muted fa-lg" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>"""

content = content.replace(old_modules_ui, new_modules_ui)

with open('src/pages/Lecturer/Home/Home.tsx', 'w') as f:
    f.write(content)

with open('src/pages/Student/Home/Home.tsx', 'r') as f:
    s_content = f.read()

s_content = re.sub(
    r'            \{\/\* ── Page Header ── \*\/}.*?<\/div>\s*<\/div>\s*<\/div>',
    r'''            {/* ── Page Header ── */}
            <div className="bg-dark text-white py-4 mb-4">
                <div className="container d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <div className="bg-secondary rounded d-flex align-items-center justify-content-center mr-3" style={{ width: '60px', height: '60px' }}>
                            <i className="fas fa-user text-light fa-2x" />
                        </div>
                        <div>
                            <p className="text-muted text-uppercase small font-weight-bold mb-1">
                                {details?.intake || ''}{details?.department ? ` — ${details.department}` : ''}
                            </p>
                            <h2 className="mb-0 font-weight-bold">Mes Modules</h2>
                        </div>
                    </div>
                    <div>
                        <span className="badge badge-primary px-3 py-2 font-weight-bold" style={{ fontSize: '1rem' }}>
                            {modules.length} Module{modules.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>''',
    s_content, flags=re.DOTALL
)

s_content = re.sub(
    r'            \{\/\* ── Content ── \*\/}.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/>',
    r'''            {/* ── Content ── */}
            <div className="container pb-4">
                {modules.length === 0 ? (
                    <div className="card shadow-sm border-0 text-center py-5 mb-4">
                        <div className="card-body">
                            <i className="fas fa-layer-group fa-3x text-muted mb-3" />
                            <p className="text-muted font-weight-bold">Aucun module assigné pour le moment.</p>
                        </div>
                    </div>
                ) : (
                    <div className="row mb-4">
                        {modules.map((mod: any) => (
                            <div key={mod.id} className="col-md-4 mb-4">
                                <Link to={`/student/${mod.id}`} className="text-decoration-none text-dark">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div className="card-header bg-primary text-white p-4 border-0" style={{ minHeight: '120px' }}>
                                            <h4 className="font-weight-bold mb-1 text-truncate" title={stripCode(mod.name || mod.title)}>{stripCode(mod.name || mod.title)}</h4>
                                            <p className="mb-0 text-white-50">{mod.codeEC || mod.mid}</p>
                                        </div>
                                        <div className="card-body bg-white p-3 d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div className="d-flex text-muted font-weight-bold small">
                                                <div className="mr-3"><i className="far fa-clock mr-1" />{mod.totalCH ?? mod.duration ?? 0}h</div>
                                                <div><i className="far fa-star mr-1" />{mod.creditsEC ?? mod.credits ?? 0} ECTS</div>
                                            </div>
                                            <i className="far fa-folder text-muted fa-lg" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>''',
    s_content, flags=re.DOTALL
)

with open('src/pages/Student/Home/Home.tsx', 'w') as f:
    f.write(s_content)

print("Google Classroom style applied.")
