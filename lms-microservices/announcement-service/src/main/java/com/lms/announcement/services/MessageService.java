package com.lms.announcement.services;

import com.lms.announcement.dto.SendMessageDto;
import com.lms.announcement.entity.Message;
import com.lms.announcement.repository.MessageRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    public List<Message> getInbox(String username) {
        return messageRepository.findByReceiverUsernameAndDeletedByReceiverFalseOrderByCreatedAtDesc(username);
    }

    public List<Message> getSent(String username) {
        return messageRepository.findBySenderUsernameAndDeletedBySenderFalseOrderByCreatedAtDesc(username);
    }

    public long countUnread(String username) {
        return messageRepository.countByReceiverUsernameAndReadFalseAndDeletedByReceiverFalse(username);
    }

    public Message sendMessage(SendMessageDto dto) {
        Message message = new Message();
        message.setSenderUsername(dto.getSenderUsername());
        message.setReceiverUsername(dto.getReceiverUsername());
        message.setSubject(dto.getSubject());
        message.setBody(dto.getBody());
        message.setRead(false);
        return messageRepository.save(message);
    }

    public Message markAsRead(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found: " + id));
        message.setRead(true);
        return messageRepository.save(message);
    }

    public void deleteByReceiver(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found: " + id));
        message.setDeletedByReceiver(true);
        messageRepository.save(message);
    }

    public void deleteBySender(Long id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found: " + id));
        message.setDeletedBySender(true);
        messageRepository.save(message);
    }
}
