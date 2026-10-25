# API Usage Examples for New Database Features

## Overview
This document provides practical examples of how to use the new entities and repositories in your service layer and controllers.

---

## ExerciseComment API Examples

### 1. Create a Root Comment
```java
@PostMapping("/exercises/{exerciseId}/comments")
public ResponseEntity<ExerciseComment> createComment(
    @PathVariable Long exerciseId,
    @RequestBody CreateCommentRequest request,
    @RequestHeader("X-User-Id") String userId) {
    
    CodingExercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new NotFoundException("Exercise not found"));
    
    ExerciseComment comment = new ExerciseComment();
    comment.setExercise(exercise);
    comment.setStudentId(userId);
    comment.setStudentName(request.getStudentName());
    comment.setContent(request.getContent());
    comment.setStatus(ExerciseComment.CommentStatus.PENDING);
    
    ExerciseComment saved = commentRepository.save(comment);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
}
```

### 2. Create a Nested Reply
```java
@PostMapping("/comments/{parentCommentId}/replies")
public ResponseEntity<ExerciseComment> createReply(
    @PathVariable Long parentCommentId,
    @RequestBody CreateCommentRequest request,
    @RequestHeader("X-User-Id") String userId) {
    
    ExerciseComment parentComment = commentRepository.findById(parentCommentId)
        .orElseThrow(() -> new NotFoundException("Parent comment not found"));
    
    ExerciseComment reply = new ExerciseComment();
    reply.setExercise(parentComment.getExercise());
    reply.setParentComment(parentComment);
    reply.setStudentId(userId);
    reply.setStudentName(request.getStudentName());
    reply.setContent(request.getContent());
    reply.setStatus(ExerciseComment.CommentStatus.PENDING);
    
    ExerciseComment saved = commentRepository.save(reply);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
}
```

### 3. Get Root Comments for an Exercise
```java
@GetMapping("/exercises/{exerciseId}/comments")
public ResponseEntity<List<ExerciseComment>> getComments(
    @PathVariable Long exerciseId) {
    
    List<ExerciseComment> comments = commentRepository
        .findByExerciseIdAndParentCommentIsNullOrderByCreatedAtDesc(exerciseId);
    
    return ResponseEntity.ok(comments);
}
```

### 4. Get Replies for a Comment
```java
@GetMapping("/comments/{parentCommentId}/replies")
public ResponseEntity<List<ExerciseComment>> getReplies(
    @PathVariable Long parentCommentId) {
    
    List<ExerciseComment> replies = commentRepository
        .findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
    
    return ResponseEntity.ok(replies);
}
```

### 5. Get Approved Comments Only
```java
@GetMapping("/exercises/{exerciseId}/comments/approved")
public ResponseEntity<List<ExerciseComment>> getApprovedComments(
    @PathVariable Long exerciseId) {
    
    List<ExerciseComment> approved = commentRepository
        .findApprovedRootCommentsByExerciseId(exerciseId);
    
    return ResponseEntity.ok(approved);
}
```

### 6. Approve a Comment
```java
@PutMapping("/comments/{commentId}/approve")
public ResponseEntity<ExerciseComment> approveComment(
    @PathVariable Long commentId) {
    
    ExerciseComment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new NotFoundException("Comment not found"));
    
    comment.setStatus(ExerciseComment.CommentStatus.APPROVED);
    ExerciseComment updated = commentRepository.save(comment);
    
    return ResponseEntity.ok(updated);
}
```

### 7. Delete a Comment (Soft Delete)
```java
@DeleteMapping("/comments/{commentId}")
public ResponseEntity<Void> deleteComment(
    @PathVariable Long commentId) {
    
    ExerciseComment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new NotFoundException("Comment not found"));
    
    comment.setStatus(ExerciseComment.CommentStatus.DELETED);
    commentRepository.save(comment);
    
    return ResponseEntity.noContent().build();
}
```

