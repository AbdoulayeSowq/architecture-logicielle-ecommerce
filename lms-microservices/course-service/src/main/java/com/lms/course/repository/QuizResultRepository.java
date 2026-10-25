package com.lms.course.repository;

import com.lms.course.entity.Quiz;
import com.lms.course.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByQuiz(Quiz quiz);
    List<QuizResult> findByStudentId(String studentId);
    List<QuizResult> findByQuizAndStudentId(Quiz quiz, String studentId);
    Optional<QuizResult> findFirstByQuizAndStudentIdOrderByAttemptNumberDesc(Quiz quiz, String studentId);
    long countByQuizAndStudentId(Quiz quiz, String studentId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT qr.studentId FROM QuizResult qr WHERE qr.quiz.module.id = :moduleId")
    java.util.List<String> findDistinctStudentIdsByQuizModuleId(Long moduleId);

    @org.springframework.data.jpa.repository.Query("SELECT qr FROM QuizResult qr WHERE qr.quiz.module.id = :moduleId")
    java.util.List<QuizResult> findByModuleId(Long moduleId);
}
