package com.lms.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "mentorships", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"mentor_username", "mentee_username", "module_id", "mentor_role", "status"})
})
public class Mentorship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String mentorUsername;

    @Column(nullable = false)
    private String menteeUsername;

    private String mentorName;
    private String menteeName;

    @Column(nullable = false)
    private Long moduleId;

    /**
     * Type de mentor: LECTURER (prof) ou STUDENT (étudiant du module)
     */
    @Column(nullable = false)
    private String mentorRole; // LECTURER | STUDENT

    @Column(nullable = false)
    private String status; // PENDING, ACTIVE, COMPLETED, REJECTED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
