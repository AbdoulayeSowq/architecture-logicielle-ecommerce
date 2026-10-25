# LMS Backend - Microservices Architecture

Ce depot contient le backend du LMS EPT, concu avec une architecture microservices robuste et scalable.

## Architecture du Systeme

Le systeme est structure selon les standards Cloud Native :

1. **Service Discovery (Eureka)** - Annuaire dynamique permettant aux services de se trouver mutuellement.
2. **API Gateway** - Point d'entree unique gerant le routage et la securite JWT.
3. **Config Server** - Gestion centralisee des configurations via `config-repo/`.
4. **Database per Service** - Chaque microservice possede sa propre base PostgreSQL.
5. **AI Service (RAG)** - IA utilisant Groq (Llama 3) et Gemini (Embeddings) avec pgvector.

## Stack Technique

- **Core** : Spring Boot 3.4+, Java 17, Spring Cloud 2024
- **Securite** : Spring Security, JWT (Stateless), RBAC
- **Persistance** : PostgreSQL (bases separees), Hibernate/JPA
- **Messaging** : Apache Kafka (mode KRaft)
- **IA** : Groq, Google Gemini, Spring AI, pgvector
- **Containerisation** : Docker, Docker Compose

## Structure du Projet

```
lms-microservices/
├── config-server/          # Serveur de configuration
├── config-repo/            # Fichiers YAML de config centralisee
├── discovery-server/       # Serveur Eureka
├── api-gateway/            # Passerelle d'entree (routage, JWT, CORS)
├── user-service/           # Utilisateurs, auth, gamification
├── course-service/         # Cours, modules, quiz, forum, devoirs
├── university-service/     # Structure academique (cycles, classes)
├── announcement-service/   # Notifications, messages, annonces
├── ai-service/             # Chatbot IA, RAG, generation de contenu
├── postgres-init/          # Script SQL d'initialisation des bases
├── docker-compose.yml      # Orchestration de tous les services
└── .env.example            # Template des variables d'environnement
```

---

## Deploiement Docker (recommande)

### Prerequis

