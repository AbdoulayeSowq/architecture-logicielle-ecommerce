package com.lms.practice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableDiscoveryClient
@EnableAsync
public class PracticeServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PracticeServiceApplication.class, args);
    }
}
