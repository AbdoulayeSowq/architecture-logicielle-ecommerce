# LMS Frontend

Interface utilisateur React de la plateforme LMS EPT.

## Espaces utilisateur

- **Admin** (`/admin`) : Gestion des utilisateurs, departements, classes, cours, modules, emploi du temps
- **Professeur** (`/lecturer`) : Modules assignes, materiaux, quiz, devoirs IA, forum, mentorat
- **Etudiant** (`/student`) : Cours, quiz, notes, forum, gamification, certificats, analytics

## Stack technique

- React 18 + TypeScript
- Axios (appels API via API Gateway)
- AdminLTE (CSS)
- React Toastify (notifications)
- STOMP/WebSocket (notifications temps reel)

## Prerequis

- Node.js 18+
- npm

## Developpement local

```bash
npm install
npm start
```

L'application demarre sur http://localhost:3000.

La variable `REACT_APP_API_BASE_URL` dans `.env` definit l'URL de l'API Gateway :

```
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

## Deploiement Docker

Le frontend est inclus dans le `docker-compose.yml` du backend. Le Dockerfile effectue un build multi-stage :

1. Build React (node:18-alpine)
2. Serve statique (nginx:alpine)

En production (Docker), le nginx proxy les appels `/api` vers `api-gateway:8080`.
Le frontend est accessible sur le port 80.

## Structure

```
src/
├── pages/
│   ├── Admin/        # Pages administration
│   ├── Lecturer/     # Pages professeur
│   ├── Student/      # Pages etudiant
│   └── public/       # Login, 404, Unauthorized
├── services/
│   ├── api/          # Appels API (course, user, ai, university, etc.)
│   ├── AuthContext.tsx
│   └── WebSocketService.ts
├── components/       # Composants partages (ChatBot, Notifications, etc.)
└── App.tsx           # Routage principal
```

---
DIC2 2026 | Ecole Polytechnique de Thies
