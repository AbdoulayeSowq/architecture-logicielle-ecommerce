package com.lms.user.client;

import com.lms.user.dto.CModuleDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "course-service")
public interface CourseClient {

    @GetMapping("/api/modules/{id}")
    CModuleDTO getModuleById(@PathVariable("id") Long id);
}
