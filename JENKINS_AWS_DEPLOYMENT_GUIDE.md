# 🚀 STRATÉGIE DÉPLOIEMENT MULTI-ENVIRONNEMENT
## Jenkins + AWS EC2 (Prod + Staging) + GitHub Actions (Production Actuelles)

**Objectif** : Ajouter Jenkins + AWS sans toucher au déploiement actuel (GitHub Actions)  
**Branche** : `main` (shared, continuous development)  
**Stratégie** : Blue-Green Deployment + Version Tagging  

---

## 📋 ARCHITECTURE CIBLE

```
┌────────────────────────────────────────────────────────────────┐
│                     SOURCE UNIQUE: main branch                 │
│              K(Continu développement sans interruption)          │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼──────────────┐
                │             │              │
                ▼             ▼              ▼
        ┌────────────┐  ┌────────────┐  ┌─────────────┐
        │ GitHub     │  │  Jenkins   │  │  Developer  │
        │ Actions    │  │  Pipeline  │  │ Workstation │
        │ (Webhook)  │  │  (Webhook) │  │ (Manual)    │
        └──────┬─────┘  └──────┬─────┘  └─────────────┘
               │               │
               │ (CI Check)    │ (CI Check)
               ▼               ▼
        ┌──────────────────────────┐
        │  Lint, Test, Build       │
        │  (même steps)            │
        └───────────┬──────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
        ▼                          ▼
    ┌─────────────┐           ┌──────────────────┐
    │  Docker Hub │           │   AWS ECR        │
    │  Registry   │           │   (Private)      │
    │             │           │                  │
    │  Images:    │           │  Images:         │
    │  emdy1/*    │           │  (same as Hub)   │
    └─────────────┘           └──────────────────┘
        │                           │
        │ (Docker pull)             │ (Docker pull)
        │                           │
        ▼                           ▼
    ┌──────────────────┐    ┌─────────────────────┐
    │  EC2 Production  │    │  AWS Staging        │
    │  (GitHub Actions)│    │  (Jenkins)          │
    │                  │    │                     │
    │  ✅ ACTUEL       │    │  ✅ NOUVEAU         │
    │  (À conserver)   │    │  (À ajouter)        │
    └──────────────────┘    └─────────────────────┘
        │                           │
        │ (Nginx: 80/443)           │ (Nginx: 80/443)
        │                           │
        ▼                           ▼
    ┌──────────────────┐    ┌─────────────────────┐
    │  Frontend        │    │  Frontend           │
    │  API Gateway     │    │  API Gateway        │
    │  (8080)          │    │  (8080)             │
    │  Microservices   │    │  Microservices      │
    └──────────────────┘    └─────────────────────┘
```

---

## 🎯 PHASE 1: PRÉPARATION (1-2 jours)

### 1.1 Créer AWS EC2 Instance Staging

**Spécifications** :
- **Instance Type** : t3.medium (identique production)
- **OS** : Ubuntu 22.04 LTS (identique production)
- **Storage** : 30GB EBS (identique)
- **Security Group** :
  - Port 22 (SSH) - Jenkins + Admin
  - Port 80 (HTTP) - Frontend
  - Port 443 (HTTPS) - Frontend
  - Port 8080 (API Gateway - privé)
  - Port 5432 (PostgreSQL - privé)
- **Name** : `lms-staging-server`

**Commands** :
```bash
# AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups lms-staging-sg \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=lms-staging-server}]'
```

### 1.2 Setup Base de Données Staging (Optionnel - Separate ou Shared)

**Option A: Separate DB (Recommandé pour isolation)**
```sql
-- Aurora RDS ou PostgreSQL EC2
CREATE DATABASE lmsdb_staging;
CREATE DATABASE user_db_staging;
CREATE DATABASE course_db_staging;
-- ... autres DBs
```

**Option B: Shared DB (Moins cher, mais risqué)**
```sql
-- Même DB production avec préfixes _staging
CREATE DATABASE user_db_staging;
CREATE SCHEMA staging;  -- Dans la même instance
```

