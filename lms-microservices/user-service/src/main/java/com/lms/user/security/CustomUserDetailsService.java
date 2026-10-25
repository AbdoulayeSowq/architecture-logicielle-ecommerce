package com.lms.user.security;

import com.lms.user.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AppUserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // Recherche d'abord par email (car le front envoie souvent un email)
        return repository.findByEmail(identifier)
                // Si non trouvé par email, on tente par username (cas de l'admin ou login simplifié)
                .orElseGet(() -> repository.findByUsername(identifier)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with email or username: " + identifier)));
    }
}
