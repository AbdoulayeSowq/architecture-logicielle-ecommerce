package com.lms.user.service.impl;

import com.lms.user.dto.*;
import com.lms.user.entity.Address;
import com.lms.user.entity.AppUser;
import com.lms.user.entity.Lecturer;
import com.lms.user.entity.Student;
import com.lms.user.exception.NotFoundException;
import com.lms.user.repository.AddressRepository;
import com.lms.user.repository.AppUserRepository;
import com.lms.user.repository.LecturerRepository;
import com.lms.user.repository.StudentRepository;
import com.lms.user.service.AdminService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LecturerRepository lecturerRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String createStudent(StudentRequestDto dto, String groupName) {
        if (studentRepository.findByUsername(dto.getUsername()) != null) {
            throw new RuntimeException("Student already exists with username " + dto.getUsername());
        }

        Address address = new Address();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            address = addressRepository.save(address);
            Student student = getStudent(dto, address);
            studentRepository.save(student);

            // Create corresponding AppUser for authentication
            if (appUserRepository.findByUsername(dto.getUsername()).isEmpty()) {
                AppUser appUser = new AppUser();
                appUser.setUsername(dto.getUsername());
                appUser.setEmail(dto.getEmail());
                appUser.setPassword(passwordEncoder.encode("password123")); // Default password
                appUser.setRole("ROLE_STUDENT");
                appUserRepository.save(appUser);
            }

            // Synchronize with Keycloak authentication server
            createKeycloakUser(dto.getUsername(), dto.getEmail(), dto.getFirstName(), dto.getLastName(), "student");

            return "Student created successfully with username " + dto.getUsername();
        } catch (Exception e) {
            throw new RuntimeException("Failed to save student in database", e);
        }
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id).orElse(null);
    }

    public Student getStudentByUsername(String username) {
        return studentRepository.findByUsername(username);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getStudentsByLevel(String level) {
        return studentRepository.findByIntakeIgnoreCase(level);
    }

    public String updateStudent(Long id, StudentUpdateDto dto) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            throw new NotFoundException("Student not found with id " + id);
        }

        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setPhone(dto.getPhone());
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setGender(dto.getGender());
        student.setCourseId(dto.getCourseId());
        student.setIntake(dto.getIntake());

        Address address = student.getAddress();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            addressRepository.save(address);
            studentRepository.save(student);
            return "Student updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update student in database", e);
        }
    }

    public String deleteStudent(Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            throw new NotFoundException("Student not found with id " + id);
        }

        try {
            studentRepository.delete(student);
            appUserRepository.findByUsername(student.getUsername()).ifPresent(appUserRepository::delete);
            return "Student deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete student in database", e);
        }
    }

    private void validateLecturerDepartment(Lecturer lecturer) {
        String profDept = lecturer.getDepartment();
        if (profDept == null || profDept.trim().isEmpty()) {
            if (lecturer.getSupervisedDepartmentCode() != null || lecturer.getSupervisedClassName() != null) {
                throw new RuntimeException("L'enseignant doit appartenir à un département d'enseignement avant d'être nommé responsable.");
            }
            return;
        }

        String profDeptNormalized = profDept.trim().toLowerCase();

        // 1. Validation Chef de Département
        if (lecturer.getSupervisedDepartmentCode() != null && !lecturer.getSupervisedDepartmentCode().trim().isEmpty()) {
            String targetDept = lecturer.getSupervisedDepartmentCode().trim().toLowerCase();
            // L'enseignant doit appartenir au département visé (ex: profDept contient "informatique" ou "git" et targetDept est "git")
            boolean isMatch = profDeptNormalized.contains(targetDept) || targetDept.contains(profDeptNormalized) 
                    || (profDeptNormalized.contains("informatique") && targetDept.equals("git"))
                    || (profDeptNormalized.contains("télécom") && targetDept.equals("git"));
            
            if (!isMatch) {
                throw new RuntimeException("Incohérence : Un enseignant du département '" + profDept + 
                        "' ne peut pas être nommé Chef du Département '" + lecturer.getSupervisedDepartmentCode().toUpperCase() + "'.");
            }
        }

        // 2. Validation Responsable Pédagogique (supporte plusieurs classes séparées par virgule)
        if (lecturer.getSupervisedClassName() != null && !lecturer.getSupervisedClassName().trim().isEmpty()) {
            String[] classes = lecturer.getSupervisedClassName().split(",");
            for (String rawClass : classes) {
                String targetClass = rawClass.trim().toLowerCase();
                if (targetClass.isEmpty()) continue;
                if (targetClass.contains("-")) {
                    String classDeptSuffix = targetClass.substring(targetClass.lastIndexOf("-") + 1);
                    boolean isMatch = profDeptNormalized.contains(classDeptSuffix) || classDeptSuffix.contains(profDeptNormalized)
                            || (profDeptNormalized.contains("informatique") && classDeptSuffix.equals("git"))
                            || (profDeptNormalized.contains("télécom") && classDeptSuffix.equals("git"));
                    
                    if (!isMatch) {
                        throw new RuntimeException("Incohérence : Un enseignant du département '" + profDept + 
                                "' ne peut pas être nommé Responsable Pédagogique de la classe '" + targetClass.toUpperCase() + "'.");
                    }
                }
            }
        }
    }

    public String createLecturer(LecturerRequestDto dto, String groupName) {
        if (lecturerRepository.findByUsername(dto.getUsername()) != null) {
            throw new RuntimeException("Lecturer already exists with username " + dto.getUsername());
        }

        Address address = new Address();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            address = addressRepository.save(address);
            Lecturer lecturer = getLecturer(dto, address);
            
            // Validation d'intégrité académique
            validateLecturerDepartment(lecturer);
            
            lecturerRepository.save(lecturer);

            // Create corresponding AppUser for authentication
            if (appUserRepository.findByUsername(dto.getUsername()).isEmpty()) {
                AppUser appUser = new AppUser();
                appUser.setUsername(dto.getUsername());
                appUser.setEmail(dto.getEmail());
                appUser.setPassword(passwordEncoder.encode("password123")); // Default password
                appUser.setRole("ROLE_LECTURER");
                appUserRepository.save(appUser);
            }

            // Synchronize with Keycloak authentication server
            createKeycloakUser(dto.getUsername(), dto.getEmail(), dto.getFirstName(), dto.getLastName(), "lecturer");

            return "Lecturer created successfully with username " + dto.getUsername();
        } catch (Exception e) {
            throw new RuntimeException("Failed to save lecturer in database", e);
        }
    }

    public Lecturer getLecturerById(Long id) {
        return lecturerRepository.findById(id).orElse(null);
    }

    public Lecturer getLecturerByUsername(String username) {
        return lecturerRepository.findByUsername(username);
    }

    public List<Lecturer> getAllLecturers() {
        return lecturerRepository.findAll();
    }

    public String updateLecturer(Long id, LecturerUpdateDto dto) {
        Lecturer lecturer = lecturerRepository.findById(id).orElse(null);
        if (lecturer == null) {
            throw new NotFoundException("Lecturer not found with id " + id);
        }

        lecturer.setFirstName(dto.getFirstName());
        lecturer.setLastName(dto.getLastName());
        lecturer.setPhone(dto.getPhone());
        lecturer.setDateOfBirth(dto.getDateOfBirth());
        lecturer.setGender(dto.getGender());
        lecturer.setSupervisedDepartmentCode(dto.getSupervisedDepartmentCode());
        lecturer.setSupervisedClassName(dto.getSupervisedClassName());

        // Validation d'intégrité académique
        validateLecturerDepartment(lecturer);

        Address address = lecturer.getAddress();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            addressRepository.save(address);
            lecturerRepository.save(lecturer);
            return "Lecturer updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update lecturer in database", e);
        }
    }

    @Override
    public void updateLecturer(Lecturer lecturer) {
        try {
            lecturerRepository.save(lecturer);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update lecturer in database", e);
        }
    }

    public String deleteLecturer(Long id) {
        Lecturer lecturer = lecturerRepository.findById(id).orElse(null);
        if (lecturer == null) {
            throw new NotFoundException("Lecturer not found with id " + id);
        }

        try {
            lecturerRepository.delete(lecturer);
            appUserRepository.findByUsername(lecturer.getUsername()).ifPresent(appUserRepository::delete);
            return "Lecturer deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete lecturer in database", e);
        }
    }

    public Map<String, String> getUserByUsername(String username) {
        Student student = getStudentByUsername(username);
        if (student != null) {
            return Map.of("email", student.getEmail(), "name", student.getFullName());
        }
        Lecturer lecturer = getLecturerByUsername(username);
        if (lecturer != null) {
            return Map.of("email", lecturer.getEmail(), "name", lecturer.getFullName());
        }
        throw new RuntimeException("User not found with username " + username);
    }

    public void updateStudentDepartment(String username, String department) {
        Student student = studentRepository.findByUsername(username);
        if (student == null) {
            throw new NotFoundException("Student not found with username: " + username);
        }
        student.setDepartment(department);
        studentRepository.save(student);
    }

    @Override
    public AppUser getAppUserByUsername(String username) {
        return appUserRepository.findByUsername(username).orElse(null);
    }

    @Override
    public List<Map<String, String>> getAllContacts() {
        List<Map<String, String>> contacts = new ArrayList<>();
        
        // Add Admins - Minimal data
        appUserRepository.findAll().stream()
                .filter(u -> "ROLE_ADMIN".equals(u.getRole()))
                .forEach(u -> {
                    Map<String, String> contact = new HashMap<>();
                    contact.put("username", u.getUsername());
                    contact.put("displayName", u.getUsername());
                    contact.put("role", "ADMIN");
                    contacts.add(contact);
                });

        // Add Lecturers - Only name and username
        lecturerRepository.findAll().forEach(l -> {
            Map<String, String> contact = new HashMap<>();
            contact.put("username", l.getUsername());
            String name = (l.getFirstName() != null ? l.getFirstName() : "") + " " + (l.getLastName() != null ? l.getLastName() : "");
            String displayName = name.trim().isEmpty() ? l.getUsername() : name.trim();
            contact.put("displayName", displayName);
            contact.put("fullName", displayName); // Add for mobile compatibility
            contact.put("role", "LECTURER");
            contacts.add(contact);
        });

        // Add Students - Only name and username (This is the largest part)
        studentRepository.findAll().forEach(s -> {
            Map<String, String> contact = new HashMap<>();
            contact.put("username", s.getUsername());
            String name = (s.getFirstName() != null ? s.getFirstName() : "") + " " + (s.getLastName() != null ? s.getLastName() : "");
            String displayName = name.trim().isEmpty() ? s.getUsername() : name.trim();
            contact.put("displayName", displayName);
            contact.put("fullName", displayName); // Add for mobile compatibility
            contact.put("role", "STUDENT");
            contacts.add(contact);
        });

        return contacts;
    }

    private static Student getStudent(StudentRequestDto dto, Address address) {
        Student student = new Student();
        student.setUsername(dto.getUsername());
        student.setEmail(dto.getEmail());
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setPhone(dto.getPhone());
        student.setAddress(address);
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setGender(dto.getGender());
        student.setNicImage(dto.getNicImage());
        student.setStudentImage(dto.getStudentImage());
        student.setBirthCertificateImage(dto.getBirthCertificateImage());
        student.setStudentId(dto.getStudentId());
        student.setEnrollmentNumber(dto.getEnrollmentNumber());
        student.setIntake(dto.getIntake());
        student.setDepartment(dto.getDepartment());
        student.setGuardianName(dto.getGuardianName());
        student.setGuardianPhone(dto.getGuardianPhone());
        student.setGuardianEmail(dto.getGuardianEmail());
        student.setGuardianRelationship(dto.getGuardianRelationship());
        // Map courseId manually since it's part of the DTO
        if (dto.getCourseId() != null) {
            student.setCourseId(dto.getCourseId());
        }
        return student;
    }

    private static Lecturer getLecturer(LecturerRequestDto dto, Address address) {
        Lecturer lecturer = new Lecturer();
        lecturer.setUsername(dto.getUsername());
        lecturer.setEmail(dto.getEmail());
        lecturer.setFirstName(dto.getFirstName());
        lecturer.setLastName(dto.getLastName());
        lecturer.setPhone(dto.getPhone());
        lecturer.setAddress(address);
        lecturer.setDateOfBirth(dto.getDateOfBirth());
        lecturer.setGender(dto.getGender());
        lecturer.setNicImage(dto.getNicImage());
        lecturer.setProfileImage(dto.getProfileImage());
        lecturer.setLecturerId(dto.getLecturerId());
        lecturer.setDesignation(dto.getDesignation());
        lecturer.setDepartment(dto.getDepartment());
        lecturer.setFaculty(dto.getFaculty());
        lecturer.setOfficeLocation(dto.getOfficeLocation());
        lecturer.setWorkType(dto.getWorkType());
        lecturer.setNic(dto.getNic());
        lecturer.setHighestDegree(dto.getHighestDegree());
        lecturer.setInstitution(dto.getInstitution());
        lecturer.setMajor(dto.getMajor());
        lecturer.setResearchInterest(dto.getResearchInterest());
        lecturer.setLinkedIn(dto.getLinkedIn());
        lecturer.setCv(dto.getCv());
        lecturer.setSupervisedDepartmentCode(dto.getSupervisedDepartmentCode());
        lecturer.setSupervisedClassName(dto.getSupervisedClassName());
        return lecturer;
    }

    private void createKeycloakUser(String username, String email, String firstName, String lastName, String roleName) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            
            // 1. Get Admin Access Token from master realm
            String tokenUrl = "http://keycloak:8080/realms/master/protocol/openid-connect/token";
            org.springframework.http.HttpHeaders tokenHeaders = new org.springframework.http.HttpHeaders();
            tokenHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            
            org.springframework.util.MultiValueMap<String, String> tokenBody = new org.springframework.util.LinkedMultiValueMap<>();
            tokenBody.add("client_id", "admin-cli");
            tokenBody.add("username", "admin");
            tokenBody.add("password", "admin_password");
            tokenBody.add("grant_type", "password");
            
            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> tokenRequest = 
                    new org.springframework.http.HttpEntity<>(tokenBody, tokenHeaders);
            
            Map<String, Object> tokenResponse = restTemplate.postForObject(tokenUrl, tokenRequest, Map.class);
            if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                throw new RuntimeException("Failed to obtain Keycloak admin access token");
            }
            String accessToken = tokenResponse.get("access_token").toString();
            
            // 2. Create User in lms realm
            String createUserUrl = "http://keycloak:8080/admin/realms/lms/users";
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            Map<String, Object> credential = new HashMap<>();
            credential.put("type", "password");
            credential.put("value", "Lms@2026");
            credential.put("temporary", true);
            
            Map<String, Object> userPayload = new HashMap<>();
            userPayload.put("username", username);
            userPayload.put("email", email);
            userPayload.put("firstName", firstName != null ? firstName : "");
            userPayload.put("lastName", lastName != null ? lastName : "");
            userPayload.put("enabled", true);
            userPayload.put("credentials", List.of(credential));
            userPayload.put("requiredActions", List.of("UPDATE_PASSWORD"));
            
            org.springframework.http.HttpEntity<Map<String, Object>> userRequest = new org.springframework.http.HttpEntity<>(userPayload, headers);
            org.springframework.http.ResponseEntity<Void> response = restTemplate.postForEntity(createUserUrl, userRequest, Void.class);
            
            if (response.getStatusCode() == org.springframework.http.HttpStatus.CREATED) {
                java.net.URI location = response.getHeaders().getLocation();
                if (location != null) {
                    String path = location.getPath();
                    String userId = path.substring(path.lastIndexOf('/') + 1);
                    
                    // 3. Fetch Role Object from Keycloak
                    String getRoleUrl = "http://keycloak:8080/admin/realms/lms/roles/" + roleName;
                    org.springframework.http.HttpEntity<Void> roleRequest = new org.springframework.http.HttpEntity<>(headers);
                    try {
                        Map<String, Object> roleResponse = restTemplate.exchange(
                                getRoleUrl,
                                org.springframework.http.HttpMethod.GET,
                                roleRequest,
                                Map.class
                        ).getBody();
                        
                        if (roleResponse != null) {
                            // 4. Map Role to User in Keycloak
                            String mapRoleUrl = "http://keycloak:8080/admin/realms/lms/users/" + userId + "/role-mappings/realm";
                            org.springframework.http.HttpEntity<List<Map<String, Object>>> mapRoleRequest = 
                                    new org.springframework.http.HttpEntity<>(List.of(roleResponse), headers);
                              restTemplate.postForEntity(mapRoleUrl, mapRoleRequest, Void.class);
                              log.info("Successfully assigned role '{}' to Keycloak user '{}'", roleName, username);
                          }
                      } catch (Exception re) {
                          log.error("Failed to fetch/assign Keycloak role '{}' for user '{}': {}", roleName, username, re.getMessage());
                      }
                  }
              } else {
                  throw new RuntimeException("Keycloak user creation returned status: " + response.getStatusCode());
              }
          } catch (Exception e) {
              log.error("Keycloak synchronization failed for user '{}': {}", username, e.getMessage());
              throw new RuntimeException("Failed to register account in authentication server: " + e.getMessage(), e);
          }
    }
}
