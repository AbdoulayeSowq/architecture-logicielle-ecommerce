import re

with open('src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx', 'r') as f:
    content = f.read()

# Map S.xxx to classes
mapping = {
    'S.card': 'card shadow-sm border-0 mb-3',
    'S.cardBody': 'card-body p-4',
    'S.cardTitle': 'font-weight-bold mb-2',
    'S.dangerBtn': 'btn btn-outline-danger btn-sm font-weight-bold rounded',
    'S.input': 'form-control bg-light py-2',
    'S.modal': 'modal-content border-0 shadow-lg p-4 rounded-lg',
    'S.outlineBtn': 'btn btn-outline-primary font-weight-bold rounded',
    'S.primaryBtn': 'btn btn-primary font-weight-bold rounded',
    'S.secondaryBtn': 'btn btn-secondary font-weight-bold rounded',
    'S.formGroup': 'form-group mb-4',
}

# Find all <tag style={{ ...S.xxx, prop: val }}> or similar
# We can use a regex to find ...S.xxx and remove it
for key, cls in mapping.items():
    # Replace ...S.xxx,
    content = re.sub(r'\.\.\.' + key.replace('.', r'\.') + r'\s*,?', '', content)

# Remove S.statusSelect
content = re.sub(r'S\.statusSelect\(([^)]+)\)', r'{}', content)

with open('src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx', 'w') as f:
    f.write(content)
