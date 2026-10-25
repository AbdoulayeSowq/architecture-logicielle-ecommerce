package com.lms.user.controller;

import com.lms.user.service.AdminService;
import com.lms.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "Profil Utilisateur", description = "Informations du profil de l'utilisateur connecté")
public class UserController {

    private final UserService userService;
    private final AdminService adminService;

    @Operation(summary = "Obtenir les infos de l'utilisateur connecté", description = "Retourne les informations de profil de l'utilisateur actuellement authentifié (rôle, username, etc.).")
    @GetMapping("/userInfo")
    public Map<String, Object> getUserInfo() {
        return userService.getUserInfo();
    }

    @Operation(summary = "Obtenir l'activité d'un utilisateur", description = "Retourne les détails d'activité (dernière connexion) pour un utilisateur donné.")
    @GetMapping("/activity/{username}")
    public com.lms.user.entity.AppUser getUserActivity(@org.springframework.web.bind.annotation.PathVariable String username) {
        return adminService.getAppUserByUsername(username);
    }

    @Operation(summary = "Lister tous les contacts", description = "Retourne la liste simplifiée de tous les utilisateurs (Admins, Profs, Étudiants) pour la messagerie.")
    @GetMapping("/contacts")
    public List<Map<String, String>> getContacts() {
        return adminService.getAllContacts();
    }
}
