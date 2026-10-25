package com.lms.practice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(PistonProperties.class)
public class PracticeConfig {

    /**
     * RestTemplate with Eureka load-balancing so that calls to
     * "http://user-service/..." are resolved via the service registry.
     */
    @Bean
    @LoadBalanced
    public RestTemplate practiceRestTemplate() {
        return new RestTemplate();
    }

    /**
     * Standard RestTemplate without Eureka load-balancing for direct external calls
     * (e.g. calling Judge0 at localhost or judge0 directly).
     */
    @Bean
    public RestTemplate standardRestTemplate() {
        return new RestTemplate();
    }
}
