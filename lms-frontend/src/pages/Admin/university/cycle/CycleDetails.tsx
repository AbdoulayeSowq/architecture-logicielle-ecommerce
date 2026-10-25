import React, { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { useParams, Link } from "react-router-dom";
import {
    assignDepartmentToCycle,
    getDepartmentsByCycleId,
    getDepartmentsWithoutAssigned,
    getCycleById,
    unassignDepartmentFromCycle,
    updateCycle,
} from "../../../../services/api/university";
import { AssignButton, SaveButton } from "../../../../components/Admin/ButtonIndicator";
import PageLoading from "../../../../components/Admin/PageLoading";
import { notifyError, notifySuccess } from "../../../../components/notify";

const CycleDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [deptLoading, setDeptLoading] = useState(true);
    const [cycleDeptLoading, setCycleDeptLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAssign, setIsAssign] = useState(false);
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
    const [cycle, setCycle] = useState<any>({
        id: '', cid: '', name: '', description: '', createdDate: ''
    });
    const [departments, setDepartments] = useState<any[]>([]);
    const [cycleDepartments, setCycleDepartments] = useState<any[]>([]);

    // Fetch cycle info
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getCycleById(id || '');
                setCycle(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

    // Fetch unassigned departments (for modal)
    const fetchDepartments = async () => {
        const data = await getDepartmentsWithoutAssigned();
        setDepartments(Array.isArray(data) ? data : []);
        setDeptLoading(false);
    };
    useEffect(() => { fetchDepartments(); }, []);

    // Fetch departments of this cycle
    const fetchCycleDepartments = async () => {
        const data = await getDepartmentsByCycleId(id || '');
        setCycleDepartments(Array.isArray(data) ? data : []);
        setCycleDeptLoading(false);
    };
    useEffect(() => { fetchCycleDepartments(); }, [id]);

    // DataTable — département du cycle
    useEffect(() => {
        if (!cycleDeptLoading) {
            const table = ($('#cycle-dept-table') as any).DataTable({
                lengthChange: false, autoWidth: false, ordering: false,
                buttons: [{
                    text: 'Ajouter un département',
                    action: () => {
                        ($('<button type="button" style="display:none;" data-toggle="modal" data-target="#addDeptModal"></button>')
                            .appendTo('body') as any).trigger('click').remove();
                    },
                }],
            });
            (table.buttons().container() as any).appendTo('#cycle-dept-table_wrapper .col-md-6:eq(0)');
            return () => { table.destroy(); };
        }
    }, [cycleDeptLoading, id, loading]);

    // DataTable — liste des depts non assignés
    useEffect(() => {
        if (!deptLoading) {
            const t = ($('#dept-table') as any).DataTable({ lengthChange: false, autoWidth: false, ordering: false });
            return () => { t.destroy(); };
        }
    }, [deptLoading, id, loading]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCycle((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        if (id) await updateCycle(id, cycle);
        setTimeout(() => setIsSaving(false), 1000);
    };

    const handleCheckboxChange = (itemId: string) => {
        setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const getCheckedIds = () => Object.keys(checkedItems).filter(k => checkedItems[k]);

    const handleUnassign = async (deptId: string) => {
        await unassignDepartmentFromCycle(deptId);
        await fetchCycleDepartments();
        await fetchDepartments();
    };

    const handleAssign = async () => {
        const ids = getCheckedIds();
        if (ids.length === 0) return;
        try {
            setIsAssign(true);
            await Promise.all(ids.map(dId => assignDepartmentToCycle(id || '', dId)));
            notifySuccess("Département(s) assigné(s) avec succès");
            await fetchCycleDepartments();
            await fetchDepartments();
            setCheckedItems({});
        } catch (error: any) {
            notifyError(error.response?.data || error.message);
        } finally {
            setIsAssign(false);
        }
    };

    if (loading && !cycle.id) return <PageLoading />;

    return (
        <section className="content">
            <BreadCrumb title={cycle.name || 'Cycle'} page_name="Cycle" parent_name="Université" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card card-primary card-outline card-outline-tabs">
                            <div className="card-header p-0 border-bottom-0">
                                <ul className="nav nav-tabs" id="cycle-tabs" role="tablist">
                                    <li className="nav-item">
                                        <a className="nav-link active" data-toggle="pill" href="#tab-details" role="tab">Détails</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" data-toggle="pill" href="#tab-departments" role="tab">Départements</a>
                                    </li>
                                </ul>
                            </div>
                            <div className="card-body">
                                <div className="tab-content">
                                    {/* ── Détails ── */}
                                    <div className="tab-pane fade show active" id="tab-details" role="tabpanel">
                                        <form className="form-horizontal" onSubmit={handleUpdate}>
                                            <div className="card-body">
                                                <div className="form-group row">
                                                    <label className="col-sm-2 col-form-label">ID Cycle</label>
                                                    <div className="col-sm-10">
                                                        <input className="form-control" value={cycle.cid || ''} disabled />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <label className="col-sm-2 col-form-label">Créé le</label>
                                                    <div className="col-sm-10">
                                                        <input className="form-control" value={cycle.createdDate ? new Date(cycle.createdDate).toLocaleString() : ''} disabled />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <label htmlFor="name" className="col-sm-2 col-form-label">Nom</label>
                                                    <div className="col-sm-10">
                                                        <input type="text" className="form-control" id="name" name="name" value={cycle.name || ''} onChange={handleChange} required />
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <label htmlFor="description" className="col-sm-2 col-form-label">Description</label>
                                                    <div className="col-sm-10">
                                                        <textarea className="form-control" id="description" name="description" value={cycle.description || ''} onChange={handleChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group row mt-4">
                                                    <label className="col-sm-2 col-form-label" />
                                                    <div className="col-sm-10 d-flex">
                                                        <SaveButton isSaving={isSaving} onClick={handleUpdate} />
                                                        <button type="reset" className="btn btn-default ml-2">Annuler</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    {/* ── Départements ── */}
                                    <div className="tab-pane fade" id="tab-departments" role="tabpanel">
                                        {/* Modal ajout département */}
                                        <div className="modal fade" id="addDeptModal">
                                            <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-lg">
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h4 className="modal-title">Ajouter un département au cycle</h4>
                                                        <button type="button" className="close" data-dismiss="modal"><span>&times;</span></button>
                                                    </div>
                                                    <div className="modal-body">
                                                        {deptLoading ? <div>Chargement...</div> : (
                                                            <table id="dept-table" className="table table-hover text-nowrap">
                                                                <thead><tr><th>ID</th><th>Nom</th></tr></thead>
                                                                <tbody>
                                                                    {departments.map((d: any) => (
                                                                        <tr key={d.id}>
                                                                            <td>
                                                                                <div className="custom-control custom-checkbox">
                                                                                    <input type="checkbox" className="custom-control-input" id={`chk-${d.id}`}
                                                                                        checked={!!checkedItems[d.id]} onChange={() => handleCheckboxChange(d.id)} />
                                                                                    <label className="custom-control-label" htmlFor={`chk-${d.id}`}>{d.did || d.id}</label>
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <span className="badge bg-info mr-2">{d.abbreviation || (d.name.match(/\(([^)]+)\)/)?.[1]) || '---'}</span>
                                                                                {d.name.split(' (')[0]}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                    <div className="modal-footer d-flex justify-content-start">
                                                        <AssignButton onClick={handleAssign} isSaving={isAssign} disabled={getCheckedIds().length === 0} />
                                                        <button type="button" className="btn btn-default ml-2" data-dismiss="modal">Fermer</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table départements du cycle */}
                                        {cycleDeptLoading ? <div>Chargement...</div> : (
                                            <table id="cycle-dept-table" className="table table-hover text-nowrap">
                                                <thead><tr><th>ID Dept</th><th>Nom</th><th></th></tr></thead>
                                                <tbody>
                                                    {cycleDepartments.map((d: any) => (
                                                        <tr key={d.id}>
                                                            <td>
                                                                <span className="badge bg-indigo" style={{fontSize: '0.9rem'}}>
                                                                    {d.abbreviation || (d.name.match(/\(([^)]+)\)/)?.[1]) || d.did || 'DEPT'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Link to={`/admin/university/department/${d.id}/details`}>
                                                                    {d.name.split(' (')[0]}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                <i className="fas fa-ellipsis-v" data-toggle="dropdown" />
                                                                <div className="dropdown-menu">
                                                                    <button className="dropdown-item text-danger" onClick={() => handleUnassign(d.id)}>Désassigner</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CycleDetails;
