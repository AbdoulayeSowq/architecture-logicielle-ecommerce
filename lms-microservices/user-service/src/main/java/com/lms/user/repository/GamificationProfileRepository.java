package com.lms.user.repository;

import com.lms.user.entity.GamificationProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GamificationProfileRepository extends JpaRepository<GamificationProfile, Long> {
    Optional<GamificationProfile> findByUsername(String username);
    java.util.List<GamificationProfile> findTop10ByOrderByXpPointsDesc();
}
