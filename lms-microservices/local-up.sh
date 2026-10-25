#!/bin/bash
# ============================================================
# local-up.sh — Basculer en mode développement LOCAL
# Stoppe les conteneurs applicatifs Docker, garde l'infra,
# puis lance les services Spring Boot + frontend en local.
# ============================================================

set -eo pipefail
set +e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")/lms-frontend"

# --- Couleurs ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Conteneurs applicatifs à stopper (on garde postgres, kafka, redis, discovery, config, pgadmin)
APP_CONTAINERS="api-gateway user-service university-service course-service announcement-service ai-service meeting-service lms-frontend"

echo -e "${YELLOW}[1/4] Arrêt des conteneurs applicatifs Docker...${NC}"
cd "$SCRIPT_DIR"
for c in $APP_CONTAINERS; do
    if docker ps -q -f "name=$c" | grep -q .; then
        docker stop "$c" 2>/dev/null && echo "  Stoppé: $c"
    fi
done

echo -e "${YELLOW}[2/4] Vérification que l'infra Docker tourne...${NC}"
INFRA="postgres_db kafka discovery-server config-server redis livekit"
for c in $INFRA; do
    if docker ps -q -f "name=$c" | grep -q .; then
        echo -e "  ${GREEN}✓${NC} $c"
    else
        echo -e "  ${RED}✗${NC} $c — démarrage..."
        docker-compose up -d "$c"
    fi
done

# Attendre que config-server soit healthy
echo -e "${YELLOW}[3/4] Attente que config-server soit prêt...${NC}"
for i in $(seq 1 30); do
    if curl -sf http://localhost:8888/actuator/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} config-server prêt"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo -e "  ${RED}✗ config-server pas prêt après 60s. Vérifiez les logs.${NC}"
        exit 1
    fi
    sleep 2
done

echo -e "${YELLOW}[4/4] Lancement des services en local...${NC}"

# Charger et exporter le .env pour que Maven les hérite
set -a
source "$SCRIPT_DIR/.env"
# En local, LiveKit est accessible via localhost
export LIVEKIT_SERVER_URL=ws://localhost:7880
set +a

# Services Spring Boot à lancer (dans l'ordre)
SERVICES="api-gateway user-service university-service course-service announcement-service meeting-service ai-service"

PIDS_FILE="$SCRIPT_DIR/.local-pids"
> "$PIDS_FILE"

for svc in $SERVICES; do
    SVC_DIR="$SCRIPT_DIR/$svc"
    if [ ! -d "$SVC_DIR" ]; then
        echo -e "  ${RED}✗ Dossier $svc introuvable, ignoré${NC}"
        continue
    fi
    echo -e "  Lancement de ${GREEN}$svc${NC}..."
    cd "$SVC_DIR"
    mvn spring-boot:run -DskipTests \
        -Dspring-boot.run.jvmArguments="-Xmx384m -Xms192m" \
        > "$SCRIPT_DIR/logs/$svc.log" 2>&1 &
    echo "$! $svc" >> "$PIDS_FILE"
    cd "$SCRIPT_DIR"
done

# Frontend React
if [ -d "$FRONTEND_DIR" ]; then
    echo -e "  Lancement de ${GREEN}lms-frontend${NC} (npm start)..."
    cd "$FRONTEND_DIR"
    npm start > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
    echo "$! lms-frontend" >> "$PIDS_FILE"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Mode LOCAL activé !${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Services en cours de démarrage (~30-60s pour les JVM)"
echo "  Logs dans : $SCRIPT_DIR/logs/"
echo ""
echo "  Commandes utiles :"
echo "    tail -f logs/api-gateway.log     # suivre la gateway"
echo "    tail -f logs/meeting-service.log # suivre meeting"
echo "    ./local-down.sh                  # tout arrêter"
echo ""
echo -e "${YELLOW}⚠️  Si tu redémarres le config-server Docker, relance aussi :${NC}"
echo "    kill \$(lsof -ti:8080) && cd api-gateway && mvn spring-boot:run -DskipTests &"
echo ""
