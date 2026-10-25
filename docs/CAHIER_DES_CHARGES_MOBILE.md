# CAHIER DES CHARGES
## Application Mobile LMS EPT

---

**Projet** : Application Mobile du Learning Management System  
**Module** : Développement Web Mobile  
**Institution** : École Polytechnique de Thiès (EPT)  
**Étudiant** : Médoune DIOP  
**Classe** : DIC2 - Promotion 2026  
**Version** : 1.0.0  
**Date** : Mai 2026

---

## 1. CONTEXTE ET OBJECTIFS

### 1.1 Contexte
L'École Polytechnique de Thiès dispose d'une plateforme LMS web basée sur une architecture microservices (Spring Boot). Ce cahier des charges définit le développement d'une application mobile native permettant aux étudiants d'accéder aux fonctionnalités essentielles de la plateforme en mobilité.

### 1.2 Objectifs
- Offrir un accès mobile aux ressources pédagogiques
- Faciliter le suivi académique en temps réel
- Améliorer l'engagement étudiant via la gamification
- Permettre l'émargement par QR Code
- Fournir un assistant IA contextuel

### 1.3 Périmètre
**Inclus** : 
- Fonctionnalités étudiants (complètes)
- Fonctionnalités enseignants (version minimaliste : consultation, notifications, messagerie)

**Exclu** : 
- Interface administrateur (réservée au web uniquement)

---

## 2. SPÉCIFICATIONS TECHNIQUES

### 2.1 Technologies
| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Flutter | 3.27+ |
| Langage | Dart | 3.4+ |
| Backend | Spring Boot (existant) | 3.3.1 |
| API Gateway | Spring Cloud Gateway | Port 8080 |
| Base de données | PostgreSQL | 15+ |
| Authentification | Keycloak + JWT | 23+ |
| IAM | Keycloak (OAuth 2.0 / OIDC) | - |

### 2.2 Architecture Backend (Existant)
L'application mobile consomme les APIs REST exposées par l'API Gateway. L'authentification est gérée par Keycloak :

```
┌─────────────────┐
│  Mobile Flutter │
└────────┬────────┘
         │ HTTPS/WSS
         ▼
┌─────────────────┐      ┌──────────────┐
│  API Gateway    │◄────►│  Keycloak    │
│     :8080       │      │  (IAM/SSO)   │
└────────┬────────┘      └──────────────┘
         │                OAuth 2.0 / OIDC
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ User   │ │ Course │ │   AI   │ │ Univ.  │ │ Announ.│
│Service │ │Service │ │Service │ │Service │ │Service │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
  :8081      :8083      :8085      :8082      :8086
```

**Flux d'authentification** :
1. L'utilisateur se connecte via l'app mobile
2. L'API Gateway redirige vers Keycloak
3. Keycloak valide les credentials et émet un JWT
4. Le JWT est utilisé pour toutes les requêtes vers les microservices
5. L'API Gateway valide le JWT auprès de Keycloak avant de router

### 2.3 Dépendances Principales
- **Navigation** : `go_router` (routing déclaratif)
- **État** : `provider` (state management)
- **HTTP** : `dio`, `http`
- **Authentification** : `flutter_appauth` (OAuth 2.0 / OIDC pour Keycloak)
- **Temps réel** : `web_socket_channel`, `stomp_dart_client`
- **Sécurité** : `flutter_secure_storage`, `local_auth`
- **UI** : `fl_chart`, `shimmer`, `cached_network_image`
- **QR** : `mobile_scanner`, `qr_flutter`
- **Notifications** : `firebase_messaging`

---

## 3. EXIGENCES FONCTIONNELLES

### 3.0 Gestion des Rôles (F00)
L'application supporte deux types d'utilisateurs avec des interfaces différenciées :

