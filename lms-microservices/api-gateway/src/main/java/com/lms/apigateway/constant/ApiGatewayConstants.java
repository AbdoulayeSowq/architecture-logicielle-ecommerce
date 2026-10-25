package com.lms.apigateway.constant;

public class ApiGatewayConstants {
    public static final String USER_SERVICE_URI = System.getenv("USER_SERVICE_URI") != null 
            ? System.getenv("USER_SERVICE_URI") : "http://localhost:8081";
            
    public static final String UNIVERSITY_SERVICE_URI = System.getenv("UNIVERSITY_SERVICE_URI") != null 
            ? System.getenv("UNIVERSITY_SERVICE_URI") : "http://localhost:8082";
            
    public static final String COURSE_SERVICE_URI = System.getenv("COURSE_SERVICE_URI") != null 
            ? System.getenv("COURSE_SERVICE_URI") : "http://localhost:8083";
            
    public static final String ANNOUNCEMENT_SERVICE_URI = System.getenv("ANNOUNCEMENT_SERVICE_URI") != null 
            ? System.getenv("ANNOUNCEMENT_SERVICE_URI") : "http://localhost:8086";
}