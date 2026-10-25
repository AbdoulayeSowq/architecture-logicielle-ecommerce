package com.lms.course.repository;

import com.lms.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@org.springframework.stereotype.Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // --- Queries existantes ---
    boolean existsByTitle(String title);
    List<Course> findByDepartmentId(Long departmentId);
    List<Course> findByDepartmentIdIsNull();
    List<Course> findByModuleId(Long moduleId);
    List<Course> findByModuleIsNull();

    // --- Nouvelles queries pour les séances ---
    
    /** Séances d'un module, triées par ordre */
    List<Course> findByModuleIdOrderByOrdreAsc(Long moduleId);
    
    /** Séances par type (COURS_MAGISTRAL, TD, TP, TPE) */
    List<Course> findByTypeSeance(String typeSeance);
    
    /** Séances d'un module par type */
    List<Course> findByModuleIdAndTypeSeanceOrderByOrdreAsc(Long moduleId, String typeSeance);
    
    /** Séances d'un module dans une plage de dates */
    List<Course> findByModuleIdAndSessionDateBetweenOrderByOrdreAsc(
        Long moduleId, LocalDateTime start, LocalDateTime end
    );
    
    /** Séances par ordre spécifique dans un module */
    Course findByModuleIdAndOrdre(Long moduleId, Integer ordre);
    
    /** Séances par date */
    List<Course> findBySessionDateBetween(LocalDateTime start, LocalDateTime end);

    /** Séances par niveau */
    List<Course> findByLevel(String level);
}