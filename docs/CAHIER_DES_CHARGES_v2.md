# CAHIER DES CHARGES
## Learning Management System Adaptatif — LMS EPT

---

| Champ | Valeur |
|---|---|
| **Institution** | École Polytechnique de Thiès (EPT) |
| **Encadreurs** | Pr. CISS · Pr. GUISSÉ · Pr. WADE · Pr. SIDIBÉ |
| **Auteur** | Médoune DIOP — DIC2, Promotion 2026 |
| **Version** | 2.0 |
| **Date** | Mai 2026 |
| **Statut** | Phase d'implémentation avancée — En production |

---

## 1. Présentation générale

### 1.1 Contexte

Ce projet développe une plateforme d'apprentissage en ligne (LMS) adaptative pour l'EPT, conçue pour être déployable dans tout établissement universitaire. Les LMS existants (Moodle, Blackboard) présentent deux limitations majeures : une interface peu engageante et une absence d'adaptativité traitant tous les apprenants identiquement.

### 1.2 Objectifs

- Offrir une expérience d'apprentissage moderne et engageante (inspirée de HTB Academy)
- Intégrer un moteur adaptatif IA identifiant les lacunes et personnalisant le parcours en temps réel
- Fournir aux enseignants des outils simples de création de contenu et de suivi pédagogique
- Proposer une application mobile native (iOS/Android) couvrant l'intégralité du cycle pédagogique

### 1.3 Périmètre

La plateforme couvre l'ensemble du cycle pédagogique : création de contenu, diffusion, évaluation, suivi et engagement. Elle est accessible sur **navigateur web** et **application mobile native (Flutter)**.

### 1.4 Parties prenantes

| Acteur | Rôle | Interactions principales |
|---|---|---|
| Étudiant | Utilisateur final apprenant | Cours, quiz, forum, parcours adaptatif, réunions, émargement |
| Professeur | Créateur de contenu et évaluateur | Création cours, quiz, sessions live, suivi des étudiants |
| Administrateur | Gestionnaire de la plateforme | Gestion utilisateurs, rapports, logs système |
| Système IA | Moteur adaptatif automatisé | Analyse, recommandation, alertes décrochage, génération de quiz |

---

## 2. Besoins fonctionnels

### 2.1 Gestion des cours et du contenu

#### 2.1.1 Création de cours

Le professeur dispose d'un éditeur de cours permettant de structurer le contenu par module. Types de blocs disponibles :

- Texte enrichi (titres, paragraphes, listes, callouts info/warning)
- Blocs de code avec coloration syntaxique par langage
- Upload d'images et de fichiers
- Embed vidéo (URL YouTube ou upload direct)
- Questions interactives avec réponse attendue et indice
- Import depuis PDF ou PPTX (structuration automatique par IA)

#### 2.1.2 Versionning et publication

- Mode brouillon / aperçu avant publication
- Publication planifiée
- Import/Export au format SCORM

#### 2.1.3 Contenu vidéo

- Lecture vidéo avec chapitrage cliquable
- Lecture à vitesse variable (0.5× à 2×)
- Support lecture hors-ligne (mobile)

#### 2.1.4 Practice Coding (LeetCode-like)

- Environnement de code en ligne (Judge0) intégré directement dans le cours
- Support multi-langages (Python, Java, C, JavaScript, etc.)
- Jeux de tests automatiques avec retour immédiat
- Accessible depuis le web et le mobile

### 2.2 Gestion des utilisateurs et des rôles

- Trois rôles : Étudiant, Professeur, Administrateur
- Authentification via **Keycloak** (OAuth 2.0 / OIDC) — SSO institutionnel
- Sessions longue durée sur mobile (29 jours via `offline_access`)
- Déconnexion unique (Single Sign-Out) avec invalidation des cookies SSO
- Profils détaillés avec historique d'activité et avatar généré par initiales
- Gestion des inscriptions aux cours

### 2.3 Réunions et sessions live

