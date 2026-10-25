package com.lms.course.repository;

import com.lms.course.entity.TeachingUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeachingUnitRepository extends JpaRepository<TeachingUnit, Long> {

    Optional<TeachingUnit> findByCode(String code);

    List<TeachingUnit> findBySemester(String semester);

    List<TeachingUnit> findByDepartmentId(Long departmentId);
    List<TeachingUnit> findByDepartmentCode(String departmentCode);

    List<TeachingUnit> findByClassId(Long classId);
    List<TeachingUnit> findByClassCode(String classCode);

    List<TeachingUnit> findBySemesterAndClassId(String semester, Long classId);

    boolean existsByCode(String code);
}
