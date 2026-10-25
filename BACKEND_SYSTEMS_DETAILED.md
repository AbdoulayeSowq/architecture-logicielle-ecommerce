# 🔧 RÉSUMÉ TECHNIQUE DÉTAILLÉ - SYSTÈMES BACKEND

**Plateforme LMS EPT - Architecture Microservices**  
**Focus** : Notifications, Meetings, IA, Recommendations, Kafka  
**Date** : Mai 2026

---

## 📑 TABLE DES MATIÈRES

1. [Système de Notifications](#1--système-de-notifications)
2. [Système de Meetings (Visioconférence)](#2--système-de-meetings-visioconférence)
3. [Système IA (Intelligence Artificielle)](#3--système-ia-intelligence-artificielle)
4. [Système de Recommandations](#4--système-de-recommandations)
5. [Kafka - Message Broker](#5--kafka--message-broker)
6. [Intégration des Systèmes](#6--intégration-des-systèmes)

---

## 1. 🔔 SYSTÈME DE NOTIFICATIONS

### Vue d'Ensemble
Le système de notifications est **centralissé** dans le **Announcement Service** (Port 8086) et fonctionne sur un modèle **temps réel** via **WebSocket (STOMP)** avec persistance en base de données.

### Architecture

```
┌────────────────────────────────────────────────────┐
│           APPLICATION CLIENT (Web/Mobile)          │
├────────────────────────────────────────────────────┤
│  WebSocket STOMP Client (SockJS + @stomp/stompjs) │
│  URL: ws://localhost:8086/ws-announcement          │
└────────────────────────────────────────────────────┘
                    │
                    │ (STOMP Protocol)
                    ▼
┌────────────────────────────────────────────────────┐
│    Announcement Service (Spring WebSocket)         │
│              Port 8086                             │
├────────────────────────────────────────────────────┤
│ WebSocketConfig:                                    │
│ ├─ Simple Broker: /topic, /queue                  │
│ ├─ App Destination Prefix: /app                   │
│ └─ User Destination Prefix: /user                 │
│                                                    │
│ STOMP Endpoints:                                   │
│ ├─ /ws-announcement ← Connection point             │
│ └─ /app/notify ← Send notifications               │
│                                                    │
│ Destinations:                                      │
│ ├─ /topic/notifications ← Broadcast all            │
│ ├─ /user/{userId}/queue/notifications ← Personal  │
│ ├─ /topic/messages/{conversationId} ← Group chat  │
│ └─ /topic/meetings/{meetingId} ← Meeting events   │
└────────────────────────────────────────────────────┘
                    │
                    │ (Persistent)
                    ▼
┌────────────────────────────────────────────────────┐
│        PostgreSQL - announcement_db                │
├────────────────────────────────────────────────────┤
│ Tables:                                             │
│ ├─ notifications                                   │
│ │  └─ id, userId, title, body, type, read,        │
│ │     createdAt, updatedAt                        │
│ │                                                  │
│ ├─ messages                                        │
│ │  └─ id, senderId, receiverId, content,          │
│ │     conversationId, timestamp, read             │
│ │                                                  │
│ └─ announcements                                   │
│    └─ id, title, body, targetAudience,            │
│       createdAt, expiresAt, priority              │
└────────────────────────────────────────────────────┘
                    │
                    │ (Kafka Events)
                    ▼
┌────────────────────────────────────────────────────┐
│           Apache Kafka (Message Broker)            │
├────────────────────────────────────────────────────┤
│ Topics:                                             │
│ ├─ notification-events                             │
│ ├─ user-events                                     │
│ ├─ course-events                                   │
│ └─ meeting-events                                  │
└────────────────────────────────────────────────────┘
```

### WebSocket Configuration

#### Configuration Spring (WebSocketConfig.java)
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple broker pour destinations /topic et /queue
        config.enableSimpleBroker("/topic", "/queue");
        
        // Préfixe pour messages client → serveur
        config.setApplicationDestinationPrefixes("/app");
        
        // Préfixe pour messages utilisateur-spécifiques
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Point de connexion WebSocket
        registry.addEndpoint("/ws-announcement")
                .setAllowedOriginPatterns("*");
    }
}
```

#### Points de Connexion (Endpoints)
| Endpoint | Type | Description |
|----------|------|-------------|
| `/ws-announcement` | WebSocket | Point d'entrée STOMP (raw WebSocket) |
| `/app/notify` | STOMP Send | Envoyer une notification |
| `/app/message/send` | STOMP Send | Envoyer un message |
| `/topic/notifications` | STOMP Subscribe | Recevoir toutes les notifications |
| `/user/{userId}/queue/notifications` | STOMP Subscribe | Notifications personnalisées |
| `/topic/messages/{conversationId}` | STOMP Subscribe | Messagerie de groupe |
| `/topic/meetings/{meetingId}` | STOMP Subscribe | Événements réunion |

### Types de Notifications

#### 1. **System Announcements** (Annonces Système)
- **Source** : Admins ou système automatique
- **Broadcast** : À tous les utilisateurs (ou groupe cible)
- **Destination WebSocket** : `/topic/notifications`
- **Types** : Maintenance, mise à jour, changement politique
- **Persistance** : Base de données + expiration

**Exemple Payload** :
```json
{
  "type": "SYSTEM_ANNOUNCEMENT",
  "title": "Maintenance planifiée",
  "body": "La plateforme sera en maintenance le 22/05 de 22h à 23h",
  "priority": "HIGH",
  "targetAudience": "ALL",
  "expiresAt": "2026-05-23T00:00:00"
}
```

#### 2. **Course Updates** (Mises à Jour de Cours)
- **Source** : Enseignants (création/modification de cours/quiz)
- **Broadcast** : Aux étudiants inscrits au module
- **Destination WebSocket** : `/user/{studentId}/queue/notifications`
- **Trigger** : Événement Kafka `course-events`
- **Persistance** : Base de données (7 jours)

**Exemple Payload** :
```json
{
  "type": "COURSE_UPDATE",
  "title": "Nouveau quiz disponible",
  "body": "Prof. Diop a publié le quiz 'Chapitres 1-3' dans Développement Web",
  "courseId": 123,
  "moduleName": "Développement Web",
  "relatedId": 456
}
```

#### 3. **Quiz Available** (Quiz Disponible)
- **Source** : Course Service
- **Broadcast** : Aux étudiants inscrits
- **Destination WebSocket** : `/user/{studentId}/queue/notifications`
- **Trigger** : `POST /api/courses/modules/{moduleId}/quizzes`
- **Persistance** : Base de données

**Exemple Payload** :
```json
{
  "type": "QUIZ_AVAILABLE",
  "title": "Quiz: Chapitres 1-3",
  "body": "Un nouveau quiz est disponible. Temps limite: 1h",
  "moduleId": 123,
  "quizId": 789,
  "deadlineAt": "2026-05-25T10:00:00"
}
```

#### 4. **Grade Posted** (Notes Publiées)
- **Source** : Course Service
- **Broadcast** : À l'étudiant concerné
- **Destination WebSocket** : `/user/{studentId}/queue/notifications`
- **Trigger** : Évaluation quiz complète + scoring IA
- **Persistance** : Base de données

**Exemple Payload** :
```json
{
  "type": "GRADE_POSTED",
  "title": "Note reçue: Quiz Chapitres 1-3",
  "body": "Vous avez obtenu 18/20 au quiz 'Chapitres 1-3'",
  "score": 18,
  "maxScore": 20,
  "quizId": 789,
  "feedback": "Excellente performance!"
}
```

#### 5. **Message Received** (Nouveau Message)
- **Source** : Messagerie (étudiant, enseignant)
- **Broadcast** : Au destinataire unique
- **Destination WebSocket** : `/user/{userId}/queue/notifications`
- **Persistance** : Base de données

**Exemple Payload** :
```json
{
  "type": "MESSAGE_RECEIVED",
  "title": "Nouveau message de Prof. DIOP",
  "body": "Pouvez-vous me remettre votre travail ce soir?",
  "senderId": "prof-diop",
  "senderName": "Médoune DIOP",
  "conversationId": 555,
  "messageId": 888
}
```

#### 6. **Meeting Started** (Réunion Lancée)
- **Source** : Meeting Service
- **Broadcast** : Aux participants inscrits
- **Destination WebSocket** : `/user/{studentId}/queue/notifications` + `/topic/meetings/{meetingId}`
- **Trigger** : `POST /api/meeting/meetings/{id}/start`
- **Persistance** : Base de données (archive)

**Exemple Payload** :
```json
{
  "type": "MEETING_STARTED",
  "title": "La classe commence!",
  "body": "Prof. DIOP a lancé la réunion 'TD Semaine 5' dans Développement Web",
  "meetingId": 111,
  "moduleId": 123,
  "moduleName": "Développement Web",
  "joinUrl": "https://livekit.example.com/meeting-111"
}
```

#### 7. **Mentoring Request** (Demande de Mentorat)
- **Source** : Étudiant (demande aide)
- **Broadcast** : Aux mentors/enseignants
- **Destination WebSocket** : `/user/{mentorId}/queue/notifications`
- **Persistance** : Base de données

**Exemple Payload** :
```json
{
  "type": "MENTORING_REQUEST",
  "title": "Demande de mentorat de Aya Seck",
  "body": "Aya Seck demande de l'aide pour le quiz 'Développement Web'",
  "studentId": "aya-seck",
  "moduleId": 123,
  "requestId": 222
}
```

### Flux de Notification (End-to-End)

#### Scénario: Enseignant publie un quiz

```
1. ENSEIGNANT
   POST /api/courses/modules/123/quizzes
   {
     "title": "Quiz Chapitres 1-3",
     "questions": [...]
   }
   ↓
   
2. COURSE SERVICE
   ✓ Crée quiz en DB
   ✓ Publie événement Kafka: course-events
   Event: {
     "type": "QUIZ_CREATED",
     "moduleId": 123,
     "quizId": 789,
     "timestamp": "2026-05-22T10:30:00"
   }
   ↓
   
3. ANNOUNCEMENT SERVICE (Kafka Listener)
   @KafkaListener(topic = "course-events")
   public void handleCourseEvent(String event) {
     if (event.type == "QUIZ_CREATED") {
       // Récupérer les étudiants inscrits au module
       List<Student> students = courseClient.getEnrolledStudents(moduleId);
       
       // Créer notifications individuelles
       for (Student student : students) {
         Notification notif = new Notification(
           userId: student.id,
           type: "QUIZ_AVAILABLE",
           title: "Quiz: Chapitres 1-3",
           body: "Un nouveau quiz est disponible",
           moduleId: 123,
           quizId: 789
         );
         notificationRepository.save(notif);
         
         // Push WebSocket en temps réel
         messagingTemplate.convertAndSendToUser(
           student.id,
           "/queue/notifications",
           notif
         );
       }
     }
   }
   ↓
   
4. FRONTEND/MOBILE (WebSocket Listener)
   stompClient.subscribe('/user/' + userId + '/queue/notifications', 
     (notification) => {
       console.log("Nouvelle notification:", notification);
       showToast("Quiz disponible!");
       updateNotificationBell();
     }
   );
   ↓
   
5. PERSISTANCE
   notification_db.notifications INSERT
   id: 1001
   userId: student-1
   type: QUIZ_AVAILABLE
   title: Quiz: Chapitres 1-3
   body: Un nouveau quiz est disponible
   read: false
   createdAt: 2026-05-22T10:30:15
```

### API Endpoints - Notifications

#### GET - Récupérer toutes les notifications
```http
GET /api/notifications/{userId}
Authorization: Bearer <JWT>

Response 200:
[
  {
    "id": 1001,
    "userId": "student-1",
    "type": "QUIZ_AVAILABLE",
    "title": "Quiz: Chapitres 1-3",
    "body": "Un nouveau quiz est disponible",
    "read": false,
    "createdAt": "2026-05-22T10:30:15"
  },
  ...
]
```

#### GET - Notifications non lues
```http
GET /api/notifications/{userId}/unread
Authorization: Bearer <JWT>

Response 200:
[
  {...},
  {...}
]
```

#### PATCH - Marquer comme lu
```http
PATCH /api/notifications/{notificationId}/read
Authorization: Bearer <JWT>

Response 200: ✓
```

#### PATCH - Marquer tout comme lu
```http
PATCH /api/notifications/{userId}/read-all
Authorization: Bearer <JWT>

Response 200: ✓
```

#### DELETE - Supprimer notification
```http
DELETE /api/notifications/{notificationId}
Authorization: Bearer <JWT>

Response 204: ✓
```

### Notification Service (NotificationServiceImpl.java)

```java
@Service
@AllArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    // Récupérer toutes les notifications d'un utilisateur (triées par date DESC)
    @Override
    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    // Récupérer les notifications non lues
    @Override
    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndReadFalse(userId);
    }
    
    // Envoyer une notification (DB + WebSocket)
    @Override
    public Notification sendNotification(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        
        // Push WebSocket en temps réel
        messagingTemplate.convertAndSendToUser(
            notification.getUserId(),
            "/queue/notifications",
            saved
        );
        
        return saved;
    }
    
    // Marquer une notification comme lue
    @Override
    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }
    
    // Marquer toutes comme lues
    @Override
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
    
    // Supprimer une notification
    @Override
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        notificationRepository.delete(notification);
    }
}
```

### Base de Données - Schema

#### Table: notifications
```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50) NOT NULL,  -- SYSTEM_ANNOUNCEMENT, COURSE_UPDATE, QUIZ_AVAILABLE, etc.
    related_id BIGINT,           -- quizId, meetingId, etc.
    module_id BIGINT,            -- module concerné
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,        -- pour annonces temporaires
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (user_id, read),
    INDEX (user_id, created_at DESC)
);
```

#### Table: messages
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id VARCHAR(255) NOT NULL,
    receiver_id VARCHAR(255) NOT NULL,
    conversation_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    INDEX (conversation_id),
    INDEX (receiver_id, read)
);
```

