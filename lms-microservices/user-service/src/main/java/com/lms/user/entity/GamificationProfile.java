package com.lms.user.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "gamification_profiles")
public class GamificationProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private int xpPoints = 0;
    private int level = 1;
    
    private int currentStreak = 0;
    private int longestStreak = 0;
    
    private LocalDate lastLoginDate;

    @JsonIgnore
    @OneToMany
    @JoinColumn(name = "username", referencedColumnName = "username", insertable = false, updatable = false)
    private List<UserBadge> badges;

    @JsonIgnore
    @ElementCollection
    @CollectionTable(name = "gamification_skills", joinColumns = @JoinColumn(name = "profile_id"))
    @MapKeyColumn(name = "skill_name")
    @Column(name = "score")
    private Map<String, Integer> skillScores;

    public int getStreakJours() {
        return this.currentStreak;
    }

    public void setStreakJours(int streakJours) {
        this.currentStreak = streakJours;
    }

    public void addXp(int amount) {
        this.xpPoints += amount;
        // Simple level calculation: Level = (XP / 100) + 1
        this.level = (this.xpPoints / 100) + 1;
    }

    public void updateStreak() {
        LocalDate today = LocalDate.now();
        if (lastLoginDate == null) {
            currentStreak = 1;
            longestStreak = 1;
        } else if (lastLoginDate.equals(today.minusDays(1))) {
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        } else if (!lastLoginDate.equals(today)) {
            currentStreak = 1;
        }
        lastLoginDate = today;
    }
}
