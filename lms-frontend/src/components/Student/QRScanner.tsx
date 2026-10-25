import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import api from '../../services/api/api';

interface QRScannerProps {
    studentId: string;
    onSuccess?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ studentId, onSuccess }) => {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    const getGpsPosition = (): Promise<GeolocationPosition> =>
        new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
        );

    const startScanner = async () => {
        setError(null);

        // Demande la géolocalisation AVANT d'ouvrir la caméra (optionnelle côté front, validée par le backend)
        let latitude: number | undefined;
        let longitude: number | undefined;
        try {
            const pos = await getGpsPosition();
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
        } catch (e) {
            console.warn("GPS non disponible ou refusé. Les coordonnées seront absentes.", e);
        }

        setScanning(true);

        // Un court délai pour s'assurer que le div 'qr-reader' est bien présent dans le DOM
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                const config = { fps: 10, qrbox: { width: 250, height: 250 } };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    async (decodedText) => {
                        await stopScanner();
                        try {
                            const response = await api.post('/course/attendance/qr-scan', {
                                token: decodedText,
                                studentId: studentId,
                                latitude,
                                longitude,
                            });
                            toast.success(response.data);
                            if (onSuccess) onSuccess();
                        } catch (err: any) {
                            toast.error(err.response?.data || "Erreur lors de l'émargement");
                            setScanning(false);
                        }
                    },
                    () => { /* scan en cours */ }
                );
            } catch (err: any) {
                console.error("Erreur caméra:", err);
                setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
                setScanning(false);
            }
        }, 300);
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                await html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Erreur lors de l'arrêt du scanner:", err);
            }
        }
        setScanning(false);
        html5QrCodeRef.current = null;
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                stopScanner();
            }
        };
    }, []);

    return (
        <div className="text-center">
            {!scanning ? (
                <button 
                    className="btn btn-primary btn-lg rounded-pill px-4"
                    onClick={startScanner}
                >
                    <i className="fas fa-qrcode mr-2"></i> Scanner mon émargement
                </button>
            ) : (
                <div className="card shadow-sm border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                    <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                        <span>Scan en cours...</span>
                        <button className="btn btn-sm btn-outline-light" onClick={stopScanner}>Annuler</button>
                    </div>
                    {error && (
                        <div className="alert alert-danger m-3 x-small">
                            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                        </div>
                    )}
                    <div id="qr-reader" style={{ width: '100%' }}></div>
                    <div className="card-body bg-light">
                        <p className="small text-muted mb-0">Placez le QR Code de l'enseignant devant la caméra.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