### Performance & Optimisations

#### 1. **Caching**
```java
@EnableCaching
public class CacheConfig {
    
    // Cache notifications non lues (2 min)
    @Cacheable(value = "unreadNotifications", key = "#userId")
    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndReadFalse(userId);
    }
    
    // Invalidate après marquer comme lu
    @CacheEvict(value = "unreadNotifications", key = "#userId")
    public void invalidateCache(String userId) {}
}
```

#### 2. **Batch Processing**
```java
// Marquer 1000+ notifications comme lues
@Modifying
@Query("UPDATE Notification n SET n.read = true WHERE n.userId = ?1 AND n.read = false")
void markAllAsReadBatch(String userId);
```

#### 3. **Connection Pooling**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
```

---

## 2. 🎥 SYSTÈME DE MEETINGS (VISIOCONFÉRENCE)

### Vue d'Ensemble
Le système de meetings intègre **LiveKit** (WebRTC) pour la visioconférence en temps réel avec gestion de salles, participants et broadcasting via WebSocket.

### Architecture

```
┌────────────────────────────────────────────────────┐
│       Frontend/Mobile Client                       │
│   (React LiveKit Components / Flutter)             │
└────────────────────────────────────────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
   HTTP/REST   WebSocket      WebRTC
   (signaling) (real-time)   (media)
      │             │             │
      └─────────────┼─────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│   Meeting Service (Port 8087)                      │
├────────────────────────────────────────────────────┤
│ Controllers:                                        │
│ ├─ POST /api/meeting/modules/{moduleId}/meetings  │
│ │  └─ Create meeting                               │
│ │                                                  │
│ ├─ POST /api/meeting/meetings/{id}/join            │
│ │  └─ Join meeting + generate LiveKit token       │
│ │                                                  │
│ ├─ POST /api/meeting/meetings/{id}/end             │
│ │  └─ End meeting                                  │
│ │                                                  │
│ └─ GET /api/meeting/meetings/{id}/participants    │
│    └─ List participants                            │
│                                                    │
│ Services:                                           │
│ └─ MeetingService                                  │
│    ├─ createMeeting()                              │
│    ├─ generateToken() [LiveKit JWT]               │
│    ├─ joinMeeting()                                │
│    ├─ endMeeting()                                 │
│    └─ getMeetingParticipants()                     │
└────────────────────────────────────────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
   DB (Meeting)  WebSocket  LiveKit Server
   (metadata)    (broadcast) (WebRTC)
      │             │             │
      ▼             ▼             ▼
