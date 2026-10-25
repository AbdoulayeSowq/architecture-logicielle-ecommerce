# Diagramme de Séquence : Parcours d'Achat & Inscription

Ce diagramme de séquence décrit le flux complet lorsqu'un client découvre une formation sur la vitrine, valide son panier, effectue le paiement et accède instantanément à son espace de formation.

## Cinématique des Interactions Inter-Services

```mermaid
sequenceDiagram
    autonumber
    actor Client as 👤 Client (Navigateur React)
    participant Gateway as 🚪 API Gateway (8080)
    participant CourseSvc as 📚 Course & Order Service (8082)
    participant Payment as 💳 Passerelle Paiement (Mock/Stripe)
    participant Kafka as 📨 Kafka Broker (Topic: order.events)
    participant AnnounceSvc as 🔔 Announcement Service (8085)
    participant UserSvc as 👤 User Service (8081)

    %% 1. Navigation Catalogue
    Client->>Gateway: GET /api/course/modules (Consultation catalogue)
    Gateway->>CourseSvc: Routage vers CourseService
    CourseSvc-->>Client: Liste des formations avec détails & prix

    %% 2. Ajout au panier & Création de Commande
    Client->>Gateway: POST /api/orders { moduleId: 12, paymentMethod: "WAVE" }
    Gateway->>Gateway: Validation du Token JWT (Header Authorization)
    Gateway->>CourseSvc: POST /api/orders (injecte X-Auth-User)
    CourseSvc->>CourseSvc: Vérification existence du cours & calcul montant
    CourseSvc->>CourseSvc: Sauvegarde Order (Statut = PENDING)
    CourseSvc-->>Client: 201 Created { orderId: 42, orderNumber: "ORD-2026-42", status: "PENDING" }

    %% 3. Paiement & Confirmation
    Client->>Payment: Exécution du règlement (WAVE / CB)
    Payment-->>Client: Accusé de paiement réussi (TransactionId: "TX-9988")

    Client->>Gateway: POST /api/orders/42/confirm { transactionId: "TX-9988" }
    Gateway->>CourseSvc: POST /api/orders/42/confirm
    CourseSvc->>CourseSvc: Passage statut Order -> PAID
    CourseSvc->>CourseSvc: Inscription automatique du client au module (accès débloqué)

    %% 4. Découplage Événementiel via Kafka
    CourseSvc->)Kafka: Publie événement OrderConfirmedEvent { orderId: 42, user: "sowma", module: "Architecture Microservices" }
    CourseSvc-->>Client: 200 OK { message: "Commande validée et formation débloquée !" }

    %% 5. Traitement Asynchrone
    par Notification Acheteur
        Kafka->)AnnounceSvc: Consomme OrderConfirmedEvent
        AnnounceSvc->>AnnounceSvc: Génère notification de confirmation
        AnnounceSvc-->>Client: Push Notification temps réel (WebSocket)
    and Mise à jour Gamification
        Kafka->)UserSvc: Consomme OrderConfirmedEvent
        UserSvc->>UserSvc: Attribution de points XP d'inscription
    end

    %% 6. Accès immédiat
    Client->>Gateway: GET /api/studentcourse/student/sowma/modules
    Gateway->>CourseSvc: Récupère la bibliothèque de l'acheteur
    CourseSvc-->>Client: Formation débloquée disponible avec vidéos & quiz
```

## Points Clés de l'Architecture

1. **Routage et Sécurité Centralisés** : Le client ne contacte jamais directement `course-service` ; l'API Gateway valide le jeton JWT et transmet le contexte utilisateur de manière sécurisée.
2. **Atomicité Locale** : La création de la commande et le déblocage de l'accès s'effectuent dans une transaction ACID locale au microservice de cours.
3. **Résilience Asynchrone** : Les notifications et la gamification sont découplées via Apache Kafka. Même si le service de notification subit une interruption de service temporaire, la commande du client n'est jamais retardée ni bloquée.
