package com.lms.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDto {
    private Long id;
    private String username;
    private String typeReco;
    private String cibleId;
    private String raison;
    private Boolean vue;
    private LocalDateTime createdAt; // Correspond au champ 'createdDate' de l'entité
}
