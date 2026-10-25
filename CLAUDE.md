# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble

Monorepo LMS pour l'École Polytechnique de Thiès (EPT), 3 sous-projets indépendants (chacun avec son propre `README.md` / `package.json` / `pom.xml`) :

| Dossier | Stack | Rôle |
|---|---|---|
| `lms-frontend/` | React 18 + TypeScript (CRA), AdminLTE CSS, Axios, STOMP/WebSocket | Interface web — Admin, Lecturer (prof), Student |
| `lms-microservices/` | Spring Boot 3.4+, Java 17, Spring Cloud (Eureka/Gateway/Config), PostgreSQL (1 DB par service), Kafka | Backend microservices |
| `lms_ept/` | Flutter 3.x, Dart, Provider, go_router | App mobile (Android/iOS) |

> **Focus actuel** : amélioration UI/UX du **frontend web** (`lms-frontend/`), en priorité les espaces **Étudiant** (`src/pages/Student/`) et **Professeur** (`src/pages/Lecturer/`). Le mobile (`lms_ept/`) a déjà eu son audit UX — voir `lms_ept/AUDIT_UX_PRO_2026.md` — et n'est plus la priorité tant qu'il n'y a pas de nouvelle demande dessus.

## Commandes

### `lms-frontend/` (React)
```bash
npm install
npm start              # dev server, http://localhost:3000 (proxy API vers REACT_APP_API_BASE_URL dans .env)
npm run build           # build prod (servi par nginx en Docker)
npm test                 # Jest via react-scripts, interactif
npm test -- --watchAll=false --testPathPattern=<fichier>   # un seul fichier de test, non-interactif
```
Pas de script `lint` dédié — l'ESLint `react-app` tourne pendant `npm start`/`npm run build` (config dans `package.json` → `eslintConfig`).

### `lms-microservices/` (Spring Boot)
```bash
cp .env.example .env && docker-compose build && docker-compose up -d   # tout (backend + frontend), ~60s de démarrage
docker-compose ps / docker-compose logs -f <service> / docker-compose down

./run-local.sh           # alternative sans Docker : force Java 17, lance chaque service en local (logs dans .local-logs/)
```
Par service individuel (dans `lms-microservices/<service>/`) :
```bash
mvn spring-boot:run
mvn test
mvn test -Dtest=NomDeLaClasseTest#nomDuTest   # un seul test
```
Ordre de démarrage en local : `discovery-server` → `config-server` → `api-gateway` → les autres services.

### `lms_ept/` (Flutter)
```bash
flutter pub get
flutter run              # device/simulateur connecté
flutter analyze          # lint statique — à lancer après toute modif Dart
flutter test
```

## Architecture — vue d'ensemble multi-services

Tout le trafic client (web + mobile) passe par `api-gateway` (:8080), qui valide le JWT et route vers les microservices enregistrés dans `discovery-server` (Eureka, :8761). Chaque service a sa propre base PostgreSQL (database-per-service) : `user-service` (:8081, auth/rôles/gamification), `university-service` (:8082, structure académique Cycle→Department→Class), `course-service` (:8083, modules/quiz/devoirs/forum), `announcement-service` (:8086, notifications), `ai-service` (:8085, RAG/chatbot/pgvector), `practice-service` (exercices de code, exécution via Judge0). RBAC à 3 rôles : ADMIN, LECTURER, STUDENT.

**Flux IA/RAG** : à l'upload d'un support dans `course-service`, le texte est extrait puis indexé en embeddings dans `pgvector` par `ai-service`. Le chatbot (`ChatBotWidget.tsx` côté web, widget équivalent côté mobile) interroge `ai-service`, qui filtre par `moduleId` si un module est sélectionné (sinon chat général). Génération via Groq (Llama 3) / Gemini.

## `lms-frontend/` — structure & UI