- Docker et Docker Compose installes
- Cles API : Groq (https://console.groq.com) et Gemini (https://aistudio.google.com/apikey)

### 1. Configuration de l'environnement

```bash
cp .env.example .env
```

Editez le fichier `.env` et remplissez les valeurs :

```
POSTGRES_USER=lmsuser
POSTGRES_PASSWORD=lmspass
POSTGRES_DB=lmsdb
DB_USERNAME=lmsuser
DB_PASSWORD=lmspass
JWT_SECRET=<generer avec : openssl rand -hex 32>
GROQ_API_KEY=gsk_votre_cle
GEMINI_API_KEY=votre_cle_gemini
```

### 2. Build des images

```bash
docker-compose build
```

Cette etape compile tous les services (Maven pour le backend, npm pour le frontend). Premiere execution : ~10 min. Les builds suivants utilisent le cache Docker.

### 3. Lancement

```bash
docker-compose up -d
```

Verifier que tous les containers tournent :

```bash
docker-compose ps
```

Attendre ~60 secondes que les services Java demarrent completement (healthchecks sur discovery-server et config-server).

### 4. Initialisation des donnees

Les bases de donnees sont creees automatiquement par `postgres-init/init.sql`. Les tables sont generees par Hibernate au demarrage de chaque service (`ddl-auto: update`).

Pour importer un jeu de donnees existant (fourni par un collaborateur) :

```bash
docker exec -i postgres_db psql -U lmsuser -d user_db < user_db.sql
docker exec -i postgres_db psql -U lmsuser -d course_db < course_db.sql
docker exec -i postgres_db psql -U lmsuser -d university_db < university_db.sql
docker exec -i postgres_db psql -U lmsuser -d announcement_db < announcement_db.sql
docker exec -i postgres_db psql -U lmsuser -d ai_db < ai_db.sql
```

### 5. Verification

| Service | URL | Attendu |
|---------|-----|---------|
| Frontend | http://localhost | Page de login |
| API Gateway | http://localhost:8080 | 401 (normal sans token) |
| Eureka Dashboard | http://localhost:8761 | Liste des services enregistres |
| PgAdmin | http://localhost:5050 | Interface admin PostgreSQL |

### 6. Arret

```bash
docker-compose down
```

Les donnees sont conservees dans le volume Docker `postgres_data`. Ne pas utiliser `docker-compose down -v` sauf pour repartir de zero.

---

## 7. Module Practice & Exécution de Code (Judge0)

Le LMS intègre un bac à sable (Playground) et des exercices de programmation interactifs de type LeetCode / HackerRank.
L'exécution du code est gérée de manière asynchrone et sécurisée par **Judge0**.

### Architecture d'exécution
1. **Frontend** : L'étudiant tape son code dans l'éditeur (Monaco Editor).
2. **practice-service** : Reçoit le code, le valide, et le soumet à l'API de Judge0 via `Judge0Client`.
3. **judge0 (API)** : Place la soumission dans une file d'attente Redis (`judge0-redis`).
4. **judge0-worker** : Récupère la soumission, compile le code et l'exécute de manière isolée.
5. **practice-service** : Effectue un *polling* (toutes les 500ms) pour récupérer le résultat de l'exécution et le compare aux cas de tests attendus.

### Gestion des logs et outputs de débogage

Un système intelligent sépare les **résultats du code** des **logs de débogage** :

- **Sortie (Output)** : Seul le résultat final du wrapper code (ex: `System.out.println(result)`) est comparé aux cas de test attendus
- **Debug / Console** : Tous les `print()` et autres statements de débogage s'affichent dans une section séparée

**Exemple en Java :**
```java
class Solution {
    public int countVowels(String s) {
        int count = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = Character.toLowerCase(s.charAt(i));
            if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' || c == 'y') {
                count++;
            }
        }
        // Ceci s'affichera dans la section "Debug / Console"
        print("Nombre de voyelles trouvées:", count);
        return count;
    }
}
```

**Résultat :**
- ✅ **Sortie** : `3` (comparé aux cas de test)
- ✅ **Debug / Console** : `Nombre de voyelles trouvées: 3` (affichage uniquement)
- ✅ **Status** : ✅ Accepté

### Créer des exercices
Pour que Judge0 puisse évaluer le code (notamment en Java), le code soumis doit être exécutable. Pour les exercices, le code de départ (`starter_code`) inclut généralement la méthode `main` qui lit l'entrée standard (`System.in`) et appelle la méthode que l'étudiant doit compléter.

Un script complet contenant 7 exercices interactifs prêts à l'emploi (Two Sum, Factorielle, Palindrome, Compter les Voyelles, etc.) est fourni.
Pour charger ces exercices dans la base de données :

```bash
docker cp init_practice_exercises.sql postgres_db:/tmp/init_practice_exercises.sql
docker exec postgres_db psql -U macbookpro -d practice_db -f /tmp/init_practice_exercises.sql
```

**Note :** Les exercices sont insérés dans la table `coding_exercises` avec leurs wrappers associés, cas de test et solutions officielles (editorial).

---

## Developpement local (sans Docker)

Pour travailler sur un service individuellement :

### Prerequis

- Java 17, Maven 3.8+
- PostgreSQL installe localement
- Les bases creees (`user_db`, `course_db`, `university_db`, `announcement_db`, `ai_db`)

### Lancement

```bash
cp .env.example .env
# Remplir le .env avec vos valeurs locales
./run-local.sh
```

Le script demarre les services dans l'ordre (discovery -> config -> services).

---

## Services et Ports

| Service | Port | Base de donnees |
|---------|------|-----------------|
| discovery-server | 8761 | - |
| config-server | 8888 | - |
| api-gateway | 8080 | - |
| user-service | 8081 | user_db |
| university-service | 8082 | university_db |
| course-service | 8083 | course_db |
| ai-service | 8085 | ai_db |
| announcement-service | 8086 | announcement_db |
| frontend (nginx) | 80 | - |
| kafka | 9092 | - |
| pgadmin | 5050 | - |

## Tests API

Des collections Postman sont disponibles a la racine pour chaque service :

- `LMS_User_Service_Postman_Collection.json`
- `LMS_Course_Service_Postman_Collection.json`
- `LMS_University_Service_Postman_Collection.json`
- `LMS_Announcement_Service_Postman_Collection.json`
- `LMS_AI_Service_Postman_Collection.json`

---

## Notes importantes

- Les fichiers `.env` ne sont jamais commites (`.gitignore`).
- Les dumps SQL de donnees ne sont jamais commites.
- Les fichiers uploades (PDF, etc.) ne sont jamais commites.
- Le `config-repo/` contient des placeholders `${VARIABLE}`, pas de valeurs en clair.