PostgreSQL    SockJS/STOMP   livekit-server
meeting_db    /topic/meetings (WSS)
              /{meetingId}
```

### LiveKit Integration

#### Configuration (application.yml)
```yaml
livekit:
  api-key: ${LIVEKIT_API_KEY:devkey}
  api-secret: ${LIVEKIT_API_SECRET:devsecret123456789012345678901234567890}
  server-url: ws://livekit:7880
  public-url: ${LIVEKIT_PUBLIC_URL:wss://lms-ept.duckdns.org:7443}
```

#### Token Generation (JWT)
```java
// Service génère un JWT pour accès LiveKit
public String generateToken(String roomName, String userId, 
                           String role, String firstName, 
                           String lastName, String fullName) {
    
    // Configuration LiveKit
    AccessToken token = new AccessToken(
        apiKey, 
        apiSecret
    );
    
    token.addGrant(new VideoGrant()
        .canPublish(true)
        .canPublishData(true)
        .canSubscribe(true)
        .room(roomName)  // ex: "module-123-class-1"
    );
    
    token.identity = userId;
    token.name = fullName;
    token.metadata = {
        "role": role,           // "LECTURER" or "STUDENT"
        "firstName": firstName,
        "lastName": lastName,
        "joinedAt": System.currentTimeMillis()
    };
    
    return token.toJwt();
}
```

### Meeting Lifecycle

#### 1. **Création de Réunion**

```
ENSEIGNANT
POST /api/meeting/modules/123/meetings
{
  "title": "TD Semaine 5 - Développement Web",
  "description": "Exercices pratiques sur les microservices"
}
│
▼
MEETING SERVICE
meeting = new Meeting(
  moduleId: 123,
  creatorId: "prof-diop",
  title: "TD Semaine 5",
  status: "SCHEDULED",
  roomName: "module-123-meeting-" + System.nanoTime(),
  createdAt: NOW
);
meetingRepository.save(meeting);
│
▼
DB: meetings table INSERT
id: 1, moduleId: 123, roomName: "module-123-meeting-1234567890",
status: "SCHEDULED", createdAt: "2026-05-22T10:00:00"
│
▼
BROADCAST WEBSOCKET (à tous les étudiants du module)
/topic/meetings/123
{
  "type": "MEETING_CREATED",
  "meetingId": 1,
  "title": "TD Semaine 5 - Développement Web",
  "status": "SCHEDULED",
  "scheduledAt": "2026-05-22T10:00:00"
}
```

#### 2. **Rejoindre Réunion**

```
ÉTUDIANT
POST /api/meeting/meetings/1/join
{
  "role": "STUDENT"
}
│
▼
MEETING SERVICE
// 1. Vérifier statut réunion
Meeting meeting = meetingRepository.findById(1);
if (meeting.status != "ACTIVE") {
  throw error "Réunion non active";
}

// 2. Générer LiveKit JWT Token
String livekitToken = generateToken(
  meeting.roomName,      // "module-123-meeting-1234567890"
  userId,                 // "aya-seck"
  "STUDENT",
  "Aya",
  "Seck",
  "Aya Seck"
);

// 3. Enregistrer participant
MeetingParticipant participant = new MeetingParticipant(
  meetingId: 1,
  userId: "aya-seck",
  role: "STUDENT",
  joinedAt: NOW,
  status: "CONNECTED"
);
participantRepository.save(participant);

// 4. Retourner réponse avec token
return {
  "token": livekitToken,
  "livekitUrl": "wss://lms-ept.duckdns.org:7443",
  "participant": participant
}
│
▼
FRONTEND
// Utiliser token pour connexion LiveKit
const room = new Room({
  audio: true,
  video: { resolution: { width: 640, height: 480 } },
  publishDefaults: {
    videoCodec: "h264",
    simulcast: false
  }
});

// Connecter au serveur LiveKit
await room.connect(
  livekitUrl,
  token  // JWT généré par backend
);

// Afficher vidéo locale
const videoElement = document.getElementById('local-video');
room.localParticipant.videoTrackPublications.forEach(trackPub => {
  videoElement.appendChild(trackPub.videoTrack.attach());
});

// Afficher vidéos distantes
room.on('participantConnected', (participant) => {
  // Ajouter participant à l'écran
});
│
▼
LIVESTREAM WEBSOCKET (tous participants)
/topic/meetings/1
{
  "type": "PARTICIPANT_JOINED",
  "participantId": "aya-seck",
  "participantName": "Aya Seck",
  "role": "STUDENT",
  "joinedAt": "2026-05-22T10:05:30",
  "totalParticipants": 25
}
```

#### 3. **Fin de Réunion**

```
ENSEIGNANT
POST /api/meeting/meetings/1/end
│
▼
MEETING SERVICE
meeting = meetingRepository.findById(1);
meeting.status = "ENDED";
meeting.endedAt = NOW;
meetingRepository.save(meeting);

// Déconnecter tous les participants
List<MeetingParticipant> participants = 
  participantRepository.findByMeetingId(1);
participants.forEach(p -> {
  p.status = "DISCONNECTED";
  p.leftAt = NOW;
});
participantRepository.saveAll(participants);
│
▼
BROADCAST WEBSOCKET
/topic/meetings/1
{
  "type": "MEETING_ENDED",
  "meetingId": 1,
  "endedAt": "2026-05-22T11:00:00",
  "totalParticipants": 25,
  "durationMinutes": 60
}
│
▼
KAFKA EVENT (notification + archive)
Topic: meeting-events
Event: {
  "type": "MEETING_ENDED",
  "meetingId": 1,
  "moduleId": 123,
  "duration": 3600,  // secondes
  "participants": 25,
  "recordingUrl": "https://storage.example.com/meeting-1.mp4"
}
```

### MeetingController.java

```java
@RestController
@RequestMapping("/api/meeting")
public class MeetingController {
    
    private final MeetingService meetingService;
    
    // Créer réunion
    @PostMapping("/modules/{moduleId}/meetings")
    public ResponseEntity<Meeting> createMeeting(
            @PathVariable Long moduleId,
            @RequestBody CreateMeetingRequest request,
            @RequestHeader("loggedInUser") String username) {
        
        Meeting meeting = meetingService.createMeeting(
            moduleId, 
            username, 
            request.getTitle(), 
            request.getDescription()
        );
        return ResponseEntity.ok(meeting);
    }
    
    // Récupérer réunions du module
    @GetMapping("/modules/{moduleId}/meetings")
    public ResponseEntity<List<Meeting>> getModuleMeetings(
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(meetingService.getModuleMeetings(moduleId));
    }
    
    // Réunions actives du module
    @GetMapping("/modules/{moduleId}/meetings/active")
    public ResponseEntity<List<Meeting>> getActiveModuleMeetings(
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(meetingService.getActiveModuleMeetings(moduleId));
    }
    
    // Rejoindre réunion (génère LiveKit token)
    @PostMapping("/meetings/{id}/join")
    public ResponseEntity<?> joinMeeting(
            @PathVariable Long id,
            @RequestBody JoinMeetingRequest request,
            @RequestHeader("loggedInUser") String username,
            @RequestHeader(value = "loggedInUserFirstName", required = false) String firstName,
            @RequestHeader(value = "loggedInUserLastName", required = false) String lastName) {
        
        // Vérifier statut
        Meeting meeting = meetingService.getMeetingById(id);
        if (!"ACTIVE".equals(meeting.getStatus())) {
            return ResponseEntity.badRequest()
                .body("Cette réunion n'est pas active.");
        }
        
        // Générer token LiveKit
        String token = meetingService.generateToken(
            meeting.getRoomName(), 
            username, 
            request.getRole(), 
            firstName, 
            lastName
        );
        
        // Enregistrer participant
        MeetingParticipant participant = meetingService.joinMeeting(
            id, 
            username, 
            request.getRole()
        );
        
        // Retourner réponse
        return ResponseEntity.ok(new JoinMeetingResponse(
            token, 
            meetingService.getLivekitUrl(), 
            participant
        ));
    }
    
    // Terminer réunion
    @PostMapping("/meetings/{id}/end")
    public ResponseEntity<Void> endMeeting(
            @PathVariable Long id,
            @RequestHeader("loggedInUser") String username) {
        meetingService.endMeeting(id);
        return ResponseEntity.ok().build();
    }
    
    // Lister participants
    @GetMapping("/meetings/{id}/participants")
    public ResponseEntity<List<MeetingParticipant>> getMeetingParticipants(
            @PathVariable Long id) {
        return ResponseEntity.ok(meetingService.getMeetingParticipants(id));
    }
}
```

### Base de Données - Schema

#### Table: meetings
```sql
CREATE TABLE meetings (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL,
    creator_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    room_name VARCHAR(255) UNIQUE NOT NULL,  -- Identifiant unique LiveKit
    status VARCHAR(20) DEFAULT 'SCHEDULED',   -- SCHEDULED, ACTIVE, ENDED
    recording_url VARCHAR(500),               -- URL vidéo si recording activé
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    FOREIGN KEY (module_id) REFERENCES modules(id),
    INDEX (module_id),
    INDEX (status)
);
```

#### Table: meeting_participants
```sql
CREATE TABLE meeting_participants (
    id BIGSERIAL PRIMARY KEY,
    meeting_id BIGINT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(20),  -- LECTURER, STUDENT, GUEST
    status VARCHAR(20),  -- CONNECTED, DISCONNECTED, IDLE
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    
    FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (meeting_id),
    UNIQUE (meeting_id, user_id)
);
```

---

## 3. 🤖 SYSTÈME IA (INTELLIGENCE ARTIFICIELLE)

### Vue d'Ensemble
Le système IA utilise une architecture **Provider-based** avec **multiple LLM providers** (Groq, Ollama, Gemini) et intègre **RAG (Retrieval Augmented Generation)** pour chatbot contextuel.

### Architecture IA

```
┌────────────────────────────────────────────────────┐
│    Frontend/Mobile Requests                        │
│  POST /api/ai/chatbot/ask                          │
│  POST /api/ai/chatbot/generate-quiz                │
│  POST /api/ai/chatbot/generate-template            │
│  POST /api/ai/chatbot/evaluate-answer              │
└────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────┐
│    AI Service (Port 8085)                          │
│  ChatbotController                                  │
│  AdaptiveController                                │
│  RemediationController                             │
│  ProctoringController                              │
└────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   AiService   KnowledgeBase  VectorStore
   (Orchestration)  Service  (pgvector)
        │           │           │
        │           ▼           │
        │      TextExtraction   │
        │      (PDF/DOC/VIDEO)  │
        │                       │
        └───────────┼───────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
        ▼           ▼           ▼              ▼
    GroqProvider OllamaProvider GeminiProvider CerebrasProvider
    (Fast LLM)  (Local LLM)   (Embeddings)   (Backup LLM)
        │           │           │              │
        └───────────┼───────────┴──────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │  PostgreSQL + pgvector    │
        │  ai_db                    │
        │  ├─ vector_embeddings     │
        │  ├─ knowledge_base        │
        │  └─ chat_history          │
        └───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   Kafka Events            │
        │  ai-generation-events     │
        │  ai-evaluation-events     │
        └───────────────────────────┘
```

### Provider Pattern (AiProvider.java)

```java
// Interface abstraite pour tous les LLM providers
public interface AiProvider {
    String generateContent(String prompt) throws AiProviderException;
    boolean isConfigured();
}

// Implementation Groq (Priorité 1 - Rapide & Gratuit)
@Component
public class GroqProvider implements AiProvider {
    
    private static final String GROQ_API_URL = 
        "https://api.groq.com/openai/v1/chat/completions";
    
    @Value("${groq.api-key}")
    private String apiKey;
    
    @Override
    public String generateContent(String prompt) throws AiProviderException {
        try {
            HttpClient client = HttpClient.newHttpClient();
            
            // Construire requête
            String requestBody = """
                {
                  "model": "mixtral-8x7b-32768",
                  "messages": [{"role": "user", "content": "%s"}],
                  "temperature": 0.7,
                  "max_tokens": 1024
                }
                """.formatted(prompt);
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
            
            // Envoyer et recevoir
            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() != 200) {
                throw new AiProviderException("Groq API error: " + response.body());
            }
            
            // Parser JSON pour extraire contenu
            JsonNode json = new ObjectMapper().readTree(response.body());
            return json.at("/choices/0/message/content").asText();
            
        } catch (Exception e) {
            throw new AiProviderException("Groq generation failed: " + e.getMessage());
        }
    }
    
    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}