- Création de sessions live (vidéo) via **LiveKit** directement depuis un module de cours
- Détection automatique du rôle hôte/participant au sein de la session
- Notifications temps réel (WebSocket STOMP) à tous les inscrits lors du démarrage ou de la fin d'une session
- Overlay vidéo persistant sur mobile (fenêtre flottante) — Dynamic Island (iOS)
- Support de sessions multiples simultanées sur mobile

### 2.4 Système d'évaluation

#### 2.4.1 Configuration du quiz

| Paramètre | Options disponibles |
|---|---|
| Mode document | Non autorisé / Partiel / Total |
| Surveillance caméra | Optionnelle — activable par le professeur |
| Randomisation | Questions et/ou réponses depuis banque |
| Reprises | Nombre de tentatives (1 à illimité) |
| Minuteur | Global ou par question |

#### 2.4.2 Anti-triche (mode documents non autorisés)

- Détection de sortie de souris hors zone d'évaluation
- À 3 sorties : soumission automatique de la tentative en l'état
- Détection de changement d'onglet ou de fenêtre
- Enregistrement vidéo segmenté — stockage des moments suspects uniquement
- Rapport d'intégrité automatique (score d'intégrité, nb de sorties, segments vidéo)

#### 2.4.3 Quiz adaptatif (IA)

- Génération automatique de questions depuis le contenu du cours (LLM via Groq)
- Ajustement dynamique de la difficulté selon les réponses en temps réel
- Analyse des résultats par thématique pour alimenter le profil adaptatif

### 2.5 Émargement par QR Code

- Génération d'un QR Code de session par le professeur
- Scan QR Code par l'étudiant depuis l'application mobile
- Validation combinée : QR Code + GPS (rayon de proximité configurable)
- Pré-chargement GPS en arrière-plan pour fluidité du scan
- Historique d'émargement consultable par l'étudiant et le professeur

### 2.6 Forum et collaboration

- Forum par module avec fils de discussion, upvote et marquage de solution (style Stack Overflow)
- Sessions Q&A live pendant un cours avec anonymat optionnel
- Vue étudiant sur ses projets de groupe et personnels avec dates de remise

### 2.7 Emploi du temps et organisation

- Calendrier intégré pour le Professeur et l'Étudiant (deadlines, séances)
- Rappels automatiques via le système de notification
- Synchronisation avec les sessions live planifiées

### 2.8 Suivi pédagogique

- Tableau de bord professeur : progression par étudiant, par cours et par module
- Notes, absences et commentaires par étudiant
- Bulletins semestriels consultables par l'étudiant
- Radar de compétences (Skill Radar Chart) par étudiant et par cohorte
- Notation du cours par l'étudiant après complétion (note /10 + commentaire)

### 2.9 Détection du risque de décrochage

- Détection d'inactivité prolongée, baisse de score, non-connexion
- Alerte automatique dans le tableau de bord professeur
- Score de risque par étudiant (faible / moyen / élevé)
- Prédiction du risque d'échec à l'évaluation finale

### 2.10 Engagement et motivation

- **Gamification** : points XP par action (complétion section, bon score quiz, participation forum)
- **Streaks** de connexion et d'apprentissage
- **Classement** (leaderboard) global et par cohorte
- **Badges** : attribution automatique selon les jalons (Open Badges, exportable LinkedIn)
- **Certificats** : génération automatique après complétion d'un cours
- **Mentorat** : mise en relation automatique mentor/mentoré sur base des scores, avec accord préalable

### 2.11 Notifications

| Type | Déclencheur | Canal |
|---|---|---|
| `rappel_echeance` | Quiz à rendre, événement imminent, remise proche | In-app, Email, Push |
| `session_live` | Démarrage / fin d'une réunion de cours | In-app, Push (temps réel) |
| `activite_cours` | Nouveau message forum, résultat quiz, badge obtenu, cours mis à jour | In-app, Email |
| `alerte_decrochage` | Inactivité détectée, risque d'échec | In-app, Email |
| `note_disponible` | Correction d'un devoir ou d'un quiz | In-app, Push |

