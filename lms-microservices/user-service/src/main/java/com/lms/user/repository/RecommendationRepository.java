package com.lms.user.repository;

import com.lms.user.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByUsername(String username);
    List<Recommendation> findByUsernameOrderByCreatedDateDesc(String username);
}
