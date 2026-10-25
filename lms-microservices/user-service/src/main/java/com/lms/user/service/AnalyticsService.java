package com.lms.user.service;

import com.lms.user.dto.AdaptiveProfileDto;
import com.lms.user.dto.RecommendationDto;
import com.lms.user.entity.AdaptiveProfile;
import com.lms.user.entity.Recommendation;
import com.lms.user.repository.AdaptiveProfileRepository;
import com.lms.user.repository.RecommendationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AnalyticsService {

    private final AdaptiveProfileRepository adaptiveProfileRepository;
    private final RecommendationRepository recommendationRepository;

    public AdaptiveProfileDto getProfilAdaptatif(String username) {
        AdaptiveProfile profile = adaptiveProfileRepository.findByUsername(username).orElse(null);
        if (profile == null) {
            return null;
        }
        return convertToDto(profile);
    }

    public AdaptiveProfileDto createOrUpdateProfilAdaptatif(String username, Map<String, Object> data) {
        AdaptiveProfile profile = adaptiveProfileRepository.findByUsername(username)
                .orElse(new AdaptiveProfile());
        
        profile.setUsername(username);
        
        if (data.containsKey("niveauGlobal")) {
            profile.setNiveauGlobal((String) data.get("niveauGlobal"));
        }
        if (data.containsKey("classeMoyenne")) {
            profile.setClasseMoyenne(((Number) data.get("classeMoyenne")).doubleValue());
        }
        if (data.containsKey("competences")) {
            profile.setCompetences((Map<String, String>) data.get("competences"));
        }
        
        AdaptiveProfile saved = adaptiveProfileRepository.save(profile);
        return convertToDto(saved);
    }

    public List<RecommendationDto> getRecommandations(String username) {
        List<Recommendation> recommendations = recommendationRepository.findByUsernameOrderByCreatedDateDesc(username);
        return recommendations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public RecommendationDto createRecommandation(String username, Map<String, Object> data) {
        Recommendation recommendation = new Recommendation();
        recommendation.setUsername(username);
        recommendation.setTypeReco((String) data.get("typeReco"));
        recommendation.setCibleId((String) data.get("cibleId"));
        recommendation.setRaison((String) data.get("raison"));
        recommendation.setVue(false);
        
        Recommendation saved = recommendationRepository.save(recommendation);
        return convertToDto(saved);
    }

    public AdaptiveProfileDto updateFromSessionResult(String username, Map<String, Double> competenceScores, Double scorePercent) {
        AdaptiveProfile profile = adaptiveProfileRepository.findByUsername(username)
                .orElse(new AdaptiveProfile());

        profile.setUsername(username);

        // Translate score ratios to FAIBLE/MOYEN/BON/EXCELLENT
        if (competenceScores != null && !competenceScores.isEmpty()) {
            Map<String, String> currentCompetences = profile.getCompetences() != null
                    ? new java.util.HashMap<>(profile.getCompetences()) : new java.util.HashMap<>();
            for (Map.Entry<String, Double> entry : competenceScores.entrySet()) {
                String level = scoreToLevel(entry.getValue());
                currentCompetences.put(entry.getKey(), level);
            }
            profile.setCompetences(currentCompetences);
        }

        // Recalculate global level from all competences
        if (profile.getCompetences() != null && !profile.getCompetences().isEmpty()) {
            double avg = profile.getCompetences().values().stream()
                    .mapToInt(this::levelToInt).average().orElse(1.0);
            String niveauGlobal = avg >= 3.5 ? "AVANCE" : avg >= 2.0 ? "INTERMEDIAIRE" : "DEBUTANT";
            profile.setNiveauGlobal(niveauGlobal);
        } else if (scorePercent != null) {
            profile.setNiveauGlobal(scorePercent >= 75 ? "AVANCE" : scorePercent >= 50 ? "INTERMEDIAIRE" : "DEBUTANT");
        }

        if (profile.getNiveauGlobal() == null) profile.setNiveauGlobal("DEBUTANT");

        AdaptiveProfile saved = adaptiveProfileRepository.save(profile);
        return convertToDto(saved);
    }

    private String scoreToLevel(Double score) {
        if (score == null) return "FAIBLE";
        if (score >= 0.75) return "EXCELLENT";
        if (score >= 0.60) return "BON";
        if (score >= 0.40) return "MOYEN";
        return "FAIBLE";
    }

    private int levelToInt(String level) {
        return switch (level) {
            case "EXCELLENT" -> 4;
            case "BON" -> 3;
            case "MOYEN" -> 2;
            default -> 1;
        };
    }

    public RecommendationDto markAsViewed(Long id) {
        Recommendation recommendation = recommendationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recommendation not found"));
        recommendation.setVue(true);
        Recommendation saved = recommendationRepository.save(recommendation);
        return convertToDto(saved);
    }

    private AdaptiveProfileDto convertToDto(AdaptiveProfile profile) {
        AdaptiveProfileDto dto = new AdaptiveProfileDto();
        dto.setId(profile.getId());
        dto.setUsername(profile.getUsername());
        dto.setNiveauGlobal(profile.getNiveauGlobal());
        dto.setClasseMoyenne(profile.getClasseMoyenne());
        dto.setCompetences(profile.getCompetences());
        dto.setDernierMisAJour(profile.getLastUpdated());
        return dto;
    }

    private RecommendationDto convertToDto(Recommendation recommendation) {
        RecommendationDto dto = new RecommendationDto();
        dto.setId(recommendation.getId());
        dto.setUsername(recommendation.getUsername());
        dto.setTypeReco(recommendation.getTypeReco());
        dto.setCibleId(recommendation.getCibleId());
        dto.setRaison(recommendation.getRaison());
        dto.setVue(recommendation.getVue());
        dto.setCreatedAt(recommendation.getCreatedDate());
        return dto;
    }
}
