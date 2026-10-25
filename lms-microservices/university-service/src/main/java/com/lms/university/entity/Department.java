package com.lms.university.entity;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dId;

    private String name;

    private String abbreviation;

    private String phone;

    private String email;

    private String description;

    private Long headId;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "cycle_id")
    private Cycle cycle;

    @JsonIgnore
    @ElementCollection
    @CollectionTable(name = "department_courses", joinColumns = @JoinColumn(name = "department_id"))
    @Column(name = "course_id")
    private Set<Long> courseIds = new HashSet<>();

    @JsonIgnore
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "department", orphanRemoval = true)
    private Set<Class> classes = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @PrePersist
    protected void onCreate() {
        int randomNum = (int)(Math.random() * 9000) + 1000;
        String prefix = (abbreviation != null && !abbreviation.isEmpty()) ? abbreviation.toUpperCase() : "DE";
        this.dId = prefix + randomNum;
        this.createdDate = LocalDateTime.now();
    }
}
