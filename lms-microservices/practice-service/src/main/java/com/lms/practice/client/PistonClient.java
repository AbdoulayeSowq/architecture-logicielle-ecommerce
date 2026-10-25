package com.lms.practice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.lms.practice.config.PistonProperties;
import com.lms.practice.entity.SubmissionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
public class PistonClient {

    private static final Logger log = LoggerFactory.getLogger(PistonClient.class);

    private final RestTemplate restTemplate;
    private final PistonProperties properties;

    public PistonClient(@Qualifier("standardRestTemplate") RestTemplate standardRestTemplate, PistonProperties properties) {
        this.restTemplate = standardRestTemplate;
        this.properties = properties;
    }

    public JudgeResult execute(String sourceCode, String language, String stdin) {
        try {
            String url = properties.getBaseUrl() + "/api/v2/execute";
            String filename = getFilenameForLanguage(language);

            PistonRequest request = new PistonRequest(
                    toPistonLanguage(language),
                    "*",
                    List.of(new PistonFile(filename, sourceCode)),
                    stdin != null ? stdin : ""
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PistonRequest> entity = new HttpEntity<>(request, headers);

            log.debug("[PistonClient] POST → {}", url);
            ResponseEntity<PistonResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, PistonResponse.class);

            PistonResponse body = response.getBody();
            if (body == null) {
                throw new IllegalStateException("Piston returned empty response");
            }

            return mapResponse(body);
        } catch (Exception e) {
            log.error("Failed to execute code via Piston: {}", e.getMessage(), e);
            JudgeResult err = new JudgeResult();
            err.setStatus(SubmissionStatus.INTERNAL_ERROR);
            err.setStderr("Piston execution error: " + e.getMessage());
            return err;
        }
    }

    private String getFilenameForLanguage(String language) {
        return switch (language.toLowerCase()) {
            case "python"     -> "solution.py";
            case "java"       -> "Solution.java";
            case "c++", "cpp" -> "solution.cpp";
            case "c"          -> "solution.c";
            case "javascript" -> "solution.js";
            default           -> throw new IllegalArgumentException("Unsupported language: " + language
                    + ". Supported: python, java, javascript, c, c++");
        };
    }

    /**
     * Maps our internal language names to the identifiers expected by Piston API.
     * e.g. "cpp" → "c++", "javascript" → "javascript"
     */
    private String toPistonLanguage(String language) {
        return switch (language.toLowerCase()) {
            case "cpp" -> "c++";
            default    -> language.toLowerCase();
        };
    }

    private JudgeResult mapResponse(PistonResponse response) {
        JudgeResult result = new JudgeResult();

        if (response.compile != null && response.compile.code != 0) {
            result.setStatus(SubmissionStatus.COMPILE_ERROR);
            result.setCompileOutput(response.compile.output);
            result.setStderr(response.compile.stderr);
            return result;
        }

        if (response.run != null) {
            result.setStdout(response.run.stdout);
            result.setStderr(response.run.stderr);
            if (response.run.code != 0) {
                if ("SIGKILL".equals(response.run.signal)) {
                    result.setStatus(SubmissionStatus.TIME_LIMIT_EXCEEDED);
                } else {
                    result.setStatus(SubmissionStatus.RUNTIME_ERROR);
                }
            } else {
                result.setStatus(SubmissionStatus.ACCEPTED);
            }
            return result;
        }

        result.setStatus(SubmissionStatus.INTERNAL_ERROR);
        result.setStderr("No execution output from Piston");
        return result;
    }

    // ── Output Result DTO ─────────────────────────────────────────────────────────

    public static class JudgeResult {
        private SubmissionStatus status;
        private String stdout;
        private String stderr;
        private String compileOutput;
        private Long timeMs;

        public SubmissionStatus getStatus() { return status; }
        public void setStatus(SubmissionStatus status) { this.status = status; }
        public String getStdout() { return stdout; }
        public void setStdout(String stdout) { this.stdout = stdout; }
        public String getStderr() { return stderr; }
        public void setStderr(String stderr) { this.stderr = stderr; }
        public String getCompileOutput() { return compileOutput; }
        public void setCompileOutput(String compileOutput) { this.compileOutput = compileOutput; }
        public Long getTimeMs() { return timeMs; }
        public void setTimeMs(Long timeMs) { this.timeMs = timeMs; }

        public boolean isAccepted() {
            return status == SubmissionStatus.ACCEPTED;
        }
    }

    // ── Jackson Mapping ──────────────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PistonRequest {
        public String language;
        public String version;
        public List<PistonFile> files;
        public String stdin;

        public PistonRequest(String language, String version, List<PistonFile> files, String stdin) {
            this.language = language;
            this.version = version;
            this.files = files;
            this.stdin = stdin;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PistonFile {
        public String name;
        public String content;

        public PistonFile(String name, String content) {
            this.name = name;
            this.content = content;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PistonResponse {
        public String language;
        public String version;
        public ExecutionResult run;
        public ExecutionResult compile;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ExecutionResult {
        public String stdout;
        public String stderr;
        public int code;
        public String signal;
        public String output;
    }
}