**→ Recommandation** : Option A (Staging isolé) pour sécurité

### 1.3 Setup Secrets AWS Staging

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name lms/staging/database \
  --secret-string '{
    "POSTGRES_USER": "postgres",
    "POSTGRES_PASSWORD": "staging-password-xyz",
    "DB_URL": "jdbc:postgresql://staging-db:5432/user_db_staging"
  }'

aws secretsmanager create-secret \
  --name lms/staging/api-keys \
  --secret-string '{
    "JWT_SECRET": "staging-secret-key-xyz",
    "GROQ_API_KEY": "gsk_...",
    "GEMINI_API_KEY": "AIza..."
  }'
```

### 1.4 Configurer AWS ECR (Private Docker Registry)

```bash
# Créer ECR repo
aws ecr create-repository --repository-name lms-services

# Créer repos pour chaque service
for SERVICE in discovery-server config-server api-gateway \
               user-service course-service ai-service \
               announcement-service meeting-service lms-frontend; do
  aws ecr create-repository --repository-name $SERVICE
done

# Configure ECR lifecycle (keep 10 latest images)
aws ecr put-lifecycle-policy \
  --repository-name lms-services \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {"type": "expire"}
    }]
  }'
```

---

## 🏗️ PHASE 2: SETUP JENKINS

### 2.1 Installer Jenkins sur EC2 Bastion/Builder

**Instance Jenkins séparée (optionnel mais recommandé)** :
```bash
# EC2 Jenkins Controller (t3.small)
sudo apt update && sudo apt upgrade -y

# Installer Java
sudo apt install openjdk-11-jdk -y

# Installer Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install jenkins -y

# Démarrer Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Accéder à Jenkins
# http://jenkins-ec2-ip:8080
# Password: cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 2.2 Plugins Jenkins Essentiels

**Via Jenkins UI (Manage Jenkins → Plugin Manager)** :
```
1. ✅ Pipeline
2. ✅ GitHub Integration
3. ✅ Docker
4. ✅ Docker Pipeline
5. ✅ AWS CodePipeline
6. ✅ SSH Agent
7. ✅ Credentials Binding
8. ✅ AnsiColor (pour logs colorés)
9. ✅ Slack Notification
10. ✅ Email Extension
```

**Ou via Script** :
```groovy
// Jenkins Script Console
plugins = ['pipeline', 'github', 'docker-commons', 
           'docker-workflow', 'codepipeline', 'ssh-agent',
           'credentials-binding', 'ansicolor', 'slack', 'email-ext']

plugins.each { plugin ->
  Jenkins.instance.pluginManager.plugins.each {
    if (it.getShortName() == plugin) it.doDelete()
  }
  Jenkins.instance.updateCenter.getPlugin(plugin).deploy()
}
```

### 2.3 Configurer Credentials Jenkins

**AWS Credentials** :
```groovy
// Jenkins → Manage Credentials → Add Credentials
// Type: AWS Credentials
// Access Key ID: AKIA...
// Secret Access Key: xxx...
// Credentials ID: aws-staging-credentials
```

**Docker Hub Credentials** :
```groovy
// Type: Username with password
// Username: emdy1
// Password: ***
// Credentials ID: dockerhub-credentials
```

**GitHub Credentials** :
```groovy
// Type: GitHub App or Personal Token
// Token: ghp_...
// Credentials ID: github-credentials
```

---

## 📝 PHASE 3: CRÉER JENKINSFILE (Pipeline as Code)

### 3.1 Jenkinsfile pour AWS Staging

**Chemin** : `Jenkinsfile.staging` (à la racine du projet)

