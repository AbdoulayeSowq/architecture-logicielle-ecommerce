package com.lms.course.repository;

import com.lms.course.entity.Assignment;
import com.lms.course.entity.CModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByModule(CModule module);
}
