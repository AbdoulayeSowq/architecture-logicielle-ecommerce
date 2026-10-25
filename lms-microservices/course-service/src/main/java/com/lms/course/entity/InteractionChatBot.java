package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "interactions_chatbot")
public class InteractionChatBot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String prompt;

    @Column(columnDefinition = "TEXT")
    private String reponse;

    private Long idUser;

    private LocalDate createdAt;

    public InteractionChatBot() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getReponse() { return reponse; }
    public void setReponse(String reponse) { this.reponse = reponse; }

    public Long getIdUser() { return idUser; }
    public void setIdUser(Long idUser) { this.idUser = idUser; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
