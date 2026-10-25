package com.lms.course.repository;

import com.lms.course.entity.ForumUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumUpvoteRepository extends JpaRepository<ForumUpvote, Long> {
    Optional<ForumUpvote> findByUserIdAndThreadId(String userId, Long threadId);
    Optional<ForumUpvote> findByUserIdAndPostId(String userId, Long postId);
    void deleteByUserIdAndThreadId(String userId, Long threadId);
    void deleteByUserIdAndPostId(String userId, Long postId);
}