```
src/
├── pages/{Admin,Lecturer,Student,public}/   # une page = un dossier, routing par rôle dans App.tsx
├── components/                               # composants partagés (ChatBot, Notifications, Meeting, Timetable, ui/...)
├── services/api/                              # appels Axios par domaine (course, user, ai, university, ...)
├── services/AuthContext.tsx, WebSocketService.ts
└── index.css                                   # variables CSS globales (charte graphique)
```

Le routing (`App.tsx`) est imbriqué par rôle sous `/admin/*`, `/lecturer/*`, `/student/*`, protégé par un guard de rôle. Les prises de rendez-vous plein-écran (quiz, prise de devoir, meeting LiveKit) sortent de ce layout imbriqué et sont montées comme routes top-level (`/student/:moduleId/quiz/:quizId`, `/meeting`, etc.) — comme sur mobile, vérifier que ces écrans plein-écran gardent une UX de sortie cohérente (pas de perte de progression silencieuse).

**Charte graphique** — variables définies dans `src/index.css`, à toujours utiliser plutôt que des couleurs en dur (détail complet dans `FRONTEND_DESIGN_GUIDE.md`) :
- `--accent: #3b82f6` (bleu EPT — **même valeur hex que `AppTheme.eptBlue` côté mobile**, la cohérence cross-platform est voulue)
- `--bg-base/--bg-card/--bg-elevated`, `--bg-sidebar` (#1e293b), `--text-primary/--text-secondary/--text-muted`
- `--success/--warning/--danger/--info`, `--shadow-sm/md/lg`, `--radius-sm/--radius/--radius-lg`, `--sp-1` à `--sp-*` (spacing)
- Dark mode via `[data-theme="dark"]` — toujours tester les deux thèmes
- Principe directeur : esthétique **Google Classroom** (cartes à en-tête coloré, minimaliste), zéro style inline, `--accent` (bleu) plutôt que vert pour les statuts "validé/terminé"

## Docs de référence (ne pas dupliquer, aller lire au besoin)

- `README.md` — démarrage rapide Docker/local des 2 gros sous-projets
- `PROJECT_KNOWLEDGE.md` / `PROJECT_CONTEXT.md` — cartographie des microservices, modèle de données académique, contexte RAG (redondants entre eux, `PROJECT_CONTEXT.md` est le plus dense)
- `RESUME_PROJECT.md` / `BACKEND_SYSTEMS_DETAILED.md` — détail technique approfondi du backend (notifications, meetings, IA, Kafka)
- `FRONTEND_DESIGN_GUIDE.md` — charte graphique complète du frontend web (lire avant tout travail UI/UX dessus)
- `professional_critique.md` — feuille de route pour passer d'un prototype à un LMS SaaS production-ready (résilience, IAM, observabilité, i18n, accessibilité)
- `IMPROVEMENTS.md` (racine) — priorisation fonctionnelle vs objectifs pédagogiques du projet (IA, recommandations, progression, analytics) — différent de `lms_ept/IMPROVEMENTS.md` qui est spécifique au mobile
- `ADAPTIVE_LEARNING_PLAN.md` / `ADAPTIVITE_ETUDIANT.md` — vision et état de l'apprentissage adaptatif (remédiation IA, recommandations)
- `MOBILE_STRATEGY.md` — stratégie de cache/perf mobile (grade big-tech) — pertinent seulement si on retouche `lms_ept/`
- `HOW_TO_LOGIN.md` — connexion locale, création de comptes de test par rôle
- `TROUBLESHOOTING.md` — problèmes connus LiveKit/LMS et leurs solutions
- `AWS_DEPLOY_PLAN.md`, `DEPLOYMENT_NOTES.md`, `JENKINS_AWS_DEPLOYMENT_GUIDE.md` — déploiement AWS EC2 / CI (Jenkins + GitHub Actions)
- `lms_ept/AUDIT_UX_PRO_2026.md` — audit UX mobile déjà traité (Sprint 1-2 corrigés), utile comme référence de méthode/format si on fait l'équivalent côté web
