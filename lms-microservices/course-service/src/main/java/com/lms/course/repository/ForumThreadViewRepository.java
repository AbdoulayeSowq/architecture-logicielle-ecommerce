package com.lms.course.repository;

import com.lms.course.entity.ForumThreadView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ForumThreadViewRepository extends JpaRepository<ForumThreadView, Long> {
    Optional<ForumThreadView> findByThreadIdAndUserId(Long threadId, String userId);
    long countByThreadId(Long threadId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "INSERT INTO forum_thread_views (thread_id, user_id, viewed_at) VALUES (:threadId, :userId, CURRENT_TIMESTAMP) ON CONFLICT (thread_id, user_id) DO NOTHING", nativeQuery = true)
    int insertIfNotExists(@org.springframework.data.repository.query.Param("threadId") Long threadId, @org.springframework.data.repository.query.Param("userId") String userId);
}
