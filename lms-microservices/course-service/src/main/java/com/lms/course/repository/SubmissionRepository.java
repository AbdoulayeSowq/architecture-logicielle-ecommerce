package com.lms.course.repository;

import com.lms.course.entity.Assignment;
import com.lms.course.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignment(Assignment assignment);
    Optional<Submission> findByAssignmentAndStudentId(Assignment assignment, String studentId);
    List<Submission> findByStudentId(String studentId);
}
