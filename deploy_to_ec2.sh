#!/bin/bash

# Configuration
EC2_KEY="~/.ssh/debian-emdy.pem"
EC2_USER="admin"
EC2_IP="13.50.250.155"
REMOTE_PATH="~/lms"
DEPLOY_BRANCH="main"  # Branche de déploiement principale

echo "=================================================="
echo "🚀 LMS EPT - Déploiement Direct sur EC2"
echo "=================================================="

# S'assurer que la clé SSH est ajoutée à l'agent local pour le ForwardAgent
ssh-add -l | grep -q "debian-emdy"
if [ $? -ne 0 ]; then
  echo "🔑 Ajout de la clé SSH à l'agent local..."
  ssh-add -K "$EC2_KEY" 2>/dev/null || ssh-add "$EC2_KEY"
fi

# Demander quel service déployer
echo "Choisissez le service à déployer :"
echo "auto) Détection automatique des changements (Recommandé)"
echo "1) lms-frontend"
echo "2) course-service"
echo "3) user-service"
echo "4) university-service"
echo "5) meeting-service"
echo "6) announcement-service"
echo "7) ai-service"
echo "8) discovery-server"
echo "9) config-server"
echo "10) api-gateway"
echo "11) practice-service"
echo "all) TOUS les services (Reconstruction complète)"
echo "pull-only) Mettre à jour le code sans reconstruire de conteneurs"
read -p "Sélection [auto] : " SERVICE_CHOICE
SERVICE_CHOICE=${SERVICE_CHOICE:-auto}

# Mapper le choix
case $SERVICE_CHOICE in
  auto) SERVICE="auto" ;;
  1|lms-frontend) SERVICE="lms-frontend" ;;
  2|course-service) SERVICE="course-service" ;;
  3|user-service) SERVICE="user-service" ;;
  4|university-service) SERVICE="university-service" ;;
  5|meeting-service) SERVICE="meeting-service" ;;
  6|announcement-service) SERVICE="announcement-service" ;;
  7|ai-service) SERVICE="ai-service" ;;
  8|discovery-server) SERVICE="discovery-server" ;;
  9|config-server) SERVICE="config-server" ;;
  10|api-gateway) SERVICE="api-gateway" ;;
  11|practice-service) SERVICE="practice-service" ;;
  all) SERVICE="all" ;;
  pull-only) SERVICE="pull-only" ;;
  *)
    echo "Utilisation de la saisie brute : $SERVICE_CHOICE"
    SERVICE=$SERVICE_CHOICE
    ;;
esac

