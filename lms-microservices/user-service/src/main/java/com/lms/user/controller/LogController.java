package com.lms.user.controller;

import com.lms.user.entity.SystemLog;
import com.lms.user.repository.SystemLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/logs")
@Tag(name = "System Logs", description = "Endpoints pour consulter les journaux d'activité du service utilisateur")
public class LogController {

    private final SystemLogRepository systemLogRepository;

    public LogController(SystemLogRepository systemLogRepository) {
        this.systemLogRepository = systemLogRepository;
    }

    @Operation(summary = "Récupérer tous les logs", description = "Retourne la liste de tous les journaux d'activité, triés par date décroissante.")
    @GetMapping
    public ResponseEntity<List<SystemLog>> getAllLogs() {
        return ResponseEntity.ok(systemLogRepository.findAllByOrderByTimestampDesc());
    }

    @Operation(summary = "Récupérer les logs d'un utilisateur", description = "Retourne les journaux d'activité pour un utilisateur spécifique.")
    @GetMapping("/user/{username}")
    public ResponseEntity<List<SystemLog>> getLogsByUsername(@PathVariable String username) {
        return ResponseEntity.ok(systemLogRepository.findByUsernameOrderByTimestampDesc(username));
    }
}
