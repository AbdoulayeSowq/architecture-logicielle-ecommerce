package com.lms.course.repository;

import com.lms.course.entity.Attendance;
import com.lms.course.entity.CModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByModuleAndDate(CModule module, LocalDate date);
    List<Attendance> findByStudentId(String studentId);
    List<Attendance> findByModuleAndStudentId(CModule module, String studentId);
    boolean existsByStudentIdAndCourseIdAndDate(String studentId, Long courseId, LocalDate date);
    List<Attendance> findByCourseId(Long courseId);
    boolean existsByCourseId(Long courseId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.studentId FROM Attendance a WHERE a.module.id = :moduleId")
    java.util.List<String> findDistinctStudentIdsByModuleId(Long moduleId);
}
