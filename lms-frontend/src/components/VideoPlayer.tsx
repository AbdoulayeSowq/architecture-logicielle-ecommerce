import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface VideoPlayerProps {
    url?: string;
    uploadedFile?: File;
    width?: string | number;
    height?: string | number;
    autoplay?: boolean;
    controls?: boolean;
    onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
    onEnded?: () => void;
}

const VideoPlayer = ({
    url,
    uploadedFile,
    width = '100%',
    height = 'auto',
    autoplay = false,
    controls = true,
    onEnded,
}: VideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [qualities, setQualities] = useState<Record<string, string>>({});
    const [selectedQuality, setSelectedQuality] = useState<string>("Auto (Original)");
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [showMenu, setShowMenu] = useState<boolean>(false);

    const initialVideoUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : (() => {
        if (!url) return '';
        if (url.includes('youtube.com/watch')) {
            const videoId = new URL(url).searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    })();

    const isYouTube = initialVideoUrl.includes('youtube.com/embed') || initialVideoUrl.includes('youtu.be');
    const heightVal = height === 'auto' ? undefined : height;

    useEffect(() => {
        setCurrentUrl(initialVideoUrl);
        setQualities({});
        setSelectedQuality("Auto (Original)");

        if (isYouTube || uploadedFile || !url) return;

        // Fetch qualities from the backend
        const fetchQualities = async () => {
            try {
                // Extract filename from URL
                const segments = url.split('/');
                const fileName = segments[segments.length - 1];
                if (!fileName) return;

                // Obtain token for authenticated request if available
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // Find host
                const host = url.startsWith('http') ? new URL(url).origin : '';
                const response = await axios.get(`${host}/api/course/files/video-qualities/${fileName}`, { headers });
                
                if (response.status === 200 && response.data?.qualities) {
                    const mappedQualities: Record<string, string> = {};
                    Object.entries(response.data.qualities).forEach(([key, val]) => {
                        let finalVal = val as string;
                        if (!finalVal.startsWith('http')) {
                            finalVal = `${host}${finalVal}`;
                        }
                        mappedQualities[key] = finalVal;
                    });
                    setQualities(mappedQualities);
                }
            } catch (e) {
                console.warn('Error fetching video resolutions:', e);
            }
        };

        fetchQualities();
    }, [url, isYouTube, uploadedFile, initialVideoUrl]);

    const handleQualityChange = (qualityName: string, qualityUrl: string) => {
        if (!videoRef.current || selectedQuality === qualityName) return;

        const video = videoRef.current;
        const currentTime = video.currentTime;
        const isPlaying = !video.paused;

        setSelectedQuality(qualityName);
        setCurrentUrl(qualityUrl);
        setShowMenu(false);

        // Resume playback at exact time
        const resumePlayback = () => {
            video.currentTime = currentTime;
            if (isPlaying) {
                video.play().catch(err => console.warn('Autoplay block:', err));
            }
            video.removeEventListener('loadedmetadata', resumePlayback);
        };

        video.addEventListener('loadedmetadata', resumePlayback);
    };

    if (isYouTube) {
        return (
            <div style={{ width, position: 'relative' }}>
                <iframe
                    src={`${initialVideoUrl}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}`}
                    style={{ width, height: heightVal ?? '500px', borderRadius: '8px', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div style={{ width, position: 'relative', overflow: 'hidden', borderRadius: '8px' }} className="video-player-container">
            <video
                ref={videoRef}
                src={currentUrl}
                controls={controls}
                autoPlay={autoplay}
                style={{ width, height: heightVal ?? 'auto', borderRadius: '8px', background: '#000', display: 'block' }}
                onEnded={onEnded}
            >
                Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            {/* Quality Gear Overlay */}
            {Object.keys(qualities).length > 0 && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            outline: 'none',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(8px)',
                            color: showMenu ? '#fbbf24' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                        title="Qualité de la vidéo"
                        className="btn-quality-gear"
                    >
                        <i className={`fas fa-cog ${showMenu ? 'fa-spin' : ''}`} style={{ fontSize: '16px' }} />
                    </button>

                    {/* Glassmorphic Dropdown Menu */}
                    {showMenu && (
                        <div
                            style={{
                                position: 'absolute',
                                right: 0,
                                marginTop: '8px',
                                width: '260px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '12px',
                                padding: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <div style={{ padding: '6px 12px', color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Économiseur de Bande Passante
                            </div>
                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                            {Object.entries(qualities).map(([name, qualityUrl]) => {
                                const isSelected = selectedQuality === name;
                                let desc = 'Qualité maximale';
                                let icon = 'fa-hd';
                                if (name.includes('240p')) {
                                    desc = 'Éco (-80% de data)';
                                    icon = 'fa-seedling';
                                } else if (name.includes('480p')) {
                                    desc = 'Standard (-50% de data)';
                                    icon = 'fa-bolt';
                                }

                                return (
                                    <button
                                        key={name}
                                        onClick={() => handleQualityChange(name, qualityUrl as string)}
                                        style={{
                                            width: '100%',
                                            background: isSelected ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            color: isSelected ? '#fbbf24' : '#f8fafc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.2s',
                                        }}
                                        className="quality-item-btn"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <i className={`fas ${icon}`} style={{ fontSize: '13px', width: '16px', color: isSelected ? '#fbbf24' : '#64748b' }} />
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500 }}>{name}</div>
                                                <div style={{ fontSize: '10px', color: isSelected ? 'rgba(251,191,36,0.7)' : '#64748b' }}>{desc}</div>
                                            </div>
                                        </div>
                                        {isSelected && <i className="fas fa-check" style={{ fontSize: '11px', color: '#fbbf24' }} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
