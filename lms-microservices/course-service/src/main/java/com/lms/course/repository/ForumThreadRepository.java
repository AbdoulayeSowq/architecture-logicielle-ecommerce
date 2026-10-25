package com.lms.course.repository;

import com.lms.course.entity.CModule;
import com.lms.course.entity.ForumThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumThreadRepository extends JpaRepository<ForumThread, Long> {
    @Query("SELECT ft.id, ft.title, ft.content, ft.authorId, ft.authorName, ft.moduleId, ft.viewCount, " +
           "(ft.upvoteCount + (SELECT COALESCE(SUM(p.upvoteCount), 0) FROM ForumPost p WHERE p.thread.id = ft.id)), " +
           "ft.isClosed, ft.createdAt, ft.updatedAt, " +
           "(SELECT COUNT(p) FROM ForumPost p WHERE p.thread.id = ft.id), " +
           "(SELECT COUNT(p) FROM ForumPost p WHERE p.thread.id = ft.id AND p.isSolution = true) " +
           "FROM ForumThread ft WHERE ft.moduleId = :moduleId")
    List<Object[]> findThreadIdsByModuleId(@Param("moduleId") Long moduleId);
    List<ForumThread> findByModuleId(Long moduleId);
    List<ForumThread> findByModule(CModule module);
    List<ForumThread> findByAuthorId(String authorId);
    boolean existsByTitleAndModuleId(String title, Long moduleId);
    List<ForumThread> findAll();
}
