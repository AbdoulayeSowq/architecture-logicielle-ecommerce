package com.lms.course.service;

import com.lms.course.dto.UniversityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class UniversityEventListener {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UniversityEventListener.class);
    
    private final com.lms.course.repository.TeachingUnitRepository teachingUnitRepository;

    public UniversityEventListener(com.lms.course.repository.TeachingUnitRepository teachingUnitRepository) {
        this.teachingUnitRepository = teachingUnitRepository;
    }

    @KafkaListener(topics = "university-events", groupId = "lms-group", autoStartup = "${spring.kafka.listener.auto-startup:true}")
    public void handleUniversityEvent(UniversityEvent event) {
        log.info("Received event from Kafka: {}", event);
        
        if ("DELETED".equals(event.getAction())) {
            log.warn("University {} with ID {} was deleted. Check for orphaned courses!", event.getType(), event.getId());
        } else {
            if ("DEPT".equals(event.getType())) {
                updateDepartments(event);
            } else if ("CLASS".equals(event.getType())) {
                updateClasses(event);
            }
        }
    }

    private void updateDepartments(UniversityEvent event) {
        var units = teachingUnitRepository.findByDepartmentCode(event.getCode());
        if (units.isEmpty() && event.getName() != null) {
            String shortName = event.getName().contains("(") ? 
                               event.getName().substring(event.getName().indexOf("(")+1, event.getName().indexOf(")")) : 
                               event.getName();
            
            String normalizedShortName = shortName.replaceAll("[\\s-]+", "").toUpperCase();

            units = teachingUnitRepository.findAll().stream()
                    .filter(tu -> {
                        if (tu.getDepartmentCode() != null) return false;
                        String tuName = tu.getName().replaceAll("[\\s-]+", "").toUpperCase();
                        String tuDesc = (tu.getDescription() != null) ? tu.getDescription().replaceAll("[\\s-]+", "").toUpperCase() : "";
                        return tuName.contains(normalizedShortName) || tuDesc.contains(normalizedShortName);
                    })
                    .toList();
        }
        if (!units.isEmpty()) {
            units.forEach(tu -> {
                tu.setDepartmentId(event.getId());
                tu.setDepartmentCode(event.getCode());
                log.info(">>>> AUTO-SYNC: Updated TU {} with Department {} ({})", tu.getName(), event.getName(), event.getCode());
            });
            teachingUnitRepository.saveAll(units);
        }
    }

    private void updateClasses(UniversityEvent event) {
        var units = teachingUnitRepository.findByClassCode(event.getCode());
        if (units.isEmpty() && event.getName() != null) {
            // On normalise (ex: "DIC1 GIT" -> "DIC1GIT")
            String normalizedEventName = event.getName().replaceAll("[\\s-]+", "").toUpperCase();

            units = teachingUnitRepository.findAll().stream()
                    .filter(tu -> {
                        if (tu.getClassCode() != null) return false;
                        String tuName = tu.getName().replaceAll("[\\s-]+", "").toUpperCase();
                        String tuDesc = (tu.getDescription() != null) ? tu.getDescription().replaceAll("[\\s-]+", "").toUpperCase() : "";
                        return tuName.contains(normalizedEventName) || tuDesc.contains(normalizedEventName);
                    })
                    .toList();
        }
        if (!units.isEmpty()) {
            units.forEach(tu -> {
                tu.setClassId(event.getId());
                tu.setClassCode(event.getCode());
                log.info(">>>> AUTO-SYNC: Updated TU {} with Class {} ({})", tu.getName(), event.getName(), event.getCode());
            });
            teachingUnitRepository.saveAll(units);
        }
    }
}