```groovy
// Jenkinsfile.staging
pipeline {
    agent any
    
    options {
        timeout(time: 60, unit: 'MINUTES')
        timestamps()
        ansiColor('xterm')
        buildDiscarder(logRotator(numToKeepStr: '30'))
    }
    
    environment {
        // AWS
        AWS_REGION = 'eu-west-1'
        AWS_ECR_REGISTRY = '123456789.dkr.ecr.eu-west-1.amazonaws.com'
        AWS_ECR_REPO_PREFIX = "${AWS_ECR_REGISTRY}/lms"
        
        // Staging EC2
        STAGING_EC2_IP = '52.18.xxx.xxx'  // À récupérer d'AWS
        STAGING_USER = 'ubuntu'
        STAGING_KEY = credentials('aws-staging-pem')
        
        // Versions
        BUILD_VERSION = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
        IMAGE_TAG = "staging-${BUILD_VERSION}"
        
        // Slack
        SLACK_CHANNEL = '#deployments'
        SLACK_WEBHOOK = credentials('slack-webhook')
    }
    
    stages {
        stage('🔍 Checkout') {
            steps {
                checkout(scm: [
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/diopmedoune/lms.git']]
                ])
                script {
                    env.GIT_COMMIT_MSG = sh(returnStdout: true, 
                        script: "git log -1 --pretty=%B").trim()
                }
            }
        }
        
        stage('✅ Lint & Tests') {
            parallel {
                stage('Java Lint') {
                    steps {
                        dir('lms-microservices') {
                            sh '''
                                echo "🔍 Linting Java services..."
                                mvn clean checkstyle:check -DskipTests || true
                            '''
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('lms-frontend') {
                            sh '''
                                echo "🔍 Linting React..."
                                npm install
                                npm run lint || true
                            '''
                        }
                    }
                }
            }
        }
        
        stage('🔨 Build Images') {
            steps {
                script {
                    // Authenticate to AWS ECR
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${AWS_ECR_REGISTRY}
                    '''
                    
                    // Build each service
                    services = [
                        'discovery-server', 'config-server', 'api-gateway',
                        'user-service', 'course-service', 'ai-service',
                        'announcement-service', 'meeting-service', 'lms-frontend'
                    ]
                    
                    services.each { service ->
                        sh '''
                            echo "🐳 Building ${service}..."
                            
                            if [ "${service}" == "lms-frontend" ]; then
                                cd lms-frontend
                            else
                                cd lms-microservices/${service}
                            fi
                            
                            docker build \
                              -t ${AWS_ECR_REPO_PREFIX}/${service}:${IMAGE_TAG} \
                              -t ${AWS_ECR_REPO_PREFIX}/${service}:latest \
                              .
                            
                            cd - > /dev/null
                        '''
                    }
                }
            }
        }
        
        stage('📤 Push to ECR') {
            steps {
                script {
                    services = [
                        'discovery-server', 'config-server', 'api-gateway',
                        'user-service', 'course-service', 'ai-service',
                        'announcement-service', 'meeting-service', 'lms-frontend'
                    ]
                    
                    services.each { service ->
                        sh '''
                            echo "📤 Pushing ${service}..."
                            
                            docker push ${AWS_ECR_REPO_PREFIX}/${service}:${IMAGE_TAG}
                            docker push ${AWS_ECR_REPO_PREFIX}/${service}:latest
                        '''
                    }
                }
            }
        }
        
        stage('🚀 Deploy to Staging') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'aws-staging-pem', 
                                                       keyFileVariable: 'SSH_KEY_FILE')]) {
                        sh '''
                            echo "🚀 Deploying to Staging EC2..."
                            
                            # SSH into staging EC2
                            ssh -i ${SSH_KEY_FILE} \
                                -o StrictHostKeyChecking=no \
                                ${STAGING_USER}@${STAGING_EC2_IP} << 'EOF'
                            
                            cd ~/lms/lms-microservices
                            
                            # Update docker-compose.yml with ECR images
                            cat > docker-compose.staging.yml << 'COMPOSE'
                            version: '3.8'
                            services:
                              discovery-server:
                                image: ${AWS_ECR_REPO_PREFIX}/discovery-server:${IMAGE_TAG}
                                ports: ["8761:8761"]
                                environment:
                                  JAVA_OPTS: -Xmx384m -Xms256m
                                networks: [lms-network]
                              
                              # ... autres services
                              
                              api-gateway:
                                image: ${AWS_ECR_REPO_PREFIX}/api-gateway:${IMAGE_TAG}
                                ports: ["8080:8080"]
                                environment:
                                  EUREKA_CLIENT_SERVICEURL_DEFAULTZONE: http://discovery-server:8761/eureka/
                                  JWT_SECRET: ${JWT_SECRET}
                                depends_on:
                                  - discovery-server
                                networks: [lms-network]
                              
                              lms-frontend:
                                image: ${AWS_ECR_REPO_PREFIX}/lms-frontend:${IMAGE_TAG}
                                ports: ["3000:80"]
                                environment:
                                  REACT_APP_API_URL: http://api-gateway:8080
                                depends_on:
                                  - api-gateway
                                networks: [lms-network]
                            COMPOSE
                            
                            # Pull latest images from ECR
                            docker login -u AWS -p $(aws ecr get-login-password --region ${AWS_REGION}) ${AWS_ECR_REGISTRY}
                            docker-compose -f docker-compose.staging.yml pull
                            
                            # Stop old containers (graceful shutdown)
                            docker-compose -f docker-compose.staging.yml down || true
                            
                            # Start new containers
                            docker-compose -f docker-compose.staging.yml up -d
                            
                            # Wait for services to be healthy
                            echo "⏳ Waiting for services to be healthy..."
                            sleep 30
                            
                            # Health checks
                            curl -f http://localhost:8761/actuator/health || exit 1
                            curl -f http://localhost:8080/actuator/health || exit 1
                            
                            # Cleanup
                            docker image prune -af
                            
                            echo "✅ Staging deployment successful!"
                            
                            EOF
                        '''
                    }
                }
            }
        }
        
        stage('🧪 Smoke Tests') {
            steps {
                sh '''
                    echo "🧪 Running smoke tests..."
                    
                    # Test endpoints
                    STAGING_URL="http://${STAGING_EC2_IP}"
                    
                    # Frontend
                    curl -f ${STAGING_URL}/ || exit 1
                    
                    # API Gateway health
                    curl -f ${STAGING_URL}/api/actuator/health || exit 1
                    
                    # Discover services
                    curl -f ${STAGING_URL}:8761/actuator/info || exit 1
                    
                    echo "✅ Smoke tests passed!"
                '''
            }
        }
        
        stage('📢 Notify') {
            steps {
                script {
                    def status = currentBuild.result ?: 'SUCCESS'
                    def color = status == 'SUCCESS' ? 'good' : 'danger'
                    
                    sh '''
                        echo "📢 Sending Slack notification..."
                        
                        curl -X POST ${SLACK_WEBHOOK} \
                          -H 'Content-Type: application/json' \
                          -d '{
                            "attachments": [{
                              "color": "'${color}'",
                              "title": "🚀 LMS Staging Deployment",
                              "fields": [
                                {"title": "Status", "value": "'${status}'", "short": true},
                                {"title": "Build", "value": "#'${BUILD_NUMBER}'", "short": true},
                                {"title": "Branch", "value": "main", "short": true},
                                {"title": "Commit", "value": "'${GIT_COMMIT_MSG}'", "short": false},
                                {"title": "URL", "value": "http://'${STAGING_EC2_IP}'", "short": true}
                              ]
                            }]
                          }'
                    '''
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            sh '''
                echo "❌ Deployment failed!"
                # Optionnel: rollback automatique
                ssh -i ${STAGING_KEY} ${STAGING_USER}@${STAGING_EC2_IP} \
                  'cd ~/lms/lms-microservices && docker-compose up -d' || true
            '''
        }
    }
}
```

