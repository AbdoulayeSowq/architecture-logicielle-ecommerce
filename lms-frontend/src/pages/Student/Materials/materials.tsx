import {useParams, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getMaterialsByModuleId, getModuleById, createMaterial, uploadFile} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import { StudentCard } from "../../../components/Student/StudentCard";
import VideoPlayer from "../../../components/VideoPlayer";
import PdfViewer from "../../../components/PdfViewer";

const Materials = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
    const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const [newMaterial, setNewMaterial] = useState({
        title: '', description: '', type: 'PDF', fileUrl: '', moduleId: id
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (id) {
                    const moduleData = id && id !== 'modules' ? await getModuleById(id) : null;
                    setModule(moduleData);
                    const materialsData = await getMaterialsByModuleId(id);
                    setMaterials(materialsData || []);
                }
            } catch (error) {
                console.error("Error fetching materials:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const stripCode = (title: string) => {
        if (!title) return '';
        return title.replace(/^\[.*?\]\s*/, '');
    };

    const filteredMaterials = materials.filter((material: any) => {
        const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            material.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || material.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleAddMaterial = async (e: any) => {
        e.preventDefault();
        const isFileType = newMaterial.type === 'PDF' || newMaterial.type === 'DOCUMENT' || newMaterial.type === 'VIDEO';
        try {
            setUploading(true);
            let fileUrl = newMaterial.fileUrl;
            if (isFileType && selectedFile) {
                const result = await uploadFile(selectedFile);
                fileUrl = result.url;
            }
            if (!fileUrl) { console.error("No file or URL provided"); return; }
            await createMaterial({
                ...newMaterial,
                fileUrl,
                moduleId: id
            });
            setNewMaterial({ title: '', description: '', type: 'PDF', fileUrl: '', moduleId: id });
            setSelectedFile(null);
            setShowUploadForm(false);
            if (id) {
                const materialsData = await getMaterialsByModuleId(id);
                setMaterials(materialsData || []);
            }
        } catch (error) {
            console.error("Error adding material:", error);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <div className="content">
            <div className="container py-4">
                <StudentPageHeader 
                    title={stripCode(module?.title) || "Supports de cours"} 
                    subtitle={`Ressources et documents pédagogiques pour le module ${module?.code || ''}.`} 
                    icon="fa-folder-open"
                >
                    <button 
                        onClick={() => navigate(`/student/${id}`)}
                        className="btn btn-outline-secondary px-4"
                        style={{ borderRadius: '8px' }}
                    >
                        <i className="fas fa-arrow-left mr-2"></i> Retour
                    </button>
                </StudentPageHeader>

                {showUploadForm && (
                    <StudentCard className="mb-4" title="Ajouter une ressource" icon="fa-plus-circle">
                        <form onSubmit={handleAddMaterial}>
                            <div className="form-group mb-3">
                                <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Titre du support</label>
                                <input type="text" className="form-control bg-light py-4 font-weight-bold" required
                                    value={newMaterial.title}
                                    onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                                    placeholder="ex: Introduction au cours..."/>
                            </div>
                            <div className="form-group mb-3">
                                <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Description</label>
                                <textarea className="form-control bg-light p-3" rows={3}
                                    value={newMaterial.description}
                                    onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                                    placeholder="Brève description du contenu..."></textarea>
                            </div>
                            <div className="form-group mb-3">
                                <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Type de ressource</label>
                                <select className="form-control bg-light"
                                    value={newMaterial.type}
                                    onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}>
                                    <option value="PDF">Document PDF</option>
                                    <option value="VIDEO">Vidéo (Fichier ou Lien)</option>
                                    <option value="LINK">Site Web Externe</option>
                                    <option value="DOCUMENT">Autre Document</option>
                                </select>
                            </div>
                            {(newMaterial.type === 'PDF' || newMaterial.type === 'DOCUMENT' || newMaterial.type === 'VIDEO') ? (
                                <>
                                    <div className="form-group mb-3">
                                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Fichier {newMaterial.type === 'PDF' ? '(PDF)' : newMaterial.type === 'VIDEO' ? '(MP4, WebM, etc.)' : ''}</label>
                                        <div className="position-relative">
                                            <input type="file" className="form-control bg-light py-1"
                                                accept={newMaterial.type === 'PDF' ? 'application/pdf' : newMaterial.type === 'VIDEO' ? 'video/*' : undefined}
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                required={!newMaterial.fileUrl}/>
                                        </div>
                                        {selectedFile && (
                                            <div className="mt-2 p-2 bg-primary-light rounded small font-weight-bold text-primary d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                                <i className="fas fa-file-alt" />
                                                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">Ou lien (optionnel)</label>
                                        <input type="url" className="form-control bg-light py-4"
                                            value={newMaterial.fileUrl}
                                            onChange={(e) => setNewMaterial({...newMaterial, fileUrl: e.target.value})}
                                            placeholder="https://youtube.com/..."/>
                                    </div>
                                </>
                            ) : (
                                <div className="form-group mb-4">
                                    <label className="text-muted small font-weight-bold text-uppercase d-block mb-2">URL de la ressource</label>
                                    <input type="url" className="form-control bg-light py-4" required
                                        value={newMaterial.fileUrl}
                                        onChange={(e) => setNewMaterial({...newMaterial, fileUrl: e.target.value})}
                                        placeholder="https://..."/>
                                </div>
                            )}
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary px-4 font-weight-bold" disabled={uploading} style={{ borderRadius: '10px' }}>
                                    {uploading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Mise en ligne...</>) : 'Publier'}
                                </button>
                                <button type="button" onClick={() => setShowUploadForm(false)} className="btn btn-outline-secondary px-4 font-weight-bold" style={{ borderRadius: '10px' }}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </StudentCard>
                )}

                <div className="mb-3">
                    {!showUploadForm && (
                        <button onClick={() => setShowUploadForm(true)} className="btn btn-primary px-4" style={{ borderRadius: '8px' }}>
                            <i className="fas fa-plus mr-2"></i> Ajouter une ressource
                        </button>
                    )}
                </div>

                <StudentCard className="border-0 overflow-hidden">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <input
                                type="text"
                                className="form-control bg-light"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <select
                                className="form-control bg-light"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="ALL">Tous les types</option>
                                <option value="PDF">PDF</option>
                                <option value="VIDEO">Vidéo</option>
                                <option value="LINK">Lien</option>
                                <option value="DOCUMENT">Document</option>
                            </select>
                        </div>
                    </div>
                    <div className="table-responsive">
                        {filteredMaterials.length === 0 ? (
                            <div className="empty-state-box py-5">
                                <i className="fas fa-folder-open fa-3x mb-3"></i>
                                <p style={{ fontSize: '1.1rem' }}>
                                    {materials.length === 0 ? 'Aucun support disponible pour ce module pour le moment.' : 'Aucun support ne correspond à votre recherche.'}
                                </p>
                            </div>
                        ) : (
                            <table className="table table-borderless mb-0">
                                <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)" }}>
                                    <tr>
                                        <th style={{ color: "var(--text-secondary)", padding: "1.25rem" }} className="small font-weight-bold">TYPE</th>
                                        <th style={{ color: "var(--text-secondary)", padding: "1.25rem" }} className="small font-weight-bold">TITRE</th>
                                        <th style={{ color: "var(--text-secondary)", padding: "1.25rem" }} className="small font-weight-bold">DESCRIPTION</th>
                                        <th style={{ color: "var(--text-secondary)", padding: "1.25rem" }} className="small font-weight-bold text-center">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMaterials.map((material: any) => {
                                        const typeColors: any = {
                                            'PDF': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: 'fa-file-pdf' },
                                            'VIDEO': { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', icon: 'fa-video' },
                                            'LINK': { bg: 'rgba(16, 163, 74, 0.1)', color: 'var(--success)', icon: 'fa-link' },
                                            'DOCUMENT': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: 'fa-file-word' }
                                        };
                                        const meta = typeColors[material.type] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', icon: 'fa-file' };
                                        
                                        return (
                                            <tr key={material.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="hover-row">
                                                <td style={{ padding: "1.5rem" }}>
                                                    <span className="badge px-3 py-2" style={{ 
                                                        background: meta.bg, 
                                                        color: meta.color,
                                                        borderRadius: "6px",
                                                        fontSize: "0.7rem",
                                                        fontWeight: 700
                                                    }}>
                                                        <i className={`fas ${meta.icon} mr-2`}></i>{material.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1.5rem" }}>
                                                    <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{material.title}</div>
                                                </td>
                                                <td style={{ padding: "1.5rem" }}>
                                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "400px" }}>{material.description}</div>
                                                </td>
                                                <td style={{ padding: "1.5rem" }} className="text-center">
                                                    {material.type?.toUpperCase() === 'VIDEO' ? (
                                                        <button
                                                            onClick={() => setVideoModal({ url: material.fileUrl, title: material.title })}
                                                            className="btn btn-primary btn-sm px-3"
                                                            style={{ borderRadius: "6px" }}
                                                        >
                                                            <i className="fas fa-play mr-1"></i> Regarder
                                                        </button>
                                                    ) : material.type?.toUpperCase() === 'PDF' ? (
                                                        <button
                                                            onClick={() => setPdfModal({ url: material.fileUrl, title: material.title })}
                                                            className="btn btn-primary btn-sm px-3"
                                                            style={{ borderRadius: "6px" }}
                                                        >
                                                            <i className="fas fa-file-pdf mr-1"></i> Voir
                                                        </button>
                                                    ) : (
                                                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm px-3" style={{ borderRadius: "6px" }}>
                                                            <i className="fas fa-external-link-alt mr-1"></i> Ouvrir
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </StudentCard>
            </div>

            {/* Video Modal */}
            {videoModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setVideoModal(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h5 style={{ margin: 0, fontWeight: 700 }}>{videoModal.title}</h5>
                            <button
                                onClick={() => setVideoModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <VideoPlayer url={videoModal.url} autoplay />
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {pdfModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setPdfModal(null)}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            maxWidth: '1000px',
                            width: '100%',
                            maxHeight: '95vh',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h5 style={{ margin: 0, fontWeight: 700 }}>{pdfModal.title}</h5>
                            <button
                                onClick={() => setPdfModal(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '20px', maxHeight: '85vh', overflow: 'auto' }}>
                            <PdfViewer url={pdfModal.url} height="75vh" />
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .hover-row:hover {
                    background: var(--bg-hover) !important;
                }
            `}</style>
        </div>
    );
};

export default Materials;