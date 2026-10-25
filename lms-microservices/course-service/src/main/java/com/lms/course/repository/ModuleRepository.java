package com.lms.course.repository;

import com.lms.course.entity.CModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<CModule, Long> {

    Optional<CModule> findByCodeEC(String codeEC);

    boolean existsByCodeEC(String codeEC);

    List<CModule> findByNameContainingIgnoreCase(String name);

    List<CModule> findByLecturerUsername(String lecturerUsername);

    List<CModule> findByTeachingUnitId(Long teachingUnitId);

    List<CModule> findBySemester(String semester);

    List<CModule> findByLevelIgnoreCase(String level);

    List<CModule> findBySemesterAndLevel(String semester, String level);

    List<CModule> findByCreditsEC(Integer creditsEC);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM CModule m JOIN m.teachingUnit tu WHERE tu.departmentId = :departmentId")
    List<CModule> findModulesByDepartmentId(@org.springframework.data.repository.query.Param("departmentId") Long departmentId);
}
