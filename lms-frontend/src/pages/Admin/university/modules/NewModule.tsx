import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { createModule } from "../../../../services/api/course";
import { CreateButton } from "../../../../components/Admin/ButtonIndicator";
import api from "../../../../services/api/api";

const NewModule = () => {

    const navigate = useNavigate();
    const [teachingUnits, setTeachingUnits] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchTUs = async () => {
            const res = await api.get("/course/teaching-unit");
            setTeachingUnits(res.data || []);
        }
        fetchTUs();
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsCreating(true);
        
        const moduleData = {
            codeEC: e.target.codeEC.value,
            name: e.target.name.value,
            description: e.target.description.value,
            cmHours: parseInt(e.target.cmHours.value) || 0,
            tdHours: parseInt(e.target.tdHours.value) || 0,
            tpHours: parseInt(e.target.tpHours.value) || 0,
            tpeHours: parseInt(e.target.tpeHours.value) || 0,
            creditsEC: parseInt(e.target.creditsEC.value) || 0,
            teachingUnitId: parseInt(e.target.teachingUnitId.value),
            semester: e.target.semester.value,
            level: e.target.level.value
        };

        const create = await createModule(moduleData);

        if (create && create.status === 201) {
            e.target.reset();
            navigate(`/admin/university/module/${create.data.id}/details`);
        }
        setIsCreating(false);
    }

    return (
        <section className="content">
            < BreadCrumb page_name="Nouveau Module" parent_name="Université" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <form className="form-horizontal" onSubmit={handleSubmit}>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group row">
                                                <label htmlFor="codeEC" className="col-sm-4 col-form-label">Code EC <span className="text-danger">*</span></label>
                                                <div className="col-sm-8">
                                                    <input type="text" className="form-control" id="codeEC" name="codeEC" placeholder="ex: DEV15011" required />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label htmlFor="name" className="col-sm-4 col-form-label">Nom du Module <span className="text-danger">*</span></label>
                                                <div className="col-sm-8">
                                                    <input type="text" className="form-control" id="name" name="name" placeholder="ex: Administration Systèmes" required />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label htmlFor="teachingUnitId" className="col-sm-4 col-form-label">UE Parente <span className="text-danger">*</span></label>
                                                <div className="col-sm-8">
                                                    <select className="form-control" id="teachingUnitId" name="teachingUnitId" required>
                                                        <option value="">Sélectionner une UE...</option>
                                                        {teachingUnits.map(tu => (
                                                            <option key={tu.id} value={tu.id}>{tu.name} ({tu.codeUE})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group row">
                                                <label htmlFor="creditsEC" className="col-sm-4 col-form-label">Crédits EC <span className="text-danger">*</span></label>
                                                <div className="col-sm-8">
                                                    <input type="number" className="form-control" id="creditsEC" name="creditsEC" required />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label htmlFor="semester" className="col-sm-4 col-form-label">Semestre</label>
                                                <div className="col-sm-8">
                                                    <select className="form-control" id="semester" name="semester">
                                                        <option value="S1">S1</option>
                                                        <option value="S2">S2</option>
                                                        <option value="S3">S3</option>
                                                        <option value="S4">S4</option>
                                                        <option value="S5">S5</option>
                                                        <option value="S6">S6</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label htmlFor="level" className="col-sm-4 col-form-label">Niveau</label>
                                                <div className="col-sm-8">
                                                    <select className="form-control" id="level" name="level">
                                                        <option value="DIC1">DIC1</option>
                                                        <option value="DIC2">DIC2</option>
                                                        <option value="DIC3">DIC3</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr />
                                    <h5>Charges Horaires (Heures)</h5>
                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label>CM</label>
                                                <input type="number" className="form-control" name="cmHours" defaultValue={0} />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label>TD</label>
                                                <input type="number" className="form-control" name="tdHours" defaultValue={0} />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label>TP</label>
                                                <input type="number" className="form-control" name="tpHours" defaultValue={0} />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label>TPE</label>
                                                <input type="number" className="form-control" name="tpeHours" defaultValue={0} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group mt-3">
                                        <label htmlFor="description">Description</label>
                                        <textarea className="form-control" id="description" name="description" rows={3}></textarea>
                                    </div>

                                    <div className="form-group row mt-4">
                                        <div className="col-sm-12 d-flex">
                                            <CreateButton isSaving={isCreating} />
                                            <button type="reset" className="btn btn-default ml-2" onClick={() => navigate("/admin/university/module")}>Annuler</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default NewModule;