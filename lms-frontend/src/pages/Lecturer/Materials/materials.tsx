import {Link, useParams, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {getMaterialsByModuleId, getModuleById, createMaterial, deleteMaterial, uploadFile} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";
import { StudentCard } from "../../../components/Student/StudentCard";
import { StudentPageHeader } from "../../../components/Student/StudentPageHeader";
import VideoPlayer from "../../../components/VideoPlayer";
import PdfViewer from "../../../components/PdfViewer";
import { ConfirmModal } from "../../../components/ui";

const LecturerMaterials = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<any[]>([]);
    const [module, setModule] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
    const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [newMaterial, setNewMaterial] = useState({
        title: '', description: '', type: 'PDF', fileUrl: '', moduleId: id
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (id) {
                const moduleData = await getModuleById(id);
                setModule(moduleData);
                const materialsData = await getMaterialsByModuleId(id);
                setMaterials(materialsData || []);
            }
        } catch (error) { console.error("Error fetching materials:", error); }
        finally { setLoading(false); }
    };

    const filteredMaterials = materials.filter((material: any) => {
        const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            material.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || material.type === filterType;
        return matchesSearch && matchesType;
    });

    useEffect(() => { fetchData(); }, [id, fetchData]);

    const handleAddMaterial = async (e: any) => {
        e.preventDefault();
        const isFileType = newMaterial.type === 'PDF' || newMaterial.type === 'DOCUMENT';
        try {
            setUploading(true);
            let fileUrl = newMaterial.fileUrl;
            if (isFileType && selectedFile) {
                const result = await uploadFile(selectedFile);
                fileUrl = result.url;
            }
            if (!fileUrl) { console.error("No file or URL provided"); return; }
            await createMaterial({ ...newMaterial, fileUrl });
            setNewMaterial({ title: '', description: '', type: 'PDF', fileUrl: '', moduleId: id });
            setSelectedFile(null);
            fetchData();
        } catch (error) { console.error("Error creating material:", error); } 
        finally { setUploading(false); }
    };

    const handleDelete = (materialId: string) => setDeleteTarget(materialId);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMaterial(deleteTarget); fetchData(); }
        catch (error) { console.error("Error deleting material:", error); }
        finally { setDeleteTarget(null); }
    };

    if (loading && !module) return <PageLoading />;

    return (
        <div className="content">
            <div className="container py-4">
                <StudentPageHeader 
                    title="Gestion des Supports" 
                    subtitle={module?.title || module?.name}
                    onBack={() => navigate(`/lecturer/${id}`)}
                    actions={
                        <ol className="breadcrumb bg-transparent p-0 m-0 font-weight-bold" style={{ fontSize: '0.85rem' }}>
                            <li className="breadcrumb-item"><Link to={"/lecturer"} className="text-primary">Accueil</Link></li>
                            <li className="breadcrumb-item active text-muted">Supports</li>
                        </ol>
                    }
                />
                <div className="row">
                    <div className="col-lg-4 mb-4">
                        <StudentCard title="Ajouter une ressource" icon="fa-plus-circle">
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
                                <button type="submit" className="btn btn-primary w-100 py-2 font-weight-bold" disabled={uploading} style={{ borderRadius: '10px' }}>
                                    {uploading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Mise en ligne...</>) : 'Publier le support'}
                                </button>
                            </form>
                        </StudentCard>
                    </div>

                    <div className="col-lg-8">
                        <StudentCard title="Supports déjà publiés" icon="fa-layer-group">
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
                            {filteredMaterials.length === 0 ? (
                                <div className="empty-state-box py-5">
                                    <i className="fas fa-folder-open mb-3 text-muted" style={{ fontSize: '3rem', opacity: 0.2 }} />
                                    <p className="font-weight-bold text-muted m-0">
                                        {materials.length === 0 ? 'Aucun support publié pour le moment.' : 'Aucun support ne correspond à votre recherche.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th className="border-top-0">Contenu</th>
                                                <th className="border-top-0">Format</th>
                                                <th className="border-top-0 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMaterials.map((material: any) => {
                                                const typeConfig: any = {
                                                    'PDF': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: 'fa-file-pdf', label: 'PDF' },
                                                    'VIDEO': { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', icon: 'fa-video', label: 'Vidéo' },
                                                    'LINK': { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', icon: 'fa-link', label: 'Lien' },
                                                    'DOCUMENT': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: 'fa-file-alt', label: 'Document' }
                                                };
                                                const config = typeConfig[material.type] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', icon: 'fa-file', label: material.type };
                                                return (
                                                    <tr key={material.id}>
                                                        <td className="align-middle py-3">
                                                            <div className="d-flex align-items-center">
                                                                <div className="mr-3 p-2 rounded" style={{ background: config.bg }}>
                                                                    <i className={`fas ${config.icon}`} style={{ color: config.color, fontSize: '1.2rem' }} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-weight-bold text-dark">{material.title}</div>
                                                                    <div className="text-secondary small mt-1">{material.description}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="align-middle">
                                                            <span className="badge px-3 py-2" style={{ background: config.bg, color: config.color, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                {config.label}
                                                            </span>
                                                        </td>
                                                        <td className="align-middle text-right">
                                                            <div className="d-flex justify-content-end" style={{ gap: '0.5rem' }}>
                                                                {material.type?.toUpperCase() === 'VIDEO' ? (
                                                                    <button
                                                                        onClick={() => setVideoModal({ url: material.fileUrl, title: material.title })}
                                                                        className="btn btn-sm btn-outline-info rounded"
                                                                        title="Voir la vidéo"
                                                                    >
                                                                        <i className="fas fa-play" />
                                                                    </button>
                                                                ) : material.type?.toUpperCase() === 'PDF' ? (
                                                                    <button
                                                                        onClick={() => setPdfModal({ url: material.fileUrl, title: material.title })}
                                                                        className="btn btn-sm btn-outline-info rounded"
                                                                        title="Voir le PDF"
                                                                    >
                                                                        <i className="fas fa-file-pdf" />
                                                                    </button>
                                                                ) : (
                                                                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info rounded" title="Voir le support">
                                                                        <i className="fas fa-eye" />
                                                                    </a>
                                                                )}
                                                                <button onClick={() => handleDelete(material.id)} className="btn btn-sm btn-outline-danger rounded" title="Supprimer">
                                                                    <i className="fas fa-trash" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </StudentCard>
                    </div>
                </div>
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

            <ConfirmModal
                show={!!deleteTarget}
                title="Supprimer le support"
                message="Êtes-vous sûr de vouloir supprimer ce support ?"
                confirmLabel="Supprimer"
                danger
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

export default LecturerMaterials;