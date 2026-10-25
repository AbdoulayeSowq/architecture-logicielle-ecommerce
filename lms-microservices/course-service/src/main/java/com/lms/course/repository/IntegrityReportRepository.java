package com.lms.course.repository;

import com.lms.course.entity.IntegrityReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IntegrityReportRepository extends JpaRepository<IntegrityReport, Long> {
}