| Rôle | Accès Mobile | Fonctionnalités |
|------|--------------|-----------------|
| **STUDENT** | Complet | Toutes les fonctionnalités (F01-F16) |
| **LECTURER** | Minimaliste | Consultation modules, messagerie, notifications, forum (lecture/réponse) |
| **ADMIN** | ❌ Non disponible | Interface web uniquement |

**Détection du rôle** : Basée sur les claims JWT retournés par Keycloak après authentification.

---

### 3.1 Authentification (F01)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F01.1 | Connexion via Keycloak (OAuth 2.0) | Critique |
| F01.2 | Stockage sécurisé des tokens (Access + Refresh) | Critique |
| F01.3 | Rafraîchissement automatique du token | Critique |
| F01.4 | Déconnexion et révocation du token | Critique |
| F01.5 | Authentification biométrique (optionnel) | Moyenne |

**Flux d'authentification** :
1. L'utilisateur saisit ses identifiants
2. L'application envoie une requête à Keycloak via l'API Gateway
3. Keycloak valide et retourne un `access_token` JWT + `refresh_token`
4. Les tokens sont stockés dans `flutter_secure_storage`
5. Le `access_token` est inclus dans l'en-tête `Authorization: Bearer <token>` pour chaque requête

**Endpoints Keycloak** :
- `POST /realms/{realm}/protocol/openid-connect/token` (via API Gateway)
- `POST /realms/{realm}/protocol/openid-connect/logout`
- `POST /realms/{realm}/protocol/openid-connect/token` (refresh)

**Endpoints Backend** :
- `POST /api/user/auth/login` (proxy vers Keycloak)
- `POST /api/user/auth/logout` (révocation + nettoyage session)
- `POST /api/user/auth/refresh` (renouvellement du token)

---

### 3.2 Tableau de Bord (F02)
| ID | Fonctionnalité | Priorité | Rôles |
|----|----------------|----------|-------|
| F02.1 | Affichage des modules inscrits | Critique | STUDENT |
| F02.2 | Progression par module (%) | Haute | STUDENT |
| F02.3 | Notifications récentes | Haute | STUDENT, LECTURER |
| F02.4 | Accès rapide aux quiz/devoirs | Moyenne | STUDENT |
| F02.5 | Vue enseignant : modules enseignés | Moyenne | LECTURER |

**Endpoints** :
- `GET /api/course/modules/student/{username}` (Étudiants)
- `GET /api/course/modules/lecturer/{username}` (Enseignants)
- `GET /api/announcement/notifications/user/{username}`

---

### 3.3 Modules et Cours (F03)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F03.1 | Liste des cours par module | Critique |
| F03.2 | Consultation des supports (PDF, vidéo) | Critique |
| F03.3 | Téléchargement hors ligne des PDF | Moyenne |
| F03.4 | Lecteur vidéo intégré | Moyenne |

**Endpoints** :
- `GET /api/course/modules/{moduleId}/courses`
- `GET /api/course/courses/{courseId}/materials`

---

### 3.4 Évaluations (F04)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F04.1 | Passage de quiz (QCM) | Critique |
| F04.2 | Soumission de devoirs | Critique |
| F04.3 | Consultation des résultats | Critique |
| F04.4 | Révision des réponses (quiz) | Haute |
| F04.5 | Quiz adaptatifs (IA) | Moyenne |

**Endpoints** :
- `GET /api/course/quizzes/{quizId}`
- `POST /api/course/quizzes/{quizId}/submit`
- `GET /api/course/assignments/{assignmentId}`
- `POST /api/course/assignments/{assignmentId}/submit`

---

### 3.5 Notes et Bulletins (F05)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F05.1 | Consultation des notes par module | Critique |
| F05.2 | Moyenne générale et classement | Haute |
| F05.3 | Historique des évaluations | Haute |
| F05.4 | Export PDF du bulletin | Moyenne |

**Endpoints** :
- `GET /api/course/grades/student/{username}`

---

### 3.6 Émargement (F06)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F06.1 | Scan de QR Code pour émargement | Critique |
| F06.2 | Validation géolocalisée (optionnel) | Moyenne |
| F06.3 | Historique des présences | Haute |

