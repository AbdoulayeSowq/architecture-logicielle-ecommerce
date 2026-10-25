package com.lms.course.controller;

import com.lms.course.entity.Certificat;
import com.lms.course.repository.CertificatRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/course/certificats")
@Tag(name = "Certificats", description = "Génération et vérification des certificats de réussite")
public class CertificatController {

    private final CertificatRepository certificatRepository;

    public CertificatController(CertificatRepository certificatRepository) {
        this.certificatRepository = certificatRepository;
    }

    @Operation(summary = "Certificats d'un étudiant", description = "Retourne tous les certificats obtenus par un étudiant.")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Certificat>> getStudentCertificats(@PathVariable Long studentId) {
        return ResponseEntity.ok(certificatRepository.findByStudentIdOrderByDateEmissionDesc(studentId));
    }

    @Operation(summary = "Vérifier un certificat", description = "Vérifie l'authenticité d'un certificat à partir de son code de vérification unique.")
    @GetMapping("/verify/{code}")
    public ResponseEntity<Certificat> verifyCertificat(@PathVariable String code) {
        Optional<Certificat> cert = certificatRepository.findByCodeVerification(code);
        return cert.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Générer un certificat", description = "Génère un nouveau certificat de réussite pour un étudiant.")
    @PostMapping("/generate")
    public ResponseEntity<Certificat> generateCertificat(@RequestBody Certificat certificat) {
        return ResponseEntity.ok(certificatRepository.save(certificat));
    }
}
