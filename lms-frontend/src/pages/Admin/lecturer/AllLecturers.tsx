import { useEffect, useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useNavigate } from "react-router-dom";
import { deleteLecturer, getLecturers } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

const AllLecturers = () => {
    const [lecturer, setLecturer] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listLecturers = async () => {
        const data = await getLecturers();
        setLecturer(data || []);
        setLoading(false);
    }

    useEffect(() => {
        listLecturers();
    }, []);

    useEffect(() => {
        if (!loading && lecturer) {
            const table = $('#lecturer-table').DataTable({
                paging: (lecturer?.length || 0) > 15,
                pageLength: 15,
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Create New',
                        className: 'btn btn-primary',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/lecturer/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#lecturer-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }
    }, [loading, lecturer, navigate]);

    const handleDelete = async (id: string) => {
        await deleteLecturer(id);
        await listLecturers();
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content p-0">
            <style>{`
                .dataTables_wrapper .dataTables_paginate .paginate_button.current, 
                .dataTables_wrapper .dataTables_paginate .paginate_button.current:hover {
                    background: var(--accent) !important;
                    border-color: var(--accent) !important;
                    color: #fff !important;
                    border-radius: 50px;
                    padding: 5px 15px;
                }
                .btn-primary, .btn-info, .dt-button, .dt-buttons .btn {
                    background-color: var(--accent) !important;
                    border-color: var(--accent) !important;
                    color: #fff !important;
                    border-radius: 8px !important;
                    padding: 6px 16px !important;
                    font-weight: 600 !important;
                    border: none !important;
                }
                .dt-button:hover, .btn-primary:hover {
                    background-color: var(--accent-hover) !important;
                    opacity: 0.9;
                }
            `}</style>
            {/* Header removed per user request */}
            <div className="container-fluid mt-3">
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
                            <div className="card-body">
                                <table id="lecturer-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">ID Professeur</th>
                                        <th className="col-3">Nom complet</th>
                                        <th className="col-2">Département</th>
                                        <th className="col-3">Désignation</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        Array.isArray(lecturer) && lecturer.length > 0 ? (
                                            lecturer.map((s: any) => (
                                                <tr key={s.id}>
                                                    <td className="font-weight-bold" style={{ color: 'var(--accent)' }}>{s.lecturerId}</td>
                                                    <td>
                                                        <Link to={`/admin/lecturer/${s.username}/details`} className="font-weight-bold" style={{ color: 'var(--text-primary)' }}>
                                                            {s.fullName}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-info">{s.department || 'GIT'}</span>
                                                    </td>
                                                    <td>{s.designation || 'Ingénieur de Conception'}</td>
                                                    <td>
                                                        <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                           id={`dropdownMenu-${s.id}`} data-toggle="dropdown"
                                                           aria-haspopup="true"></i>
                                                        <div className="dropdown-menu"
                                                              aria-labelledby={`dropdownMenu-${s.id}`}>
                                                            <a className="dropdown-item"
                                                               href={`/admin/lecturer/${s.username}/details`}>
                                                                <i className="fas fa-eye mr-2"></i> Voir Détails
                                                            </a>
                                                            <a className="dropdown-item text-danger" type="button"
                                                               onClick={() => handleDelete(s.username)}>
                                                                <i className="fas fa-trash mr-2"></i> Supprimer
                                                            </a>
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

export default AllLecturers;