### 3.2 Créer Job Jenkins

**Via Jenkins UI** :
1. **New Item** → Pipeline
2. **Name** : `LMS-Staging-Deploy`
3. **Description** : `Staging deployment on AWS (main branch)`
4. **Pipeline** :
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: `https://github.com/diopmedoune/lms.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile.staging`
5. **Build Triggers** :
   - ✅ GitHub hook trigger for GITscm polling
   - ✅ Poll SCM (backup) : `H/5 * * * *` (every 5 min)

---

## 🔗 PHASE 4: WEBHOOKS & INTÉGRATION

### 4.1 Configurer GitHub Webhook (Jenkins)

**Dans GitHub** :
1. Repository → Settings → Webhooks
2. **Add Webhook** :
   - Payload URL: `http://jenkins-ip:8080/github-webhook/`
   - Content type: `application/json`
   - Events: `Push events`, `Pull requests`
   - Active: ✅

**Jenkins** :
1. Manage Jenkins → Configure System
2. GitHub → GitHub Servers
3. Name: `GitHub`
4. API URL: `https://api.github.com`
5. Credentials: GitHub token

### 4.2 Paralléliser: GitHub Actions (Prod) + Jenkins (Staging)

**Configuration** :
```yaml
# GitHub Actions: .github/workflows/deploy.yml (ACTUEL - Production)
# Continue à fonctionner normalement
# Déploie vers Production EC2 via GitHub Actions

# Jenkins: Jenkinsfile.staging (NOUVEAU - Staging)
# Déploie vers Staging EC2 via Jenkins
```

