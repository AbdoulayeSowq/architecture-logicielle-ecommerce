package com.lms.course.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentAnalyticsDto {
    private Double overallAverage;
    private Double highestScore;
    private Double lowestScore;
    private int totalModules;
    private List<ModuleScore> progression; // Pour le graphique
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ModuleScore {
        private String moduleCode;
        private Double score;
        private Double classAverage;
    }
}