**Endpoints** :
- `POST /api/uni/attendance/mark`
- `GET /api/uni/attendance/student/{username}`

---

### 3.7 Messagerie (F07)
| ID | Fonctionnalité | Priorité | Rôles |
|----|----------------|----------|-------|
| F07.1 | Liste des conversations | Haute | STUDENT, LECTURER |
| F07.2 | Envoi/réception de messages | Haute | STUDENT, LECTURER |
| F07.3 | Notifications temps réel (WebSocket) | Haute | STUDENT, LECTURER |
| F07.4 | Badge de messages non lus | Moyenne | STUDENT, LECTURER |

**Endpoints** :
- `GET /api/user/messages/conversations/{username}`
- `GET /api/user/messages/conversation`
- `POST /api/user/messages/send`

**WebSocket** : `ws://api-gateway:8080/ws`

---

### 3.8 Forum (F08)
| ID | Fonctionnalité | Priorité | Rôles |
|----|----------------|----------|-------|
| F08.1 | Consultation des discussions par module | Haute | STUDENT, LECTURER |
| F08.2 | Création de threads | Haute | STUDENT |
| F08.3 | Réponses et commentaires | Haute | STUDENT, LECTURER |
| F08.4 | Recherche dans le forum | Moyenne | STUDENT, LECTURER |

**Endpoints** :
- `GET /api/course/forum/module/{moduleId}`
- `POST /api/course/forum/threads` (STUDENT uniquement)
- `POST /api/course/forum/threads/{threadId}/replies`

---

### 3.9 Assistant IA (F09)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F09.1 | Chatbot contextuel par module | Haute |
| F09.2 | Recherche sémantique dans les cours | Haute |
| F09.3 | Génération de quiz adaptatifs | Moyenne |
| F09.4 | Historique des conversations | Basse |

**Endpoints** :
- `POST /api/ai/chatbot/ask`
- `POST /api/ai/adaptive-quiz/generate`

**Technologie** : RAG (Retrieval Augmented Generation) avec Google Gemini 1.5 Flash

---

### 3.10 Emploi du Temps (F10)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F10.1 | Affichage de l'emploi du temps hebdomadaire | Haute |
| F10.2 | Vue grille (jours × heures) | Haute |
| F10.3 | Filtrage par type (EC, TPE, Projet) | Moyenne |

**Endpoints** :
- `GET /api/uni/timetables/class/{classId}/latest`

---

### 3.11 Mentorat (F11)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F11.1 | Demande de mentorat (enseignant/étudiant) | Moyenne |
| F11.2 | Suivi des demandes (envoyées/reçues) | Moyenne |
| F11.3 | Gestion des statuts (accepté/refusé) | Moyenne |

**Endpoints** :
- `GET /api/user/gamification/mentorship/mentee/{username}`
- `POST /api/user/gamification/mentorship/request`
- `PUT /api/user/gamification/mentorship/{requestId}/status`

---

### 3.12 Gamification (F12)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F12.1 | Profil gamification (XP, niveau, badges) | Moyenne |
| F12.2 | Classement général (leaderboard) | Moyenne |
| F12.3 | Streak de connexion | Basse |

**Endpoints** :
- `GET /api/user/gamification/profile/{username}`
- `GET /api/user/gamification/leaderboard`

---

### 3.13 Analytics Étudiant (F13)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F13.1 | Graphique de progression | Moyenne |
| F13.2 | Radar des compétences | Moyenne |
| F13.3 | Identification des lacunes | Moyenne |

**Endpoints** :
- `GET /api/ai/analytics/student/{username}`
- `GET /api/ai/analytics/student/{username}/lacunes`

---

### 3.14 Certificats (F14)
| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F14.1 | Liste des certificats obtenus | Moyenne |
| F14.2 | Affichage du QR Code de vérification | Moyenne |
| F14.3 | Téléchargement PDF | Moyenne |
| F14.4 | Vérification d'authenticité | Basse |