**Schéma** :
```
main branch push
    │
    ├─→ GitHub Actions webhook
    │    └─→ Build + Push Docker Hub
    │         └─→ Deploy to Production EC2 (AWS)
    │
    └─→ Jenkins webhook
         └─→ Build + Push AWS ECR
              └─→ Deploy to Staging EC2 (AWS)
```

---

## 🔐 PHASE 5: CONFIGURATION PRODUITS

### 5.1 Environment Variables - Staging

**AWS Secrets Manager** :
```bash
{
  "JWT_SECRET": "staging-secret-xyz",
  "POSTGRES_USER": "postgres",
  "POSTGRES_PASSWORD": "staging-password-xyz",
  "DB_USERNAME": "postgres",
  "DB_PASSWORD": "staging-password-xyz",
  "EUREKA_URL": "http://discovery-server:8761/eureka/",
  "KAFKA_BOOTSTRAP_SERVERS": "kafka:29092",
  "GROQ_API_KEY": "gsk_...",
  "GEMINI_API_KEY": "AIza...",
  "LIVEKIT_API_KEY": "devkey",
  "LIVEKIT_API_SECRET": "devsecret...",
  "BASE_URL": "http://staging-ec2-ip",
  "FRONTEND_URL": "http://staging-ec2-ip:3000"
}
```

**Fetch in Jenkinsfile** :
```bash
# Dans stage deploy
aws secretsmanager get-secret-value --secret-name lms/staging/api-keys \
  --query SecretString --output text | jq . > /tmp/env.json

source /tmp/env.json
```

### 5.2 docker-compose.staging.yml (Adapté)

```yaml
version: '3.8'

services:
  postgres_db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: lmsdb_staging  # DB staging séparée
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
    networks: [lms-network]
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    environment:
      # ... même config que production
    networks: [lms-network]
    restart: unless-stopped

  discovery-server:
    image: ${AWS_ECR_REPO_PREFIX}/discovery-server:${IMAGE_TAG}
    ports: ["8761:8761"]
    environment:
      JAVA_OPTS: -Xmx384m -Xms256m
    networks: [lms-network]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:8761/actuator/health"]
      interval: 15s
      timeout: 10s
      retries: 10

  # ... autres services avec images ECR ...

  lms-frontend:
    image: ${AWS_ECR_REPO_PREFIX}/lms-frontend:${IMAGE_TAG}
    ports: ["3000:80"]
    networks: [lms-network]
    environment:
      REACT_APP_API_URL: http://api-gateway:8080
    restart: unless-stopped

volumes:
  postgres_data_staging:

networks:
  lms-network:
    driver: bridge
```

