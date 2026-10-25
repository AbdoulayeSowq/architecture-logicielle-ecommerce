package com.lms.course.controller;

import com.lms.course.entity.Attendance;
import com.lms.course.repository.AttendanceRepository;
import com.lms.course.repository.ModuleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/course/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final ModuleRepository moduleRepository;
    private final com.lms.course.repository.CourseRepository courseRepository;
    private final com.lms.course.client.UserClient userClient;

    public AttendanceController(AttendanceRepository attendanceRepository, ModuleRepository moduleRepository, com.lms.course.repository.CourseRepository courseRepository, com.lms.course.client.UserClient userClient) {
        this.attendanceRepository = attendanceRepository;
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
        this.userClient = userClient;
    }

    private static class TokenData {
        String sessionOrModuleId;
        boolean isOnline;
        Double profLatitude;
        Double profLongitude;
        TokenData(String sessionOrModuleId, boolean isOnline, Double profLatitude, Double profLongitude) {
            this.sessionOrModuleId = sessionOrModuleId;
            this.isOnline = isOnline;
            this.profLatitude = profLatitude;
            this.profLongitude = profLongitude;
        }
    }

    private static final Map<String, TokenData> activeQrTokens = new ConcurrentHashMap<>();

    public static class QrTokenRequest {
        private String moduleId;
        private Long sessionId;
        private boolean isOnline;
        private Double profLatitude;
        private Double profLongitude;
        public String getModuleId() { return moduleId; }
        public void setModuleId(String moduleId) { this.moduleId = moduleId; }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public boolean isOnline() { return isOnline; }
        public void setIsOnline(boolean isOnline) { this.isOnline = isOnline; }
        public Double getProfLatitude() { return profLatitude; }
        public void setProfLatitude(Double profLatitude) { this.profLatitude = profLatitude; }
        public Double getProfLongitude() { return profLongitude; }
        public void setProfLongitude(Double profLongitude) { this.profLongitude = profLongitude; }
    }

    public static class QrScanRequest {
        private String token;
        private String studentId;
        private Double latitude;
        private Double longitude;
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    public static class AttendanceReport {
        private java.util.List<com.lms.course.client.UserClient.StudentDTO> present;
        private java.util.List<com.lms.course.client.UserClient.StudentDTO> absent;
        private int totalExpected;
        private int totalPresent;

        public java.util.List<com.lms.course.client.UserClient.StudentDTO> getPresent() { return present; }
        public void setPresent(java.util.List<com.lms.course.client.UserClient.StudentDTO> present) { this.present = present; }
        public java.util.List<com.lms.course.client.UserClient.StudentDTO> getAbsent() { return absent; }
        public void setAbsent(java.util.List<com.lms.course.client.UserClient.StudentDTO> absent) { this.absent = absent; }
        public int getTotalExpected() { return totalExpected; }
        public void setTotalExpected(int totalExpected) { this.totalExpected = totalExpected; }
        public int getTotalPresent() { return totalPresent; }
        public void setTotalPresent(int totalPresent) { this.totalPresent = totalPresent; }
    }

    public static class StudentAttendanceDTO {
        private String moduleName;
        private String sessionTitle;
        private LocalDate date;
        private String startTime;
        private String endTime;
        private String scanTime; // L'heure réelle du scan
        private String status;
        private String lecturerName;

        public String getModuleName() { return moduleName; }
        public void setModuleName(String moduleName) { this.moduleName = moduleName; }
        public String getSessionTitle() { return sessionTitle; }
        public void setSessionTitle(String sessionTitle) { this.sessionTitle = sessionTitle; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public String getScanTime() { return scanTime; }
        public void setScanTime(String scanTime) { this.scanTime = scanTime; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getLecturerName() { return lecturerName; }
        public void setLecturerName(String lecturerName) { this.lecturerName = lecturerName; }
    }

    public static class AdminAttendanceDTO {
        private String studentFullName;
        private String studentUsername;
        private String moduleName;
        private LocalDate date;
        private String level;
        private String status;

        public String getStudentFullName() { return studentFullName; }
        public void setStudentFullName(String studentFullName) { this.studentFullName = studentFullName; }
        public String getStudentUsername() { return studentUsername; }
        public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }
        public String getModuleName() { return moduleName; }
        public void setModuleName(String moduleName) { this.moduleName = moduleName; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class AttendanceSessionSummary {
        private String moduleId;
        private String moduleName;
        private LocalDate date;
        private String level;
        private String sessionTitle;
        private int presentCount;
        private int absentCount;
        private String lecturerName;
        private Long classId;
        private String classCode;

        public String getModuleId() { return moduleId; }
        public void setModuleId(String moduleId) { this.moduleId = moduleId; }
        public String getModuleName() { return moduleName; }
        public void setModuleName(String moduleName) { this.moduleName = moduleName; }
        public String getSessionTitle() { return sessionTitle; }
        public void setSessionTitle(String sessionTitle) { this.sessionTitle = sessionTitle; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public int getPresentCount() { return presentCount; }
        public void setPresentCount(int presentCount) { this.presentCount = presentCount; }
        public int getAbsentCount() { return absentCount; }
        public void setAbsentCount(int absentCount) { this.absentCount = absentCount; }
        public String getLecturerName() { return lecturerName; }
        public void setLecturerName(String lecturerName) { this.lecturerName = lecturerName; }
        public Long getClassId() { return classId; }
        public void setClassId(Long classId) { this.classId = classId; }
        public String getClassCode() { return classCode; }
        public void setClassCode(String classCode) { this.classCode = classCode; }
    }

    @GetMapping("/history/{studentId}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<java.util.List<StudentAttendanceDTO>> getStudentAttendanceHistory(@PathVariable String studentId) {
        // 1. Get student level to find all potential sessions
        String level = "DIC1"; // Default
        try {
            var student = userClient.getStudentByUsername(studentId);
            if (student != null && student.getLevel() != null) {
                level = student.getLevel();
            }
        } catch (Exception ignored) {}

        // 2. Get all sessions for this level
        var allSessions = courseRepository.findByLevel(level);
        
        // 3. Get all existing attendance records for this student
        var presentRecords = attendanceRepository.findByStudentId(studentId);
        java.util.Set<Long> attendedSessionIds = presentRecords.stream()
                .filter(a -> a.getCourseId() != null)
                .map(com.lms.course.entity.Attendance::getCourseId)
                .collect(java.util.stream.Collectors.toSet());

        java.util.List<StudentAttendanceDTO> history = new java.util.ArrayList<>();

        // Add "PRESENT" records
        for (var a : presentRecords) {
            StudentAttendanceDTO dto = new StudentAttendanceDTO();
            dto.setModuleName("[" + a.getModule().getCodeEC() + "] " + a.getModule().getName());
            dto.setDate(a.getDate());
            dto.setStatus(a.getStatus());
            
            // Resolve lecturer name
            String lecturerName = a.getModule().getLecturerFullName();
            if (lecturerName == null || lecturerName.isEmpty()) {
                try {
                    var l = userClient.getLecturerByUsername(a.getModule().getLecturerUsername());
                    if (l != null) {
                        if (l.getFullName() != null && !l.getFullName().isEmpty()) {
                            lecturerName = l.getFullName();
                        } else if (l.getFirstName() != null || l.getLastName() != null) {
                            lecturerName = (l.getFirstName() != null ? l.getFirstName() : "") + " " + (l.getLastName() != null ? l.getLastName() : "");
                            lecturerName = lecturerName.trim();
                        }
                    }
                } catch (Exception ignored) {}
            }
            dto.setLecturerName(lecturerName != null && !lecturerName.isEmpty() ? lecturerName : a.getModule().getLecturerUsername());
            
            if (a.getScanDateTime() != null) {
                dto.setScanTime(a.getScanDateTime().toLocalTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
            }
            
            if (a.getCourseId() != null) {
                courseRepository.findById(a.getCourseId()).ifPresent(c -> {
                    dto.setSessionTitle(c.getTitle());
                    var formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
                    dto.setStartTime(c.getSessionDate() != null ? c.getSessionDate().format(formatter) : "08:00");
                    dto.setEndTime(c.getSessionDate() != null ? c.getSessionDate().plusMinutes(c.getDuree() != null ? c.getDuree() : 120).format(formatter) : "10:00");
                });
            }
            history.add(dto);
        }

        // Add "ABSENT" records for past sessions not attended
        LocalDateTime now = LocalDateTime.now();
        for (var session : allSessions) {
            if (!attendedSessionIds.contains(session.getId()) && session.getSessionDate() != null && session.getSessionDate().isBefore(now)) {
                StudentAttendanceDTO dto = new StudentAttendanceDTO();
                dto.setModuleName("[" + session.getModule().getCodeEC() + "] " + session.getModule().getName());
                dto.setDate(session.getSessionDate().toLocalDate());
                dto.setStatus("ABSENT");
                dto.setSessionTitle(session.getTitle());
                
                var formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
                dto.setStartTime(session.getSessionDate().format(formatter));
                dto.setEndTime(session.getSessionDate().plusMinutes(session.getDuree() != null ? session.getDuree() : 120).format(formatter));
                
                // Resolve lecturer name
                String lecturerName = null;
                try {
                    var l = userClient.getLecturerByUsername(session.getModule().getLecturerUsername());
                    if (l != null) {
                        if (l.getFullName() != null && !l.getFullName().isEmpty()) {
                            lecturerName = l.getFullName();
                        } else if (l.getFirstName() != null || l.getLastName() != null) {
                            lecturerName = (l.getFirstName() != null ? l.getFirstName() : "") + " " + (l.getLastName() != null ? l.getLastName() : "");
                            lecturerName = lecturerName.trim();
                        }
                    }
                } catch (Exception ignored) {}
                dto.setLecturerName(lecturerName != null && !lecturerName.isEmpty() ? lecturerName : session.getModule().getLecturerUsername());
                
                history.add(dto);
            }
        }

        history.sort((a, b) -> {
            int dateCmp = b.getDate().compareTo(a.getDate());
            if (dateCmp != 0) return dateCmp;
            if (a.getScanTime() == null && b.getScanTime() == null) return 0;
            if (a.getScanTime() == null) return 1;
            if (b.getScanTime() == null) return -1;
            return b.getScanTime().compareTo(a.getScanTime());
        });
        return ResponseEntity.ok(history);
    }

    @GetMapping("/admin/sessions")
    public ResponseEntity<java.util.List<AttendanceSessionSummary>> getAttendanceSessions() {
        var allAttendance = attendanceRepository.findAll();
        var grouped = allAttendance.stream()
            .filter(a -> a.getCourseId() != null)
            .collect(java.util.stream.Collectors.groupingBy(
                Attendance::getCourseId
            ));

        java.util.List<AttendanceSessionSummary> summaries = new java.util.ArrayList<>();
        grouped.forEach((courseId, records) -> {
            var first = records.get(0);
            var module = first.getModule();
            AttendanceSessionSummary summary = new AttendanceSessionSummary();
            summary.setModuleId(module.getId().toString());
            summary.setModuleName(module.getName());
            summary.setDate(first.getDate());
            summary.setLevel(module.getLevel());
            summary.setLecturerName(module.getLecturerFullName());
            // Expose classId and classCode from TeachingUnit for proper class-based filtering
            if (module.getTeachingUnit() != null) {
                summary.setClassId(module.getTeachingUnit().getClassId());
                summary.setClassCode(module.getTeachingUnit().getClassCode());
            }
            summary.setPresentCount(records.size());
            
            // Enrich with session title
            courseRepository.findById(courseId).ifPresent(c -> {
                summary.setSessionTitle(c.getTitle());
            });

            try {
                var allStudents = userClient.getStudentsByLevel(module.getLevel());
                summary.setAbsentCount(allStudents.size() - records.size());
            } catch (Exception e) {
                summary.setAbsentCount(0);
            }
            summaries.add(summary);
        });
        summaries.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<java.util.List<AdminAttendanceDTO>> getAllAttendance() {
        var allRecords = attendanceRepository.findAll();
        var today = LocalDate.now();
        java.util.List<AdminAttendanceDTO> result = new java.util.ArrayList<>();
        allRecords.forEach(a -> {
            AdminAttendanceDTO dto = new AdminAttendanceDTO();
            dto.setStudentUsername(a.getStudentId());
            dto.setModuleName(a.getModule().getName());
            dto.setDate(a.getDate());
            dto.setLevel(a.getModule().getLevel());
            dto.setStatus("PRESENT");
            try {
                var student = userClient.getStudentByUsername(a.getStudentId());
                dto.setStudentFullName(student.getFullName());
            } catch (Exception e) {
                dto.setStudentFullName(a.getStudentId());
            }
            result.add(dto);
        });
        var modules = moduleRepository.findAll();
        for (var module : modules) {
            var presentUsernames = allRecords.stream()
                .filter(a -> a.getModule().getId().equals(module.getId()) && a.getDate().equals(today))
                .map(Attendance::getStudentId)
                .toList();
            if (!presentUsernames.isEmpty()) {
                var allStudents = userClient.getStudentsByLevel(module.getLevel());
                for (var student : allStudents) {
                    if (!presentUsernames.contains(student.getUsername())) {
                        AdminAttendanceDTO dto = new AdminAttendanceDTO();
                        dto.setStudentUsername(student.getUsername());
                        dto.setStudentFullName(student.getFullName());
                        dto.setModuleName(module.getName());
                        dto.setDate(today);
                        dto.setLevel(module.getLevel());
                        dto.setStatus("ABSENT");
                        result.add(dto);
                    }
                }
            }
        }
        result.sort((a, b) -> b.getDate().compareTo(a.getDate()));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/report/{moduleId}")
    public ResponseEntity<AttendanceReport> getAttendanceReport(
            @PathVariable String moduleId,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long sessionId) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        var module = moduleRepository.findById(Long.valueOf(moduleId)).orElseThrow();
        
        java.util.List<Attendance> presentRecords;
        if (sessionId != null) {
            presentRecords = attendanceRepository.findByCourseId(sessionId);
        } else {
            presentRecords = attendanceRepository.findByModuleAndDate(module, targetDate);
        }
        
        var allStudents = userClient.getStudentsByLevel(module.getLevel());
        var presentUsernames = presentRecords.stream().map(Attendance::getStudentId).toList();
        var presentList = allStudents.stream().filter(s -> presentUsernames.contains(s.getUsername())).toList();
        var absentList = allStudents.stream().filter(s -> !presentUsernames.contains(s.getUsername())).toList();
        AttendanceReport report = new AttendanceReport();
        report.setPresent(presentList);
        report.setAbsent(absentList);
        report.setTotalExpected(allStudents.size());
        report.setTotalPresent(presentList.size());
        return ResponseEntity.ok(report);
    }

    @PostMapping("/qr-token")
    public ResponseEntity<Map<String, String>> generateQrToken(@RequestBody QrTokenRequest request) {
        String token = UUID.randomUUID().toString();
        String value = request.getSessionId() != null ? request.getSessionId().toString() : request.getModuleId();
        activeQrTokens.put(token, new TokenData(value, request.isOnline(), request.getProfLatitude(), request.getProfLongitude()));
        new Thread(() -> {
            try {
                // Token remains valid for 10 minutes (600 seconds)
                Thread.sleep(600000);
                activeQrTokens.remove(token);
            } catch (InterruptedException ignored) {}
        }).start();
        return ResponseEntity.ok(Map.of("token", token));
    }
    @PostMapping("/qr-scan")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<String> scanQr(@RequestBody QrScanRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.badRequest().body("Token manquant dans la requête.");
        }
        if (request.getStudentId() == null || request.getStudentId().isBlank()) {
            return ResponseEntity.badRequest().body("Identifiant étudiant manquant.");
        }

        TokenData tokenData = activeQrTokens.get(request.getToken());
        if (tokenData == null) return ResponseEntity.badRequest().body("Token invalide ou expiré. Demandez au professeur de régénérer le QR Code.");

        // Parse the sessionId stored in the token
        Long sessionId;
        try {
            sessionId = Long.valueOf(tokenData.sessionOrModuleId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Token corrompu — veuillez demander au professeur de régénérer le QR Code.");
        }

        var course = courseRepository.findById(sessionId).orElse(null);
        if (course == null) return ResponseEntity.badRequest().body("Séance introuvable (id=" + sessionId + "). Vérifiez que la séance est bien enregistrée.");

        // GPS obligatoire uniquement si le cours est en présentiel
        if (!tokenData.isOnline && (request.getLatitude() == null || request.getLongitude() == null)) {
            return ResponseEntity.badRequest().body("La géolocalisation est requise pour émarger en présentiel. Activez le GPS.");
        }

        // Validation de distance (ignorée si cours en ligne)
        var module = course.getModule();
        if (module == null) {
            return ResponseEntity.badRequest().body("Configuration incorrecte : la séance n'est associée à aucun module.");
        }

        if (!tokenData.isOnline && tokenData.profLatitude != null && tokenData.profLongitude != null) {
            double distance = calculateDistance(
                request.getLatitude(), request.getLongitude(),
                tokenData.profLatitude, tokenData.profLongitude
            );
            double allowedRadius = (module.getAllowedRadius() != null) ? module.getAllowedRadius() : 100.0;
            if (distance > allowedRadius) {
                return ResponseEntity.badRequest().body(
                    String.format("Vous êtes trop loin de la salle (%.0fm). Émargement refusé. Si vous avez un VPN actif, désactivez-le et réessayez.", distance)
                );
            }
        }

        boolean alreadyPresent = attendanceRepository.existsByStudentIdAndCourseIdAndDate(
                request.getStudentId(), sessionId, LocalDate.now());

        if (alreadyPresent) return ResponseEntity.ok("Vous avez déjà émargé pour cette séance.");

        Attendance attendance = new Attendance();
        attendance.setStudentId(request.getStudentId());
        attendance.setCourseId(sessionId);
        attendance.setStatus("PRESENT");
        attendance.setDate(LocalDate.now());
        attendance.setScanDateTime(java.time.LocalDateTime.now());
        attendance.setModule(module);

        attendanceRepository.save(attendance);
        return ResponseEntity.ok("Émargement validé !");
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth radius in meters
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