// Implementation Ollama (Fallback local)
@Component
public class OllamaProvider implements AiProvider {
    
    private static final String OLLAMA_URL = 
        "http://localhost:11434/api/generate";
    
    @Override
    public String generateContent(String prompt) throws AiProviderException {
        // Similaire à Groq mais appelle serveur Ollama local
        // Modèle: "mistral", "llama2", etc.
    }
    
    @Override
    public boolean isConfigured() {
        // Vérifier si Ollama est accessible
        try {
            HttpClient.newHttpClient()
                .send(HttpRequest.newBuilder()
                    .uri(URI.create(OLLAMA_URL))
                    .GET()
                    .build(), 
                HttpResponse.BodyHandlers.ofString());
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

// Service orchestrateur
@Service
@Slf4j
public class AiService {
    
    private final GroqProvider groqProvider;
    private final OllamaProvider ollamaProvider;
    
    public String generateContent(String prompt) {
        StringBuilder errorLog = new StringBuilder();
        
        // 1. Essayer Groq (priorité 1)
        if (groqProvider.isConfigured()) {
            try {
                log.info("🚀 Groq: Génération en cours...");
                return groqProvider.generateContent(prompt);
            } catch (AiProviderException e) {
                errorLog.append("Groq: ").append(e.getMessage()).append(" | ");
                log.error("❌ Groq échoué: {}", e.getMessage());
            }
        } else {
            errorLog.append("Groq non configuré | ");
        }
        
        // 2. Fallback sur Ollama (local)
        if (ollamaProvider.isConfigured()) {
            try {
                log.info("🔄 Ollama: Fallback...");
                return ollamaProvider.generateContent(prompt);
            } catch (AiProviderException e) {
                errorLog.append("Ollama: ").append(e.getMessage()).append(" | ");
                log.error("❌ Ollama échoué: {}", e.getMessage());
            }
        } else {
            errorLog.append("Ollama non disponible | ");
        }
        
        // 3. Erreur totale
        return "❌ Services IA indisponibles. Erreurs: " + errorLog.toString();
    }
}
```

### Chatbot - RAG (Retrieval Augmented Generation)

#### Flux Chatbot Contextualisé

```
ÉTUDIANT
POST /api/ai/chatbot/ask
{
  "moduleId": 123,
  "prompt": "Comment les microservices communiquent-ils?"
}
│
▼
CHATBOT CONTROLLER (ChatbotController.java)
1. Fetch module info (si moduleId fourni)
   moduleInfo = courseClient.getModuleById(123);
   
   → Module: Développement Web
   → Description: Architectures modernes Web

2. RECHERCHE VECTORIELLE (RAG)
   similarDocs = vectorStore.similaritySearch(
     query: "Comment les microservices communiquent-ils?",
     topK: 5,
     filterExpression: "moduleId == 123"
   );
   
   → Résultats:
   [
     "Chapitre 5: Communication entre microservices",
     "Les microservices utilisent REST et gRPC...",
     "Pattern: API Gateway et Service Mesh...",
     ...
   ]

3. CONSTRUCTION CONTEXTE
   systemPrompt = """
     Tu es l'Assistant IA de l'EPT, un tuteur pédagogique expert.
     
     RÈGLES:
     1. PRIORITÉ AUX DOCUMENTS: Base tes explications sur les supports de cours
     2. CITATION: Mentionne la source ("Selon votre support...")
     3. TRANSPARENCE: Si pas d'info dans docs, utilise ta culture générale
     4. STYLE: Professionnel, encourageant, Markdown
     5. LANGUE: Français
     
     MODULE ACTIF: Développement Web
     
     --- EXTRAITS DES SUPPORTS DE COURS ---
     [Source] Chapitre 5: Communication entre microservices...
     [Source] Les microservices utilisent REST et gRPC...
     [Source] Pattern: API Gateway et Service Mesh...
   """;
   
   fullPrompt = systemPrompt + "\nQUESTION: " + originalPrompt;

4. GÉNÉRATION IA
   response = aiService.generateContent(fullPrompt);
   
   → Groq génère:
   "Les microservices communiquent principalement via :
    1. **REST API**: Synchrone, simplement
    2. **gRPC**: Performant pour haute latence
    3. **Message Queues**: Asynchrone (Kafka)
    
    Selon votre support de cours, l'API Gateway centralise
    ces interactions pour simplifier le routing..."

5. RÉPONSE AU CLIENT
   return ResponseEntity.ok(response);
```

#### Implémentation Chatbot

```java
@RestController
@RequestMapping("/api/ai/chatbot")
@RequiredArgsConstructor
public class ChatbotController {
    
    private final AiService aiService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final VectorStore vectorStore;
    private final CourseClient courseClient;
    
    @PostMapping("/ask")
    public ResponseEntity<String> askQuestion(@RequestBody ChatRequest request) {
        StringBuilder contextBuilder = new StringBuilder();
        boolean hasCourseContext = false;
        String moduleName = null;
        String moduleDescription = null;
        
        // 1. Récupérer infos module si moduleId fourni
        if (request.getModuleId() != null) {
            try {
                var moduleInfo = courseClient.getModuleById(request.getModuleId());
                if (moduleInfo != null) {
                    moduleName = moduleInfo.getName();
                    moduleDescription = moduleInfo.getDescription();
                }
            } catch (Exception e) {
                // Continuer sans infos module
            }
            
            // 2. RECHERCHE VECTORIELLE (RAG)
            List<Document> similarDocuments = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query(request.getPrompt())
                    .topK(5)  // Top 5 documents similaires
                    .filterExpression("moduleId == '" + request.getModuleId() + "'")
                    .build()
            );
            
            if (!similarDocuments.isEmpty()) {
                hasCourseContext = true;
                contextBuilder.append("--- EXTRAITS DES SUPPORTS DE COURS ---\n");
                similarDocuments.forEach(doc -> 
                    contextBuilder.append("[Source] ")
                        .append(doc.getText())
                        .append("\n\n")
                );
            }
        }
        
        // 3. CONSTRUCTION PROMPT SYSTÈME
        String systemPrompt = """
            Tu es l'Assistant IA de l'EPT (École Polytechnique de Thiès), 
            un tuteur pédagogique expert, bienveillant et précis.
            
            TES RÈGLES DE RÉPONSE :
            1. PRIORITÉ AUX DOCUMENTS: Si contexte fourni, base tes explications PRIORITAIREMENT
            2. CITATION: Mentionne quand tu utilises les supports ("Selon votre support...")
            3. TRANSPARENCE: Si question non traitée dans docs, réponds avec ta culture générale
            4. STYLE: Professionnel, encourageant, structure avec Markdown (gras, listes, code)
            5. LANGUE: Toujours français
            """;
        
        if (moduleName != null) {
            systemPrompt += "\nMODULE ACTIF : " + moduleName;
            if (moduleDescription != null) {
                systemPrompt += " — " + moduleDescription;
            }
            systemPrompt += "\nL'étudiant est en mode Focus sur ce module.\n\n";
        }
        
        if (hasCourseContext) {
            systemPrompt += contextBuilder.toString();
        } else if (request.getModuleId() != null) {
            systemPrompt += "NOTE: Aucun document de cours indexé. Utilise connaissances générales.\n";
        }
        
        // 4. GÉNÉRATION IA
        String fullPrompt = systemPrompt + "\nQUESTION DE L'ÉTUDIANT :\n" + request.getPrompt();
        String response = aiService.generateContent(fullPrompt);
        
        return ResponseEntity.ok(response);
    }
}
```

### Génération de Quiz par IA

#### Flux: Génération Quiz Automatique

```
ENSEIGNANT
POST /api/ai/chatbot/generate-quiz
{
  "moduleId": 123,
  "context": "Générez 5 questions sur les 3 premiers chapitres"
}
│
▼
CHATBOT CONTROLLER
1. Récupérer infos module
   moduleInfo = courseClient.getModuleById(123);
   
2. RECHERCHE RAG (contexte du cours)
   docs = vectorStore.similaritySearch(
     query: "quiz questions Développement Web",
     topK: 2,
     filterExpression: "moduleId == 123"
   );
   
   → Documents: chapitre1.pdf, chapitre2.pdf, chapitre3.pdf

3. CONSTRUCTION PROMPT
   prompt = """
     Tu es expert pédagogique en "Développement Web".
     En te basant sur le contenu suivant:
     
     [CONTENU COURS - 1500 caractères max]
     Chapitre 1: Architecture...
     Chapitre 2: REST API...
     Chapitre 3: Microservices...
     
     INSTRUCTIONS: Générez 5 questions variées et pertinentes.
     
     FORMAT JSON STRICTE:
     {
       "title": "Quiz Chapitres 1-3",
       "description": "...",
       "questions": [
         {
           "text": "...",
           "type": "SINGLE_CHOICE",
           "points": 2,
           "options": [
             {"text": "...", "correct": true},
             {"text": "...", "correct": false}
           ]
         }
       ]
     }
   """;

4. GÉNÉRATION IA
   response = aiService.generateContent(prompt);
   
   → Groq retourne:
   {
     "title": "Quiz Chapitres 1-3",
     "description": "Évaluez votre compréhension des architectures web",
     "questions": [
       {
         "text": "Qu'est-ce qu'une architecture microservices?",
         "type": "SINGLE_CHOICE",
         "points": 2,
         "options": [
           {"text": "Approche modulaire avec services indépendants", "correct": true},
           {"text": "Unique monolithe centraliser", "correct": false}
         ]
       }
     ]
   }

5. PARSING JSON
   jsonStart = response.indexOf("{");
   jsonEnd = response.lastIndexOf("}");
   cleanJson = response.substring(jsonStart, jsonEnd + 1);
   
   quizData = objectMapper.readValue(cleanJson, QuizDTO.class);

6. PERSISTENCE
   quiz = quizService.saveGeneratedQuiz(123, quizData);

7. NOTIFICATION WEBSOCKET
   messagingTemplate.convertAndSendToUser(
     studentId,
     "/queue/notifications",
     new NotificationDTO(
       type: "QUIZ_AVAILABLE",
       title: quizData.getTitle(),
       moduleId: 123
     )
   );

8. KAFKA EVENT
   kafkaTemplate.send("course-events",
     new QuizGeneratedEvent(quizId, moduleId, "GENERATED_BY_AI")
   );
```

### Évaluation de Réponses par IA

```
ÉTUDIANT
POST /api/ai/chatbot/evaluate-answer
{
  "question": "Expliquezla différence entre REST et gRPC",
  "expectedAnswer": "REST utilise HTTP synchrone, gRPC utilise HTTP/2 asynchrone",
  "studentAnswer": "REST c'est pour API web, gRPC pour microservices",
  "maxPoints": 5
}
│
▼
CHATBOT CONTROLLER
prompt = """
  Tu es professeur strict et juste évaluant réponse étudiant.
  
  Question: "Expliquez la différence entre REST et gRPC"
  Corrigé attendu: "REST utilise HTTP synchrone, gRPC utilise HTTP/2 asynchrone"
  Réponse étudiant: "REST c'est pour API web, gRPC pour microservices"
  Note max: 5
  
  Assigne note 0-5 (demi-points autorisés).
  
  RÉPONDRE UNIQUEMENT AVEC JSON VALIDE:
  {
    "scoreAwarded": <nombre>,
    "feedback": "<texte court 1-2 phrases>"
  }
""";

response = aiService.generateContent(prompt);

│
▼
PARSING ET VALIDATION
// Groq retourne
{
  "scoreAwarded": 3.5,
  "feedback": "Bonne compréhension des cas d'usage. Manque détail technique sur HTTP/2."
}

// Validation
if (scoreAwarded < 0) scoreAwarded = 0;
if (scoreAwarded > maxPoints) scoreAwarded = maxPoints;

│
▼
RESPONSE
return ResponseEntity.ok(evaluation);
```

### Knowledge Base Service

```java
@Service
public class KnowledgeBaseService {
    
    private final VectorStore vectorStore;
    private final CourseClient courseClient;
    private final TextExtractionService textExtractionService;
    
    // Indexer document (PDF/DOC/VIDEO transcript)
    public void indexMaterial(Long materialId, String moduleId, String fileUrl) {
        try {
            // 1. Télécharger fichier
            byte[] fileContent = downloadFile(fileUrl);
            
            // 2. Extraire texte (PDF, Doc, etc.)
            String extractedText = textExtractionService.extractText(
                fileContent, 
                fileUrl
            );
            
            // 3. Découper en chunks (512 tokens max)
            List<String> chunks = chunkText(extractedText, 512);
            
            // 4. Générer embeddings vectoriels (Gemini)
            for (String chunk : chunks) {
                float[] embedding = geminiProvider.generateEmbedding(chunk);
                
                // 5. Indexer dans pgvector
                Document doc = new Document(
                    text: chunk,
                    metadata: {
                        "materialId": materialId,
                        "moduleId": moduleId,
                        "source": fileUrl,
                        "indexedAt": System.currentTimeMillis()
                    }
                );
                
                vectorStore.add(doc, embedding);
            }
            
        } catch (Exception e) {
            log.error("Indexing failed for material {}: {}", materialId, e.getMessage());
        }
    }
    
    // Recherche vectorielle (RAG)
    public List<Document> searchSimilar(String query, Long moduleId, int topK) {
        // 1. Générer embedding de la requête
        float[] queryEmbedding = geminiProvider.generateEmbedding(query);
        
        // 2. Recherche similarité cosinus dans pgvector
        return vectorStore.similaritySearch(
            SearchRequest.builder()
                .query(query)
                .topK(topK)
                .filterExpression("moduleId == '" + moduleId + "'")
                .build()
        );
    }
}
```

### Configuration LLM (application.yml)

```yaml
groq:
  api-key: ${GROQ_API_KEY}
  model: mixtral-8x7b-32768
  timeout-seconds: 30
  temperature: 0.7
  max-tokens: 1024

gemini:
  api-key: ${GEMINI_API_KEY}
  model: text-embedding-004
  timeout-seconds: 10

ollama:
  base-url: http://localhost:11434
  model: mistral
  temperature: 0.7

vector-store:
  provider: pgvector
  similarity-metric: cosine  # ou euclidean
```

---

## 4. 🎯 SYSTÈME DE RECOMMANDATIONS

### Vue d'Ensemble
Le système de recommandations analyse l'activité d'apprentissage des étudiants et recommande ressources/parcours personnalisés via machine learning.

### Approche: Collaborative Filtering + Content-Based

```
┌─────────────────────────────────────┐
│  ÉTUDIANT                           │
│  - Consulte cours                   │
│  - Passe quiz                       │
│  - Pose questions IA                │
│  - Participe forum                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  KAFKA EVENTS (async)               │
│  - course-viewed                    │
│  - quiz-completed                   │
│  - message-sent                     │
│  - forum-post-created               │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  RECOMMENDATION ENGINE              │
│  1. Ingestion événements            │
│  2. Feature engineering             │
│  3. Similarity computation          │
│  4. Ranking & filtering             │
│  5. Persistence                     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  PostgreSQL                         │
│  - user_learning_profile            │
│  - content_similarity_matrix        │
│  - recommendations                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  FRONTEND (Dashboard)               │
│  "Ressources recommandées pour vous"│
│  - Quiz: "Chapitres 4-6"            │
│  - Document: "Introduction gRPC"    │
│  - Discussion: "Débat microservices"│
└─────────────────────────────────────┘
```

### Learning Profile

```java
// Profil d'apprentissage de chaque étudiant
@Entity
public class UserLearningProfile {
    
    @Id
    private String userId;
    
    // Scores par domaine
    private Map<String, Float> subjectScores;  // {math: 0.8, programming: 0.65}
    
    // Préférences format
    private Map<String, Integer> contentTypePreference;  
    // {video: 10, pdf: 5, quiz: 8}
    
    // Difficulty level préféré
    private String preferredDifficultyLevel;  // BEGINNER, INTERMEDIATE, ADVANCED
    
    // Temps d'apprentissage moyen
    private Integer avgLearningTimeMinutes;
    
    // Modules complétés
    private List<Long> completedModules;
    
    // Topics d'intérêt
    private List<String> topicsOfInterest;
    
    // Dernière activité
    private LocalDateTime lastActivityAt;
    
    // Score engagement (0-100)
    private Float engagementScore;
}
```

### Algorithme de Recommandation

#### 1. Content-Based (Similarité Contenu)
```java
// Recommander contenu similaire à ce que l'étudiant aime
public List<Content> getContentBasedRecommendations(String userId, int topK) {
    // 1. Récupérer profil utilisateur
    UserLearningProfile profile = getProfile(userId);
    
    // 2. Identifier contenus consultés
    List<Content> viewedContent = userActivityService.getViewedContent(userId);
    
    // 3. Calculer similarité (tags, subject, difficulty)
    List<Content> allContent = contentService.getAllContent();
    Map<Long, Float> contentSimilarityScores = new HashMap<>();
    
    for (Content viewed : viewedContent) {
        for (Content candidate : allContent) {
            if (!candidate.equals(viewed)) {
                float similarity = calculateCosineSimilarity(viewed, candidate);
                contentSimilarityScores.put(
                    candidate.getId(), 
                    contentSimilarityScores.getOrDefault(candidate.getId(), 0f) + similarity
                );
            }
        }
    }
    
    // 4. Classer et retourner top-K
    return contentSimilarityScores.entrySet().stream()
        .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
        .limit(topK)
        .map(e -> contentService.getContent(e.getKey()))
        .collect(Collectors.toList());
}

private float calculateCosineSimilarity(Content content1, Content content2) {
    // Vectorize content (tags, description embeddings, etc.)
    float[] vec1 = contentToVector(content1);
    float[] vec2 = contentToVector(content2);
    
    // Cosine similarity
    return dotProduct(vec1, vec2) / 
           (norm(vec1) * norm(vec2));
}
```

#### 2. Collaborative Filtering (Similarité Utilisateurs)
```java
// Recommander contenu aimé par utilisateurs similaires
public List<Content> getCollaborativeRecommendations(String userId, int topK) {
    // 1. Trouver utilisateurs similaires
    List<String> similarUsers = findSimilarUsers(userId, 10);
    
    // 2. Identifier contenu populaire chez ces utilisateurs
    Map<Long, Float> contentScores = new HashMap<>();
    
    for (String similarUser : similarUsers) {
        List<UserActivity> activities = userActivityService.getActivities(similarUser);
        
        activities.forEach(activity -> {
            if (activity.getType().equals("CONTENT_COMPLETED")) {
                Long contentId = activity.getContentId();
                float rating = activity.getRating();  // ou inférer de completion_time
                
                contentScores.put(
                    contentId,
                    contentScores.getOrDefault(contentId, 0f) + rating
                );
            }
        });
    }
    
    // 3. Exclure contenus déjà vus par l'étudiant
    Set<Long> viewedContentIds = userActivityService
        .getViewedContent(userId)
        .stream()
        .map(Content::getId)
        .collect(Collectors.toSet());
    
    // 4. Retourner top-K
    return contentScores.entrySet().stream()
        .filter(e -> !viewedContentIds.contains(e.getKey()))
        .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
        .limit(topK)
        .map(e -> contentService.getContent(e.getKey()))
        .collect(Collectors.toList());
}

private List<String> findSimilarUsers(String userId, int topK) {
    // Calculer similarité utilisateurs basée sur:
    // - Scores similaires
    // - Modules suivis similaires
    // - Patterns d'apprentissage similaires
    
    List<UserLearningProfile> allProfiles = profileService.getAllProfiles();
    
    return allProfiles.stream()
        .filter(p -> !p.getUserId().equals(userId))
        .map(p -> new AbstractMap.SimpleEntry<>(p.getUserId(), 
            calculateUserSimilarity(getProfile(userId), p)))
        .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
        .limit(topK)
        .map(Map.Entry::getKey)
        .collect(Collectors.toList());
}
```

#### 3. Hybrid Approach (Combinaison)
```java
public List<Content> getHybridRecommendations(String userId, int topK) {
    // 1. Content-based (60% poids)
    List<Content> contentBased = getContentBasedRecommendations(userId, topK * 2);
    Map<Long, Float> contentScores = new HashMap<>();
    
    for (int i = 0; i < contentBased.size(); i++) {
        float score = (float)(i + 1) / contentBased.size() * 0.6;
        contentScores.put(contentBased.get(i).getId(), score);
    }
    
    // 2. Collaborative filtering (40% poids)
    List<Content> collaborative = getCollaborativeRecommendations(userId, topK * 2);
    
    for (int i = 0; i < collaborative.size(); i++) {
        float score = (float)(i + 1) / collaborative.size() * 0.4;
        contentScores.merge(
            collaborative.get(i).getId(), 
            score, 
            Float::sum
        );
    }
    
    // 3. Classer et retourner
    return contentScores.entrySet().stream()
        .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
        .limit(topK)
        .map(e -> contentService.getContent(e.getKey()))
        .collect(Collectors.toList());
}
```

### Recommendation Service Controller

```java
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {
    
    private final RecommendationService recommendationService;
    private final UserLearningProfileService profileService;
    
    // Récupérer recommandations personnalisées
    @GetMapping("/for-student/{userId}")
    public ResponseEntity<List<RecommendationDTO>> getRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Content> recommendations = recommendationService.getHybridRecommendations(
            userId, 
            limit
        );
        
        List<RecommendationDTO> dtos = recommendations.stream()
            .map(content -> RecommendationDTO.builder()
                .contentId(content.getId())
                .title(content.getTitle())
                .description(content.getDescription())
                .type(content.getType())
                .reason("Recommandé basé sur vos intérêts et votre progression")
                .relevanceScore(content.getRelevanceScore())
                .build())
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    // Obtenir profil apprentissage
    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserLearningProfileDTO> getUserProfile(
            @PathVariable String userId) {
        
        UserLearningProfile profile = profileService.getProfile(userId);
        
        return ResponseEntity.ok(mapToDTO(profile));
    }
    
    // Update profil après activité
    @PostMapping("/profile/{userId}/update-activity")
    public ResponseEntity<Void> updateActivity(
            @PathVariable String userId,
            @RequestBody UserActivityDTO activity) {
        
        profileService.recordActivity(userId, activity);
        
        // Recalculer recommandations en background
        recommendationService.recalculateRecommendations(userId);
        
        return ResponseEntity.ok().build();
    }
}
```

---

## 5. 📨 KAFKA - MESSAGE BROKER

### Vue d'Ensemble
Kafka centralise la communication **asynchrone** entre microservices, permettant découplage et scalabilité.

### Configuration Kafka

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:kafka:29092}
    
    producer:
      acks: all                 # Attendre tous les replicas
      retries: 3                # Retry policy
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      properties:
        linger.ms: 10
        batch.size: 16384
    
    consumer:
      bootstrap-servers: kafka:29092
      group-id: lms-services
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        allow.auto.create.topics: true
        spring.json.trusted.packages: "*"
    
    listener:
      ack-mode: manual    # Commit manuel après traitement
      auto-startup: true
```

### Topics Kafka

| Topic | Producteur | Consommateur | Événements |
|-------|-----------|--------------|-----------|
| `user-events` | User Service | Announcement, AI, Notification | user-created, user-updated, user-deleted, user-password-changed |
| `course-events` | Course Service | Announcement, Recommendation | course-created, quiz-created, quiz-submitted, material-uploaded, enrollment-created |
| `quiz-events` | Course Service | Announcement, AI | quiz-submitted, quiz-graded, score-updated |
| `notification-events` | Announcement Service | External (Email, SMS) | notification-sent, notification-failed |
| `meeting-events` | Meeting Service | Announcement, Archive | meeting-started, meeting-ended, participant-joined, recording-available |
| `ai-generation-events` | AI Service | Course Service | quiz-generated, template-generated, content-created |
| `recommendation-events` | Recommendation Eng. | Frontend (WebSocket) | recommendations-updated, profile-updated |

### Topic Architecture

```
User-Events Topic
├─ Partitions: 3
├─ Replication Factor: 1
├─ Retention: 7 days
└─ Events:
   ├─ UserCreatedEvent
   ├─ UserUpdatedEvent
   ├─ UserDeletedEvent
   └─ PasswordChangedEvent

Course-Events Topic
├─ Partitions: 5
├─ Replication Factor: 1
├─ Retention: 30 days
└─ Events:
   ├─ CourseCreatedEvent
   ├─ QuizCreatedEvent
   ├─ QuizSubmittedEvent
   ├─ MaterialUploadedEvent
   └─ EnrollmentCreatedEvent

Notification-Events Topic
├─ Partitions: 2
├─ Replication Factor: 1
├─ Retention: 3 days
└─ Events:
   ├─ NotificationSentEvent
   └─ NotificationFailedEvent
```

### Kafka Producer (Exemple: Course Service)

```java
@Service
@RequiredArgsConstructor
public class CourseEventProducer {
    
    private final KafkaTemplate<String, CourseEvent> kafkaTemplate;
    private static final String TOPIC = "course-events";
    
    public void publishQuizCreated(Long quizId, Long moduleId, String createdBy) {
        QuizCreatedEvent event = QuizCreatedEvent.builder()
            .quizId(quizId)
            .moduleId(moduleId)
            .createdBy(createdBy)
            .timestamp(System.currentTimeMillis())
            .version("1.0")
            .build();
        
        kafkaTemplate.send(
            TOPIC,
            quizId.toString(),  // key (pour partitioning)
            event
        );
        
        log.info("📤 Quiz-created event published: {}", quizId);
    }
    
    public void publishQuizSubmitted(Long quizId, Long studentId, Double score) {
        QuizSubmittedEvent event = QuizSubmittedEvent.builder()
            .quizId(quizId)
            .studentId(studentId)
            .score(score)
            .timestamp(System.currentTimeMillis())
            .build();
        
        kafkaTemplate.send(TOPIC, quizId.toString(), event);
    }
}
```

### Kafka Listeners (Announcement Service)

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class CourseEventListener {
    
    private final NotificationService notificationService;
    private final UserServiceClient userServiceClient;
    private final SimpMessagingTemplate messagingTemplate;
    
    // Écouter quiz créé et notifier étudiants
    @KafkaListener(
        topics = "course-events",
        groupId = "announcement-service"
    )
    public void handleCourseEvent(CourseEvent event) {
        
        if (event instanceof QuizCreatedEvent) {
            QuizCreatedEvent quizEvent = (QuizCreatedEvent) event;
            handleQuizCreated(quizEvent);
            
        } else if (event instanceof MaterialUploadedEvent) {
            MaterialUploadedEvent matEvent = (MaterialUploadedEvent) event;
            handleMaterialUploaded(matEvent);
        }
    }
    
    private void handleQuizCreated(QuizCreatedEvent event) {
        try {
            log.info("📬 Handling quiz-created event: {}", event.getQuizId());
            
            // 1. Récupérer étudiants inscrits au module
            List<String> enrolledStudents = userServiceClient
                .getEnrolledStudents(event.getModuleId());
            
            // 2. Créer notifications individuelles
            for (String studentId : enrolledStudents) {
                Notification notif = new Notification();
                notif.setUserId(studentId);
                notif.setType(NotificationType.QUIZ_AVAILABLE);
                notif.setTitle("Nouveau quiz disponible");
                notif.setBody("Un nouveau quiz a été créé pour ce module");
                notif.setRelatedId(event.getQuizId());
                notif.setModuleId(event.getModuleId());
                notif.setRead(false);
                
                // Sauvegarder en DB
                notificationService.sendNotification(notif);
                
                // Push WebSocket en temps réel
                messagingTemplate.convertAndSendToUser(
                    studentId,
                    "/queue/notifications",
                    notif
                );
            }
            
            log.info("✅ Quiz notifications sent to {} students", enrolledStudents.size());
            
        } catch (Exception e) {
            log.error("❌ Error handling quiz-created event: {}", e.getMessage());
        }
    }
    
    private void handleMaterialUploaded(MaterialUploadedEvent event) {
        // Logique similaire...
    }
}
```

### Flux Complet: Quiz Submission

```
1. ÉTUDIANT SOUMET QUIZ
   POST /api/courses/modules/123/quizzes/456/submit
   
   ▼
   
2. COURSE SERVICE (CourseController)
   @PostMapping("/{moduleId}/quizzes/{quizId}/submit")
   public ResponseEntity<?> submitQuiz(...) {
       // Validation et scoring
       QuizResult result = quizService.gradeQuiz(submission);
       
       // Publier événement Kafka
       courseEventProducer.publishQuizSubmitted(
           quizId: 456,
           studentId: "aya-seck",
           score: 18.5
       );
       
       return ResponseEntity.ok(result);
   }
   
   ▼
   
3. KAFKA BROKER
   Topic: course-events
   Event: {
     "type": "QUIZ_SUBMITTED",
     "quizId": 456,
     "studentId": "aya-seck",
     "score": 18.5,
     "timestamp": 1716370800000
   }
   
   ▼ (Async consumers)
   
4a. ANNOUNCEMENT SERVICE LISTENER
    Crée notification "Note publiée"
    Envoie via WebSocket à l'étudiant
    
4b. AI SERVICE LISTENER
    Analyse réponses
    Génère feedback remédiation si score < 60%
    
4c. RECOMMENDATION ENGINE
    Enregistre activité
    Recalcule profil d'apprentissage
    
4d. ANALYTICS SERVICE (optionnel)
    Enregistre métrique
    Calcule statistiques classe
    
   ▼
   
5. FRONTEND (WebSocket Real-Time)
   Client reçoit notification WebSocket
   → Affiche toast "Vos résultats: 18.5/20"
   → Actualise page résultats
```

### Gestion des Erreurs Kafka

```java
@Service
@Slf4j
public class KafkaErrorHandler implements ConsumerAwareListenerErrorHandler {
    
    private final DeadLetterTopicService dlTopicService;
    
    @Override
    public void handle(Exception thrownException, ConsumerRecord<?, ?> data, 
                       Consumer<?, ?> consumer, MessageListenerContainer container) {
        
        log.error("❌ Error processing message: {}", data.key(), thrownException);
        
        // Envoyer vers Dead Letter Topic
        dlTopicService.send(data.topic() + "-DLT", data);
        
        // Alerter admin
        alertingService.sendAlert(
            "Kafka processing error: " + thrownException.getMessage()
        );
        
        // Acknowledging message pour éviter reprocessing infini
        // (après max retries)
    }
}

// Configuration Dead Letter Topics
@Bean
public NewTopic courseEventsDLT() {
    return TopicBuilder.name("course-events-DLT")
        .partitions(1)
        .replicas(1)
        .build();
}
```

---

## 6. 🔗 INTÉGRATION DES SYSTÈMES

### Flux Global: Étudiant complète Quiz → Reçoit feedback IA + Notification

```
1️⃣ ÉTUDIANT SOUMET QUIZ (Frontend)
   POST /api/courses/modules/123/quizzes/456/submit
   {
     "answers": [
       {"questionId": 1, "answer": "B"},
       {"questionId": 2, "answer": "Microservices sont des..."}
     ]
   }
   ↓

2️⃣ COURSE SERVICE - Grade Quiz + Publish Event
   ├─ Calculer score (auto-grading pour QCM)
   ├─ Publier Kafka: QuizSubmittedEvent
   └─ Envoyer réponses au AI Service (pour essay questions)
   ↓
   POST /api/ai/chatbot/evaluate-answer
   {
     "question": "Définissez les microservices",
     "studentAnswer": "Microservices sont des...",
     "expectedAnswer": "Architecture modulaire avec services indépendants..."
   }
   ↓

3️⃣ AI SERVICE - Évalue + Publie Event
   └─ Groq LLM évalue réponse libre
   └─ Retourne scoreAwarded + feedback
   └─ Publier Kafka: QuizGradedEvent
   ↓

4️⃣ KAFKA CONSUMERS (Async)
   ├─ ANNOUNCEMENT SERVICE
   │  └─ Crée Notification: "Vos résultats: 18.5/20"
   │  └─ Push WebSocket: /user/aya-seck/queue/notifications
   │  └─ Persiste en DB notifications_db
   │
   ├─ RECOMMENDATION ENGINE
   │  └─ Enregistre activité quiz
   │  └─ Recalcule UserLearningProfile
   │  └─ Si score < 60%: recommande ressources remediation
   │
   ├─ ANALYTICS SERVICE (optionnel)
   │  └─ Enregistre métrique pour statistiques classe
   │  └─ Alerte prof si moyenne classe < 50%
   │
   └─ AI SERVICE (Follow-up)
      └─ Si score < 60%: génère quiz remediation
      └─ Publish: RemediationQuizGeneratedEvent
   ↓

5️⃣ FRONTEND - Mise à Jour Real-Time (WebSocket)
   Reçoit notification WebSocket:
   {
     "type": "GRADE_POSTED",
     "title": "Quiz: Chapitres 1-3",
     "body": "Vous avez obtenu 18.5/20",
     "score": 18.5,
     "feedback": "Bonne compréhension globale. Réviser ch.2 sur gRPC."
   }
   ↓
   ├─ Affiche toast "Résultats reçus"
   ├─ Actualise page résultats
   ├─ Affiche dashboard avec recommandations
   └─ Si score < 60%: affiche "Resources recommandées"
   ↓

6️⃣ ÉTUDIANT REÇOIT FEEDBACK
   Dashboard affiche:
   ┌─────────────────────────────────┐
   │ Quiz: Chapitres 1-3             │
   │ Note: 18.5/20 (92%)  ✓ PASS    │
   │ Feedback: "Bonne performance..." │
   │                                  │
   │ Ressources recommandées:        │
   │ 📄 Deep Dive: gRPC Protocol     │
   │ 📹 Video: Microservices Patterns│
   │ 🤖 AI Chat: Questions?          │
   └─────────────────────────────────┘
```

### Diagramme Timing

```
T+0s
  ├─ Étudiant submit quiz (FRONTEND)
  │
  ├─ T+0.2s: Course Service reçoit + grade QCM
  │
  ├─ T+0.5s: 
  │    ├─ Kafka: QuizSubmittedEvent published
  │    └─ AI Service: POST /evaluate-answer
  │
  ├─ T+1.5s: 
  │    ├─ AI Service répond avec feedback
  │    ├─ Kafka: QuizGradedEvent published
  │    └─ Course Service met à jour DB
  │
  ├─ T+2s: ASYNC - Multiple Consumers
  │    ├─ Announcement Service: crée Notification
  │    ├─ Recommendation Engine: recalcule profil
  │    └─ Analytics Service: met à jour stats
  │
  ├─ T+2.5s: Announcement Service
  │    └─ Push WebSocket → Frontend
  │
  └─ T+3s: FRONTEND
     ├─ Reçoit notification WebSocket
     ├─ Affiche toast
     └─ Actualise UI
     
LATENCY TOTAL: ~3 secondes (pour feedback complet)
```

---

## 📊 RÉSUMÉ TECHNIQUES

### Technologies Clés

| Système | Tech Principal | Tech Support | Pattern |
|---------|---|---|---|
| **Notifications** | WebSocket (STOMP) | PostgreSQL | Pub/Sub + Persistence |
| **Meetings** | LiveKit (WebRTC) | PostgreSQL, JWT | Token-based signaling |
| **IA** | Groq + Ollama | pgvector, RAG | Provider pattern, Fallback |
| **Recommendations** | Collaborative Filtering | PostgreSQL, Kafka | Hybrid (Content + User) |
| **Kafka** | Apache Kafka 7.4 | Spring Kafka | Event-driven async |

### Performance Targets

- **Notifications**: < 100ms latency (WebSocket)
- **Meetings**: < 200ms (signaling), 50ms (media streaming)
- **IA**: 1-5s (Groq), 500ms (local cache)
- **Recommendations**: Recalc hourly (background job)
- **Kafka**: < 50ms end-to-end (producer → consumer)

### Scalabilité

- **Notifications**: Horizontal (multiple instances + load balancer)
- **Meetings**: Per-room sharding (Redis for room state)
- **IA**: LB + queue system + worker pool
- **Recommendations**: Batch processing + caching
- **Kafka**: Multiple partitions + consumer groups

---

**Document créé: Mai 2026**  
**Plateforme LMS EPT - Écol Polytechnique de Thiès**  
**Réalisé par Médoune DIOP - DIC2**
