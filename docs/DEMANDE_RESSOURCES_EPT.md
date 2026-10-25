# DEMANDE DE RESSOURCES SERVEUR

**À l'attention de** : Direction des Systèmes d'Information - EPT  
**De** : Médoune DIOP - Étudiant DIC2  
**Date** : 21 Mai 2026  
**Objet** : Demande de ressources VM pour déploiement LMS EPT (Kubernetes)

---

## CONTEXTE

Dans le cadre de mon projet de fin d'études en Développement Web Mobile, j'ai développé une plateforme LMS (Learning Management System) complète pour l'École Polytechnique de Thiès.

**Fonctionnalités principales** :
- Gestion des cours et évaluations
- Chatbot IA avec RAG
- Visioconférence intégrée (LiveKit)
- Forum et messagerie temps réel
- Application mobile (Android/iOS)

**Architecture** : Kubernetes avec autoscaling pour optimisation des ressources

---

## SCÉNARIO D'UTILISATION

### Charge Attendue
- **Étudiants** : 1,000+ utilisateurs
- **Meetings simultanés** : 5-7 meetings (avec autoscaling)
- **Participants par meeting** : 100 personnes
- **Total visioconférence** : 500-700 utilisateurs simultanés (pic)

### Avantages Kubernetes
- ✅ **Autoscaling** : LiveKit scale de 1 à 10 pods selon la charge
- ✅ **Économie** : 60-85% de ressources vs provisioning statique
- ✅ **Haute disponibilité** : Redémarrage automatique des pods
- ✅ **Monitoring** : Supervision temps réel avec alertes

---

## RESSOURCES DEMANDÉES

### VM 1 - SERVEUR APPLICATION

**Spécifications** :
- **Processeur** : 32 vCPU (cores)
- **Mémoire** : 32 GB RAM
- **Stockage** : 500 GB SSD
- **Réseau** : 1 Gbps
- **Système** : Ubuntu 22.04 LTS
- **IP** : Publique fixe

**Usage** :
- Backend (8 microservices Spring Boot)
- Frontend React
- Base de données PostgreSQL
- API Gateway

---

### VM 2 - SERVEUR LIVEKIT (Visioconférence)

**Spécifications** :
- **Processeur** : 80 vCPU (cores)
- **Mémoire** : 64 GB RAM
- **Stockage** : 1 TB SSD
- **Réseau** : 2 Gbps (minimum 1 Gbps)
- **Système** : Ubuntu 22.04 LTS
- **IP** : Publique fixe

**Usage** :
- Serveur LiveKit (WebRTC)
- Gestion des meetings
- Streaming vidéo/audio

---

## JUSTIFICATION TECHNIQUE

### Pourquoi 2 VMs ?
1. **Isolation des ressources** : Les meetings ne doivent pas impacter l'application
2. **Scalabilité** : Possibilité d'ajouter des serveurs LiveKit si besoin
3. **Stabilité** : Crash d'un serveur n'affecte pas l'autre
4. **Performance** : Optimisation spécifique par type de charge

### Calcul des Ressources

#### VM 1 - Application
- 8 microservices × 2 vCPU = 16 vCPU
- PostgreSQL = 4 vCPU
- Marge de sécurité = 12 vCPU
- **Total : 32 vCPU**

#### VM 2 - LiveKit
- 500 participants × 0.15 vCPU = 75 vCPU
- Overhead système = 5 vCPU
- **Total : 80 vCPU**

---

## CONFIGURATION ALTERNATIVE (Budget Limité)

Si les ressources complètes ne sont pas disponibles, voici une configuration minimale :

### VM 1 - Application (Minimale)
- **vCPU** : 16 cores
- **RAM** : 24 GB
- **Stockage** : 300 GB SSD
- **Réseau** : 500 Mbps

### VM 2 - LiveKit (Minimale)
- **vCPU** : 48 cores
- **RAM** : 32 GB
- **Stockage** : 200 GB SSD
- **Réseau** : 1 Gbps

**Limitations** :
- Maximum 3 meetings simultanés (au lieu de 5)
- 50-70 participants par meeting (au lieu de 100)

---

## COÛT ESTIMÉ

**Référence Cloud Public (AWS/GCP)** :
- VM 1 : ~$1,000/mois
- VM 2 : ~$3,000/mois
- **Total : ~$4,000/mois**

**Note** : Si l'EPT dispose de son propre datacenter, le coût sera principalement l'électricité et la maintenance.

---

## PLANNING DE DÉPLOIEMENT

| Phase | Durée | Description |
|-------|-------|-------------|
| **Phase 1** | 1 semaine | Configuration des VMs |
| **Phase 2** | 1 semaine | Déploiement backend + frontend |
| **Phase 3** | 3 jours | Configuration LiveKit |
| **Phase 4** | 2 jours | Tests de charge |
| **Phase 5** | 1 jour | Mise en production |

**Durée totale** : 3 semaines

---

## BÉNÉFICES POUR L'EPT

1. **Plateforme moderne** : Interface web + mobile
2. **IA intégrée** : Chatbot intelligent pour assistance étudiants
3. **Économies** : Pas de licence Zoom/Teams nécessaire
4. **Autonomie** : Contrôle total des données
5. **Scalabilité** : Évolution selon les besoins

---

## ENGAGEMENT

Je m'engage à :
- ✅ Assurer le déploiement complet
- ✅ Former l'équipe technique de l'EPT
- ✅ Fournir la documentation complète
- ✅ Assurer le support pendant 6 mois

---

## DOCUMENTS ANNEXES

1. ✅ Cahier des charges mobile (CAHIER_DES_CHARGES_MOBILE.md)
2. ✅ Documentation technique (PROJECT_KNOWLEDGE.md)
3. ✅ Calcul détaillé des ressources (RESSOURCES_VM_DEPLOYMENT.md)
4. ✅ Guide de déploiement (AWS_DEPLOY_PLAN.md)

---

## CONTACT

**Étudiant** : Médoune DIOP  
**Classe** : DIC2 - Promotion 2026  
**Email** : [ton email]  
**Téléphone** : [ton numéro]

---

**Signature** :

_______________________  
Médoune DIOP

**Date** : 20 Mai 2026

---

*École Polytechnique de Thiès*  
*Département Génie Informatique*
