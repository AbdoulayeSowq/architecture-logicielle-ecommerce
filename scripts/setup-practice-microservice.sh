#!/bin/bash
# Script pour créer le microservice practice-service avec la bonne structure Maven

set -e

BASE_PATH="d:/ProjetTrans/lms/lms-microservices/practice-service"
SOURCE_PATH="d:/ProjetTrans/lms/lms-microservices/course-service"

echo "🚀 Création du microservice practice-service..."

# 1. Créer la structure Maven
echo "1️⃣ Création de la structure Maven..."
mkdir -p "$BASE_PATH/src/main/java/com/lms/practice/{controller,service,entity,repository,dto,client,config}"
mkdir -p "$BASE_PATH/src/main/resources/db/changelog"
mkdir -p "$BASE_PATH/src/test/java/com/lms/practice/{service,controller}"

# 2. Créer les fichiers de base
echo "2️⃣ Création des fichiers de configuration..."

# pom.xml - Déjà créé, sera copié

# application.yml
cat > "$BASE_PATH/src/main/resources/application.yml" << 'EOF'
server:
  port: 8084
  servlet:
    context-path: /

spring:
  application:
    name: practice-service
  datasource:
    url: jdbc:postgresql://postgres_db:5432/practice_db
    username: ${DB_USERNAME:macbookpro}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  liquibase:
    enabled: true
    change-log: classpath:db/changelog/db.changelog-master.xml
  cloud:
    config:
      enabled: true
      uri: http://config-server:8888
  kafka:
    bootstrap-servers: kafka:29092

eureka:
  client:
    serviceUrl:
      defaultZone: http://discovery-server:8761/eureka/
  instance:
    prefer-ip-address: true

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus,info

judge0:
  base-url: http://judge0:2358
  languages:
    python: 71
    java: 62
    cpp: 54
    c: 50
    javascript: 63
    php: 68
    dart: 88
EOF

echo "✅ application.yml créé"

# Dockerfile
cat > "$BASE_PATH/Dockerfile" << 'EOF'
FROM openjdk:17-slim

WORKDIR /app

COPY target/practice-service-1.0.0.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-jar", "app.jar"]
EOF

echo "✅ Dockerfile créé"

# .dockerignore
cat > "$BASE_PATH/.dockerignore" << 'EOF'
.git
.gitignore
.mvn
target
*.log
*.jar
.env
.env.example
.idea
.vscode
node_modules
EOF

echo "✅ .dockerignore créé"

# .gitignore
cat > "$BASE_PATH/.gitignore" << 'EOF'
target/
.idea/
*.iml
.mvn/
.env
.env.local
*.log
.DS_Store
node_modules/
dist/
build/
EOF

echo "✅ .gitignore créé"

# README.md
cat > "$BASE_PATH/README.md" << 'EOF'
# Practice Service Microservice

## 📚 Description
LMS Practice Module - Code Compilation & Submission with Judge0 Integration

## 🚀 Démarrage Local

### Prérequis
- Java 17+
- Maven 3.8+
- Docker
- PostgreSQL 16
- Judge0

### Build
```bash
mvn clean package
```

### Run
```bash
mvn spring-boot:run
```

### Docker
```bash
docker build -t practice-service:latest .
docker-compose up -d
```

## 🌐 API Documentation
- Swagger UI: http://localhost:8084/swagger-ui.html
- API Docs: http://localhost:8084/v3/api-docs

## 🗄️ Database
- Database: practice_db
- Host: postgres_db:5432
- User: macbookpro
- Password: password

## 📊 Endpoints
- GET /api/practice/exercises
- GET /api/practice/exercises/{id}
- POST /api/practice/exercises/{id}/submit
- GET /api/practice/leaderboard
- POST /api/practice/exercises/{id}/run
- GET /api/practice/submissions/history

## 📝 Configuration
See `application.yml` for configuration details
EOF

echo "✅ README.md créé"

# 3. Créer le master Liquibase changelog
cat > "$BASE_PATH/src/main/resources/db/changelog/db.changelog-master.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <include file="db/changelog/01-create-practice-tables.xml"/>
</databaseChangeLog>
EOF

echo "✅ db.changelog-master.xml créé"

echo ""
echo "✅ Structure du microservice practice-service créée avec succès!"
echo ""
echo "📂 Structure créée:"
tree -L 3 "$BASE_PATH" 2>/dev/null || find "$BASE_PATH" -type f -o -type d | head -30

echo ""
echo "⏭️  Prochaines étapes:"
echo "1. Copier le pom.xml: cp d:/ProjetTrans/lms/lms-microservices/practice-service/pom.xml"
echo "2. Copier les entités de course-service"
echo "3. Copier les services"
echo "4. Copier le contrôleur"
echo "5. mvn clean package -DskipTests"
echo "6. docker build -t practice-service:latest ."
echo "7. docker-compose up -d"
