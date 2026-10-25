package com.lms.university.service;

import com.lms.university.dto.UniversityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, UniversityEvent> kafkaTemplate;
    private static final String TOPIC = "university-events";

    public void sendEvent(UniversityEvent event) {
        log.info("Sending event to Kafka: {}", event);
        kafkaTemplate.send(TOPIC, event.getType() + "-" + event.getId(), event);
    }
}
