import os
import re

files_to_fix = [
    "src/pages/Student/Profile/Profile.tsx",
    "src/pages/Student/Forum/ThreadDetails.tsx",
    "src/pages/Lecturer/Forum/Forum.tsx",
    "src/pages/Student/Leaderboard/Leaderboard.tsx",
    "src/pages/Lecturer/ModuleDetail/ModuleDetail.tsx",
    "src/pages/Student/Home/Home.tsx",
    "src/components/Admin/Navbar.tsx",
    "src/components/Lecturer/Sidebar.tsx",
    "src/pages/Admin/communication/Messages.tsx",
    "src/components/Lecturer/Navbar.tsx",
    "src/pages/Admin/lecturer/LecturerDetails.tsx",
    "src/components/Student/Navbar.tsx",
    "src/pages/Admin/student/StudentDetails.tsx"
]

def replace_initial(content, file):
    # In Profile.tsx and Home.tsx, `const initial = ...` is used. We can just replace `{initial}` with `<i className="fas fa-user" />`
    content = re.sub(r'\{initial\}', r'<i className="fas fa-user" />', content)
    
    # ThreadDetails.tsx
    content = re.sub(r'\{thread\?\.authorName\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    
    # Forum.tsx / ModuleDetail.tsx
    content = re.sub(r'\{thread\.authorName\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    
    # Leaderboard.tsx
    content = re.sub(r'\{player\.username\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    
    # Admin/Navbar.tsx & Sidebar.tsx
    content = re.sub(r'\{username\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    
    # Messages.tsx
    content = re.sub(r'\{\(folder === \'inbox\' \? selected\.senderUsername : selected\.receiverUsername\)\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    content = re.sub(r'\{u\.displayName\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    
    # Navbars (Lecturer/Student)
    content = re.sub(r'\{fullName\?\.charAt\(0\) \|\| username\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    
    # Details (Admin)
    content = re.sub(r'\{lecturer\.fullName\?\.charAt\(0\) \|\| lecturer\.username\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)
    content = re.sub(r'\{student\.fullName\?\.charAt\(0\) \|\| student\.username\?\.charAt\(0\)\.toUpperCase\(\)\}', r'<i className="fas fa-user" />', content)

    # Some variables like `const initial = ...` might become unused, which causes ESLint warnings. Let's comment them out or remove them.
    content = re.sub(r'const initial = [^\n]+;\n', r'', content)
    
    return content

for file in files_to_fix:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()
        new_content = replace_initial(content, file)
        with open(file, 'w') as f:
            f.write(new_content)

print("Avatars replaced.")
