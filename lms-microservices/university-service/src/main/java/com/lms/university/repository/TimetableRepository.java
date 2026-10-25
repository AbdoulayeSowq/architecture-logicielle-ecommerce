package com.lms.university.repository;

import com.lms.university.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByClassId(String classId);
    
    // Find the latest published timetable for a class
    Optional<Timetable> findFirstByClassIdAndPublishedOrderByCreatedDateDesc(String classId, boolean published);
}
