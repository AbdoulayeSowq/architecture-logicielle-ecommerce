#!/bin/bash
# Lancer les services essentiels pour le dev
# Usage: ./dev-up.sh [meeting|full]

CORE="postgres_db kafka discovery-server config-server api-gateway user-service"
BUSINESS="university-service announcement-service course-service"
MEETING="redis livekit meeting-service"
FRONTEND="lms-frontend"

case "${1:-default}" in
  meeting)
    echo "🚀 Démarrage : core + business + meeting + frontend"
    docker-compose up -d $CORE $BUSINESS $MEETING $FRONTEND
    ;;
  full)
    echo "🚀 Démarrage : TOUS les services"
    docker-compose up -d
    ;;
  minimal)
    echo "🚀 Démarrage : core + frontend uniquement"
    docker-compose up -d $CORE $FRONTEND
    ;;
  *)
    echo "🚀 Démarrage : core + business + frontend (sans meeting/AI)"
    docker-compose up -d $CORE $BUSINESS $FRONTEND
    ;;
esac

echo ""
echo "✅ Services lancés. Vérifiez avec: docker ps"
