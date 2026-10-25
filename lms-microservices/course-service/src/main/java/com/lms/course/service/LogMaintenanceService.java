package com.lms.course.service;

import com.lms.course.repository.SystemLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
public class LogMaintenanceService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LogMaintenanceService.class);

    private final SystemLogRepository systemLogRepository;

    public LogMaintenanceService(SystemLogRepository systemLogRepository) {
        this.systemLogRepository = systemLogRepository;
    }

    /**
     * Purge les logs vieux de plus de 30 jours.
     * S'exécute tous les jours à 01:30 du matin (décalé par rapport au user-service).
     */
    @Scheduled(cron = "0 30 1 * * ?")
    @Transactional
    public void purgeOldLogs() {
        LocalDateTime limitDate = LocalDateTime.now().minusDays(30);
        log.info("Démarrage de la purge des logs course-service antérieurs au {}", limitDate);
        try {
            systemLogRepository.deleteByTimestampBefore(limitDate);
            log.info("Purge course-service terminée avec succès.");
        } catch (Exception e) {
            log.error("Erreur lors de la purge des logs course-service : {}", e.getMessage());
        }
    }
}