**Endpoints** :
- `GET /api/course/certificates/student/{studentId}`
- `GET /api/course/certificates/verify/{code}`

---

### 3.15 Profil Utilisateur (F15)
| ID | Fonctionnalité | Priorité | Rôles |
|----|----------------|----------|-------|
| F15.1 | Consultation des informations personnelles | Haute | STUDENT, LECTURER |
| F15.2 | Modification du mot de passe | Haute | STUDENT, LECTURER |
| F15.3 | Paramètres de l'application | Moyenne | STUDENT, LECTURER |
| F15.4 | Mode sombre/clair | Basse | STUDENT, LECTURER |

**Endpoints** :
- `GET /api/user/students/profile/{username}` (Étudiants)
- `GET /api/user/lecturers/profile/{username}` (Enseignants)
- `PUT /api/user/auth/change-password`

---

### 3.16 Fonctionnalités Enseignant (F16)
Interface minimaliste pour les enseignants permettant la consultation et la communication.

| ID | Fonctionnalité | Priorité |
|----|----------------|----------|
| F16.1 | Consultation des modules enseignés | Haute |
| F16.2 | Liste des étudiants par module | Moyenne |
| F16.3 | Réponses aux messages étudiants | Haute |
| F16.4 | Consultation des threads du forum | Haute |
| F16.5 | Notifications de nouvelles questions | Moyenne |

**Endpoints** :
- `GET /api/course/modules/lecturer/{username}`
- `GET /api/course/modules/{moduleId}/students`
- `GET /api/user/messages/conversations/{username}`

**Note** : Les fonctionnalités de création de cours, quiz, et gestion des notes restent exclusives à l'interface web.

---

## 4. EXIGENCES NON FONCTIONNELLES

### 4.1 Performance (NF01)
| ID | Critère | Valeur cible |
|----|---------|--------------|
| NF01.1 | Temps de chargement initial | < 3s |
| NF01.2 | Temps de réponse API | < 2s |
| NF01.3 | Fluidité des animations | 60 FPS |
| NF01.4 | Taille de l'APK | < 50 MB |

### 4.2 Sécurité (NF02)
| ID | Critère | Description |
|----|---------|-------------|
| NF02.1 | Chiffrement des données | AES-256 pour le stockage local |
| NF02.2 | Communication sécurisée | HTTPS/TLS 1.3 |
| NF02.3 | Gestion des tokens | Stockage dans `flutter_secure_storage` |
| NF02.4 | Expiration de session | Access token : 15 min, Refresh token : 7 jours |
| NF02.5 | Authentification centralisée | Keycloak (OAuth 2.0 / OIDC) |
| NF02.6 | Révocation des tokens | Logout côté Keycloak + suppression locale |

### 4.3 Compatibilité (NF03)
| Plateforme | Version minimale |
|------------|------------------|
| Android | 7.0 (API 24) |
| iOS | 12.0 |

