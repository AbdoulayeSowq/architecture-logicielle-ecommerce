package com.lms.course.repository;

import com.lms.course.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCourseId(Long courseId);
    List<Material> findByModuleId(Long moduleId);

    boolean existsByTitleAndModuleIdAndCourseId(String title, Long moduleId, Long courseId);
}
