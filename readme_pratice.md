# Guide du Module de Programmation (Practice) - LMS EPT

Ce document explique comment configurer, exécuter, alimenter en données et comprendre le fonctionnement du microservice **practice-service** ainsi que son interaction avec le moteur d'exécution de code **Judge0**.

---

## 1. Fonctionnement Global (Architecture)

Le module **Practice** offre un environnement d'exécution de code de type *LeetCode* ou *HackerRank* où les étudiants écrivent des algorithmes évalués automatiquement par rapport à des cas de tests pré-configurés.

### Flux d'Exécution :
1. **Frontend** : L'étudiant tape son code (ex: classe `Solution` et sa méthode de résolution) dans le Monaco Editor et clique sur **Exécuter** (Run) ou **Soumettre** (Submit).
2. **Gateway (`api-gateway`)** : Transmet la requête d'exécution sécurisée (`/api/practice/**`) au `practice-service`.
3. **Practice Service** :
   - Récupère l'exercice, les cas de test et le wrapper de code correspondant au langage choisi.
   - Enrobe le code de l'étudiant avec un **Wrapper** (qui se charge de lire les cas de test depuis l'entrée standard `stdin` et d'appeler la classe `Solution` de l'étudiant).
   - Soumet le code finalisé à l'API de **Judge0** (`/submissions?wait=false`).
4. **Judge0** :
   - Gère une file d'attente Redis (`judge0-redis`).
   - Un worker compile et exécute le code dans un bac à sable (Sandbox) Docker isolé.
5. **Practice Service (Polling)** :
   - Interroge l'API de Judge0 toutes les 500 ms jusqu'à l'obtention du statut final (Exécution terminée, Erreur de compilation, Dépassement de temps, etc.).
   - Compare la sortie (`stdout`) capturée avec le résultat attendu (`expected_output`) de chaque cas de test.
6. **Frontend** : Reçoit et affiche les résultats détaillés (temps, mémoire, cas de tests validés, logs de débogage).

### Système de Logs et Débogage :
Pour éviter que les messages de débogage (`System.out.println()`, `print()`, etc.) saisis par l'étudiant ne faussent la comparaison stricte avec la sortie attendue, les wrappers utilisent des délimiteurs spéciaux :
`---LMS_RESULT_START---` et `---LMS_RESULT_END---`.
Seul ce qui se trouve entre ces balises est considéré comme la **Sortie brute** de l'exercice. Tout le reste est affiché séparément dans la section **Debug / Console** du frontend.

---

## 2. Modèle de Données (Base de Données)

Le microservice dispose de sa propre base de données dédiée : `practice_db`. Les tables principales sont :

- **`coding_exercises`** : Contient les informations générales des exercices.
  - `title` : Titre de l'exercice (ex: "Two Sum").
  - `description` : Énoncé au format HTML/Markdown.
  - `difficulty` : Difficulté (`EASY`, `MEDIUM`, `HARD`).
  - `starter_code` : Code de départ affiché dans l'éditeur.
  - `wrapper_code` : Code pilote compilable (Main class) servant à exécuter le code de l'étudiant avec les cas de test.
  - `editorial` : Solution officielle détaillée.
  - `hints_json` : Liste d'indices au format JSON.
- **`coding_test_cases`** : Liste des cas de test.
  - `input` : Données d'entrée fournies sur `stdin`.
  - `expected_output` : Résultat attendu sur `stdout`.
  - `hidden` : Si `true`, le cas de test est masqué à l'étudiant (utilisé pour la soumission finale).
- **`coding_exercise_languages`** : Langages autorisés pour chaque exercice (ex: `java`, `python`, `javascript`, etc.).
- **`code_submissions`** : Historique des soumissions effectuées par les étudiants.

---

## 3. Variables d'Environnement

Pour fonctionner en local ou sur Docker, le service `practice-service` utilise les variables d'environnement suivantes :

| Nom de Variable | Description | Valeur par défaut en Local |
|---|---|---|
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | URL du serveur d'annuaire Eureka | `http://localhost:8761/eureka/` |
| `SPRING_CONFIG_IMPORT` | URL du serveur de configuration centralisé | `optional:configserver:http://localhost:8888` |
| `PRACTICE_DB_URL` | URL JDBC de connexion à la base PostgreSQL | `jdbc:postgresql://localhost:5432/practice_db` |
| `DB_USERNAME` | Utilisateur PostgreSQL | `postgres` (ou `lmsuser` sur Docker) |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `1234` (ou `lmspass` sur Docker) |
| `KAFKA_BOOTSTRAP_SERVERS` | Broker Kafka (pour les évènements de gamification) | `localhost:9092` |
| `JUDGE0_BASE_URL` | Endpoint de l'API Judge0 | `http://localhost:2358` |

---

## 4. Exécuter le service en local (sans Docker)

Pour faciliter le développement et tester rapidement les modifications sur le code du `practice-service`, il est recommandé de le lancer en local en utilisant Maven, tout en gardant l'infrastructure globale (Eureka, bases de données, Judge0) active dans Docker.

### Étape 1 : Démarrer l'infrastructure Docker requise
Assurez-vous que Docker Desktop tourne, puis depuis le dossier `lms-microservices` :
```bash
docker compose up -d postgres_db discovery-server config-server kafka judge0 judge0-redis judge0-worker
```

### Étape 2 : Exécuter le script d'automatisation
Un script PowerShell prêt à l'emploi configure les variables d'environnement nécessaires et lance le microservice.
Depuis le dossier `lms-microservices` :
```powershell
./run-practice-local.ps1
```

### Étape 3 : Lancement manuel (Alternative)
Si vous préférez le lancer manuellement dans votre terminal PowerShell :
```powershell
cd lms-microservices/practice-service
$env:EUREKA_CLIENT_SERVICEURL_DEFAULTZONE="http://localhost:8761/eureka/"
$env:SPRING_CONFIG_IMPORT="optional:configserver:http://localhost:8888"
$env:PRACTICE_DB_URL="jdbc:postgresql://localhost:5432/practice_db"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="1234"
$env:KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
$env:JUDGE0_BASE_URL="http://localhost:2358"

mvn spring-boot:run
```

---

## 5. Insérer et réinitialiser les exercices (Seeding)

Un jeu de données complet contenant **8 exercices interactifs** (Two Sum, Palindrome, Factorielle, Maximum d'un tableau, Inverser une chaîne, Minimum Common Value, Pow(x, n), etc.) est fourni via le script SQL `init_practice_exercises.sql`.

Ce script nettoie les anciennes tables (`TRUNCATE CASCADE`) et insère proprement les énoncés, codes de départ, wrappers et cas de test.

### Option A : Depuis Windows (Base de données locale / psql)
Si votre PostgreSQL tourne en local sous Windows sur le port 5432 :
```powershell
cd lms-microservices
$env:PGPASSWORD="1234"; psql -h 127.0.0.1 -p 5432 -U postgres -d practice_db -f .\init_practice_exercises.sql
```

### Option B : Dans le conteneur Docker PostgreSQL
Si vous utilisez la base de données intégrée dans le Docker Compose :
```bash
# 1. Copier le fichier SQL dans le conteneur
docker cp .\init_practice_exercises.sql postgres_db:/tmp/init_practice_exercises.sql

# 2. Exécuter le fichier SQL à l'intérieur du conteneur
docker exec postgres_db psql -U postgres -d practice_db -f /tmp/init_practice_exercises.sql
```
*(Remplacez `-U postgres` par `-U lmsuser` si vous utilisez les identifiants de production du Docker Compose)*.
