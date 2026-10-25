package com.lms.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Spring Cloud Config Server — LMS EPT
 *
 * Centralise la configuration de tous les microservices.
 * Lit les fichiers depuis config-repo/ en mode natif (filesystem local).
 *
 * Démarrer EN PREMIER avant tout autre service.
 * URL: http://localhost:8888
 *
 * Vérification: http://localhost:8888/user-service/default
 */
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
