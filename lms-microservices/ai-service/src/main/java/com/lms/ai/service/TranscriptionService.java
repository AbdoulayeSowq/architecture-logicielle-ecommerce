package com.lms.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@Slf4j
@RequiredArgsConstructor
public class TranscriptionService {

    private final AiService aiService;

    /**
     * Transcrit un fichier audio/vidéo en texte.
     * Dans une implémentation réelle, ceci appellerait l'API OpenAI Whisper ou un modèle local.
     */
    public String transcribe(File mediaFile) {
        log.info("Transcribing media file: {}", mediaFile.getName());
        
        // Simulation de transcription pour la démo
        // Dans le monde réel, on utiliserait un client Rest pour Whisper :
        // return whisperClient.transcribe(mediaFile);
        
        String fileName = mediaFile.getName().toLowerCase();
        
        if (fileName.contains("cours") || fileName.contains("intro")) {
            return "[TRANSCRIPTION MOCK] Bienvenue dans ce cours sur le développement Web. " +
                   "Aujourd'hui nous allons aborder les architectures microservices et l'intégration de l'IA. " +
                   "L'objectif est de comprendre comment les services communiquent entre eux via une Gateway.";
        }
        
        return "[TRANSCRIPTION MOCK] Contenu multimédia détecté. " +
               "Ceci est une transcription simulée du fichier " + mediaFile.getName() + ". " +
               "L'IA a analysé la piste audio et extrait les concepts clés du cours.";
    }
}
