package com.lms.course.repository;

import com.lms.course.entity.AdaptiveSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdaptiveSessionRepository extends JpaRepository<AdaptiveSession, Long> {
    List<AdaptiveSession> findByStudentIdOrderByStartedAtDesc(String studentId);
    List<AdaptiveSession> findByStudentIdAndModuleId(String studentId, Long moduleId);
    Optional<AdaptiveSession> findByIdAndStudentId(Long id, String studentId);
    Optional<AdaptiveSession> findTopByStudentIdAndModuleIdAndStatusOrderByStartedAtDesc(
            String studentId, Long moduleId, AdaptiveSession.SessionStatus status);
}
