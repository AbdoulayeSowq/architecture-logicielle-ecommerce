package com.lms.announcement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

@Configuration
public class CacheConfig {

    /**
     * Enregistre un filtre de mise en cache HTTP ETag (Shallow ETag Filter).
     * Ce filtre calcule un MD5 du JSON renvoyé par les contrôleurs du microservice.
     * Si les données n'ont pas changé depuis la dernière requête du client,
     * le serveur répond immédiatement par un HTTP 304 Not Modified vide.
     */
    @Bean
    public ShallowEtagHeaderFilter etagFilter() {
        return new ShallowEtagHeaderFilter();
    }
}
