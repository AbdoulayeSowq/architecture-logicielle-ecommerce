package com.lms.course.aspect;

import com.lms.course.entity.SystemLog;
import com.lms.course.repository.SystemLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

@Aspect
@Component
public class LoggingAspect {
    private final Logger log = LoggerFactory.getLogger(this.getClass());
    private final SystemLogRepository systemLogRepository;

    public LoggingAspect(SystemLogRepository systemLogRepository) {
        this.systemLogRepository = systemLogRepository;
    }

    @Around("execution(* com.lms.course.controller..*(..))")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        
        HttpServletRequest request = null;
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            request = attributes.getRequest();
        }

        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getSignature().getDeclaringTypeName();
        Object[] args = joinPoint.getArgs();

        Object proceed;
        try {
            proceed = joinPoint.proceed();
        } catch (Throwable e) {
            saveLog("ERROR", "API_ERROR", 
                    String.format("Method %s in %s failed with error: %s", methodName, className, e.getMessage()), 
                    request);
            throw e;
        }

        long executionTime = System.currentTimeMillis() - start;
        
        // Log to console
        log.info("{} finished in {} ms", joinPoint.getSignature(), executionTime);

        // Save important actions to DB (optional: filter by method or path)
        if (isWriteAction(methodName)) {
            saveLog("INFO", "API_ACTION", 
                    String.format("Method %s called with args: %s. Exec time: %dms", methodName, Arrays.toString(args), executionTime), 
                    request);
        }

        return proceed;
    }

    private boolean isWriteAction(String methodName) {
        return methodName.startsWith("create") || 
               methodName.startsWith("update") || 
               methodName.startsWith("delete") || 
               methodName.contains("upvote") ||
               methodName.contains("mark");
    }

    private void saveLog(String level, String category, String details, HttpServletRequest request) {
        try {
            SystemLog systemLog = new SystemLog();
            systemLog.setLevel(level);
            systemLog.setCategory(category);
            systemLog.setDetails(details);
            
            if (request != null) {
                systemLog.setAction(request.getMethod() + " " + request.getRequestURI());
                systemLog.setIpAddress(request.getRemoteAddr());
                // Extract username from header (set by Gateway) or query param
                String username = request.getHeader("loggedInUser");
                if (username == null || username.isEmpty()) {
                    username = request.getParameter("username");
                }
                systemLog.setUsername(username != null ? username : "SYSTEM");
            } else {
                systemLog.setAction("INTERNAL");
                systemLog.setUsername("SYSTEM");
            }
            
            systemLogRepository.save(systemLog);
        } catch (Exception e) {
            log.error("Failed to save system log: {}", e.getMessage());
        }
    }
}
