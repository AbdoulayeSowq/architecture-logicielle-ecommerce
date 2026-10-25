package com.lms.practice.repository;

import com.lms.practice.entity.CodingExercise;
import com.lms.practice.entity.DifficultyLevel;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CodingExerciseRepository extends JpaRepository<CodingExercise, Long> {

    List<CodingExercise> findByModuleId(Long moduleId, Pageable pageable);

    @Query("SELECT e FROM CodingExercise e WHERE e.published = true " +
           "AND (:moduleId IS NULL OR e.moduleId = :moduleId) " +
           "AND (:difficulty IS NULL OR e.difficulty = :difficulty) " +
           "AND (:competence IS NULL OR e.competence = :competence) " +
           "ORDER BY e.id DESC")
    List<CodingExercise> findPublishedFiltered(
            @Param("moduleId") Long moduleId,
            @Param("difficulty") DifficultyLevel difficulty,
            @Param("competence") String competence,
            Pageable pageable);
}
