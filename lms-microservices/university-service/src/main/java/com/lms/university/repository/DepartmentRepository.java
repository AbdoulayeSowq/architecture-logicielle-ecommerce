package com.lms.university.repository;

import com.lms.university.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByName(String name);
    List<Department> findByCycleId(Long cycleId);
    List<Department> findByCycleIsNull();
}
