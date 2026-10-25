package com.lms.user.controller;

import com.lms.user.dto.AdaptiveProfileDto;
import com.lms.user.dto.RecommendationDto;
import com.lms.user.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/analytics")
@AllArgsConstructor
@Tag(name = "Analytics", description = "Profil adaptatif et recommandations personnalisées pour les étudiants")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @Operation(summary = "Obtenir le profil adaptatif d'un étudiant", description = "Retourne le niveau global, la moyenne de classe et les compétences évaluées.")
    @GetMapping("/student/{username}/profil-adaptatif")
    public ResponseEntity<?> getProfilAdaptatif(@PathVariable String username) {
        try {
            AdaptiveProfileDto profile = analyticsService.getProfilAdaptatif(username);
            if (profile == null) {
                return ResponseEntity.status(404).body("Profil adaptatif non trouvé pour cet étudiant");
            }
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la récupération du profil adaptatif");
        }
    }

    @Operation(summary = "Créer ou mettre à jour le profil adaptatif", description = "Crée un nouveau profil ou met à jour l'existant.")
    @PostMapping("/student/{username}/profil-adaptatif")
    public ResponseEntity<?> createOrUpdateProfilAdaptatif(
            @PathVariable String username,
            @RequestBody Map<String, Object> data) {
        try {
            AdaptiveProfileDto profile = analyticsService.createOrUpdateProfilAdaptatif(username, data);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la création/mise à jour du profil adaptatif");
        }
    }

    @Operation(summary = "Obtenir les recommandations d'un étudiant", description = "Retourne la liste des recommandations personnalisées.")
    @GetMapping("/student/{username}/recommandations")
    public ResponseEntity<?> getRecommandations(@PathVariable String username) {
        try {
            List<RecommendationDto> recommendations = analyticsService.getRecommandations(username);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la récupération des recommandations");
        }
    }

    @Operation(summary = "Créer une recommandation", description = "Crée une nouvelle recommandation pour un étudiant.")
    @PostMapping("/student/{username}/recommandations")
    public ResponseEntity<?> createRecommandation(
            @PathVariable String username,
            @RequestBody Map<String, Object> data) {
        try {
            RecommendationDto recommendation = analyticsService.createRecommandation(username, data);
            return ResponseEntity.ok(recommendation);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la création de la recommandation");
        }
    }

    @Operation(summary = "Marquer une recommandation comme vue", description = "Marque une recommandation comme lue par l'étudiant.")
    @PutMapping("/recommandation/{id}/view")
    public ResponseEntity<?> markAsViewed(@PathVariable Long id) {
        try {
            RecommendationDto recommendation = analyticsService.markAsViewed(id);
            return ResponseEntity.ok(recommendation);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors du marquage de la recommandation");
        }
    }

    @Operation(summary = "Mettre à jour le profil adaptatif après une session adaptative",
               description = "Appelé par course-service après completion d'une session. Met à jour compétences et niveau global.")
    @PostMapping("/student/{username}/session-result")
    public ResponseEntity<?> updateFromSessionResult(
            @PathVariable String username,
            @RequestBody SessionResultDto dto) {
        try {
            AdaptiveProfileDto profile = analyticsService.updateFromSessionResult(username, dto.getCompetenceScores(), dto.getScorePercent());
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la mise à jour depuis la session: " + e.getMessage());
        }
    }

    public static class SessionResultDto {
        private java.util.Map<String, Double> competenceScores;
        private Double scorePercent;

        public java.util.Map<String, Double> getCompetenceScores() { return competenceScores; }
        public void setCompetenceScores(java.util.Map<String, Double> competenceScores) { this.competenceScores = competenceScores; }
        public Double getScorePercent() { return scorePercent; }
        public void setScorePercent(Double scorePercent) { this.scorePercent = scorePercent; }
    }
}
