package com.lms.announcement.controller;

import com.lms.announcement.dto.SendMessageDto;
import com.lms.announcement.entity.Message;
import com.lms.announcement.services.MessageService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcement/messages")
@AllArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    /** Boîte de réception d'un utilisateur */
    @GetMapping("/inbox/{username}")
    public ResponseEntity<List<Message>> getInbox(@PathVariable String username) {
        return ResponseEntity.ok(messageService.getInbox(username));
    }

    /** Messages envoyés par un utilisateur */
    @GetMapping("/sent/{username}")
    public ResponseEntity<List<Message>> getSent(@PathVariable String username) {
        return ResponseEntity.ok(messageService.getSent(username));
    }

    /** Nombre de messages non lus */
    @GetMapping("/unread/{username}")
    public ResponseEntity<Map<String, Long>> countUnread(@PathVariable String username) {
        long count = messageService.countUnread(username);
        return ResponseEntity.ok(Map.of("unread", count));
    }

    /** Envoyer un nouveau message */
    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(@RequestBody SendMessageDto dto) {
        Message message = messageService.sendMessage(dto);
        // Envoyer temps réel au destinataire ET à l'expéditeur (pour sync conversation)
        messagingTemplate.convertAndSendToUser(
            message.getReceiverUsername(),
            "/queue/messages",
            message
        );
        messagingTemplate.convertAndSendToUser(
            message.getSenderUsername(),
            "/queue/messages",
            message
        );
        return ResponseEntity.ok(message);
    }

    /** Marquer un message comme lu */
    @PutMapping("/{id}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(messageService.markAsRead(id));
    }

    /** Supprimer un message (côté destinataire) */
    @DeleteMapping("/{id}/receiver")
    public ResponseEntity<Void> deleteByReceiver(@PathVariable Long id) {
        messageService.deleteByReceiver(id);
        return ResponseEntity.noContent().build();
    }

    /** Supprimer un message (côté expéditeur) */
    @DeleteMapping("/{id}/sender")
    public ResponseEntity<Void> deleteBySender(@PathVariable Long id) {
        messageService.deleteBySender(id);
        return ResponseEntity.noContent().build();
    }
}
