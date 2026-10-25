#!/usr/bin/env bash
set -euo pipefail

echo "====================================================================="
echo "🚀 Starting practice-service locally on Windows (Git Bash)..."
echo "📌 Connecting to Docker-hosted services (Postgres, Kafka, Judge0, Eureka)"
echo "====================================================================="

# Ensure practice-service container is stopped so port 8084 is free
echo "🛑 Stopping any running practice-service container to free port 8084..."
(
  cd "$(dirname "$0")/.."
  docker-compose stop practice-service
)

echo "🏃 Starting Spring Boot application..."
mvn spring-boot:run -Dspring-boot.run.arguments="\
  --spring.datasource.url=jdbc:postgresql://localhost:5432/practice_db \
  --spring.datasource.username=postgres \
  --spring.datasource.password=1234 \
  --spring.kafka.bootstrap-servers=localhost:9092 \
  --eureka.client.service-url.defaultZone=http://localhost:8761/eureka/ \
  --judge0.base-url=http://localhost:2358"
