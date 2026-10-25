import re

with open('src/pages/Lecturer/Home/Home.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'\{modules\.map\(\(mod: any\) => \(.*?\)\)\}',
    r'''{modules.map((mod: any) => (
                            <div key={mod.id} className="col-md-4 mb-4">
                                <Link to={`/lecturer/${mod.id}`} className="text-decoration-none">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div className="p-4" style={{ background: 'var(--accent-light)', minHeight: '110px', borderBottom: '1px solid var(--accent-border)' }}>
                                            <h5 className="font-weight-bold mb-1 text-truncate" style={{ color: 'var(--accent)' }} title={stripTitle(mod.name || mod.title)}>{stripTitle(mod.name || mod.title)}</h5>
                                            <p className="mb-0 small font-weight-bold opacity-75" style={{ color: 'var(--accent)' }}>{mod.codeEC || mod.mid} • {mod.semester}</p>
                                        </div>
                                        <div className="card-body d-flex align-items-end justify-content-end p-3" style={{ background: 'var(--bg-card)' }}>
                                            <i className="far fa-folder text-muted fa-lg" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}''',
    content, flags=re.DOTALL
)

with open('src/pages/Lecturer/Home/Home.tsx', 'w') as f:
    f.write(content)

with open('src/pages/Student/Home/Home.tsx', 'r') as f:
    s_content = f.read()

s_content = re.sub(
    r'\{modules\.map\(\(mod: any\) => \(.*?\)\)\}',
    r'''{modules.map((mod: any) => (
                            <div key={mod.id} className="col-md-4 mb-4">
                                <Link to={`/student/${mod.id}`} className="text-decoration-none">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                        <div className="p-4" style={{ background: 'var(--accent-light)', minHeight: '110px', borderBottom: '1px solid var(--accent-border)' }}>
                                            <h5 className="font-weight-bold mb-1 text-truncate" style={{ color: 'var(--accent)' }} title={stripCode(mod.name || mod.title)}>{stripCode(mod.name || mod.title)}</h5>
                                            <p className="mb-0 small font-weight-bold opacity-75" style={{ color: 'var(--accent)' }}>{mod.codeEC || mod.mid}</p>
                                        </div>
                                        <div className="card-body p-3 d-flex justify-content-between align-items-center" style={{ background: 'var(--bg-card)' }}>
                                            <div className="d-flex text-muted font-weight-bold small">
                                                <div className="mr-3"><i className="far fa-clock mr-1" />{mod.totalCH ?? mod.duration ?? 0}h</div>
                                                <div><i className="far fa-star mr-1" />{mod.creditsEC ?? mod.credits ?? 0} ECTS</div>
                                            </div>
                                            <i className="far fa-folder text-muted fa-lg" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}''',
    s_content, flags=re.DOTALL
)

with open('src/pages/Student/Home/Home.tsx', 'w') as f:
    f.write(s_content)

print("Classroom cards updated with dark-mode friendly variables.")
