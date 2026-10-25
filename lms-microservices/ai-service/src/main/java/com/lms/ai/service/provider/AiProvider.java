package com.lms.ai.service.provider;

public interface AiProvider {

    String getName();

    boolean isConfigured();

    String generateContent(String prompt) throws AiProviderException;

    class AiProviderException extends RuntimeException {
        private final boolean rateLimited;

        public AiProviderException(String message, boolean rateLimited) {
            super(message);
            this.rateLimited = rateLimited;
        }

        public AiProviderException(String message, Throwable cause, boolean rateLimited) {
            super(message, cause);
            this.rateLimited = rateLimited;
        }

        public boolean isRateLimited() {
            return rateLimited;
        }
    }
}
