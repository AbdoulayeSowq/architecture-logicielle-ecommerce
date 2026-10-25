package com.lms.course.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import org.springframework.web.bind.annotation.RequestBody;
import com.lms.course.dto.EvaluateAnswerRequest;
import com.lms.course.dto.EvaluateAnswerResponse;

@FeignClient(name = "ai-service")
public interface AiClient {

    @PostMapping("/api/ai/chatbot/index-material")
    void indexMaterial(@RequestParam("materialId") Long materialId, 
                       @RequestParam("moduleId") String moduleId, 
                       @RequestParam("fileUrl") String fileUrl);

    @PostMapping("/api/ai/chatbot/evaluate-answer")
    EvaluateAnswerResponse evaluateAnswer(@RequestBody EvaluateAnswerRequest request);
}
