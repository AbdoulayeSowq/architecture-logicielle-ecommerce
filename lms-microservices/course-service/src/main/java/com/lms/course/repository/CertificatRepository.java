package com.lms.course.repository;

import com.lms.course.entity.Certificat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificatRepository extends JpaRepository<Certificat, Long> {
    List<Certificat> findByStudentIdOrderByDateEmissionDesc(Long studentId);
    Optional<Certificat> findByCodeVerification(String codeVerification);
}
