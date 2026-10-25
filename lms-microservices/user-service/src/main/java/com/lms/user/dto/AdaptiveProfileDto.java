package com.lms.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdaptiveProfileDto {
    private Long id;
    private String username;
    private String niveauGlobal;
    private Double classeMoyenne;
    private Map<String, String> competences;
    private LocalDateTime dernierMisAJour; // Correspond au champ 'lastUpdated' de l'entité
}
