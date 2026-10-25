package com.lms.user.dto;

import com.lms.user.entity.Badge;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class GamificationProfileDto {
    private String username;
    private int xpPoints;
    private int level;
    private int currentStreak;
    private int longestStreak;
    private List<Badge> badges;
    private Map<String, Integer> skillScores;
}

