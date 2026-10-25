# 📊 FICHE TECHNIQUE : DÉPLOIEMENT LMS EPT (VM UNIQUE)

**Projet** : Plateforme LMS EPT (Learning Management System)  
**Destinataire** : Direction des Systèmes d'Information (DSI) - EPT  
**Auteur** : Médoune DIOP (DIC2)  
**Date** : 21 Mai 2026  
**Objectif** : Spécifications techniques pour le provisionnement d'une VM de démarrage.

---

## 🖥️ SYNTHÈSE DE LA DEMANDE VM

Pour le démarrage et la phase pilote de la plateforme (incluant la visioconférence et le sandbox d'exécution de code), nous sollicitons la création d'une machine virtuelle unique configurée comme suit :

| Ressource | Spécification Cible | Rôle & Usage |
| :--- | :--- | :--- |
| **Processeur** | **12 vCPU** | Support de la charge des microservices + sandbox Judge0 |
| **Mémoire (RAM)** | **18 GB** | Charge applicative (~16 GB) + marge de sécurité |
| **Stockage** | **200 GB SSD** | Stockage système, bases de données et fichiers (MinIO) |
| **Réseau** | **1 Gbps** | Nécessaire pour la fluidité de la visioconférence WebRTC |
| **Système (OS)** | **Ubuntu 22.04 LTS** | Environnement standard pour Kubernetes (K3s/MicroKube) |
| **Connectivité** | **1 IP Publique Fixe** | Accès externe sécurisé (Nom de domaine, SSL, LiveKit WebRTC) |
| **Accès Système** | **Accès SSH avec privilèges `sudo` (root)** | Indispensable pour l'installation de Kubernetes et les configurations réseau |

---

## 📊 RÉPARTITION DÉTAILLÉE DES RESSOURCES

L'ensemble des services est orchestré sur une architecture Kubernetes légère (tout-en-un) pour optimiser l'utilisation des ressources.

| Composant / Service | vCPU | RAM | Rôle & Usage |
| :--- | :---: | :---: | :--- |
| **Visioconférence (LiveKit)** | 2.0 vCPU | 3.0 GB | Optimisé pour 2 salons de 50 personnes simultanés |
| **Sandbox d'Exécution (Judge0)** | 2.0 vCPU | 2.0 GB | Correction automatique des exercices de programmation |
| **Authentification (Keycloak)** | 1.0 vCPU | 1.0 GB | SSO unifié et gestion sécurisée des accès |
| **Bases de Données & Cache** | 1.7 vCPU | 2.6 GB | PostgreSQL (BD principale), Redis (sessions) & Kafka |
| **Cœur LMS (6 Microservices)** | 2.5 vCPU | 3.2 GB | Cours, étudiants, IA RAG, notifications, meetings... |
| **Passerelle & Config (Spring Cloud)**| 1.1 vCPU | 1.25 GB| API Gateway, Config Server et Eureka Discovery |
| **Frontend (Nginx)** | 0.2 vCPU | 256 MB | Distribution de l'application Web React |
| **Infrastructure & CI/CD** | 1.7 vCPU | 2.5 GB | K8s Control Plane, MinIO (stockage), Jenkins |

---

## 📈 RÉCAPITULATIF DU DIMENSIONNEMENT

| Catégorie | vCPU Calculés | RAM Calculée |
| :--- | :--- | :--- |
| Infrastructure, Outils & Bases de Données | 4.4 vCPU | 6.1 GB RAM |
| Services Applicatifs Coeur (LMS & Auth) | 3.5 vCPU | 4.2 GB RAM |
| Modules Spéciaux (Visioconférence LiveKit + Sandbox Judge0) | 4.0 vCPU | 5.0 GB RAM |
| **TOTAL TECHNIQUE REQUIS** | **~12 vCPU** | **~15.3 GB RAM** |
| **Marge de Stabilité Système** | *Inclus* | **~2.7 GB RAM** |
| **TOTAL VM DEMANDÉE** | **12 vCPU** | **18 GB RAM** |

---

> 💡 **Avantage de cette configuration unique** : Cette VM de démarrage centralise tous les services à moindre coût pour l'EPT. Grâce à Kubernetes, l'architecture pourra être scalée horizontalement de manière transparente sur plusieurs VM si la charge augmente à l'avenir.
