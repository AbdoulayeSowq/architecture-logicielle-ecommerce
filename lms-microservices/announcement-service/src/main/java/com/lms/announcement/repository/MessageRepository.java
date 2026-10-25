package com.lms.announcement.repository;

import com.lms.announcement.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Boîte de réception : reçus et non supprimés par le destinataire
    List<Message> findByReceiverUsernameAndDeletedByReceiverFalseOrderByCreatedAtDesc(String receiverUsername);

    // Envoyés : envoyés et non supprimés par l'expéditeur
    List<Message> findBySenderUsernameAndDeletedBySenderFalseOrderByCreatedAtDesc(String senderUsername);

    // Nombre de messages non lus pour un utilisateur
    long countByReceiverUsernameAndReadFalseAndDeletedByReceiverFalse(String receiverUsername);
}
