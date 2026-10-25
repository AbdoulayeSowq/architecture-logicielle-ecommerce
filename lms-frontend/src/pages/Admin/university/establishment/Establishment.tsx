import { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useNavigate } from "react-router-dom";
import { deleteEstablishment, getEstablishments } from "../../../../services/api/university";
import PageLoading from "../../../../components/Admin/PageLoading";

const Establishment = () => {
    const [establishment, setEstablishment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listEstablishments = async () => {
        const data = await getEstablishments();
        setEstablishment(data);
        setLoading(false);
    }

    useEffect(() => {
        listEstablishments().then(r => r);
    }, []);

    useEffect(() => {
        if (!loading) {
            const table = $('#establishment-table').DataTable({
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Ajouter Nouveau',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/university/establishment/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#establishment-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }

    }, [loading, navigate]);

    const handleDelete = async (id: string) => {
        await deleteEstablishment(id);
        await listEstablishments();
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content">
            <BreadCrumb page_name="Établissements" parent_name="Université" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <table id="establishment-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-3">ID Établissement</th>
                                        <th className="col-3">Nom de l'établissement</th>
                                        <th className="col-3">Cycles</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            Array.isArray(establishment) && establishment.length > 0 ? (
                                                establishment.map((f: any) => (
                                                    <tr key={f.id}>
                                                        <td>{f.fid}</td>
                                                        <td><Link
                                                            to={`/admin/university/establishment/${f.id}/details`}>{f.name}</Link>
                                                        </td>
                                                        <td>{f.cycles?.length || 0}</td>
                                                        <td>
                                                            <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                               id="dropdownMenuButton1" data-toggle="dropdown"
                                                               aria-haspopup="true"></i>
                                                            <div className="dropdown-menu"
                                                                 aria-labelledby="dropdownMenuButton1">
                                                                <a className="dropdown-item"
                                                                   href={`/admin/university/establishment/${f.id}/details`}>Modifier</a>
                                                                <a className="dropdown-item text-danger" type="button"
                                                                   onClick={() => handleDelete(f.id)}>Supprimer</a>
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

export default Establishment;