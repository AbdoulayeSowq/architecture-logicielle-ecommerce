import React, { useState } from 'react';

interface CodeBlockProps {
    language: string;
    code: string;
    children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, children }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                // Fallback for non-secure contexts (http://)
                const textarea = document.createElement('textarea');
                textarea.value = code;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="code-block-container">
            <div className="code-header">
                <span>{language}</span>
                <button
                    type="button"
                    className="copy-btn"
                    onClick={handleCopy}
                    aria-label="Copier le code"
                >
                    {copied ? (
                        <><i className="fas fa-check"></i> Copié !</>
                    ) : (
                        <><i className="far fa-copy"></i> Copier</>
                    )}
                </button>
            </div>
            <pre><code className={`language-${language} hljs`}>{children ?? code}</code></pre>
        </div>
    );
};

export default CodeBlock;
