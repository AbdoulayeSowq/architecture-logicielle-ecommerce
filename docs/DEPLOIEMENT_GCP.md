# Guide de Déploiement : Application Web LMS sur Google Cloud Platform

Ce document détaille les étapes pour déployer l'environnement Web de la plateforme LMS EPT (Frontend React + Backend Microservices Java) en production sur Google Cloud Platform pour un MVP / Soutenance.

*Note : Le déploiement de l'application mobile (Flutter) n'est pas couvert dans ce document.*

---

## 1. Prérequis et Architecture Cible

**Architecture déployée :**
* **Frontend** : React (servi via Nginx)
* **Backend** : Microservices Spring Boot (API Gateway, User, Course, Announcement, AI, etc.)
* **Base de données** : PostgreSQL (avec pgvector)
* **Message Broker** : Kafka
* **Réseau** : Reverse Proxy Nginx + HTTPS (Certbot)

**Ressources recommandées pour le MVP :**
Pour éviter les crashs (OOM - Out of Memory) liés à la gourmandise des applications Java, il est **fortement recommandé** d'utiliser une instance `e2-medium` (4 Go RAM, 2 vCPU) financée par les 300$ de crédits gratuits offerts à l'inscription sur Google Cloud.

---

## 2. Étape 1 : Création de la Machine Virtuelle sur GCP

1. Connectez-vous à [Google Cloud Console](https://console.cloud.google.com).
2. Créez un nouveau projet (ex: `lms-ept-production`).
3. Allez dans **Compute Engine -> VM Instances** et cliquez sur **Create Instance**.
4. **Configuration de l'instance :**
   * **Name** : `lms-web-server`
   * **Region** : `us-central1` (ou europe-west9 si disponible)
   * **Machine type** : `e2-medium` (4 Go RAM)
   * **Boot disk** : `Ubuntu 22.04 LTS` (Taille: 30 Go ou plus)
   * **Firewall** : Cochez **Allow HTTP traffic** et **Allow HTTPS traffic**.
5. Cliquez sur **Create** et attendez le démarrage.

---

## 3. Étape 2 : Sécurité du Pare-feu (Firewall GCP)

**Important :** Ne laissez pas l'API Gateway ou les autres microservices exposés directement sur Internet pour des raisons de sécurité.

1. Allez dans **VPC Network -> Firewall**.
2. Assurez-vous que **seuls** les ports suivants sont ouverts au public :
   * `80` (HTTP - Frontend & Proxy)
   * `443` (HTTPS - Sécurité)
   * `22` (SSH - Accès Administrateur)
3. Les requêtes vers l'API (port `8080`) transiteront obligatoirement par Nginx (port `443`).

---

## 4. Étape 3 : Configuration du Serveur (Docker & Swap)

Ouvrez une connexion SSH depuis la console Google Cloud, puis préparez le serveur :

### A. Mises à jour
```bash
sudo apt update && sudo apt upgrade -y
```

### B. Ajout de Mémoire Swap (Sécurité Anti-Crash)
Même avec 4 Go de RAM, il est prudent d'ajouter un espace Swap pour la compilation et les pics de charge :
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### C. Installation de Docker et Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y
```
Ajoutez votre utilisateur au groupe Docker pour éviter d'utiliser `sudo` :
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 5. Étape 4 : Récupération et Configuration du Projet

1. Installez Git :
   ```bash
   sudo apt install git -y
   ```
2. Clonez le code source :
   ```bash
   git clone <URL_DE_VOTRE_DEPOT_LMS>
   cd <VOTRE_DEPOT_LMS>/lms-microservices
   ```
3. Configurez les variables d'environnement :
   ```bash
   cp .env.example .env
   nano .env
   ```
   Remplissez les clés nécessaires (`JWT_SECRET`, `GROQ_API_KEY`, mots de passe de la BDD, etc.).

---

## 6. Étape 5 : Lancement des Microservices

Pour limiter la consommation en production, assurez-vous que les variables `JAVA_OPTS` sont bien configurées dans votre `docker-compose.yml` (ex: `-Xms128m -Xmx256m`).

Construisez et lancez l'infrastructure en arrière-plan :
```bash
docker compose up -d --build
```
*Note : Le build initial peut prendre 10 à 20 minutes.*

Vérifiez que tout fonctionne :
```bash
docker ps
docker compose logs -f
```

---

## 7. Étape 6 : Configuration du Nginx Reverse Proxy (Frontend & API)

Nous utilisons Nginx pour servir le frontend React et relayer les requêtes `/api` vers l'API Gateway.

1. Installez Nginx :
   ```bash
   sudo apt install nginx -y
   ```
2. Créez un fichier de configuration pour le LMS :
   ```bash
   sudo nano /etc/nginx/sites-available/lms
   ```
3. Insérez la configuration suivante (remplacez `votre-domaine.com` par votre domaine gratuit ou l'IP de votre VM si vous n'avez pas de domaine) :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com; # Ou IP publique de la VM

       # Frontend React
       location / {
           # Si le frontend React est géré par un conteneur (ex: port 3000)
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       # Backend API Gateway
       location /api/ {
           proxy_pass http://localhost:8080/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
4. Activez la configuration et redémarrez Nginx :
   ```bash
   sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 8. Étape 7 : Sécurisation avec HTTPS (Certbot)

Si vous avez configuré un nom de domaine (ex: `lms.mondomaine.com`), générez un certificat SSL gratuit :

1. Installez Certbot :
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. Générez et installez le certificat :
   ```bash
   sudo certbot --nginx -d votre-domaine.com
   ```
L'application Web LMS est désormais sécurisée en HTTPS et fonctionnelle pour le MVP !
