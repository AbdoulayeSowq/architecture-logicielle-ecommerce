import React, { useEffect, useState } from "react";
import { getStudentCertificats, verifyCertificat } from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";

interface Certificat {
    id: number;
    studentId: number;
    course?: { id: number; name: string; code?: string };
    moduleId?: number;
    urlPdf?: string;
    codeVerification: string;
    dateEmission: string;
}

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const Certificates: React.FC = () => {
    const [certs, setCerts]             = useState<Certificat[]>([]);
    const [loading, setLoading]         = useState(true);
    const [verifyCode, setVerifyCode]   = useState("");
    const [verifyResult, setVerifyResult] = useState<Certificat | null | undefined>(undefined);
    const [verifyNotFound, setVerifyNotFound] = useState(false);
    const [verifying, setVerifying]     = useState(false);
    const [copied, setCopied]           = useState<number | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const stored = localStorage.getItem("user");
                const uname = stored ? JSON.parse(stored).username || JSON.parse(stored).email : "";
                const details = await getStudentDetailsByUsername(uname);
                const sid = details?.id;
                if (sid) {
                    const data = await getStudentCertificats(String(sid));
                    setCerts(Array.isArray(data) ? data : []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyCode.trim()) return;
        setVerifying(true);
        setVerifyResult(undefined);
        setVerifyNotFound(false);
        const result = await verifyCertificat(verifyCode.trim());
        if (result) { setVerifyResult(result); } else { setVerifyNotFound(true); }
        setVerifying(false);
    };

    const handleCopy = (cert: Certificat) => {
        navigator.clipboard.writeText(cert.codeVerification).catch(() => {});
        setCopied(cert.id);
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) return <PageLoading />;

    return (
        <div className="content">
            <div className="container py-4">
                <StudentPageHeader
                    title="Mes Certificats"
                    subtitle="Certificats obtenus pour vos cours complétés."
                    icon="fa-certificate"
                />

                {/* Certificate grid */}
                {certs.length === 0 ? (
                    <div className="empty-state-box mb-4">
                        <i className="fas fa-certificate" />
                        <p>Terminez un cours pour obtenir votre certificat officiel.</p>
                    </div>
                ) : (
                    <div className="module-grid mb-4">
                        {certs.map(cert => (
                            <div key={cert.id} className="card">
                                <div className="card-header d-flex align-items-center" style={{ gap: 12 }}>
                                    <span style={{ fontSize: '1.75rem' }}>🎓</span>
                                    <div>
                                        <p className="font-weight-bold mb-0">
                                            {cert.course?.name ?? `Cours #${cert.course?.id ?? '?'}`}
                                        </p>
                                        <small style={{ color: 'var(--accent)' }}>
                                            {cert.dateEmission ? fmtDate(cert.dateEmission) : '—'}
                                        </small>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <label>CODE DE VÉRIFICATION</label>
                                    <div className="input-group mb-3">
                                        <input
                                            className="form-control mono"
                                            value={cert.codeVerification}
                                            readOnly
                                            style={{ color: 'var(--accent)' }}
                                        />
                                        <div className="input-group-append">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleCopy(cert)}
                                            >
                                                <i className={`fas ${copied === cert.id ? 'fa-check' : 'fa-copy'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    {cert.urlPdf && (
                                        <a
                                            href={cert.urlPdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-sm"
                                        >
                                            <i className="fas fa-file-download mr-1" /> Télécharger le PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Verify panel */}
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">
                            <i className="fas fa-search mr-2 text-muted" />
                            Vérifier l'authenticité d'un certificat
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleVerify} className="d-flex flex-wrap" style={{ gap: 12 }}>
                            <input
                                type="text"
                                className="form-control"
                                style={{ flex: 1, minWidth: 240 }}
                                placeholder="Entrez le code de vérification..."
                                value={verifyCode}
                                onChange={e => setVerifyCode(e.target.value)}
                                id="cert-verify-input"
                            />
                            <button type="submit" className="btn btn-primary" disabled={verifying} id="cert-verify-btn">
                                {verifying ? <><i className="fas fa-spinner fa-spin mr-1" /> Vérification...</> : 'Vérifier'}
                            </button>
                        </form>

                        {verifyNotFound && (
                            <div className="alert alert-danger mt-3 mb-0">
                                <i className="fas fa-times-circle mr-2" />
                                Ce code est invalide ou n'existe pas.
                            </div>
                        )}
                        {verifyResult && (
                            <div className="alert alert-success mt-3 mb-0">
                                <i className="fas fa-check-circle mr-2" />
                                Certificat authentique — <strong>{verifyResult.course?.name}</strong> délivré le <strong>{fmtDate(verifyResult.dateEmission)}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificates;