### 4.4 Ergonomie (NF04)
- Design Material Design 3 (Android) / Cupertino (iOS)
- Thème EPT (Bleu #1e3a8a, Or #d4af37)
- Accessibilité WCAG 2.1 niveau AA
- Support du mode hors ligne (lecture seule)

### 4.5 Maintenabilité (NF05)
- Architecture MVVM (Model-View-ViewModel)
- Séparation des couches (UI, Services, Models)
- Documentation inline du code
- Tests unitaires (couverture > 60%)

---

## 5. CONTRAINTES

### 5.1 Contraintes Techniques
- Utilisation obligatoire du backend existant (pas de modification)
- Respect des contrats d'API définis
- Compatibilité avec l'API Gateway (CORS, JWT)
- Intégration avec Keycloak pour l'authentification (OAuth 2.0 / OpenID Connect)
- Gestion du cycle de vie des tokens (expiration, refresh)

### 5.2 Contraintes Temporelles
- Durée du projet : 8 semaines
- Livraison : Juin 2026

### 5.3 Contraintes Budgétaires
- Projet académique (budget nul)
- Utilisation de technologies open-source uniquement

---

## 6. LIVRABLES

| Livrable | Format | Date |
|----------|--------|------|
| Cahier des charges | Markdown | Semaine 1 |
| Maquettes UI/UX | Figma | Semaine 2 |
| Code source | Git repository | Semaine 8 |
| APK Android | .apk | Semaine 8 |
| Documentation technique | Markdown | Semaine 8 |
| Guide utilisateur | PDF | Semaine 8 |

---

## 7. ORGANISATION DU PROJET

### 7.1 Méthodologie
- **Approche** : Agile (Scrum)
- **Sprints** : 2 semaines
- **Outils** : Git, GitHub, Trello

### 7.2 Phases du Projet
1. **Phase 1** : Analyse et conception (Semaines 1-2)
2. **Phase 2** : Développement des fonctionnalités critiques (Semaines 3-5)
3. **Phase 3** : Développement des fonctionnalités secondaires (Semaines 6-7)
4. **Phase 4** : Tests et déploiement (Semaine 8)

---

## 8. CRITÈRES D'ACCEPTATION

### 8.1 Critères Fonctionnels
- ✅ Toutes les fonctionnalités critiques (priorité Critique) sont opérationnelles
- ✅ L'authentification et la sécurité sont conformes aux standards
- ✅ L'application fonctionne sans crash sur Android 10+

### 8.2 Critères Techniques
- ✅ Code conforme aux conventions Dart/Flutter
- ✅ Aucune erreur de compilation
- ✅ Temps de réponse < 2s pour 95% des requêtes

### 8.3 Critères Qualité
- ✅ Interface intuitive et cohérente
- ✅ Gestion des erreurs réseau
- ✅ Messages d'erreur explicites

---

## 9. RISQUES ET MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Indisponibilité du backend | Moyenne | Élevé | Mode hors ligne, cache local |
| Changement d'API | Faible | Élevé | Abstraction des services, versioning |
| Dépassement de délai | Moyenne | Moyen | Priorisation stricte (MoSCoW) |
| Problèmes de performance | Moyenne | Moyen | Profiling régulier, optimisation |

---

## 10. GLOSSAIRE

| Terme | Définition |
|-------|------------|
| **RAG** | Retrieval Augmented Generation - Technique d'IA combinant recherche et génération |
| **JWT** | JSON Web Token - Standard d'authentification |
| **Keycloak** | Solution open-source de gestion d'identité et d'accès (IAM) |
| **OAuth 2.0** | Protocole d'autorisation standard pour les applications |
| **OIDC** | OpenID Connect - Couche d'identité au-dessus d'OAuth 2.0 |
| **Access Token** | Token JWT de courte durée pour l'authentification des requêtes |
| **Refresh Token** | Token de longue durée pour renouveler l'access token |
| **QCM** | Questionnaire à Choix Multiples |
| **WebSocket** | Protocole de communication bidirectionnelle temps réel |
| **Émargement** | Enregistrement de la présence d'un étudiant |
| **Gamification** | Utilisation de mécaniques de jeu (XP, badges) pour l'engagement |

---

## 11. RÉFÉRENCES

- [Documentation Flutter](https://docs.flutter.dev/)
- [API REST Backend LMS](http://localhost:8080/swagger-ui.html)
- [Architecture Microservices](../PROJECT_CONTEXT.md)
- [Guide de style Material Design 3](https://m3.material.io/)

---

**Validation**

| Rôle | Nom | Signature | Date |
|------|-----|-----------|------|
| Étudiant | Médoune DIOP | | |
| Professeur | M. GUEYE | | |

---

*Document généré le 19 mai 2026 - Version 1.0*  
*Projet Dev-Mobile - DIC2 - École Polytechnique de Thiès*
