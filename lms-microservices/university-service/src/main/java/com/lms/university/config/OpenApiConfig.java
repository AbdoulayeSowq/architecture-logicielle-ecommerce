package com.lms.university.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI universityServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("University Service API")
                        .description("Microservice de gestion de la structure universitaire : départements, assignation de cours aux départements.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("EPT LMS Team")
                                .email("admin@ept.sn")))
                .servers(List.of(
                        new Server().url("http://localhost:8082").description("Serveur local (direct)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")
                ));
    }
}
