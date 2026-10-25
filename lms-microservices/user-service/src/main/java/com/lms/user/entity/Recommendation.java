package com.lms.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    /**
     * Type de recommandation: COURS | MODULE | BADGE | EXERCICE
     */
    @Column(nullable = false)
    private String typeReco;

    /**
     * ID de la cible (courseId, moduleId, badgeId, etc.)
     */
    @Column(nullable = false)
    private String cibleId;

    /**
     * Raison de la recommandation
     */
    @Column(columnDefinition = "text")
    private String raison;

    /**
     * Marqueur de lecture par l'étudiant
     */
    @Column(nullable = false)
    private Boolean vue = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }
}
