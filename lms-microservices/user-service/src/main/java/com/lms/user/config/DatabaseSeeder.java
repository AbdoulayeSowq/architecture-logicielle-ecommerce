package com.lms.user.config;

import com.lms.user.entity.AppUser;
import com.lms.user.entity.Lecturer;
import com.lms.user.entity.Student;
import com.lms.user.repository.AppUserRepository;
import com.lms.user.repository.LecturerRepository;
import com.lms.user.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed admin (admin@lms.sn)
        if (appUserRepository.findByUsername("admin").isEmpty()) {
            AppUser admin = new AppUser();
            admin.setUsername("admin");
            admin.setEmail("admin@lms.sn");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ROLE_ADMIN");
            appUserRepository.save(admin);
            System.out.println("Default admin user created.");
        }

        String defaultPassword = passwordEncoder.encode("password123");

        // Sync missing students
        List<Student> students = studentRepository.findAll();
        for (Student student : students) {
            AppUser appUser = appUserRepository.findByUsername(student.getUsername()).orElse(null);
            if (appUser == null) {
                appUser = new AppUser();
                appUser.setUsername(student.getUsername());
                appUser.setPassword(defaultPassword);
                appUser.setRole("ROLE_STUDENT");
            }
            if (appUser.getEmail() == null || appUser.getEmail().isEmpty()) {
                appUser.setEmail(student.getEmail());
                appUserRepository.save(appUser);
            }
        }

        // Sync missing lecturers
        List<Lecturer> lecturers = lecturerRepository.findAll();
        for (Lecturer lecturer : lecturers) {
            AppUser appUser = appUserRepository.findByUsername(lecturer.getUsername()).orElse(null);
            if (appUser == null) {
                appUser = new AppUser();
                appUser.setUsername(lecturer.getUsername());
                appUser.setPassword(defaultPassword);
                appUser.setRole("ROLE_LECTURER");
            }
            if (appUser.getEmail() == null || appUser.getEmail().isEmpty()) {
                appUser.setEmail(lecturer.getEmail());
                appUserRepository.save(appUser);
            }
        }
        
        System.out.println("Database sync complete: all students and lecturers have AppUser accounts with emails.");
    }
}
