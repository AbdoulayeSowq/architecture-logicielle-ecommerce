package com.lms.user.service;

import com.lms.user.client.CourseClient;
import com.lms.user.dto.CModuleDTO;
import com.lms.user.dto.GamificationProfileDto;
import com.lms.user.dto.MentorshipRequestDto;
import com.lms.user.entity.Badge;
import com.lms.user.entity.GamificationProfile;
import com.lms.user.entity.Mentorship;
import com.lms.user.entity.UserBadge;
import com.lms.user.repository.BadgeRepository;
import com.lms.user.repository.GamificationProfileRepository;
import com.lms.user.repository.MentorshipRepository;
import com.lms.user.repository.UserBadgeRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class GamificationService {
    
    private final GamificationProfileRepository profileRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final MentorshipRepository mentorshipRepository;
    private final RestTemplate restTemplate;
    private final AdminService adminService;
    private final CourseClient courseClient;

    private void sendNotification(String userId, String title, String content, String type) {
        try {
            Map<String, Object> notif = new HashMap<>();
            notif.put("userId", userId);
            notif.put("title", title);
            notif.put("content", content);
            notif.put("type", type);
            restTemplate.postForObject("http://announcement-service/api/announcement/notifications/send", notif, Object.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }

    public GamificationProfileDto getProfile(String username) {
        GamificationProfile profile = profileRepository.findByUsername(username)
                .orElseGet(() -> createDefaultProfile(username));
                
        List<Badge> badges = userBadgeRepository.findByUsername(username).stream()
                .map(UserBadge::getBadge)
                .collect(Collectors.toList());
                
        GamificationProfileDto dto = new GamificationProfileDto();
        dto.setUsername(profile.getUsername());
        dto.setXpPoints(profile.getXpPoints());
        dto.setLevel(profile.getLevel());
        dto.setCurrentStreak(profile.getCurrentStreak());
        dto.setLongestStreak(profile.getLongestStreak());
        dto.setBadges(badges);
        dto.setSkillScores(profile.getSkillScores());
        
        return dto;
    }
    
    private GamificationProfile createDefaultProfile(String username) {
        GamificationProfile p = new GamificationProfile();
        p.setUsername(username);
        return profileRepository.save(p);
    }
    
    public GamificationProfile addXp(String username, int amount) {
        return addXp(username, amount, null);
    }
    
    public GamificationProfile addXp(String username, int amount, String skill) {
        GamificationProfile profile = profileRepository.findByUsername(username)
                .orElseGet(() -> createDefaultProfile(username));
        int oldLevel = profile.getLevel();
        profile.addXp(amount);
        if (skill != null && !skill.trim().isEmpty()) {
            if (profile.getSkillScores() == null) {
                profile.setSkillScores(new HashMap<>());
            }
            profile.getSkillScores().merge(skill, amount, Integer::sum);
        }
        GamificationProfile saved = profileRepository.save(profile);
        if (saved.getLevel() > oldLevel) {
            sendNotification(username,
                "Niveau " + saved.getLevel() + " atteint !",
                "Félicitations, vous venez de passer au niveau " + saved.getLevel() + " (+" + amount + " XP).",
                "BADGE");
        }
        return saved;
    }
    
    public GamificationProfile recordLogin(String username) {
        GamificationProfile profile = profileRepository.findByUsername(username)
                .orElseGet(() -> createDefaultProfile(username));
        profile.updateStreak();
        return profileRepository.save(profile);
    }

    public Mentorship requestMentorship(MentorshipRequestDto dto) {
        boolean exists = mentorshipRepository.existsByMentorUsernameAndMenteeUsernameAndModuleIdAndMentorRoleAndStatusIn(
                dto.getMentorUsername(), dto.getMenteeUsername(), dto.getModuleId(), dto.getMentorRole(),
                List.of("PENDING", "ACTIVE"));
        if (exists) {
            throw new RuntimeException("A mentorship request already exists for this mentor/mentee/module combination");
        }
        Mentorship mentorship = new Mentorship();
        mentorship.setMentorUsername(dto.getMentorUsername());
        mentorship.setMenteeUsername(dto.getMenteeUsername());
        mentorship.setModuleId(dto.getModuleId());
        mentorship.setMentorRole(dto.getMentorRole() != null ? dto.getMentorRole() : "LECTURER");
        mentorship.setStatus("PENDING");

        // Populate names
        try {
            // Mentee is always a student
            com.lms.user.entity.Student mentee = adminService.getStudentByUsername(dto.getMenteeUsername());
            if (mentee != null) mentorship.setMenteeName(mentee.getFirstName() + " " + mentee.getLastName());

            // Mentor can be student or lecturer
            if ("STUDENT".equals(mentorship.getMentorRole())) {
                com.lms.user.entity.Student mentor = adminService.getStudentByUsername(dto.getMentorUsername());
                if (mentor != null) mentorship.setMentorName(mentor.getFirstName() + " " + mentor.getLastName());
            } else {
                com.lms.user.entity.Lecturer mentor = adminService.getLecturerByUsername(dto.getMentorUsername());
                if (mentor != null) mentorship.setMentorName(mentor.getFirstName() + " " + mentor.getLastName());
            }
        } catch (Exception e) {
            System.err.println("Failed to populate names: " + e.getMessage());
        }

        Mentorship saved = mentorshipRepository.save(mentorship);
        
        // Exemple de jointure applicative via Feign
        try {
            CModuleDTO module = courseClient.getModuleById(saved.getModuleId());
            System.out.println("Mentorat créé pour le module : " + module.getName());
        } catch (Exception e) {
            System.err.println("Impossible de récupérer les détails du module via Feign: " + e.getMessage());
        }

        sendNotification(saved.getMentorUsername(),
            "Nouvelle demande de mentorat",
            (saved.getMenteeName() != null ? saved.getMenteeName() : saved.getMenteeUsername()) + " vous a demandé un mentorat sur un module.",
            "MENTORING");
        return saved;
    }

    private void populateNames(Mentorship m) {
        if (m.getMenteeName() == null) {
            try {
                com.lms.user.entity.Student mentee = adminService.getStudentByUsername(m.getMenteeUsername());
                if (mentee != null) m.setMenteeName(mentee.getFirstName() + " " + mentee.getLastName());
            } catch (Exception ignored) {}
        }
        if (m.getMentorName() == null) {
            try {
                if ("STUDENT".equals(m.getMentorRole())) {
                    com.lms.user.entity.Student mentor = adminService.getStudentByUsername(m.getMentorUsername());
                    if (mentor != null) m.setMentorName(mentor.getFirstName() + " " + mentor.getLastName());
                } else {
                    com.lms.user.entity.Lecturer mentor = adminService.getLecturerByUsername(m.getMentorUsername());
                    if (mentor != null) m.setMentorName(mentor.getFirstName() + " " + mentor.getLastName());
                }
            } catch (Exception ignored) {}
        }
    }
    
    public Mentorship acceptOrRejectMentorship(Long id, String status, String lecturerUsername) {
        if (!status.equals("ACCEPTED") && !status.equals("REJECTED") && !status.equals("COMPLETED")) {
            throw new RuntimeException("Invalid status. Allowed: ACCEPTED, REJECTED, COMPLETED");
        }
        Mentorship mentorship = mentorshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mentorship not found"));
        if (!mentorship.getMentorUsername().equals(lecturerUsername)) {
            throw new RuntimeException("Only the assigned mentor can modify this request");
        }
        if (status.equals("COMPLETED") && !mentorship.getStatus().equals("ACCEPTED")) {
            throw new RuntimeException("Only ACCEPTED mentorships can be marked as COMPLETED");
        }
        if (!status.equals("COMPLETED") && !mentorship.getStatus().equals("PENDING")) {
            throw new RuntimeException("Only PENDING mentorships can be accepted or rejected");
        }
        mentorship.setStatus(status);
        populateNames(mentorship); // Ensure names are present
        Mentorship saved = mentorshipRepository.save(mentorship);
        
        String title;
        String content;
        String mentorDisplayName = saved.getMentorName() != null ? saved.getMentorName() : saved.getMentorUsername();
        
        switch (status) {
            case "ACCEPTED":
                title = "Demande de mentorat acceptée";
                content = mentorDisplayName + " a accepté votre demande de mentorat.";
                break;
            case "REJECTED":
                title = "Demande de mentorat refusée";
                content = mentorDisplayName + " a refusé votre demande de mentorat.";
                break;
            case "COMPLETED":
                title = "Mentorat terminé";
                content = "Votre mentorat avec " + mentorDisplayName + " est marqué comme terminé.";
                break;
            default:
                title = "Mise à jour du mentorat";
                content = "Statut : " + status;
        }
        sendNotification(saved.getMenteeUsername(), title, content, "MENTORING");
        return saved;
    }

    public Mentorship cancelMentorship(Long id, String studentUsername) {
        Mentorship mentorship = mentorshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mentorship not found"));
        if (!mentorship.getMenteeUsername().equals(studentUsername)) {
            throw new RuntimeException("Only the mentee who created this request can cancel it");
        }
        if (mentorship.getStatus().equals("ACCEPTED")) {
            throw new RuntimeException("Cannot cancel an already accepted mentorship");
        }
        mentorship.setStatus("CANCELLED");
        return mentorshipRepository.save(mentorship);
    }

    public List<Mentorship> getMentorshipsForMentee(String username) {
        List<Mentorship> list = mentorshipRepository.findByMenteeUsername(username);
        list.forEach(this::populateNames);
        return list;
    }

    public List<Mentorship> getMentorshipsForMentor(String username) {
        List<Mentorship> list = mentorshipRepository.findByMentorUsername(username);
        list.forEach(this::populateNames);
        return list;
    }

    public List<GamificationProfile> getLeaderboard() {
        return profileRepository.findTop10ByOrderByXpPointsDesc();
    }

}
