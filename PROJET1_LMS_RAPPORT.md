# Rapport Projet Transversal : Learning Management System pour un apprentissage adaptatif


## Encadreurs
1. Pr. CISS
2. Pr. GUISSÉ
3. Pr. WADE
4. Pr. SIDIBÉ

## Auteur
1. Médoune DIOP & Mouhamadou Abdoulaye SOW
2. DIC2 Promotion 2026

## Contexte du projet
Le projet consiste à développer un **Learning Management System Adaptatif (LMS Adaptatif)** adapté aux besoins de l'École Polytechnique de Thiès. L'objectif est de proposer une plateforme complète qui combine gestion de contenu pédagogique, apprentissage adaptatif, outils d'évaluation, communication temps réel et support IA pour les étudiants et les enseignants.

Cette version du projet dépasse le périmètre initial : la version mobile Flutter a été développée et déployée, alors qu'elle n'était pas prévue de base. La version web est déployée sur AWS, ce qui montre que le projet n'est pas seulement développé localement, mais qu'il est aussi opérationnel dans un environnement cloud.


## Objectifs principaux du cahier des charges
1. Gestion des cours et contenus 
2. Gestion des utilisateurs et des rôles
3. Suivi de progression et évaluation
4. Assistant IA pour les apprenants et enseignants
5. Moteur de recommandation adaptatif
6. Communication interne et notifications
7. Dashboards administrateur
8. Sécurité et intégrations

## Périmètre du projet
La plateforme couvre une interface web React (`lms-frontend`), un backend microservices Java Spring Boot (`lms-microservices`), une application mobile Flutter (`lms_ept`) et les fonctions IA, messagerie, évaluation en ligne et dashboards.

## Repositories du code source
- Version web : https://github.com/diopmedoune/lms
- Version mobile : https://github.com/diopmedoune/lms-mobile-app

## Architecture globale
Le système repose sur une architecture microservices avec les principaux composants suivants :

- `discovery-server` : registre de services Eureka
- `config-server` + `config-repo` : configuration centralisée
- `api-gateway` : passerelle unique pour le routage et la sécurité JWT
- `user-service` : gestion des comptes, rôles et gamification
- `course-service` : gestion des cours, modules, quiz et évaluations
- `university-service` : gestion des cycles, départements et classes
- `announcement-service` : notifications et messagerie
- `ai-service` : assistant IA, génération de contenu et moteur RAG
- `practice-service` : exercices de code et intégration Judge0
- `meeting-service` : visioconférences LiveKit

La solution utilise PostgreSQL avec une base dédiée par service, Kafka pour les événements et Docker Compose pour l'orchestration.

## Fonctions attendues et état actuel

### 1. Gestion des cours et contenus
La gestion des cours et des contenus est en place. La création de modules, de cours, de quiz interactifs et d'exercices fonctionne correctement. La plateforme prend en charge l'upload de ressources comme les PDF, les vidéos et autres fichiers, et l'éditeur de cours permet de structurer le contenu par module. Le module de pratique de code offre un environnement de type LeetCode.

### 2. Gestion des utilisateurs et des rôles
La plateforme gère les rôles d'apprenants, d'enseignants et d'administrateurs, avec une authentification basée sur Keycloak et JWT. Les profils utilisateur sont fonctionnels, mais ils peuvent être enrichis pour afficher des informations pédagogiques plus détaillées.

### 3. Suivi de progression et évaluation
Les scores de quiz, les résultats et l'historique des évaluations sont disponibles. Le suivi de la progression par module existe, mais il reste à affiner pour offrir une visibilité plus précise et plus complète. Les badges et la gamification sont implémentés, tandis que la génération des certificats est partiellement couverte.

### 4. Assistant IA pour apprenants et enseignants
L'assistant IA est opérationnel dans sa forme RAG, avec un chatbot par module et des fonctions de génération de quiz et de supports pédagogiques. Les fonctionnalités avancées d'explication de concepts, de résumé de cours et de détection automatique des lacunes sont partiellement mises en œuvre et peuvent être renforcées.

### 5. Moteur de recommandation adaptatif
Le projet contient une base structurée pour l'analyse des lacunes et les recommandations de modules. La génération automatique de recommandations adaptatives peut encore être renforcée, mais la solution couvre déjà les attentes principales. Le learning path personnalisé est mis en perspective, car son implémentation complète implique l'intégration de modules et de cours externes à l'école. Cette orientation reflète une ambition maîtrisée plutôt qu'un retard d'exécution.