# Branche de déploiement : toujours prod/medoune
CURRENT_LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_LOCAL_BRANCH" != "$DEPLOY_BRANCH" ]; then
  echo "⚠️  Attention : vous êtes sur '$CURRENT_LOCAL_BRANCH' mais la branche de déploiement est '$DEPLOY_BRANCH'."
  read -p "Continuer avec '$DEPLOY_BRANCH' quand même ? (Y/n) : " BRANCH_CONFIRM
  BRANCH_CONFIRM=${BRANCH_CONFIRM:-y}
  if [[ ! "$BRANCH_CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé."
    exit 0
  fi
fi
BRANCH="$DEPLOY_BRANCH"

echo "--------------------------------------------------"
echo "📍 Branche : $BRANCH"
echo "📦 Service : $SERVICE"
echo "--------------------------------------------------"

# Proposer de pousser les modifications locales (main n'est jamais touché)
read -p "Pousser les commits locaux vers origin/$BRANCH avant de déployer ? (Y/n) : " PUSH_CONFIRM
PUSH_CONFIRM=${PUSH_CONFIRM:-y}
if [[ "$PUSH_CONFIRM" =~ ^[Yy]$ ]]; then
  echo "⬆️ Push sur $BRANCH (main resté intact)..."
  git push origin "$BRANCH"
else
  echo "⚠️  Pas de push. L'EC2 déploiera le dernier commit déjà poussé sur $BRANCH."
fi

# Connexion SSH avec Agent Forwarding (-A)
echo "📡 Connexion à l'EC2 ($EC2_IP) et exécution du déploiement..."

# Préparation de la commande SSH selon le choix
SSH_CMD="cd $REMOTE_PATH &&
echo '🔄 Fetching et vérification de la branche $BRANCH...' &&
git fetch origin &&
OLD_COMMIT=\$(git rev-parse HEAD) &&
git checkout $BRANCH &&
git reset --hard origin/$BRANCH &&
NEW_COMMIT=\$(git rev-parse HEAD)"

if [ "$SERVICE" == "auto" ]; then
  # Mode détection automatique
  SSH_CMD="$SSH_CMD &&
  echo '🔍 Analyse des changements entre' \$OLD_COMMIT 'et' \$NEW_COMMIT '...' &&
  if [ \"\$OLD_COMMIT\" = \"\$NEW_COMMIT\" ]; then
    echo '✅ Aucun changement de code détecté. L EC2 est déjà à jour.' &&
    exit 0;
  fi &&
  DIFF_FILES=\$(git diff --name-only \$OLD_COMMIT \$NEW_COMMIT) &&
  SERVICES_TO_BUILD='' &&
  GLOBAL_REBUILD='false' &&
  
  if echo \"\$DIFF_FILES\" | grep -q -E 'docker-compose.yml|postgres-init/'; then GLOBAL_REBUILD='true'; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-frontend/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD lms-frontend\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/course-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD course-service\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/user-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD user-service\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/university-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD university-service\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/meeting-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD meeting-service\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/announcement-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD announcement-service\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/ai-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD ai-service\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/discovery-server/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD discovery-server\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/config-server/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD config-server\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/api-gateway/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD api-gateway\"; fi &&
  if echo \"\$DIFF_FILES\" | grep -q 'lms-microservices/practice-service/'; then SERVICES_TO_BUILD=\"\$SERVICES_TO_BUILD practice-service\"; fi &&
  
  if [ \"\$GLOBAL_REBUILD\" = \"true\" ]; then
    echo '⚠️ Changement global détecté (docker-compose). Reconstruction complète...' &&
    cd lms-microservices &&
    docker-compose build &&
    docker-compose up -d &&
    docker image prune -af &&
    docker builder prune -f;
  elif [ -n \"\$SERVICES_TO_BUILD\" ]; then
    echo '🛠️ Services modifiés détectés :' \$SERVICES_TO_BUILD &&
    cd lms-microservices &&
    for svc in \$SERVICES_TO_BUILD; do
      echo \"🏗️ Build du service : \$svc...\" &&
      docker-compose build \$svc &&
      docker-compose up -d \$svc;
    done &&
    echo '🧹 Nettoyage des images obsolètes et du cache de build...' &&
    docker image prune -f &&
    docker builder prune -f;
  else
    echo '✅ Aucun service à reconstruire pour les fichiers modifiés.';
  fi"
elif [ "$SERVICE" == "all" ]; then
  SSH_CMD="$SSH_CMD &&
  echo '🏗️ Reconstruction de TOUS les conteneurs...' &&
  cd lms-microservices &&
  docker-compose build &&
  docker-compose up -d &&
  echo '🧹 Nettoyage des images Docker obsolètes et du cache de build...' &&
  docker image prune -af &&
  docker builder prune -f"
elif [ "$SERVICE" == "pull-only" ]; then
  SSH_CMD="$SSH_CMD && echo '✅ Code source mis à jour sur l EC2 avec succès (aucun build docker).'"
else
  SSH_CMD="$SSH_CMD &&
  echo '🏗️ Reconstruction forcée du service : $SERVICE...' &&
  cd lms-microservices &&
  docker-compose build $SERVICE &&
  docker-compose up -d $SERVICE &&
  echo '🧹 Nettoyage des images Docker obsolètes et du cache de build...' &&
  docker image prune -f &&
  docker builder prune -f"
fi

ssh -A -i "$EC2_KEY" "$EC2_USER@$EC2_IP" "$SSH_CMD"

echo "=================================================="
echo "🎉 Déploiement terminé !"
echo "=================================================="
