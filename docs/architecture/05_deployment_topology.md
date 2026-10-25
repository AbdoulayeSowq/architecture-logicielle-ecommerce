# Topologie de Déploiement : Docker Compose & Architecture Cloud

Ce document décrit la structure physique et logique du déploiement conteneurisé de la plateforme EduMarket, utilisable aussi bien sur le poste de l'évaluateur que sur un serveur cloud (AWS EC2).

## Schéma d'Architecture Réseau Docker

```mermaid
graph TD
    subgraph Internet["Réseau Public / Internet"]
        UserBrowser["Navigateur Utilisateur (Port 80/443)"]
    end

    subgraph HostServer["Hôte Docker (Machine de Dev ou Instance AWS EC2)"]
        subgraph FrontendProxy["Frontend & Proxy Statique"]
            Nginx["Nginx Reverse Proxy<br/>Port 80 -> lms-frontend React SPA"]
        end

        subgraph DockerNetwork["Réseau Interne Docker : lms-network (Bridge)"]
            Gateway["api-gateway : 8080"]
            Eureka["discovery-server : 8761"]
            Config["config-server : 8888"]

            subgraph ServicesMetier["Services Applicatifs"]
                UserSvc["user-service : 8081"]
                CourseSvc["course-service : 8082"]
                UniSvc["university-service : 8083"]
                AISvc["ai-service : 8084"]
                AnnounceSvc["announcement-service : 8085"]
                MeetSvc["meeting-service : 8086"]
            end

            subgraph DataLayer["Services de Données & Message Broker"]
                Postgres["postgres_db : 5432<br/>(pgvector/pgvector:pg16)"]
                Kafka["kafka : 9092<br/>(Apache Kafka)"]
                Minio["minio : 9000/9001<br/>(S3 Object Storage)"]
                Redis["redis : 6379"]
            end
        end

        subgraph Volumes["Volumes Persistants Docker"]
            VolPG[(postgres_data)]
            VolMinio[(minio_data)]
            VolKafka[(kafka_data)]
        end
    end

    UserBrowser -->|HTTP:80| Nginx
    UserBrowser -->|HTTP:8080| Gateway
    Nginx --> Gateway

    Gateway --> ServicesMetier
    ServicesMetier -.-> Eureka
    ServicesMetier -.-> Config
    ServicesMetier --> Postgres
    ServicesMetier --> Kafka
    CourseSvc --> Minio

    Postgres --- VolPG
    Minio --- VolMinio
    Kafka --- VolKafka
```

## Stratégie des Réseaux et des Ports

1. **Isolation Réseau** :
   - Tous les conteneurs partagent le réseau de pont `lms-network`.
   - Seuls les ports nécessaires sont exposés à l'hôte :
     - `80` : Frontend Web (Nginx).
     - `8080` : API Gateway (Entrée unique de l'API REST).
     - `8761` : Tableau de bord Netflix Eureka (Monitoring de découverte en environnement de dev).
     - `9001` : Console web MinIO (Exploration des fichiers S3).
   - Les bases de données (`5432`) et le broker Kafka (`9092`) sont accessibles depuis l'hôte en environnement local mais peuvent être restreints en production.

2. **Politique de Santé (Healthchecks)** :
   - PostgreSQL possède un healthcheck `pg_isready`.
   - `discovery-server` et `config-server` sont lancés en amont des services métiers via des directives `depends_on`.
