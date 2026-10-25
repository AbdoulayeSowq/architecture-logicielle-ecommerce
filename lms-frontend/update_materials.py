import re

def update_student():
    with open('src/pages/Student/ModuleDetail/ModuleDetail.tsx', 'r') as f:
        content = f.read()

    # Define the mapping logic
    mapping_code = """                                                    <div className="mr-3 p-2 rounded" style={{ 
                                                        background: m.type === 'PDF' ? 'rgba(239, 68, 68, 0.1)' : (m.type === 'VIDEO' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(6, 182, 212, 0.1)'), 
                                                        color: m.type === 'PDF' ? '#ef4444' : (m.type === 'VIDEO' ? '#3b82f6' : '#06b6d4'),
                                                        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <i className={`fas ${m.type === 'PDF' ? 'fa-file-pdf' : (m.type === 'VIDEO' ? 'fa-video' : 'fa-link')} fa-lg`}></i>
                                                    </div>"""
    
    pattern = r'<div className="mr-3 p-2 rounded" style=\{\{ background: "rgba\(37, 99, 235, 0.1\)", color: "var\(--accent\)" \}\}>\s*<i className=\{`fas \$\{m\.type === '\''PDF'\'' \? '\''fa-file-pdf'\'' : \(m\.type === '\''VIDEO'\'' \? '\''fa-video'\'' : '\''fa-link'\''\)\} fa-lg`\}><\/i>\s*<\/div>'
    
    content = re.sub(pattern, mapping_code, content)
    
    with open('src/pages/Student/ModuleDetail/ModuleDetail.tsx', 'w') as f:
        f.write(content)

def update_lecturer():
    with open('src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx', 'r') as f:
        content = f.read()

    # Match the icon container in Lecturer side
    pattern = r'color: mat\.type === "PDF" \? "#ff3e3e" : "#2cb5e8"'
    replacement = r'color: mat.type === "PDF" ? "#ef4444" : (mat.type === "VIDEO" ? "#3b82f6" : "#06b6d4")'
    content = re.sub(pattern, replacement, content)
    
    with open('src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx', 'w') as f:
        f.write(content)

update_student()
update_lecturer()
print("Materials icons updated.")
