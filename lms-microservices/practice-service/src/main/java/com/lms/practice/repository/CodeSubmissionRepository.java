package com.lms.practice.repository;

import com.lms.practice.entity.CodeSubmission;
import com.lms.practice.entity.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CodeSubmissionRepository extends JpaRepository<CodeSubmission, Long> {

    long countByExerciseId(Long exerciseId);

    @Query("SELECT COUNT(s) FROM CodeSubmission s WHERE s.exercise.id = :exerciseId AND s.status = 'ACCEPTED' AND s.scorePercent = 100")
    long countAcceptedByExerciseId(@Param("exerciseId") Long exerciseId);

    List<CodeSubmission> findTop10ByExercise_IdAndStudentIdOrderBySubmittedAtDesc(Long exerciseId, String studentId);

    /** Utilisé pour le polling async — récupère la soumission sans restriction de studentId */
    Optional<CodeSubmission> findById(Long id);

    Optional<CodeSubmission> findByIdAndStudentId(Long id, String studentId);

    @Query("SELECT s FROM CodeSubmission s WHERE s.exercise.id = :exerciseId AND s.status = 'ACCEPTED' AND s.scorePercent = 100 ORDER BY COALESCE(s.executionTimeMs, 999999) ASC, s.submittedAt ASC")
    List<CodeSubmission> findAcceptedLeaderboard(@Param("exerciseId") Long exerciseId);

    @Query("SELECT COUNT(DISTINCT s.studentId) FROM CodeSubmission s WHERE s.exercise.id = :exerciseId AND s.status = 'ACCEPTED' AND s.scorePercent = 100")
    long countUniqueAcceptedUsersByExerciseId(@Param("exerciseId") Long exerciseId);

    @Query("SELECT s.exercise.id, COUNT(s), SUM(CASE WHEN s.status = 'ACCEPTED' AND s.scorePercent = 100 THEN 1 ELSE 0 END) FROM CodeSubmission s GROUP BY s.exercise.id")
    List<Object[]> findSubmissionStatsGroupedByExercise();

    boolean existsByExercise_IdAndStudentIdAndStatusAndScorePercent(
            Long exerciseId, String studentId, SubmissionStatus status, Integer scorePercent);
}

