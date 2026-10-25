# Plan d'Architecture — Séparation des Rôles Administratifs & Standardisation des Classes

Ce document sert de spécification technique et de plan de route pour l'implémentation de la séparation des rôles administratifs (Chef de Département, Responsable Pédagogique, Scolarité) et la correction du modèle de classe au format standardisé (type `dic1-git`) au sein du LMS EPT.

---

## 📌 1. Vue d'Ensemble & Objectifs

L'objectif est de scinder le rôle générique d'administrateur unique en quatre profils d'administration fins, tout en standardisant la gestion des classes de l'école (EPT) pour lier dynamiquement les classes à leurs départements (ex: `dic1-git` pour le département GIT).

```
                  ┌───────────────────────────────┐
                  │      SUPER-ADMIN (Global)     │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   CHEF DE DEPT  │      │ RESP. PEDAGOGUE │      │ SCOLARITE (New) │
└────────┬────────┘      └────────┬────────┘      └─────────────────┘
         │                        │
         ▼                        ▼
[Tout le Département]      [Une Seule Classe]
(ex: DIC, GEM...)        (ex: DIC1-GIT)
```

---

## ⚙️ 2. Étape 1 : Standardisation du format des Classes (`dic1-git`)

Les classes à l'EPT doivent être liées à leur département d'origine via un format standardisé de nommage : `{nom_classe_niveau}-{abreviation_departement}` (ex: `dic1-git`, `dic2-git`, `dic1-gem`).

### Actions Backend (`university-service` & `course-service`) :
1. **Validation automatique** :
   Dans l'entité `Class.java` (`university-service`), s'assurer que le nom est validé ou automatiquement reformaté lors de la création ou de la mise à jour (remplacer les espaces par des tirets et s'assurer de la présence du code département).
2. **URLs & Routing** :
   Vérifier que les routes REST acceptant un ID ou nom de classe avec un tiret `-` ne sont pas coupées ou mal décodées par l'API Gateway ou les routeurs de microservices.
3. **Migration SQL** :
   Écrire un script de migration de base de données pour normaliser les anciennes classes (ex: renommer `dic1` en `dic1-git` si elle appartient au département GIT).

---

## 👥 3. Étape 2 : Définition des Profils d'Administration

### A. Le Responsable Pédagogique (RP) — `ROLE_RESP_PEDAGO`
* **Périmètre** : Restreint à **sa propre classe** désignée (ex: `dic1-git`).
* **Fonctionnalités clés** :
  * Éditer l'emploi du temps de sa classe uniquement.
  * Valider et justifier les absences de sa classe.
  * Consulter les notes, moyennes, bulletins et alertes de réussite de sa classe.
  * Diffuser des annonces officielles et épinglées uniquement pour les étudiants de sa classe.

### B. Le Chef de Département (CD) — `ROLE_CHEF_DEPT`
* **Périmètre** : Tout son **département** d'affiliation (ex: Département GIT ➔ toutes les classes : `dic1-git`, `dic2-git`, `dic3-git`...).
* **Fonctionnalités clés** :
  * Assigner un Responsable Pédagogique à une classe de son département.
  * Dashboard de supervision consolidé (taux de réussite, d'absentéisme par classe, avancement des modules).
  * Arbitrer et valider les maquettes pédagogiques et volumes horaires du département.
  * Signer numériquement les procès-verbaux de semestre du département.

### C. Le Service de la Scolarité — `ROLE_SCOLARITE` *(Nouveau)*
* **Périmètre** : Transversal, administratif global.
* **Fonctionnalités clés** :
  * Inscription des étudiants et impression des cartes d'étudiant / QR codes de scolarité.
  * Édition et génération automatique des certificats de scolarité et attestations de réussite officiels.
  * Gestion centralisée des salles physiques de l'établissement pour éviter les conflits d'occupation.

### D. Le Super-Admin — `ROLE_ADMIN`
* **Périmètre** : Global, gestion technique de la plateforme.
* **Fonctionnalités clés** :
  * Gestion des comptes Keycloak, des rôles globaux et des logs systèmes.
  * Création et configuration initiale des départements au sein du LMS.

---

## 💾 4. Étape 3 : Modifications Schéma Database & Contrôles Backend

Pour lier les responsables à leurs domaines, les modèles du service d'utilisateurs (`user-service`) doivent évoluer :

### Évolution de l'entité Lecteur/Professeur :
Ajouter les deux propriétés suivantes sur le profil des enseignants :
* `department_id` : Pour lier un enseignant à son département (requis pour le Chef de Département).
* `supervised_class_id` : Pour lier le Responsable Pédagogique à sa classe cible (ex: `dic1-git`).

```sql
-- Dans le schéma user-service / lecturers
ALTER TABLE lecturers ADD COLUMN department_id VARCHAR(50);
ALTER TABLE lecturers ADD COLUMN supervised_class_id VARCHAR(50);
```

### Sécurité fine (Spring Security / `@PreAuthorize`) :
Dans les contrôleurs des services (`course-service`, `university-service`, etc.), chaque requête d'écriture ou d'accès sensible doit vérifier la cohérence des droits :
```java
// Exemple conceptuel de sécurité sur l'emploi du temps
@PreAuthorize("hasRole('ADMIN') or " +
              "(hasRole('CHEF_DEPT') and #deptId == principal.departmentId) or " +
              "(hasRole('RESP_PEDAGO') and #classId == principal.supervisedClassId)")
public ResponseEntity<?> updateTimetable(String classId, String deptId, TimetableDto dto) { ... }
```

---

## 🎨 5. Étape 4 : Adaptation Frontend (Web & Mobile)

Le client Web (`lms-frontend`) et l'application mobile (`lms_ept`) devront adapter l'interface utilisateur en fonction du rôle extrait du token JWT (Keycloak) :

1. **Tableau de Bord RP** : Une interface simplifiée, recentrée sur la classe gérée, évitant de submerger l'utilisateur d'onglets globaux inutiles.
2. **Tableau de Bord Chef de Département** : Un sélecteur de classe dynamique filtré par le département de l'utilisateur connecté.
3. **Tableau de Bord Scolarité** : Onglets administratifs dédiés aux documents certifiés et plannings des salles de cours physiques.
