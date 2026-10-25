#!/bin/bash
# Quick Commands for Practice Microservice Migration

# ═════════════════════════════════════════════════════════════════
# PHASE 1: SETUP (ALREADY DONE ✅)
# ═════════════════════════════════════════════════════════════════

# Create the directory structure (if not already done)
mkdir -p d:/ProjetTrans/lms/lms-microservices/practice-service

cd d:/ProjetTrans/lms/lms-microservices/practice-service

# ═════════════════════════════════════════════════════════════════
# PHASE 2: COPY pom.xml
# ═════════════════════════════════════════════════════════════════

# The pom.xml is ready in: d:\ProjetTrans\lms\pom.xml
# Copy it or create it with the content from EXAMPLE_POM_PRACTICE_SERVICE.xml

# ═════════════════════════════════════════════════════════════════
# PHASE 3: CREATE DIRECTORY STRUCTURE
# ═════════════════════════════════════════════════════════════════

mkdir -p src/main/java/com/lms/practice/controller
mkdir -p src/main/java/com/lms/practice/service
mkdir -p src/main/java/com/lms/practice/entity
mkdir -p src/main/java/com/lms/practice/repository
mkdir -p src/main/java/com/lms/practice/dto
mkdir -p src/main/java/com/lms/practice/client
mkdir -p src/main/java/com/lms/practice/config
mkdir -p src/main/resources/db/changelog
mkdir -p src/main/resources/templates
mkdir -p src/test/java/com/lms/practice/service
mkdir -p src/test/java/com/lms/practice/controller

# ═════════════════════════════════════════════════════════════════
# PHASE 4: COPY SOURCE CODE FROM course-service
# ═════════════════════════════════════════════════════════════════

# Copy entities
cp -r ../course-service/src/main/java/com/lms/course/practice/entity/* \
   src/main/java/com/lms/practice/entity/

# Copy repositories
cp -r ../course-service/src/main/java/com/lms/course/practice/repository/* \
   src/main/java/com/lms/practice/repository/

# Copy services
cp -r ../course-service/src/main/java/com/lms/course/practice/service/* \
   src/main/java/com/lms/practice/service/

# Copy controller
cp ../course-service/src/main/java/com/lms/course/practice/controller/*.java \
   src/main/java/com/lms/practice/controller/

# ═════════════════════════════════════════════════════════════════
# PHASE 5: ADAPT IMPORTS (Find and Replace)
# ═════════════════════════════════════════════════════════════════

# Replace imports in all Java files
find src -name "*.java" -type f -exec sed -i \
  's/com\.lms\.course\.practice/com.lms.practice/g' {} \;

find src -name "*.java" -type f -exec sed -i \
  's/import com\.lms\.course\./import com.lms./g' {} \;

# ═════════════════════════════════════════════════════════════════
# PHASE 6: UPDATE CONTROLLER MAPPING (if needed)
# ═════════════════════════════════════════════════════════════════

# In PracticeController.java, change:
# @RequestMapping("/api/course/practice") 
# to:
# @RequestMapping("/api/practice")

sed -i 's|/api/course/practice|/api/practice|g' \
  src/main/java/com/lms/practice/controller/*.java

# ═════════════════════════════════════════════════════════════════
# PHASE 7: COPY RESOURCES
# ═════════════════════════════════════════════════════════════════

# Copy Liquibase changelogs
cp -r ../course-service/src/main/resources/db/changelog/* \
   src/main/resources/db/changelog/

# ═════════════════════════════════════════════════════════════════
# PHASE 8: BUILD
# ═════════════════════════════════════════════════════════════════

# Build with Maven
mvn clean package -DskipTests

# ═════════════════════════════════════════════════════════════════
# PHASE 9: BUILD DOCKER IMAGE
# ═════════════════════════════════════════════════════════════════

# Build Docker image
docker build -t emdy1/lms-practice-service:1.0.0 .

# Tag as latest
docker tag emdy1/lms-practice-service:1.0.0 emdy1/lms-practice-service:latest

# ═════════════════════════════════════════════════════════════════
# PHASE 10: UPDATE docker-compose.yml
# ═════════════════════════════════════════════════════════════════

# Add practice-service to docker-compose.yml:
# (See PLAN_IMPLEMENTATION_PRACTICE_MICROSERVICE.md for full config)

# ═════════════════════════════════════════════════════════════════
# PHASE 11: DEPLOY
# ═════════════════════════════════════════════════════════════════

# Navigate to lms-microservices directory
cd ../..

# Start the service with docker-compose
docker-compose up -d practice-service

# Check if service is running
docker ps | grep practice-service

# ═════════════════════════════════════════════════════════════════
# PHASE 12: VERIFY
# ═════════════════════════════════════════════════════════════════

# Check health
curl http://localhost:8084/actuator/health

# Check Swagger UI
# http://localhost:8084/swagger-ui.html

# Check if registered in Eureka
# http://localhost:8761

# ═════════════════════════════════════════════════════════════════
# PHASE 13: TEST API
# ═════════════════════════════════════════════════════════════════

# Get all exercises
curl http://localhost:8084/api/practice/exercises

# Get leaderboard
curl http://localhost:8084/api/practice/leaderboard

# ═════════════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═════════════════════════════════════════════════════════════════

# View logs
docker logs practice-service

# Follow logs
docker logs -f practice-service

# Stop service
docker stop practice-service

# Remove service
docker rm practice-service

# Clean up
docker system prune -f

# ═════════════════════════════════════════════════════════════════
# USEFUL COMMANDS
# ═════════════════════════════════════════════════════════════════

# SSH into container
docker exec -it practice-service /bin/bash

# Check Java version
docker run openjdk:17-slim java -version

# Check service dependencies
mvn dependency:tree

# Run tests
mvn test

# Skip tests on build
mvn clean package -DskipTests

# ═════════════════════════════════════════════════════════════════
# END OF QUICK COMMANDS
# ═════════════════════════════════════════════════════════════════