### 8. Upvote a Comment
```java
@PostMapping("/comments/{commentId}/upvote")
public ResponseEntity<ExerciseComment> upvoteComment(
    @PathVariable Long commentId) {
    
    ExerciseComment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new NotFoundException("Comment not found"));
    
    comment.setUpvotes(comment.getUpvotes() + 1);
    ExerciseComment updated = commentRepository.save(comment);
    
    return ResponseEntity.ok(updated);
}
```

### 9. Get Student's Comments
```java
@GetMapping("/users/{userId}/comments")
public ResponseEntity<List<ExerciseComment>> getStudentComments(
    @PathVariable String userId) {
    
    List<ExerciseComment> comments = commentRepository
        .findByStudentIdOrderByCreatedAtDesc(userId);
    
    return ResponseEntity.ok(comments);
}
```

---

## PublicSolution API Examples

### 1. Share a Solution
```java
@PostMapping("/exercises/{exerciseId}/solutions")
public ResponseEntity<PublicSolution> shareSolution(
    @PathVariable Long exerciseId,
    @RequestBody ShareSolutionRequest request,
    @RequestHeader("X-User-Id") String userId) {
    
    CodingExercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new NotFoundException("Exercise not found"));
    
    PublicSolution solution = new PublicSolution();
    solution.setExercise(exercise);
    solution.setStudentId(userId);
    solution.setStudentName(request.getStudentName());
    solution.setSourceCode(request.getSourceCode());
    solution.setLanguage(request.getLanguage());
    solution.setExecutionTimeMs(request.getExecutionTimeMs());
    solution.setStatus(PublicSolution.SolutionStatus.PUBLIC);
    
    PublicSolution saved = solutionRepository.save(solution);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
}
```

### 2. Get Public Solutions for an Exercise
```java
@GetMapping("/exercises/{exerciseId}/solutions/public")
public ResponseEntity<List<PublicSolution>> getPublicSolutions(
    @PathVariable Long exerciseId) {
    
    List<PublicSolution> solutions = solutionRepository
        .findByExerciseIdAndStatusOrderByCreatedAtDesc(
            exerciseId, 
            PublicSolution.SolutionStatus.PUBLIC
        );
    
    return ResponseEntity.ok(solutions);
}
```

### 3. Get Top Solutions (Ranked by Upvotes)
```java
@GetMapping("/exercises/{exerciseId}/solutions/top")
public ResponseEntity<List<PublicSolution>> getTopSolutions(
    @PathVariable Long exerciseId,
    @RequestParam(defaultValue = "10") int limit) {
    
    List<PublicSolution> topSolutions = solutionRepository
        .findByExerciseIdAndStatusOrderByUpvotesDescCreatedAtDesc(
            exerciseId,
            PublicSolution.SolutionStatus.PUBLIC
        )
        .stream()
        .limit(limit)
        .toList();
    
    return ResponseEntity.ok(topSolutions);
}
```

### 4. Get Student's Solutions
```java
@GetMapping("/users/{userId}/solutions")
public ResponseEntity<List<PublicSolution>> getStudentSolutions(
    @PathVariable String userId) {
    
    List<PublicSolution> solutions = solutionRepository
        .findByStudentIdOrderByCreatedAtDesc(userId);
    
    return ResponseEntity.ok(solutions);
}
```

### 5. Upvote a Solution
```java
@PostMapping("/solutions/{solutionId}/upvote")
public ResponseEntity<PublicSolution> upvoteSolution(
    @PathVariable Long solutionId) {
    
    PublicSolution solution = solutionRepository.findById(solutionId)
        .orElseThrow(() -> new NotFoundException("Solution not found"));
    
    solution.setUpvotes(solution.getUpvotes() + 1);
    PublicSolution updated = solutionRepository.save(solution);
    
    return ResponseEntity.ok(updated);
}
```

### 6. Report a Solution
```java
@PutMapping("/solutions/{solutionId}/report")
public ResponseEntity<PublicSolution> reportSolution(
    @PathVariable Long solutionId,
    @RequestBody ReportRequest request) {
    
    PublicSolution solution = solutionRepository.findById(solutionId)
        .orElseThrow(() -> new NotFoundException("Solution not found"));
    
    solution.setStatus(PublicSolution.SolutionStatus.REPORTED);
    PublicSolution updated = solutionRepository.save(solution);
    
    // Log the report for moderation
    logger.info("Solution {} reported: {}", solutionId, request.getReason());
    
    return ResponseEntity.ok(updated);
}
```

