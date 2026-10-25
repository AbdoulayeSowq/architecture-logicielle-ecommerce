import React, { useState, useEffect } from 'react';

interface PdfViewerProps {
    url?: string;
    uploadedFile?: File;
    width?: string | number;
    height?: string | number;
}

const PdfViewer = ({
    url,
    uploadedFile,
    width = '100%',
    height = '700px',
}: PdfViewerProps) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExternal, setIsExternal] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (uploadedFile) {
            setPdfUrl(URL.createObjectURL(uploadedFile));
            setIsExternal(false);
        } else if (url) {
            setPdfUrl(url);
            // Check if URL is external (different origin or known external domains)
            try {
                // Si c'est un lien relatif (/api/...), c'est interne
                if (url.startsWith('/')) {
                    setIsExternal(false);
                    return;
                }
                const urlObj = new URL(url);
                const isSameHost = urlObj.hostname === window.location.hostname;
                const isLocalhost = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
                setIsExternal(!isSameHost && !isLocalhost);
            } catch {
                // En cas d'erreur de parsing, on vérifie si c'est relatif
                setIsExternal(!url.startsWith('/') && !url.startsWith('./'));
            }
        }
    }, [url, uploadedFile]);

    const toggleFullscreen = () => {
        if (!isFullscreen && containerRef.current) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!pdfUrl) {
        return <div style={{ width, height, background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement du PDF...</div>;
    }

    // For external URLs, show button to open in new tab
    if (isExternal) {
        return (
            <div style={{ width, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', background: '#f3f4f6', borderRadius: '8px', minHeight: height }}>
                <i className="fas fa-file-pdf fa-3x" style={{ color: '#ef4444', opacity: 0.5 }} />
                <p style={{ textAlign: 'center', color: '#64748b', maxWidth: '400px' }}>
                    Ce PDF provient d'un site externe. Il s'ouvrira dans un nouvel onglet.
                </p>
                <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        background: '#3b82f6',
                        color: '#fff',
                        textDecoration: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Ouvrir le PDF
                </a>
            </div>
        );
    }

    // For local/same-origin PDFs, use iframe with fullscreen
    return (
        <div style={{ width, position: 'relative' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={toggleFullscreen}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                    }}
                    title={isFullscreen ? 'Fermer le plein écran' : 'Plein écran'}
                >
                    <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                </button>
            </div>
            <div
                ref={containerRef}
                style={{
                    width,
                    height,
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#fff',
                }}
            >
                <iframe
                    src={pdfUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    title="PDF Viewer"
                />
            </div>
        </div>
    );
};

export default PdfViewer;
