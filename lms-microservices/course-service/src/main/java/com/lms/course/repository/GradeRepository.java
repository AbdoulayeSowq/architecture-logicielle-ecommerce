package com.lms.course.repository;

import com.lms.course.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudentId(Long studentId);
    List<Grade> findByModuleId(Long moduleId);
    Grade findByStudentIdAndModuleId(Long studentId, Long moduleId);
}