### 7. Approve a Solution (Admin)
```java
@PutMapping("/solutions/{solutionId}/approve")
@Secured("ROLE_ADMIN")
public ResponseEntity<PublicSolution> approveSolution(
    @PathVariable Long solutionId,
    @RequestHeader("X-Admin-Id") String adminId) {
    
    PublicSolution solution = solutionRepository.findById(solutionId)
        .orElseThrow(() -> new NotFoundException("Solution not found"));
    
    solution.setStatus(PublicSolution.SolutionStatus.PUBLIC);
    solution.setApprovedBy(adminId);
    solution.setApprovedAt(LocalDateTime.now());
    
    PublicSolution updated = solutionRepository.save(solution);
    return ResponseEntity.ok(updated);
}
```

### 8. Get Solution Count for Analytics
```java
@GetMapping("/exercises/{exerciseId}/solutions/count")
public ResponseEntity<Long> countPublicSolutions(
    @PathVariable Long exerciseId) {
    
    Long count = solutionRepository
        .countPublicSolutionsByExerciseId(exerciseId);
    
    return ResponseEntity.ok(count);
}
```

### 9. Get All Public Solutions (Browse)
```java
@GetMapping("/solutions/public")
public ResponseEntity<List<PublicSolution>> browsePublicSolutions(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) {
    
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    
    List<PublicSolution> solutions = solutionRepository
        .findByStatusOrderByCreatedAtDesc(PublicSolution.SolutionStatus.PUBLIC)
        .stream()
        .skip((long) page * size)
        .limit(size)
        .toList();
    
    return ResponseEntity.ok(solutions);
}
```

### 10. Save Draft Solution (Private)
```java
@PostMapping("/exercises/{exerciseId}/solutions/draft")
public ResponseEntity<PublicSolution> saveDraft(
    @PathVariable Long exerciseId,
    @RequestBody SaveDraftRequest request,
    @RequestHeader("X-User-Id") String userId) {
    
    CodingExercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new NotFoundException("Exercise not found"));
    
    PublicSolution draft = new PublicSolution();
    draft.setExercise(exercise);
    draft.setStudentId(userId);
    draft.setSourceCode(request.getSourceCode());
    draft.setLanguage(request.getLanguage());
    draft.setStatus(PublicSolution.SolutionStatus.PRIVATE);
    
    PublicSolution saved = solutionRepository.save(draft);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
}
```

---

## CodingExercise Video Fields Examples

### 1. Add Video to Exercise
```java
@PutMapping("/exercises/{exerciseId}/video")
public ResponseEntity<CodingExercise> addVideo(
    @PathVariable Long exerciseId,
    @RequestBody AddVideoRequest request) {
    
    CodingExercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new NotFoundException("Exercise not found"));
    
    exercise.setVideoUrl(request.getVideoUrl());
    exercise.setVideoTitle(request.getVideoTitle());
    exercise.setVideoDescription(request.getVideoDescription());
    
    CodingExercise updated = exerciseRepository.save(exercise);
    return ResponseEntity.ok(updated);
}
```

### 2. Get Exercise with Video
```java
@GetMapping("/exercises/{exerciseId}")
public ResponseEntity<CodingExerciseDto> getExercise(
    @PathVariable Long exerciseId) {
    
    CodingExercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new NotFoundException("Exercise not found"));
    
    CodingExerciseDto dto = new CodingExerciseDto();
    dto.setId(exercise.getId());
    dto.setTitle(exercise.getTitle());
    dto.setDescription(exercise.getDescription());
    dto.setVideoUrl(exercise.getVideoUrl());
    dto.setVideoTitle(exercise.getVideoTitle());
    dto.setVideoDescription(exercise.getVideoDescription());
    // ... other fields
    
    return ResponseEntity.ok(dto);
}
```

