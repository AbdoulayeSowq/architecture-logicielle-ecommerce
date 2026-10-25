package com.lms.user.service;

import com.lms.user.repository.SystemLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
public class LogMaintenanceService {

    private final SystemLogRepository systemLogRepository;

    public LogMaintenanceService(SystemLogRepository systemLogRepository) {
        this.systemLogRepository = systemLogRepository;
    }

    /**
     * Purge les logs vieux de plus de 30 jours.
     * S'exécute tous les jours à 01:00 du matin.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void purgeOldLogs() {
        LocalDateTime limitDate = LocalDateTime.now().minusDays(30);
        log.info("Démarrage de la purge des logs système antérieurs au {}", limitDate);
        try {
            systemLogRepository.deleteByTimestampBefore(limitDate);
            log.info("Purge terminée avec succès.");
        } catch (Exception e) {
            log.error("Erreur lors de la purge des logs : {}", e.getMessage());
        }
    }
}
