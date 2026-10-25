import re

with open('src/pages/Lecturer/Home/Home.tsx', 'r') as f:
    content = f.read()

# Revert lecturer modules UI to a clean version without blue header
old_lect_ui = re.search(r'<div className="row mb-4">.*?{modules\.map.*?<\/div>\s*<\/div>\s*<\/Link>\s*<\/div>\s*\(.*?\)\s*<\/div>\s*<\/div>', content, re.DOTALL)
# Actually let's just replace the whole modules.map block

content = re.sub(
    r'\{modules\.map\(\(mod: any\) => \(.*?\)\)\}',
    r'''{modules.map((mod: any) => (
                            <div key={mod.id} className="col-md-4 mb-4">
                                <Link to={`/lecturer/${mod.id}`} className="text-decoration-none">
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <span className="badge badge-light px-2 py-1">{mod.codeEC || mod.mid}</span>
                                                <span className="badge badge-light px-2 py-1">{mod.semester}</span>
                                            </div>
                                            <h5 className="font-weight-bold mb-0 text-primary" style={{ fontSize: '1.1rem' }}>{stripTitle(mod.name || mod.title)}</h5>
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
                                    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                                        <div className="card-body p-4">
                                            <div className="mb-3">
                                                <span className="badge badge-light px-2 py-1">{mod.codeEC || mod.mid}</span>
                                            </div>
                                            <h5 className="font-weight-bold mb-3 text-primary" style={{ fontSize: '1.1rem' }}>{stripCode(mod.name || mod.title)}</h5>
                                            <div className="d-flex text-muted font-weight-bold small mt-auto">
                                                <div className="mr-3"><i className="far fa-clock mr-1" />{mod.totalCH ?? mod.duration ?? 0}h</div>
                                                <div><i className="far fa-star mr-1" />{mod.creditsEC ?? mod.credits ?? 0} ECTS</div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}''',
    s_content, flags=re.DOTALL
)

with open('src/pages/Student/Home/Home.tsx', 'w') as f:
    f.write(s_content)

print("Cards reverted to clean white version.")
