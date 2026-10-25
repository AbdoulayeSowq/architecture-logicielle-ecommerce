package com.lms.course.repository;

import com.lms.course.entity.Lacune;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LacuneRepository extends JpaRepository<Lacune, Long> {
    List<Lacune> findByStudentId(String studentId);
    List<Lacune> findByStudentIdAndModuleId(String studentId, Long moduleId);
    void deleteByStudentIdAndModuleId(String studentId, Long moduleId);
    boolean existsByStudentIdAndModuleIdAndCompetence(String studentId, Long moduleId, String competence);
    java.util.Optional<Lacune> findByStudentIdAndModuleIdAndCompetence(String studentId, Long moduleId, String competence);
}
