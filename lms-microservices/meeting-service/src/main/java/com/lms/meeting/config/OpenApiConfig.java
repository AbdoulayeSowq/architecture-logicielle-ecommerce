package com.lms.meeting.config;

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
    public OpenAPI meetingServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Meeting Service API")
                        .description("Microservice de gestion des réunions vidéo LiveKit pour le LMS.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("EPT LMS Team")
                                .email("admin@ept.sn")))
                .servers(List.of(
                        new Server().url("http://localhost:8087").description("Serveur local (direct)"),
                        new Server().url("http://localhost:8080").description("Via API Gateway")
                ));
    }
}
