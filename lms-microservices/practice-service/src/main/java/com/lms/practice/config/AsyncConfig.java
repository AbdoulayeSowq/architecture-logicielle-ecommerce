package com.lms.practice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Thread pool dédié aux évaluations de code asynchrones.
 * Isolé du thread pool HTTP pour éviter le thread starvation sous charge.
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "submissionExecutor")
    public Executor submissionExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);          // 5 évaluations en parallèle
        executor.setMaxPoolSize(10);          // jusqu'à 10 sous pic de charge
        executor.setQueueCapacity(50);        // file d'attente si saturé
        executor.setThreadNamePrefix("submission-");
        executor.setAwaitTerminationSeconds(30);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.initialize();
        return executor;
    }
}
