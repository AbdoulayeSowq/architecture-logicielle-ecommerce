# C4 Niveau 2 : Diagramme des Conteneurs

Le diagramme des conteneurs illustre la décomposition logique et physique de la plateforme EduMarket en conteneurs autonomes (applications web, passerelle, microservices, bases de données, brokers).

## Diagramme Mermaid

```mermaid
flowchart TB
    subgraph Clients["Clients Externes"]
        WebBrowser["🌐 Navigateur Web<br/>(Client React SPA / TypeScript)"]
        MobileApp["📱 Application Mobile<br/>(Flutter Android / iOS)"]
    end

    subgraph Infrastructure_Securite["Couche d'Accès & Infrastructure"]
        APIGateway["🚪 api-gateway<br/>(Spring Cloud Gateway, Port 8080)<br/>Routage dynamique, validation JWT, CORS"]
        Eureka["🔍 discovery-server<br/>(Netflix Eureka, Port 8761)<br/>Registre de localisation des services"]
        ConfigServer["⚙️ config-server<br/>(Spring Cloud Config, Port 8888)<br/>Centralisation des profils de config"]
        Keycloak["🔑 keycloak<br/>(IAM / OAuth2 / OIDC, Port 8443/8080)<br/>Gestion des identités & tokens"]
    end

    subgraph Microservices_Metier["Microservices Métiers (Spring Boot)"]
        UserService["👤 user-service (Port 8081)<br/>Gestion profils, rôles, gamification"]
        CourseService["📚 course-service (Port 8082)<br/>Catalogue formations, Pricing, Commandes & Inscriptions"]
        UniService["🏛️ university-service (Port 8083)<br/>Départements, catégories & cursus"]
        AIService["🤖 ai-service (Port 8084)<br/>Recommandation formations & Assistant RAG"]
        AnnouncementService["🔔 announcement-service (Port 8085)<br/>Notifications & Messagerie"]
        MeetingService["📹 meeting-service (Port 8086)<br/>Sessions live & Masterclasses (LiveKit)"]
    end

    subgraph Stockage_Evenements["Persistance Polyglotte & Événements"]
        Kafka["📨 Apache Kafka Broker (Port 9092)<br/>Topics : order.events, notification.events"]
        UserDB[("🗄️ user_db<br/>(PostgreSQL)")]
        CourseDB[("🗄️ course_db<br/>(PostgreSQL)")]
        AIDB[("🧠 ai_db<br/>(pgvector / PostgreSQL)")]
        AnnounceDB[("🗄️ announcement_db<br/>(PostgreSQL)")]
        MinIO["📦 MinIO S3 (Port 9000)<br/>Fichiers, vidéos & PDFs"]
    end

    %% Relations Clients -> Gateway
    WebBrowser -->|"HTTPS / REST"| APIGateway
    MobileApp -->|"HTTPS / REST"| APIGateway

    %% Découverte & Config
    APIGateway -.->|"Résolution de routes lb://"| Eureka
    APIGateway -.->|"Récupère config"| ConfigServer
    Microservices_Metier -.->|"Heartbeat & Enregistrement"| Eureka
    Microservices_Metier -.->|"Chargement config centralisée"| ConfigServer

    %% Routage Gateway vers services
    APIGateway -->|"/api/user/**"| UserService
    APIGateway -->|"/api/course/** & /api/orders/**"| CourseService
    APIGateway -->|"/api/uni/**"| UniService
    APIGateway -->|"/api/ai/**"| AIService
    APIGateway -->|"/api/announcements/**"| AnnouncementService
    APIGateway -->|"/api/meeting/**"| MeetingService

    %% Communications synchrones & asynchrones
    CourseService -->|"Publie OrderConfirmedEvent"| Kafka
    Kafka -->|"Consomme événements de commande"| AnnouncementService
    Kafka -->|"Consomme événements de commande"| UserService
    CourseService -.->|"Vérification profil étudiant (REST)"| UserService
    AIService -.->|"Embeddings formations"| CourseService

    %% Persistance isolée (Database-per-Service)
    UserService --> UserDB
    CourseService --> CourseDB
    AIService --> AIDB
    AnnouncementService --> AnnounceDB
    CourseService --> MinIO
```

## Synthèse des Conteneurs et Responsabilités

| Conteneur | Technologie | Port | Responsabilité Métier / Technique |
| :--- | :--- | :---: | :--- |
| **`lms-frontend`** | React 18, TypeScript, Tailwind | 3000 / 80 | Interface web responsive pour clients, vendeurs et admins. |
| **`api-gateway`** | Spring Cloud Gateway, WebFlux | 8080 | Point d'entrée unique, reverse proxy, validation de sécurité JWT, CORS. |
| **`discovery-server`**| Netflix Eureka | 8761 | Annuaire et découverte dynamique d'adresses d'instances. |
| **`config-server`** | Spring Cloud Config | 8888 | Distribution externalisée des fichiers de configuration versionnés. |
| **`user-service`** | Spring Boot, JPA, BCrypt | 8081 | Comptes clients, profils, niveaux, points XP et badges. |
| **`course-service`** | Spring Boot, JPA, Hibernate | 8082 | Catalogue de formations, fiches produits, pricing, panier et gestion des commandes/inscriptions. |
| **`ai-service`** | Spring Boot, Groq/Gemini, pgvector | 8084 | Moteur RAG, recommandation de cours adaptée aux lacunes des acheteurs. |
| **`announcement-service`**| Spring Boot, WebSocket | 8085 | Diffusion asynchrone des confirmations d'achats et notifications. |
| **`kafka`** | Apache Kafka (KRaft) | 9092 | Bus événementiel découplant les commandes des notifications. |
| **`postgres_db`** | PostgreSQL 16 + pgvector | 5432 | Héberge les bases logiques isolées par microservice. |
| **`minio`** | MinIO Object Storage | 9000 | Stockage objet compatible AWS S3 pour vidéos et PDFs pédagogiques. |
