package com.lms.course.repository;

import com.lms.course.entity.ForumPost;
import com.lms.course.entity.ForumThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findByThread(ForumThread thread);
    List<ForumPost> findByThreadId(Long threadId);
    List<ForumPost> findByAuthorId(String authorId);
}
