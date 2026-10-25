package com.lms.course.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_thread_views", uniqueConstraints = {@UniqueConstraint(columnNames = {"thread_id", "user_id"})})
public class ForumThreadView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_id")
    private ForumThread thread;

    @Column(name = "user_id")
    private String userId;

    private LocalDateTime viewedAt;

    public ForumThreadView() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ForumThread getThread() { return thread; }
    public void setThread(ForumThread thread) { this.thread = thread; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getViewedAt() { return viewedAt; }
    public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
}