### 2.12 Chatbot IA par cours

- Assistant IA contextualisé sur le contenu du module en cours (RAG — Retrieval-Augmented Generation)
- Moteur principal : **Groq** (LLM rapide), avec modèle de fallback
- Accessible depuis le web (widget flottant) et le mobile
- Historique de conversation par session

---

## 3. Moteur adaptatif — Priorité 1

### 3.1 Données collectées

- Scores et réponses détaillées par question et par thématique
- Temps passé par module, section et vidéo
- Fréquence et régularité des connexions (streak)
- Interactions forum, chatbot et ressources
- Historique des lacunes et compétences (profil adaptatif persistant)

### 3.2 Analyse IA

- Détection des lacunes thématiques depuis les erreurs récurrentes
- Évaluation du niveau par compétence (Skill Map)
- Détection précoce de décrochage
- Prédiction du risque d'échec à l'évaluation finale

### 3.3 Actions adaptatives

- Recalcul du `LearningPath` : parcours personnalisé avec modules de remise à niveau
- Ajustement de la difficulté des exercices en temps réel
- Suggestions de ressources externes (articles, vidéos, papers)
- Génération automatique de quiz depuis le contenu du cours
- Mise en relation automatique mentor/mentoré

### 3.4 Modèle de données adaptatif

| Entité | Rôle |
|---|---|
| `ProfilAdaptatif` | Pivot central : niveau, compétences, style d'apprentissage, vitesse |
| `Lacune` | Thématique insuffisante avec sévérité et source |
| `Recommandation` | Contenu suggéré avec score de confiance et type |
| `LearningPath` | Parcours personnalisé composé d'étapes ordonnées |
| `EtapePath` | Unité atomique : un contenu, un ordre, un statut |

---

## 4. Besoins non fonctionnels

### 4.1 Performance

- Temps de chargement page < 2 secondes en conditions normales
- Support 500 utilisateurs simultanés (phase initiale), scalable horizontalement
- Disponibilité cible : 99,5% hors maintenance planifiée

### 4.2 Sécurité

- Authentification OAuth 2.0 / OIDC via Keycloak
- Validation JWT côté API Gateway (Spring Cloud Gateway)
- Conformité OWASP Top 10
- Isolation des données par microservice (base dédiée par service)

### 4.3 Interopérabilité

- Export/Import SCORM pour la portabilité des cours
- Intégration LTI (Learning Tools Interoperability) pour connexion avec outils tiers

### 4.4 Mobile

- Application native iOS et Android (Flutter)
- Support hors-ligne : lecture de cours PDF, mise en file des actions (outbox sync)
- Notifications push (Firebase FCM)

---

## 5. Architecture technique

### 5.1 Frontend Web

| Composant | Technologie |
|---|---|
| Framework | React + TypeScript |
| Style | TailwindCSS |
| Auth | Keycloak (OIDC) |
| Temps réel | WebSocket STOMP |
| Vidéo | LiveKit SDK |

### 5.2 Application Mobile

| Composant | Technologie |
|---|---|
| Framework | Flutter (Dart) |
| Auth | Keycloak via flutter\_appauth |
| Temps réel | WebSocket STOMP (stomp\_dart\_client) |
| Vidéo | LiveKit Flutter SDK |
| Offline | Cache local SWR + Outbox sync |
| Notifications | Firebase FCM |

### 5.3 Backend — Architecture Microservices

| Service | Port | Responsabilité |
|---|---|---|
| `discovery-server` | 8761 | Eureka — registre de services |
| `config-server` | 8888 | Configuration centralisée |
| `api-gateway` | 8080 | Routage, validation JWT Keycloak, CORS |
| `user-service` | 8081 | Utilisateurs, profils, gamification, mentorat |
| `university-service` | 8082 | Facultés, départements, emploi du temps |
| `course-service` | 8083 | Cours, modules, quiz adaptatif, forum, notes, émargement, practice coding |
| `enrollment-service` | — | Inscriptions aux cours |
| `announcement-service` | 8086 | Annonces, messagerie, notifications WebSocket STOMP |
| `ai-service` | 8085 | Chatbot RAG, génération de quiz, analytics adaptatifs |
| **Keycloak** | — | Identity Provider (OAuth 2.0 / OIDC) |

