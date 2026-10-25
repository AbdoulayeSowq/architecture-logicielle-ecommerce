package com.lms.user.repository;

import com.lms.user.entity.AdaptiveProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdaptiveProfileRepository extends JpaRepository<AdaptiveProfile, Long> {
    Optional<AdaptiveProfile> findByUsername(String username);
    boolean existsByUsername(String username);
}
