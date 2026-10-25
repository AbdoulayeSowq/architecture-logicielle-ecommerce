import re

with open('src/pages/Lecturer/Announcements/Announcements.tsx', 'r') as f:
    content = f.read()

# Replace container
content = content.replace(
    '<div className="content">\n            <div className="container-fluid py-4">',
    '<div className="container py-4">'
)
content = content.replace(
    '</StudentPageHeader>\n                {/* Stats */}',
    '</StudentPageHeader>\n\n                {/* Stats */}'
)
# The end of the file has two closing divs
content = re.sub(r'            </div>\n        </div>\n    \);\n};\n\nexport default LecturerAnnouncements;', r'        </div>\n    );\n};\n\nexport default LecturerAnnouncements;', content)

# Replace stat cards
stat_card_re = re.compile(
    r'<div className="stat-card">\s*<div className="stat-card__icon"><i className={`fas \${s\.icon}`} /></div>\s*<div>\s*<p className="stat-card__value">\{s\.val\}</p>\s*<p className="stat-card__label">\{s\.label\}</p>\s*</div>\s*</div>',
    re.MULTILINE
)
content = stat_card_re.sub(
    '<div className="card text-center mb-3 shadow-sm border-0">\n                                <div className="card-body">\n                                    <h3 className="card-title text-primary"><i className={`fas ${s.icon} mr-2`} />{s.val}</h3>\n                                    <p className="card-text text-muted font-weight-bold">{s.label}</p>\n                                </div>\n                            </div>',
    content
)

# Replace table-card
content = content.replace('<div className="table-card">', '<div className="card shadow-sm mb-4 border-0">')
content = content.replace('<div className="table-card__header">', '<div className="card-header bg-white py-3">')
content = content.replace('<h5 className="table-card__title">', '<h5 className="mb-0 font-weight-bold">')

# Feed container
content = content.replace(') : (\n                        <div>\n                            {myAnnouncements.map((a: any) => {', ') : (\n                        <div className="list-group list-group-flush">\n                            {myAnnouncements.map((a: any) => {')

# Ann-card
content = content.replace(
    '<div key={a.id} className="ann-card" style={{ borderRadius: 0, borderLeft: \'none\', borderRight: \'none\', borderTop: \'none\' }}>',
    '<div key={a.id} className="list-group-item d-flex align-items-start border-0 border-bottom py-4">'
)
content = content.replace(
    '<div className="stat-card__icon" style={{ flexShrink: 0 }}>',
    '<div className="mr-3 mt-1">'
)
content = content.replace(
    '<i className={icon} />',
    '<i className={`${icon} fa-2x text-primary opacity-75`} />'
)

content = content.replace(
    '<strong className="ann-card__title" style={{ margin: 0 }}>{cleanTitle}</strong>',
    '<strong className="mb-0 font-weight-bold" style={{ fontSize: "1.1rem" }}>{cleanTitle}</strong>'
)

content = content.replace(
    '<p className="ann-card__desc">{a.description}</p>',
    '<p className="mb-2 mt-2 text-dark">{a.description}</p>'
)

# Modal
modal_style = "style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}"
new_modal_style = "className=\"modal-backdrop fade show d-flex align-items-center justify-content-center\" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, zIndex: 1050 }}"
content = content.replace(modal_style, new_modal_style)

content = content.replace(
    '<div className="card" style={{ width: \'100%\', maxWidth: 480 }} onClick={e => e.stopPropagation()}>',
    '<div className="modal-content shadow-lg border-0" style={{ width: \'100%\', maxWidth: 500, borderRadius: \'12px\' }} onClick={e => e.stopPropagation()}>'
)

with open('src/pages/Lecturer/Announcements/Announcements.tsx', 'w') as f:
    f.write(content)
