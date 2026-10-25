package com.lms.user.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "adaptive_profiles")
public class AdaptiveProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    /**
     * Niveau global: DEBUTANT | INTERMEDIAIRE | AVANCE
     */
    @Column(nullable = false)
    private String niveauGlobal;

    /**
     * Moyenne de classe (0-20)
     */
    private Double classeMoyenne;

    /**
     * Compétences évaluées: {"Java": "BON", "Spring": "MOYEN", ...}
     * Valeurs possibles: FAIBLE | MOYEN | BON | EXCELLENT
     * Stocké en JSON dans une colonne TEXT pour compatibilité H2
     */
    @Column(columnDefinition = "TEXT")
    private String competencesJson;

    @Transient
    private Map<String, String> competences;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
        serializeCompetences();
    }

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
        serializeCompetences();
    }

    @PostLoad
    protected void deserializeCompetences() {
        if (competencesJson != null && !competencesJson.isEmpty()) {
            try {
                competences = objectMapper.readValue(competencesJson, new TypeReference<Map<String, String>>() {});
            } catch (Exception e) {
                competences = null;
            }
        }
    }

    private void serializeCompetences() {
        if (competences != null) {
            try {
                competencesJson = objectMapper.writeValueAsString(competences);
            } catch (Exception e) {
                competencesJson = null;
            }
        }
    }
}