---

## Request/Response DTOs

### CreateCommentRequest
```java
public class CreateCommentRequest {
    private String studentName;
    private String content;
    
    // getters/setters
}
```

### ShareSolutionRequest
```java
public class ShareSolutionRequest {
    private String studentName;
    private String sourceCode;
    private String language;
    private Long executionTimeMs;
    
    // getters/setters
}
```

### AddVideoRequest
```java
public class AddVideoRequest {
    private String videoUrl;
    private String videoTitle;
    private String videoDescription;
    
    // getters/setters
}
```

---

## Service Layer Pattern

```java
@Service
@Transactional
public class ExerciseCommentService {
    
    @Autowired
    private ExerciseCommentRepository commentRepository;
    
    @Autowired
    private CodingExerciseRepository exerciseRepository;
    
    public ExerciseComment createComment(Long exerciseId, CreateCommentRequest request, String userId) {
        CodingExercise exercise = exerciseRepository.findById(exerciseId)
            .orElseThrow(() -> new NotFoundException("Exercise not found"));
        
        ExerciseComment comment = new ExerciseComment();
        comment.setExercise(exercise);
        comment.setStudentId(userId);
        comment.setStudentName(request.getStudentName());
        comment.setContent(request.getContent());
        comment.setStatus(ExerciseComment.CommentStatus.PENDING);
        
        return commentRepository.save(comment);
    }
    
    public List<ExerciseComment> getApprovedComments(Long exerciseId) {
        return commentRepository.findApprovedRootCommentsByExerciseId(exerciseId);
    }
    
    public void approveComment(Long commentId) {
        ExerciseComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new NotFoundException("Comment not found"));
        
        comment.setStatus(ExerciseComment.CommentStatus.APPROVED);
        commentRepository.save(comment);
    }
}
```

---

## Performance Considerations

### Index Usage
- Query by `exerciseId`: Uses idx_exercise_id for fast lookups
- Filter by `status`: Uses idx_status for approval queries
- Sort by `upvotes`: Uses idx_upvotes for ranking
- Sort by `createdAt`: Uses idx_created_at for chronological queries

### Pagination Recommendation
```java
Pageable pageable = PageRequest.of(page, size, Sort.by("upvotes").descending());
Page<PublicSolution> solutions = solutionRepository.findAll(pageable);
```

### N+1 Query Prevention
```java
@EntityGraph(attributePaths = {"exercise", "parentComment"})
List<ExerciseComment> findByExerciseIdAndParentCommentIsNull(Long exerciseId);
```

---

## Error Handling

```java
@ExceptionHandler(NotFoundException.class)
public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ErrorResponse(e.getMessage()));
}

@ExceptionHandler(DataIntegrityViolationException.class)
public ResponseEntity<ErrorResponse> handleIntegrityViolation(DataIntegrityViolationException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ErrorResponse("Invalid data provided"));
}
```

---

## Testing Examples

```java
@SpringBootTest
class ExerciseCommentRepositoryTest {
    
    @Autowired
    private ExerciseCommentRepository commentRepository;
    
    @Test
    void testFindRootComments() {
        List<ExerciseComment> comments = commentRepository
            .findByExerciseIdAndParentCommentIsNullOrderByCreatedAtDesc(1L);
        
        assertNotNull(comments);
    }
    
    @Test
    void testCreateNestedComment() {
        ExerciseComment parent = new ExerciseComment();
        // setup parent
        
        ExerciseComment reply = new ExerciseComment();
        reply.setParentComment(parent);
        // setup reply
        
        commentRepository.save(reply);
        
        List<ExerciseComment> replies = commentRepository
            .findByParentCommentIdOrderByCreatedAtAsc(parent.getId());
        
        assertEquals(1, replies.size());
    }
}
```

---

## Summary

All new entities are production-ready with:
- ✅ Full CRUD operations via repositories
- ✅ Optimized query methods for common use cases
- ✅ Database indexes for performance
- ✅ Cascading delete for data integrity
- ✅ Audit timestamps for tracking
- ✅ Status enums for state management
