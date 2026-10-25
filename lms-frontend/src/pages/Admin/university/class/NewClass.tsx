import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { createClass } from "../../../../services/api/university";
import { CreateButton } from "../../../../components/Admin/ButtonIndicator";
import { useState } from "react";
import { StudentCard } from "../../../../components/Student/StudentCard";

const NewClass = () => {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await createClass({
                name: e.target.name.value,
                description: e.target.description.value
            });

            if (res && res.status === 201) {
                navigate(`/admin/university/class/${res.data.id}/details`);
            }
        } catch (error) {
            console.error("Error creating class:", error);
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <section className="content" style={{ padding: '0 1rem' }}>
            <BreadCrumb page_name="Nouvelle Classe" parent_name="Université" />
            
            <div className="container-fluid">
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate("/admin/university/class")} 
                        style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)',
                            background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer'
                        }}
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>Créer une nouvelle classe</h3>
                </div>

                <div className="row">
                    <div className="col-md-8">
                        <StudentCard title="Informations de la classe" icon="fa-plus-circle">
                            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                        Nom de la classe <span style={{ color: 'var(--danger)' }}>*</span>
                                    </label>
                                    <input 
                                        type="text" id="name" name="name" required 
                                        placeholder="Ex: DIC2 - Génie Informatique"
                                        style={{ 
                                            width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', 
                                            background: 'var(--bg-base)', border: '1px solid var(--border)', 
                                            color: 'var(--text-primary)', outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                        Description
                                    </label>
                                    <textarea 
                                        id="description" name="description" rows={4}
                                        placeholder="Détails optionnels sur la classe..."
                                        style={{ 
                                            width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', 
                                            background: 'var(--bg-base)', border: '1px solid var(--border)', 
                                            color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                    <button 
                                        type="submit" disabled={isCreating}
                                        style={{ 
                                            padding: '0.8rem 2rem', background: 'var(--accent)', color: 'white', 
                                            border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        {isCreating ? <i className="fas fa-spinner fa-spin"></i> : 'Créer la classe'}
                                    </button>
                                    <button 
                                        type="button" onClick={() => navigate("/admin/university/class")}
                                        style={{ 
                                            padding: '0.8rem 1.5rem', background: 'var(--bg-base)', color: 'var(--text-secondary)', 
                                            border: '1px solid var(--border)', borderRadius: '10px', fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </StudentCard>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NewClass;
