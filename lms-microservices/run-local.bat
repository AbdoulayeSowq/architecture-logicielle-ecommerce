@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0

echo =======================================================
echo Starting LMS Microservices on Windows (Centralized Config)
echo =======================================================

:: Load .env if it exists
if exist "%ROOT_DIR%.env" (
    echo Loading environment variables from .env...
    for /f "usebackq tokens=*" %%a in ("%ROOT_DIR%.env") do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            set "%%a"
        )
    )
)

:: Common arguments (Eureka)
set COMMON_ARGS=--eureka.client.service-url.defaultZone=http://127.0.0.1:8761/eureka/

echo Starting discovery-server (Port 8761)...
start "discovery-server" cmd /k "cd /d %ROOT_DIR%discovery-server && title discovery-server && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8761"
timeout /t 10 /nobreak >nul

echo Starting config-server (Port 8888)...
start "config-server" cmd /k "cd /d %ROOT_DIR%config-server && title config-server && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8888"
timeout /t 10 /nobreak >nul

echo Starting user-service (Port 8081)...
start "user-service" cmd /k "cd /d %ROOT_DIR%user-service && title user-service && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8081"

echo Starting university-service (Port 8082)...
start "university-service" cmd /k "cd /d %ROOT_DIR%university-service && title university-service && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8082"

echo Starting course-service (Port 8083)...
start "course-service" cmd /k "cd /d %ROOT_DIR%course-service && title course-service && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8083"

echo Starting announcement-service (Port 8086)...
start "announcement-service" cmd /k "cd /d %ROOT_DIR%announcement-service && title announcement-service && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8086"

echo Starting ai-service (Port 8085)...
start "ai-service" cmd /k "cd /d %ROOT_DIR%ai-service && title ai-service && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8085"

echo Starting api-gateway (Port 8080)...
start "api-gateway" cmd /k "cd /d %ROOT_DIR%api-gateway && title api-gateway && mvn spring-boot:run -DskipTests -Dspring-boot.run.arguments=--server.port=8080"

echo =======================================================
echo All services are starting up in separate command windows!
echo =======================================================
echo Try:
echo   - Eureka:               http://127.0.0.1:8761
echo   - Gateway:              http://127.0.0.1:8080
echo   - Config Server:        http://127.0.0.1:8888
echo =======================================================
