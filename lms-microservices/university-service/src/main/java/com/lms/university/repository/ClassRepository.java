package com.lms.university.repository;

import com.lms.university.entity.Class;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassRepository extends JpaRepository<Class, Long> {
    boolean existsByName(String name);
    List<Class> findByDepartmentId(Long departmentId);
    List<Class> findByDepartmentIsNull();
}
