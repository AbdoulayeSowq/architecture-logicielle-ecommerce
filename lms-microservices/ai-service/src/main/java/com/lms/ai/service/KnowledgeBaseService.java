package com.lms.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeBaseService {

    private final VectorStore vectorStore;
    private final TextExtractionService textExtractionService;

    @Async
    public void indexMaterial(Long materialId, String moduleId, String fileUrl) {
        log.info("Starting indexing for material {} in module {}", materialId, moduleId);
        try {
            // 1. Extract text
            String content = textExtractionService.extractTextFromUrl(fileUrl);
            
            // 2. Chunking (Simple chunking by words for now)
            List<String> chunks = splitText(content, 1000);
            
            List<Document> documents = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                Document doc = new Document(chunks.get(i), Map.of(
                    "materialId", materialId,
                    "moduleId", moduleId,
                    "chunkIndex", i
                ));
                documents.add(doc);
            }

            // 3. Store in Vector Database
            vectorStore.add(documents);
            log.info("Successfully indexed {} chunks for material {}", documents.size(), materialId);
            
        } catch (Exception e) {
            log.error("Error indexing material {}: {}", materialId, e.getMessage());
        }
    }

    private List<String> splitText(String text, int wordsPerChunk) {
        int overlap = 150; // Overlap of 150 words to maintain context
        String[] words = text.split("\\s+");
        List<String> chunks = new ArrayList<>();
        
        if (words.length <= wordsPerChunk) {
            chunks.add(text.trim());
            return chunks;
        }

        int start = 0;
        while (start < words.length) {
            int end = Math.min(start + wordsPerChunk, words.length);
            StringBuilder chunk = new StringBuilder();
            for (int i = start; i < end; i++) {
                chunk.append(words[i]).append(" ");
            }
            chunks.add(chunk.toString().trim());
            
            if (end == words.length) break;
            
            // Move start forward but keep overlap
            start = end - overlap;
            if (start < 0) start = 0;
            // Prevent infinite loop if overlap >= wordsPerChunk
            if (start >= end) start = end - 1;
        }
        
        return chunks;
    }
}
