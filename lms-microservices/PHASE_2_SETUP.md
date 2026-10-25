# Practice Service - Phase 2 Setup

The practice-service directory needs to be created manually first.

## Step 1: Create the directory structure

```powershell
# PowerShell (Windows)
$basePath = "d:\ProjetTrans\lms\lms-microservices\practice-service"
New-Item -ItemType Directory -Path "$basePath" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\controller" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\service" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\entity" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\repository" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\dto" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\config" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\java\com\lms\practice\client" -Force
New-Item -ItemType Directory -Path "$basePath\src\main\resources\db\changelog" -Force
New-Item -ItemType Directory -Path "$basePath\src\test\java\com\lms\practice\service" -Force
New-Item -ItemType Directory -Path "$basePath\src\test\java\com\lms\practice\controller" -Force
```

## Step 2: Copy files

After creating the structure, copy the pom.xml, Java files, and configuration files.
