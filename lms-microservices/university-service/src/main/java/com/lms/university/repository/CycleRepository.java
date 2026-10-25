package com.lms.university.repository;

import com.lms.university.entity.Cycle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CycleRepository extends JpaRepository<Cycle, Long> {
    boolean existsByName(String name);
}
