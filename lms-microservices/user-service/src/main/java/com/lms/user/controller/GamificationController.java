package com.lms.user.controller;

import com.lms.user.dto.MentorshipRequestDto;
import com.lms.user.entity.AppUser;
import com.lms.user.repository.AppUserRepository;
import com.lms.user.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user/gamification")
@AllArgsConstructor
@Tag(name = "Gamification", description = "Système de points d'expérience (XP), badges, classement et mentorat")
public class GamificationController {

    private final GamificationService gamificationService;
    private final AppUserRepository appUserRepository;

    @Operation(summary = "Obtenir le profil de gamification", description = "Retourne le profil XP, badges acquis et streak de connexion d'un utilisateur.")
    @GetMapping("/{username:.+}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        return new ResponseEntity<>(gamificationService.getProfile(username), HttpStatus.OK);
    }

    @Operation(summary = "Ajouter des points XP", description = "Ajoute un montant de points d'expérience au profil d'un utilisateur.")
    @PostMapping("/{username:.+}/xp")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public ResponseEntity<?> addXp(
            @PathVariable String username,
            @Parameter(description = "Nombre de points XP à ajouter") @RequestParam int amount,
            @RequestParam(required = false) String skill) {
        return new ResponseEntity<>(gamificationService.addXp(username, amount, skill), HttpStatus.OK);
    }

    @Operation(summary = "Enregistrer une connexion", description = "Enregistre une connexion quotidienne et met à jour le streak de l'utilisateur.")
    @PostMapping("/{username:.+}/login")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public ResponseEntity<?> recordLogin(@PathVariable String username) {
        return new ResponseEntity<>(gamificationService.recordLogin(username), HttpStatus.OK);
    }

    @Operation(summary = "Demander un mentorat", description = "Envoie une demande de mentorat d'un étudiant (mentee) vers un autre étudiant (mentor).")
    @PostMapping("/mentorship/request")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> requestMentorship(@RequestBody MentorshipRequestDto dto) {
        try {
            return new ResponseEntity<>(gamificationService.requestMentorship(dto), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.CONFLICT);
        }
    }

    @Operation(summary = "Accepter ou refuser un mentorat", description = "Le mentor accepte ou refuse une demande de mentorat PENDING. Le username du mentor est extrait du token JWT.")
    @PutMapping("/mentorship/{id}/status")
    @PreAuthorize("hasAnyRole('LECTURER', 'STUDENT')")
    public ResponseEntity<?> acceptOrRejectMentorship(
            @PathVariable Long id,
            @Parameter(description = "Nouveau statut (ACCEPTED, REJECTED)") @RequestParam String status,
            @RequestHeader("loggedInUser") String lecturerEmail) {
        try {
            String lecturerUsername = appUserRepository.findByEmail(lecturerEmail)
                    .or(() -> appUserRepository.findByUsername(lecturerEmail))
                    .map(AppUser::getUsername)
                    .orElseThrow(() -> new RuntimeException("User not found for email or username: " + lecturerEmail));
            return new ResponseEntity<>(gamificationService.acceptOrRejectMentorship(id, status, lecturerUsername), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Annuler une demande de mentorat (Étudiant)", description = "L'étudiant (mentee) annule sa propre demande de mentorat, sauf si elle est déjà acceptée.")
    @PutMapping("/mentorship/{id}/cancel")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> cancelMentorship(
            @PathVariable Long id,
            @RequestHeader("loggedInUser") String studentEmail) {
        try {
            String studentUsername = appUserRepository.findByEmail(studentEmail)
                    .or(() -> appUserRepository.findByUsername(studentEmail))
                    .map(AppUser::getUsername)
                    .orElseThrow(() -> new RuntimeException("User not found for email or username: " + studentEmail));
            return new ResponseEntity<>(gamificationService.cancelMentorship(id, studentUsername), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @Operation(summary = "Mes demandes de mentorat (Étudiant)", description = "Liste les demandes de mentorat envoyées par l'étudiant (mentee) et leur statut.")
    @GetMapping("/mentorship/mentee/{username:.+}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMenteeRequests(@PathVariable String username) {
        return new ResponseEntity<>(gamificationService.getMentorshipsForMentee(username), HttpStatus.OK);
    }

    @Operation(summary = "Demandes de mentorat à traiter", description = "Liste les demandes de mentorat adressées au mentor pour qu'il les accepte ou refuse.")
    @GetMapping("/mentorship/mentor/{username:.+}")
    @PreAuthorize("hasAnyRole('LECTURER', 'STUDENT')")
    public ResponseEntity<?> getMentorRequests(@PathVariable String username) {
        return new ResponseEntity<>(gamificationService.getMentorshipsForMentor(username), HttpStatus.OK);
    }

    @Operation(summary = "Classement (Leaderboard)", description = "Retourne le top 10 des utilisateurs classés par points XP.")
    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        return new ResponseEntity<>(gamificationService.getLeaderboard(), HttpStatus.OK);
    }
}
