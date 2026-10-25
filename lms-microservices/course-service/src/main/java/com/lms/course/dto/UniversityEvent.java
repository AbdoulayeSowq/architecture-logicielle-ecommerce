package com.lms.course.dto;

import java.time.LocalDateTime;

public class UniversityEvent {
    private String action; // CREATED, UPDATED, DELETED
    private String type;   // DEPT, CLASS
    private Long id;
    private String name;
    private String code;   // did or clid

    public UniversityEvent() {}

    public UniversityEvent(String action, String type, Long id, String name, String code) {
        this.action = action;
        this.type = type;
        this.id = id;
        this.name = name;
        this.code = code;
    }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public static UniversityEventBuilder builder() {
        return new UniversityEventBuilder();
    }

    public static class UniversityEventBuilder {
        private String action;
        private String type;
        private Long id;
        private String name;
        private String code;

        public UniversityEventBuilder action(String action) { this.action = action; return this; }
        public UniversityEventBuilder type(String type) { this.type = type; return this; }
        public UniversityEventBuilder id(Long id) { this.id = id; return this; }
        public UniversityEventBuilder name(String name) { this.name = name; return this; }
        public UniversityEventBuilder code(String code) { this.code = code; return this; }

        public UniversityEvent build() {
            return new UniversityEvent(action, type, id, name, code);
        }
    }
}
