package com.lms.course.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Idempotent schema patch:
 * - Drops NOT NULL constraint on integrity_reports.quiz_result_id and .submission_id
 *   so that assignment submissions (quiz_result_id = NULL) and quiz results
 *   (submission_id = NULL) can both be stored.
 * ddl-auto=update does not remove existing NOT NULL constraints, hence this patch.
 */
@Component
public class SchemaMigrationFixer {

    private final DataSource dataSource;

    public SchemaMigrationFixer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void fixIntegrityReportsSchema() {
        String[] statements = {
            "ALTER TABLE IF EXISTS integrity_reports ALTER COLUMN quiz_result_id DROP NOT NULL",
            "ALTER TABLE IF EXISTS integrity_reports ALTER COLUMN submission_id   DROP NOT NULL"
        };
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String sql : statements) {
                stmt.execute(sql);
            }
        } catch (Exception e) {
            System.err.println("[SchemaMigrationFixer] Failed: " + e.getMessage());
        }
    }
}
