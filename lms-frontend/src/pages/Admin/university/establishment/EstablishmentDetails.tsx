import React, { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useParams } from "react-router-dom";
import {
    assignCycleToEstablishment,
    getCyclesByEstablishmentId,
    getCyclesWithoutAssigned,
    getEstablishmentById,
    unassignCycleFromEstablishment,
    updateEstablishment
} from "../../../../services/api/university";
import { AssignButton, SaveButton } from "../../../../components/Admin/ButtonIndicator";
import PageLoading from "../../../../components/Admin/PageLoading";
import { notifyError, notifySuccess } from "../../../../components/notify";

const EstablishmentDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [cycleLoading, setCycleLoading] = useState(true);
    const [establishmentCycleLoading, setEstablishmentCycleLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isAssign, setIsAssign] = useState(false);
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
    const [establishment, setEstablishment] = useState<any>({
        id: '',
        fid: '',
        name: '',
        description: '',
        phone: '',
        email: '',
        createdDate: ''
    });
    const [cycles, setCycles] = useState<any[]>([]);
    const [establishmentCycles, setEstablishmentCycles] = useState<any[]>([]);

    useEffect(() => {
        const fetchEstablishmentDetails = async () => {
            const establishmentData = await getEstablishmentById(id || '');
            setEstablishment(establishmentData);
            setLoading(false);
        };
        fetchEstablishmentDetails().then(r => r);
    }, [id]);

    const fetchCycles = async () => {
        const cyclesData = await getCyclesWithoutAssigned();
        setCycles(cyclesData);
        setCycleLoading(false);
    };
    useEffect(() => {
        fetchCycles().then(r => r);
    }, []);

    const fetchCyclesByEstablishment = async () => {
        const establishmentCyclesData = await getCyclesByEstablishmentId(id || '');
        setEstablishmentCycles(establishmentCyclesData);
        setEstablishmentCycleLoading(false);
    };
    useEffect(() => {
        fetchCyclesByEstablishment().then(r => r);
    }, [id]);

    useEffect(() => {
        if (!establishmentCycleLoading) {
            const table = $('#establishment-cycles-table').DataTable({
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Ajouter un cycle',
                        action: function (e: any, dt: any, node: any, config: any) {
                            $('<button type="button" style="display:none;" data-toggle="modal" data-target="#addCycleModal"></button>')
                                .appendTo('body')
                                .trigger('click')
                                .remove();
                        },
                    },
                ],
            });

            table.buttons().container().appendTo('#establishment-cycles-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }
    }, [establishmentCycleLoading, id, loading]);

    useEffect(() => {
        if (!cycleLoading) {
            const cycTable = $('#cycle-table').DataTable({
                lengthChange: false,
                autoWidth: false,
                ordering: false,
            });

            return () => {
                cycTable.destroy();
            }
        }
    }, [cycleLoading, id, loading]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEstablishment((prevEstablishment: any) => ({
            ...prevEstablishment,
            [name]: value
        }));
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsSaving(true);
        if (id) {
            await updateEstablishment(id, establishment);
        }
        setTimeout(() => {
            setIsSaving(false);
        }, 1000);
    };

    const handleCheckboxChange = (id: string) => {
        setCheckedItems(prevState => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };

    const getCheckedIds = () => {
        return Object.keys(checkedItems).filter(id => checkedItems[id]);
    };

    const handleUnassign = async (id: string) => {
        await unassignCycleFromEstablishment(id);
        await fetchCyclesByEstablishment();
        await fetchCycles();
    }

    const handleAssign = async () => {
        const checkedIds = getCheckedIds();
        if (checkedIds.length === 0) {
            return;
        }
        try {
            setIsAssign(true);
            await Promise.all(
                checkedIds.map(async (cycleId: any) => {
                    console.log(cycleId);
                    await assignCycleToEstablishment(id || '', cycleId);
                })
            );
            setTimeout(() => {
                setIsAssign(false);
            }, 1000);
            notifySuccess("Cycle assigné avec succès");
            await fetchCyclesByEstablishment();
            await fetchCycles();

        } catch (error: any) {
            notifyError(error.response.data);
            setIsAssign(false);
        }
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content">
            <BreadCrumb title={establishment.name ? establishment.name : 'Loading...'} page_name="Établissement" parent_name="Université" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card card-primary card-outline card-outline-tabs">
                            <div className="card-header p-0 border-bottom-0">
                                <ul className="nav nav-tabs" id="custom-tabs-four-tab" role="tablist">
                                    <li className="nav-item">
                                        <a className="nav-link active" id="custom-tabs-four-details-tab" data-toggle="pill" href={"#custom-tabs-four-details"} role="tab" aria-controls="custom-tabs-four-details" aria-selected="true">Détails</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" id="custom-tabs-four-cycles-tab" data-toggle="pill" href={"#custom-tabs-four-cycles"} role="tab" aria-controls="custom-tabs-four-cycles" aria-selected="false">Cycles</a>
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
                                                        <label htmlFor="fId" className="col-sm-2 col-form-label">ID Établissement <span className="text-danger">*</span></label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" id="fId" name="fId" value={establishment.fid} disabled />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="createdDate" className="col-sm-2 col-form-label">Créé le <span className="text-danger">*</span></label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" id="createdDate" name="createdDate" value={new Date(establishment.createdDate).toLocaleString()} disabled />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="name" className="col-sm-2 col-form-label">Nom de l'établissement</label>
                                                        <div className="col-sm-10">
                                                            <input type="text" className="form-control" id="name" name="name" value={establishment.name} onChange={handleChange} required />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="description" className="col-sm-2 col-form-label">Description</label>
                                                        <div className="col-sm-10">
                                                            <textarea className="form-control" id="description" name="description" value={establishment.description} onChange={handleChange}></textarea>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="phone" className="col-sm-2 col-form-label">Numéro de téléphone</label>
                                                        <div className="col-sm-10">
                                                            <input type="number" className="form-control" id="phone" name="phone" value={establishment.phone} onChange={handleChange} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label htmlFor="email" className="col-sm-2 col-form-label">Email</label>
                                                        <div className="col-sm-10">
                                                            <input type="email" className="form-control" id="email" name="email" value={establishment.email} onChange={handleChange} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group row mt-4">
                                                        <label className="col-sm-2 col-form-label"></label>
                                                        <div className="col-sm-10 d-flex">
                                                            <SaveButton isSaving={isSaving} onClick={handleUpdate} />
                                                            <button type="reset" className="btn btn-default float-right">Annuler</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <div className="tab-pane fade" id="custom-tabs-four-cycles" role="tabpanel" aria-labelledby="custom-tabs-four-cycles-tab">
                                            <div className="modal fade" id="addCycleModal">
                                                <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-lg">
                                                    <div className="modal-content">
                                                        <div className="modal-header">
                                                            <h4 className="modal-title">Ajouter un cycle à l'établissement</h4>
                                                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                                <span aria-hidden="true">&times;</span>
                                                            </button>
                                                        </div>
                                                        <div className="modal-body">
                                                            {cycleLoading ? (
                                                                <div>Loading...</div>
                                                            ) : (
                                                                <table id="cycle-table" className="table table-hover text-nowrap">
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="col-3">ID Cycle</th>
                                                                            <th className="col-3">Nom du cycle</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            Array.isArray(cycles) && cycles.length > 0 ? (
                                                                                cycles.map((d: any) => (
                                                                                    <tr key={d.id}>
                                                                                        <td>
                                                                                            <div className="custom-control custom-checkbox">
                                                                                                <input type="checkbox" name="terms" className="custom-control-input scope-checkbox" id={`checkbox-${d.id}`}
                                                                                                       checked={checkedItems[d.id]} onChange={() => handleCheckboxChange(d.id)} />
                                                                                                <label className="custom-control-label" htmlFor={`checkbox-${d.id}`}></label>

                                                                                                <Link to={``}>{d.cid}</Link>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td>{d.name}</td>
                                                                                    </tr>
                                                                                ))
                                                                            ) : (
                                                                                <></>
                                                                            )
                                                                        }


                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                        <div className="modal-footer d-flex justify-content-start">
                                                            <AssignButton onClick={() => handleAssign()} isSaving={isAssign} disabled={Object.keys(checkedItems).filter(id => checkedItems[id]).length === 0} />
                                                            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {establishmentCycleLoading ? (
                                                <div>Loading...</div>
                                            ) : (
                                                <table id="establishment-cycles-table" className="table table-hover text-nowrap">
                                                    <thead>
                                                        <tr>
                                                            <th className="col-2">ID Cycle</th>
                                                            <th className="col-3">Nom du cycle</th>
                                                            <th className="col-1"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>

                                                        {
                                                            Array.isArray(establishmentCycles) && establishmentCycles.length > 0 ? (
                                                                establishmentCycles.map((d: any) => (
                                                                    <tr key={d.id}>
                                                                        <td><a href="#">{d.cid}</a></td>
                                                                        <td>{d.name}</td>
                                                                        <td>
                                                                            <i className="fas fa-ellipsis-v button-cursor-pointer" typeof="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true"></i>
                                                                            <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                                                                <button className="dropdown-item text-danger" onClick={() => handleUnassign(d.id)}>Désassigner</button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <></>
                                                            )
                                                        }
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>

                                        <div className="tab-pane fade" id="custom-tabs-four-settings" role="tabpanel" aria-labelledby="custom-tabs-four-settings-tab">

                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default EstablishmentDetails;