---

## ⚖️ PHASE 6: STRATÉGIE DE SYNC (Production ↔ Staging)

### 6.1 Blue-Green Deployment

**Scénario** : Production + Staging avec même code, datas optionnellement isolées

```
┌─────────────────────────────────────────┐
│  main branch (Single Source of Truth)   │
└─────────────────────────────────────────┘
              │
         Commit new code
              │
         ┌────┴──────┐
         │            │
    GitHub Actions  Jenkins
    (Webhook)       (Webhook)
         │            │
         ▼            ▼
    Prod EC2      Staging EC2
    Port: 80      Port: 80
    
    Both have SAME CODE from main branch
    Both run SAME services
    Difference: isolated DBs & configs
```

### 6.2 Database Sync (Optional)

**Si you want identiques DBs** :
```bash
# Backup production weekly
pg_dump -h prod-db -U postgres lmsdb > /backup/lmsdb-$(date +%Y%m%d).sql

# Restore to staging (careful!)
psql -h staging-db -U postgres lmsdb_staging < /backup/lmsdb-latest.sql
```

### 6.3 Promoting to Production

**If Staging passes all tests** :
```bash
# Option 1: Manual promotion via GitHub UI
# Tag commit in staging EC2
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3

# GitHub Actions automatically deploys tagged commits to Production

# Option 2: Automatic promotion via Jenkins
# If all tests pass, trigger Production job
```

---

## 📊 PHASE 7: MONITORING & ALERTING

### 7.1 Health Checks

```groovy
// Dans Jenkinsfile post-deploy
stage('🏥 Health Checks') {
    steps {
        sh '''
            STAGING_IP=${STAGING_EC2_IP}
            
            # Discovery Server
            curl -f http://${STAGING_IP}:8761/actuator/health || exit 1
            
            # API Gateway
            curl -f http://${STAGING_IP}:8080/actuator/health || exit 1
            
            # Database
            curl -f http://${STAGING_IP}:8086/api/announcements || exit 1
            
            echo "✅ All services healthy"
        '''
    }
}
```

### 7.2 Slack Alerts

