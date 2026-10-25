# C4 Niveau 3 : Diagramme des Composants (Focus Catalogue & Commandes)

Ce diagramme détaille la structure interne du microservice pivot `course-service`, responsable de la gestion du catalogue de formations, de la tarification et du parcours de commande / souscription.

## Organisation Interne (Clean / Layered Architecture)

```mermaid
flowchart TD
    subgraph Controllers["Couche Contrôleurs REST (Entrypoints)"]
        CourseCtrl["CourseController<br/>Gestion séances & modules"]
        OrderCtrl["OrderController<br/>Création commande, checkout, confirmation"]
        StudentCourseCtrl["StudentCourseController<br/>Consultation catalogue & cours souscrits"]
        PublicCtrl["PublicViewController<br/>Vitrine publique sans auth"]
    end

    subgraph SecurityFilter["Couche Sécurité"]
        SecConfig["SecurityConfig<br/>Contrôle d'accès & validation JWT"]
    end

    subgraph ServiceLayer["Couche Métier (Domain Services)"]
        CourseService["CourseService / CourseServiceImpl<br/>Règles métier formations & syllabus"]
        OrderService["OrderService / OrderServiceImpl<br/>Validation panier, calcul montants, changement d'état"]
        AdaptiveService["AdaptiveQuizService<br/>Génération quiz & évaluation"]
    end

    subgraph Repositories["Couche Persistance (Spring Data JPA)"]
        ModuleRepo[("ModuleRepository")]
        CourseRepo[("CourseRepository")]
        OrderRepo[("OrderRepository")]
        QuizRepo[("QuizRepository")]
    end

    subgraph ExternalClients["Clients d'Intégration Externe"]
        KafkaProducer["KafkaEventProducer<br/>Envoi d'événements OrderConfirmedEvent"]
        UserClient["UserClient (RestTemplate/Feign)<br/>Vérification de profil client"]
        MinioClient["MinioConfig / FileController<br/>Upload supports de cours S3"]
    end

    SecConfig --> Controllers
    CourseCtrl --> CourseService
    StudentCourseCtrl --> CourseService
    PublicCtrl --> CourseService
    OrderCtrl --> OrderService

    OrderService --> OrderRepo
    OrderService --> ModuleRepo
    OrderService --> KafkaProducer
    OrderService --> UserClient

    CourseService --> ModuleRepo
    CourseService --> CourseRepo
    CourseService --> QuizRepo
    CourseService --> MinioClient
```

## Responsabilités des Composants

1. **`OrderController` & `OrderService`** :
   - Endpoints exposés :
     - `POST /api/orders` : Validation du panier et création d'une commande à l'état `PENDING`.
     - `POST /api/orders/{id}/confirm` : Simulation de validation de paiement et bascule à l'état `PAID`.
     - `GET /api/orders/my-orders` : Liste des commandes de l'acheteur connecté.
     - `GET /api/orders/{id}` : Récupération du reçu de commande détaillé.
   - Règles métier : Vérification de la disponibilité du cours, validation du tarif, inscription automatique de l'acheteur dès confirmation, publication de l'événement Kafka.

2. **`CourseController` & `CourseService`** :
   - Gestion des fiches formations (`CModule`), chapitres (`Course`), supports multimédias (`Material`) et quiz (`Quiz`).
   - Gestion du pricing unitaire (`price`, `currency`).

3. **`KafkaEventProducer`** :
   - Publication asynchrone non-bloquante vers le topic `order.events` contenant l'ID de commande, le nom d'utilisateur de l'acheteur, le montant et le module acheté.