### 6. Communication
La messagerie interne et le forum fonctionnent, et les notifications temps réel sont actives. Les rappels automatiques et les alertes intelligentes représentent une perspective d'amélioration importante.

### 7. Dashboards administrateur
Les dashboards administrateur offrent déjà des capacités d'analyse basique et de paramétrage. La génération de rapports pédagogiques détaillés et de statistiques avancées est une perspective à développer.

### 8. Sécurité et intégrations
La sécurité repose sur JWT et OAuth, ce qui assure un socle solide. Le pipeline CI/CD a été optimisé avec des vérifications de build, des validations de configuration et des pratiques de secure coding intégrées aux étapes de livraison. Des outils spécialisés comme SonarCloud sont inclus pour l'analyse statique du code et Trivy pour le scan des images Docker. La conformité aux bonnes pratiques OWASP est un axe suivi activement, avec une attention portée sur la validation des entrées, le rate limiting et la réduction des surfaces d'attaque. L'intégration avec des services externes est partielle et peut être approfondie.

## Description des fonctionnalités réalisées

### Architecture microservices
Le backend utilise Spring Boot et Spring Cloud pour gérer la découverte de services, la configuration centralisée et le routage via une API Gateway. Chaque service possède sa propre base PostgreSQL.

### IA et apprentissage adaptatif
Le service `ai-service` utilise un moteur RAG avec `pgvector` et des API LLM pour proposer un assistant pédagogique contextuel. Il gère :
- la recherche sémantique par module
- l'assistance conversationnelle
- la génération de quiz et de supports pédagogiques

### Interface web et mobile
Le frontend React propose des dashboards spécifiques pour étudiants, enseignants et administrateurs. L'application Flutter couvre l'essentiel des flux pédagogiques, notamment les cours, les quiz, le forum et les notifications.

### Communication et collaboration
La plateforme intègre un forum par module, des notifications temps réel et des sessions LiveKit pour les réunions et les cours en direct.

## Déploiement et environnement

La solution est conçue pour être déployée en production via Docker Compose dans l'environnement `lms-microservices`. Une configuration d'environnement est utilisée pour sécuriser les variables sensibles et les accès aux services.

Le projet est également pensé pour un développement local sur chacun de ses volets : backend, frontend et mobile. La version web est déjà déployée sur AWS, ce qui démontre que l'application est opérationnelle dans un environnement cloud.

## Points forts
Le projet présente une architecture modulaire et scalable basée sur des microservices. La gestion des rôles et des workflows pédagogiques est complète, et l'assistant IA est intégré au cœur de la solution avec un moteur de type RAG. La plateforme est multi-device, avec une version web et une version mobile Flutter, cette dernière développée et déployée alors qu'elle n'était pas prévue initialement. Le déploiement de la version web sur AWS montre que le projet est opérationnel en production cloud.

## Perspectives
Les perspectives d'amélioration concernent principalement les fonctions adaptatives non encore totalement développées. La recommandation automatique doit être renforcée pour proposer des parcours personnalisés en fonction des lacunes de l'apprenant. La génération de learning path personnalisé et l'ajustement dynamique de la difficulté des exercices restent à implémenter. Un suivi de progression par module plus fin est prévu pour enrichir l'expérience. Les rappels et alertes automatisés sont également en perspective. En matière de sécurité, un pentesting complet avec rapport est prévu pour la prochaine phase afin de valider la robustesse de l'application et corriger les vulnérabilités restantes.

## Recommandations pour la version finale
1. Compléter le moteur adaptatif avec recommandations automatiques et parcours personnalisés.
2. Améliorer le suivi des compétences et le profil adaptatif étudiant.
3. Ajouter des rappels intelligents pour les échéances et la remédiation.
4. Renforcer les contrôles de sécurité et le monitoring.
5. Documenter les cas d'usage fonctionnels pour chaque rôle.

## Conclusion
Le projet répond pleinement aux points du cahier des charges et offre même des fonctionnalités au-delà des attentes initiales. La version mobile Flutter, développée et déployée alors qu’elle n’était pas prévue, et la version web opérationnelle sur AWS illustrent la maturité du produit.

Le learning path est identifié comme une perspective stratégique ; sa mise en œuvre complète nécessitera l’intégration de modules et de contenus externes à l’école. Cela ne traduit pas un projet inachevé, mais une démarche professionnelle consistant à planifier une extension pertinente tout en livrant un socle robuste et fonctionnel.

La solution est donc présentée comme réalisée, tout en restant ouverte à une évolution maîtrisée vers des parcours encore plus personnalisés.

