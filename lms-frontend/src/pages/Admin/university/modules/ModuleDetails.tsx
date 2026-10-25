import React, { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { useParams } from "react-router-dom";
import {
    getModuleById,
    updateModule
} from "../../../../services/api/course";
import { getLecturers } from "../../../../services/api/user";
import { SaveButton } from "../../../../components/Admin/ButtonIndicator";
import PageLoading from "../../../../components/Admin/PageLoading";

const ModuleDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [module, setModule] = useState<any>({
        id: '',
        codeEC: '',
        name: '',
        description: '',
        cmHours: 0,
        tdHours: 0,
        tpHours: 0,
        tpeHours: 0,
        creditsEC: 0,
        createdDate: '',
        semester: '',
        lecturerUsername: '',
        completedHours: 0,
        isValidated: false,
        teachingUnit: null
    });
    const [lecturers, setLecturers] = useState<any[]>([]);

    // Fetch module details using the id
    useEffect(() => {
        const fetchModuleDetails = async () => {
            const moduleData = await getModuleById(id || '');
            if (moduleData) {
                setModule({
                    ...moduleData,
                    completedHours: moduleData.completedHours || 0,
                    isValidated: moduleData.isValidated || false
                });
            }
            setLoading(false);
        };
        const fetchLecturersList = async () => {
            const list = await getLecturers();
            setLecturers(list || []);
        };
        fetchModuleDetails();
        fetchLecturersList();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        let val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        
        // Ensure numbers are sent as numbers
        if (type === 'number' || name === 'completedHours') {
            val = val === "" ? 0 : parseInt(val, 10);
        }

        setModule((prevModule: any) => ({
            ...prevModule,
            [name]: val
        }));
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log(module);

        setIsSaving(true);
        if (id) {
            await updateModule(id, module);
        }
        setTimeout(() => {
            setIsSaving(false);
        }, 1000);
    };

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content">
            <div className="content-header p-0 pt-3">
                <div className="container-fluid">
                    <div className="row mb-2 align-items-center">
                        <div className="col-sm-auto pr-0">
                            <button 
                                onClick={() => window.history.back()} 
                                className="btn btn-light shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: '42px', height: '42px', borderRadius: '50%', color: '#3b82f6', background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s', marginRight: '1rem' }}
                                title="Retour"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        </div>
                        <div className="col-sm-6">
                            <h1 className="m-0 font-weight-bold ml-2" style={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                                {module.name} <span className="text-muted" style={{ fontSize: '1.2rem' }}>({module.codeEC})</span>
                            </h1>
                        </div>
                        <div className="col-sm-5 text-right">
                            <ol className="breadcrumb float-sm-right bg-transparent p-0 m-0">
                                <li className="breadcrumb-item"><a href="/admin/university/class">Université</a></li>
                                <li className="breadcrumb-item"><a href="/admin/university/module">Module</a></li>
                                <li className="breadcrumb-item active">Détails</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid mt-3">
                <div className="row">
                    <div className="col-12">
                        <div className="card card-primary card-outline card-outline-tabs">
                            <div className="card-header p-0 border-bottom-0">
                                <ul className="nav nav-tabs" id="custom-tabs-four-tab" role="tablist">
                                    <li className="nav-item">
                                        <a className="nav-link active" id="custom-tabs-four-details-tab" data-toggle="pill" href={"#custom-tabs-four-details"} role="tab" aria-controls="custom-tabs-four-details" aria-selected="true">Details</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" id="custom-tabs-four-lecturer-tab" data-toggle="pill" href={"#custom-tabs-four-lecturer"} role="tab" aria-controls="custom-tabs-four-lecturer" aria-selected="false">Conférencier</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" id="custom-tabs-four-progress-tab" data-toggle="pill" href={"#custom-tabs-four-progress"} role="tab" aria-controls="custom-tabs-four-progress" aria-selected="false">Avancement</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" id="custom-tabs-four-settings-tab" data-toggle="pill" href={"#custom-tabs-four-settings"} role="tab" aria-controls="custom-tabs-four-settings" aria-selected="false">Paramètres</a>
                                    </li>
                                </ul>
                            </div>
                            <div className="card-body">
                                {loading ? (
                                    <div>Loading...</div>
                                ) : (
                                    <div className="tab-content" id="custom-tabs-four-tabContent">
                                        <div className="tab-pane fade show active" id="custom-tabs-four-details" role="tabpanel" aria-labelledby="custom-tabs-four-details-tab">
                                            <form className="form-horizontal" id="createRoleForm" onSubmit={handleUpdate}>
                                                <div className="card-body">
                                                    <div className="form-group row">
                                                        <label htmlFor="codeEC" className="col-sm-2 col-form-label">Module
                                                            ID <span className="text-danger">*</span></label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" id="codeEC"
                                                                   name="codeEC" value={module.codeEC} onChange={handleChange} required/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="createdDate"
                                                               className="col-sm-2 col-form-label">Created At <span
                                                            className="text-danger">*</span></label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" id="createdDate"
                                                                   name="createdDate"
                                                                   value={new Date(module.createdDate).toLocaleString()}
                                                                   disabled/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="name" className="col-sm-2 col-form-label">Module
                                                            Name</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" id="name"
                                                                   name="name" value={module.name}
                                                                   onChange={handleChange} required/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="description"
                                                               className="col-sm-2 col-form-label">Description</label>
                                                        <div className="col-sm-10">
                                                            <textarea className="form-control" id="description"
                                                                      name="description" value={module.description}
                                                                      onChange={handleChange}></textarea>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-sm-2 col-form-label">Charges Horaires</label>
                                                        <div className="col-sm-10">
                                                            <div className="row">
                                                                <div className="col-md-3">
                                                                    <div className="input-group">
                                                                        <div className="input-group-prepend"><span className="input-group-text">CM</span></div>
                                                                        <input type="number" className="form-control" name="cmHours" value={module.cmHours} onChange={handleChange}/>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <div className="input-group">
                                                                        <div className="input-group-prepend"><span className="input-group-text">TD</span></div>
                                                                        <input type="number" className="form-control" name="tdHours" value={module.tdHours} onChange={handleChange}/>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <div className="input-group">
                                                                        <div className="input-group-prepend"><span className="input-group-text">TP</span></div>
                                                                        <input type="number" className="form-control" name="tpHours" value={module.tpHours} onChange={handleChange}/>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <div className="input-group">
                                                                        <div className="input-group-prepend"><span className="input-group-text">TPE</span></div>
                                                                        <input type="number" className="form-control" name="tpeHours" value={module.tpeHours} onChange={handleChange}/>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="creditsEC"
                                                               className="col-sm-2 col-form-label">Crédits</label>
                                                        <div className="col-sm-10">
                                                            <input type="number" className="form-control" id="creditsEC"
                                                                   name="creditsEC" value={module.creditsEC}
                                                                   onChange={handleChange}/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="semester"
                                                               className="col-sm-2 col-form-label">Semester</label>
                                                        <div className="col-sm-10">
                                                            <select className="form-control" id="semester" name="semester" value={module.semester} onChange={handleChange}>
                                                                <option value="">Select Semester</option>
                                                                <option value="Year 1 - Semester 1">Year 1 Semester 1</option>
                                                                <option value="Year 1 - Semester 2">Year 1 Semester 2</option>
                                                                <option value="Year 2 - Semester 1">Year 2 Semester 1</option>
                                                                <option value="Year 2 - Semester 2">Year 2 Semester 2</option>
                                                                <option value="Year 3 - Semester 1">Year 3 Semester 1</option>
                                                                <option value="Year 3 - Semester 2">Year 3 Semester 2</option>
                                                                <option value="Year 4 - Semester 1">Year 4 Semester 1</option>
                                                                <option value="Year 4 - Semester 2">Year 4 Semester 2</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row mt-4">
                                                        <label className="col-sm-2 col-form-label"></label>
                                                        <div className="col-sm-10 d-flex">
                                                            <SaveButton isSaving={isSaving} onClick={handleUpdate}/>
                                                            <button type="reset"
                                                                    className="btn btn-default float-right">Annuler</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <div className="tab-pane fade" id="custom-tabs-four-lecturer" role="tabpanel"
                                             aria-labelledby="custom-tabs-four-lecturer-tab">
                                            <form className="form-horizontal" onSubmit={handleUpdate}>
                                                <div className="card-body">
                                                    <div className="form-group row">
                                                        <label htmlFor="lecturer" className="col-sm-3 col-form-label">
                                                            Professeur Assigné
                                                        </label>
                                                        <div className="col-sm-9">
                                                            <select 
                                                                className="form-control" 
                                                                id="lecturerUsername" 
                                                                name="lecturerUsername" 
                                                                value={module.lecturerUsername || ""} 
                                                                onChange={handleChange}
                                                            >
                                                                <option value="">Sélectionner un professeur...</option>
                                                                {lecturers.map(lecturer => (
                                                                    <option key={lecturer.id} value={lecturer.username}>
                                                                        {lecturer.firstName} {lecturer.lastName} ({lecturer.username})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row mt-4">
                                                        <label className="col-sm-3 col-form-label"></label>
                                                        <div className="col-sm-9 d-flex">
                                                            <SaveButton isSaving={isSaving} onClick={handleUpdate}/>
                                                            <button type="reset" className="btn btn-default float-right">Annuler</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="tab-pane fade" id="custom-tabs-four-progress" role="tabpanel" aria-labelledby="custom-tabs-four-progress-tab">
                                            <form className="form-horizontal" onSubmit={handleUpdate}>
                                                <div className="card-body">
                                                    <div className="p-3 mb-4" style={{ borderLeft: '5px solid var(--success)', background: 'var(--accent-light)', borderRadius: '12px' }}>
                                                        <h5 className="font-weight-bold" style={{ color: 'var(--accent)' }}><i className="fas fa-chart-line mr-2"></i>Suivi de l'avancement pédagogique</h5>
                                                        <p className="mb-0 text-secondary">L'avancement est calculé automatiquement sur la base des heures effectuées par rapport à la charge horaire totale ({module.totalCH || module.duration || 0}h).</p>
                                                    </div>

                                                    <div className="form-group row">
                                                        <label htmlFor="completedHours" className="col-sm-3 col-form-label">Heures effectuées</label>
                                                        <div className="col-sm-4">
                                                            <div className="input-group">
                                                                <input type="number" className="form-control" id="completedHours" name="completedHours" 
                                                                       value={module.completedHours || 0} onChange={handleChange} min="0" max={module.totalCH || module.duration} />
                                                                <div className="input-group-append">
                                                                    <span className="input-group-text">/ {module.totalCH || module.duration || 0} h</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="form-group row align-items-center">
                                                        <label className="col-sm-3 col-form-label">Calcul automatique</label>
                                                        <div className="col-sm-9">
                                                            <div className="progress mb-1" style={{ height: 12, borderRadius: 6 }}>
                                                                <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                                                                     style={{ width: `${Math.min(100, Math.round(((module.completedHours || 0) / (module.totalCH || module.duration || 1)) * 100))}%` }}>
                                                                </div>
                                                            </div>
                                                            <span className="font-weight-bold">{Math.min(100, Math.round(((module.completedHours || 0) / (module.totalCH || module.duration || 1)) * 100))}% terminé</span>
                                                        </div>
                                                    </div>

                                                    <div className="form-group row mt-4">
                                                        <div className="col-sm-3"></div>
                                                        <div className="col-sm-9">
                                                            <div className="custom-control custom-switch custom-switch-off-danger custom-switch-on-accent">
                                                                <input type="checkbox" className="custom-control-input" id="isValidated" name="isValidated" 
                                                                       checked={module.isValidated || false} onChange={handleChange} />
                                                                <label className="custom-control-label font-weight-bold" htmlFor="isValidated">
                                                                    Valider manuellement la fin du module
                                                                </label>
                                                            </div>
                                                            <small className="text-muted d-block mt-1">
                                                                Cochez cette option si le module est considéré comme terminé, même si toutes les heures n'ont pas été consommées.
                                                            </small>
                                                        </div>
                                                    </div>

                                                    <div className="form-group row mt-5">
                                                        <div className="col-sm-3"></div>
                                                        <div className="col-sm-9 d-flex">
                                                            <SaveButton isSaving={isSaving} onClick={handleUpdate}/>
                                                            <button type="reset" className="btn btn-default ml-2">Annuler</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="tab-pane fade" id="custom-tabs-four-settings" role="tabpanel"
                                             aria-labelledby="custom-tabs-four-settings-tab">
                                            <div className="card-body">
                                                <p className="text-muted">Paramètres avancés du module.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                    {/* /.col */}
                </div>
                {/* /.row */}
            </div>
            {/* /.container-fluid */}
        </section>
    );
}

export default ModuleDetails;