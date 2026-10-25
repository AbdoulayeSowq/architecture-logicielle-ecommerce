#!/bin/bash
# ============================================================
# local-down.sh — Arrêter tous les services locaux
# Tue les process Java (Spring Boot) et Node (frontend),
# libère tous les ports applicatifs.
# Prêt pour repasser en mode Docker.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS_FILE="$SCRIPT_DIR/.local-pids"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}[1/3] Arrêt des services via PIDs enregistrés...${NC}"
if [ -f "$PIDS_FILE" ]; then
    while IFS=' ' read -r pid name; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo -e "  ${GREEN}✓${NC} $name (PID $pid) arrêté"
        else
            echo -e "  ${YELLOW}~${NC} $name (PID $pid) déjà arrêté"
        fi
    done < "$PIDS_FILE"
    rm -f "$PIDS_FILE"
else
    echo "  Aucun fichier de PIDs trouvé, nettoyage par ports..."
fi

echo -e "${YELLOW}[2/3] Nettoyage des ports applicatifs...${NC}"
# Ports: 8080(gateway) 8081(user) 8082(uni) 8083(course) 8085(ai) 8086(announce) 8087(meeting) 3000(frontend)
APP_PORTS="8080 8081 8082 8083 8085 8086 8087 3000"

for port in $APP_PORTS; do
    PIDS=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$PIDS" ]; then
        for pid in $PIDS; do
            PROC_NAME=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            kill "$pid" 2>/dev/null
            echo -e "  ${GREEN}✓${NC} Port $port — PID $pid ($PROC_NAME) tué"
        done
    else
        echo -e "  ${GREEN}✓${NC} Port $port déjà libre"
    fi
done

# Attendre un peu que les process se terminent
sleep 2

# Force kill si encore actifs
echo -e "${YELLOW}[3/3] Vérification finale...${NC}"
STILL_RUNNING=false
for port in $APP_PORTS; do
    PIDS=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$PIDS" ]; then
        for pid in $PIDS; do
            kill -9 "$pid" 2>/dev/null
            echo -e "  ${RED}Force kill${NC} PID $pid sur port $port"
        done
        STILL_RUNNING=true
    fi
done

if [ "$STILL_RUNNING" = false ]; then
    echo -e "  ${GREEN}✓ Tous les ports libérés${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Tous les services locaux arrêtés !${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Ports libérés : $APP_PORTS"
echo "  Docker infra toujours actif (postgres, kafka, config-server...)"
echo ""
echo "  Pour repasser en Docker : ./dev-up.sh"
echo "  Pour relancer en local  : ./local-up.sh"
echo ""
