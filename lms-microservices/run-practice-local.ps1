Write-Host "Démarrage de l'infrastructure Docker..."
docker compose up -d
docker compose stop practice-service

Write-Host "Lancement de practice-service en local..."
cd practice-service

$env:EUREKA_CLIENT_SERVICEURL_DEFAULTZONE="http://localhost:8761/eureka/"
$env:SPRING_CONFIG_IMPORT="optional:configserver:http://localhost:8888"
$env:PRACTICE_DB_URL="jdbc:postgresql://localhost:5432/practice_db"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="1234"
$env:KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
$env:JUDGE0_BASE_URL="http://localhost:2358"

mvn spring-boot:run
