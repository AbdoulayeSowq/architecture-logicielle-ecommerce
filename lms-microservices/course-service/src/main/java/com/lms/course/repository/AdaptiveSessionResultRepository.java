package com.lms.course.repository;

import com.lms.course.entity.AdaptiveSessionResult;
import com.lms.course.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdaptiveSessionResultRepository extends JpaRepository<AdaptiveSessionResult, Long> {
    List<AdaptiveSessionResult> findByQuestion(Question question);
}
