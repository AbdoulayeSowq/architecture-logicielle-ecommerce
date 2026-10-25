package com.lms.course.repository;

import com.lms.course.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByQuiz(com.lms.course.entity.Quiz quiz);

    @Query("SELECT q FROM Question q WHERE q.quiz.module.id = :moduleId AND q.quiz.isDraft = false")
    List<Question> findByModuleId(@Param("moduleId") Long moduleId);

    @Query("SELECT q FROM Question q WHERE q.quiz.module.id = :moduleId AND q.competence = :competence AND q.quiz.isDraft = false")
    List<Question> findByModuleIdAndCompetence(@Param("moduleId") Long moduleId, @Param("competence") String competence);

    @Query("SELECT q FROM Question q WHERE q.quiz.module.id = :moduleId AND q.difficultyLevel = :difficulty AND q.quiz.isDraft = false")
    List<Question> findByModuleIdAndDifficulty(@Param("moduleId") Long moduleId, @Param("difficulty") Question.DifficultyLevel difficulty);

    @Query("SELECT q FROM Question q WHERE q.quiz.module.id = :moduleId AND q.competence = :competence AND q.difficultyLevel = :difficulty AND q.quiz.isDraft = false")
    List<Question> findByModuleIdAndCompetenceAndDifficulty(@Param("moduleId") Long moduleId, @Param("competence") String competence, @Param("difficulty") Question.DifficultyLevel difficulty);

    @Query("SELECT DISTINCT q.competence FROM Question q WHERE q.quiz.module.id = :moduleId AND q.competence IS NOT NULL AND q.quiz.isDraft = false")
    List<String> findDistinctCompetencesByModuleId(@Param("moduleId") Long moduleId);
}