```groovy
// Build failure notification
post {
    failure {
        sh '''
            curl -X POST ${SLACK_WEBHOOK} \
              -H 'Content-Type: application/json' \
              -d '{
                "text": "🔴 LMS Staging Deployment FAILED",
                "attachments": [{
                  "color": "danger",
                  "fields": [
                    {"title": "Build", "value": "#${BUILD_NUMBER}", "short": true},
                    {"title": "URL", "value": "http://jenkins-ip:8080/job/LMS-Staging-Deploy/${BUILD_NUMBER}", "short": false}
                  ]
                }]
              }'
        '''
    }
}
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Phase 1: Infrastructure
- [ ] AWS EC2 Staging créé (t3.medium)
- [ ] Security groups configurés
- [ ] Staging DB créée (RDS ou EC2)
- [ ] AWS Secrets Manager secrets créés
- [ ] AWS ECR repos créés

### Phase 2: Jenkins
- [ ] Jenkins installé sur EC2 (ou local)
- [ ] Plugins Jenkins installés
- [ ] AWS credentials configurés
- [ ] Docker Hub credentials configurés
- [ ] GitHub credentials configurés

### Phase 3: Pipeline
- [ ] Jenkinsfile.staging créé
- [ ] Jenkins job créé et testé
- [ ] GitHub webhook configured
- [ ] Jenkins webhook configured

### Phase 4: Testing
- [ ] Build test (lint + compile)
- [ ] Docker build test
- [ ] Push ECR test
- [ ] SSH deployment test
- [ ] Health checks test

### Phase 5: Operations
- [ ] Monitoring mis en place
- [ ] Slack alerts configurés
- [ ] Runbook créé (troubleshooting)
- [ ] Backup strategy défini

### Phase 6: Documentation
- [ ] Deployment guide écrit
- [ ] Troubleshooting guide écrit
- [ ] Team training complété

---

## 🚨 POINTS CRITIQUES À NE PAS OUBLIER

### ❌ Ce qui peut casser le déploiement actuel:

1. **Ne pas modifier** `.github/workflows/deploy.yml`
   - Garder GitHub Actions INTACT
   - Production EC2 continue via Actions

2. **Utiliser branche SÉPARÉE** pour Jenkins en dev
   - Ou utiliser tags pour déployer versions spécifiques
   - Sinon: conflicts de déploiement

3. **Isoler les DBs**
   - Production: user_db, course_db, etc.
   - Staging: user_db_staging, course_db_staging, etc.
   - Éviter les croises

4. **Secrets séparés par environnement**
   - Production: GitHub Secrets
   - Staging: AWS Secrets Manager
   - Jamais partager les clés

5. **Ports différents sur même EC2** (si necessary)
   - Si 2 envs sur même machine:
   - Prod: 80/443
   - Staging: 8080/8443 (nginx :8080 → :80 interne)

### ✅ Bonnes pratiques:

1. **Tag images explicitement**
   - `prod-2026-05-22-a1b2c3d`
   - `staging-2026-05-22-a1b2c3d`

2. **Deploy en off-peak hours** (Staging)
   - 21h-23h pour ne pas gêner devs

3. **Health checks après chaque deploy**
   - Verify all services running
   - Check database connectivity

4. **Logs centralisés**
   - ELK Stack ou CloudWatch
   - Tracking de tous les deployments

5. **Rollback quick process**
   - Garder docker-compose avec last known good version
   - Script de rollback automatique

---

## 🔍 TROUBLESHOOTING COURANT

### Problem: GitHub Actions et Jenkins déploient simultanément

**Solution** :
```yaml
# .github/workflows/deploy.yml
- name: Check for simultaneous deployment
  run: |
    # Vérifier si Jenkins est en cours de deploy
    # Si oui: wait ou skip
    while curl -f http://jenkins-ip:8080/queue; do
      sleep 10
    done
```

### Problem: Staging et Production DBs se croisent

**Solution** :
```bash
# Toujours spécifier le schema/db
# Production
export DB_URL="jdbc:postgresql://prod-db:5432/user_db"

# Staging
export DB_URL="jdbc:postgresql://staging-db:5432/user_db_staging"
```

### Problem: Images ECR pas disponibles après push

**Solution** :
```bash
# Attendre que ECR soit prêt
for i in {1..10}; do
  if aws ecr describe-images --repository-name $SERVICE | grep -q $IMAGE_TAG; then
    echo "✅ Image found"
    break
  fi
  echo "⏳ Waiting for ECR..."
  sleep 5
done
```

---

## 📞 COMMANDES UTILES

```bash
# Monitorer deployments
watch -n 5 "aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==\`Name\`].Value|[0]]' --output table"

# Vérifier ECR images
aws ecr describe-images --repository-name lms-services --query 'imageDetails[*].[imageTags,imagePushedAt]' --output table

# SSH to Staging
ssh -i staging-key.pem ubuntu@52.18.xxx.xxx

# Check Docker Compose status
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f api-gateway

# Rollback (manual)
docker-compose -f docker-compose.previous.yml up -d

# Check Jenkins logs
tail -f /var/log/jenkins/jenkins.log
```

---

**RÉSUMÉ** :
✅ Production EC2 (GitHub Actions) → INCHANGÉ  
✅ Staging EC2 (Jenkins) → NOUVEAU  
✅ Même `main` branch → Continuous development  
✅ Différentes images (ECR vs Docker Hub)  
✅ Différentes configs/secrets (AWS Secrets Manager vs GitHub)  
✅ Parallèle déploiement sans conflit  

🚀 **Prêt pour implémentation!**