### 5.4 Infrastructure

| Composant | Technologie |
|---|---|
| Base de données | PostgreSQL (base dédiée par service) |
| Cache / Sessions | Redis |
| Messagerie async | Apache Kafka |
| Conteneurisation | Docker + Docker Compose |
| Déploiement | AWS EC2 |
| Exécution de code | Judge0 (practice coding) |

---

## 6. Tableau de priorisation des fonctionnalités

| Fonctionnalité | Priorité | Complexité | Statut |
|---|---|---|---|
| Authentification et rôles (Keycloak) | Haute | Faible | ✅ Livré |
| Gestion des cours et modules | Haute | Moyenne | ✅ Livré |
| Quiz avec anti-triche | Haute | Élevée | ✅ Livré |
| Quiz adaptatif (IA) | Haute | Élevée | ✅ Livré |
| Moteur adaptatif — LearningPath | Haute | Élevée | 🔄 En cours |
| Détection de décrochage (IA) | Haute | Élevée | ✅ Livré |
| Forum de discussion | Haute | Moyenne | ✅ Livré |
| Réunions live (LiveKit) | Haute | Élevée | ✅ Livré |
| Tableau de bord professeur | Haute | Moyenne | ✅ Livré |
| Notifications temps réel (STOMP) | Haute | Moyenne | ✅ Livré |
| Émargement QR Code + GPS | Haute | Moyenne | ✅ Livré |
| Application mobile (Flutter) | Haute | Élevée | ✅ Livré |
| Practice Coding (Judge0) | Haute | Élevée | ✅ Livré |
| Chatbot IA par cours (RAG/Groq) | Haute | Élevée | ✅ Livré |
| Gamification (XP, streaks, classement) | Moyenne | Faible | ✅ Livré |
| Badges et certifications | Moyenne | Faible | ✅ Livré |
| Radar de compétences | Moyenne | Moyenne | ✅ Livré |
| Bulletins semestriels | Moyenne | Faible | ✅ Livré |
| Emploi du temps | Moyenne | Faible | ✅ Livré |
| Mentorat automatique | Moyenne | Moyenne | ✅ Livré |
| Recommandations ressources externes (IA) | Faible | Moyenne | 🔄 En cours |
| Versionning des cours | Faible | Moyenne | ⏳ Planifié |
| Intégration LTI | Faible | Élevée | ⏳ Planifié |

---

## 7. Glossaire

| Terme | Définition |
|---|---|
| LMS | Learning Management System — plateforme de gestion de l'apprentissage |
| Moteur adaptatif | Système IA personnalisant le parcours selon les données de l'étudiant |
| LearningPath | Parcours d'apprentissage personnalisé généré automatiquement |
| ProfilAdaptatif | Entité centrale stockant le niveau, les compétences et les lacunes d'un étudiant |
| Lacune | Thématique identifiée par l'IA comme insuffisamment maîtrisée |
| Skill Radar | Représentation graphique des compétences par domaine |
| Streak | Série de jours consécutifs d'activité sur la plateforme |
| Open Badges | Standard international de certification numérique exportable sur LinkedIn |
| LTI | Learning Tools Interoperability — standard d'intégration avec outils tiers |
| SCORM | Standard d'export/import de cours compatible entre LMS |
| RAG | Retrieval-Augmented Generation — technique IA combinant recherche documentaire et LLM |
| Judge0 | Service d'exécution de code sandboxé multi-langages |
| LiveKit | Infrastructure WebRTC open-source pour les sessions vidéo en temps réel |
| Keycloak | Identity Provider open-source (OAuth 2.0 / OIDC) |
| STOMP | Simple Text Oriented Messaging Protocol — protocole WebSocket utilisé pour les notifications temps réel |

---

*Document de référence — LMS EPT v2.0 — Mai 2026*
