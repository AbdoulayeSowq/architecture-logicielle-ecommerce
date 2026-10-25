import { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useNavigate } from "react-router-dom";
import { deleteModule, getModules } from "../../../../services/api/course";
import PageLoading from "../../../../components/Admin/PageLoading";

const Module = () => {
    const [module, setModule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listModules = async () => {
        try {
            const data = await getModules();
            setModule(data || []);
        } catch (error) {
            console.error("Error listing modules:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        listModules().then(r => r);
    }, []);

    useEffect(() => {
        if (!loading) {
            const table = $('#module-table').DataTable({
                paging: (module?.length || 0) > 15,
                pageLength: 15,
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Create New',
                        className: 'btn btn-primary',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/university/module/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#module-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }

    }, [loading]);

    const handleDelete = async (id: string) => {
        await deleteModule(id);
        await listModules();
    }

    if (loading && module.length === 0) {
        return <PageLoading />
    }

    return (
        <section className="content p-0">
            <style>{`
                .btn-primary, .btn-info, .dt-button, .dt-buttons .btn {
                    background-color: var(--accent) !important;
                    border-color: var(--accent) !important;
                    color: #fff !important;
                    border-radius: 8px !important;
                    padding: 6px 16px !important;
                    font-weight: 600 !important;
                    border: none !important;
                }
            `}</style>
            {/* Header removed per user request */}
            <div className="container-fluid mt-3">
                <div className="row">
                    <div className="col-12">
                        <div className="card shadow-sm border-0" style={{ borderRadius: 15 }}>
                            <div className="card-body">
                                <table id="module-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">ID Module</th>
                                        <th className="col-3">Nom du Module</th>
                                        <th className="col-2">Département</th>
                                        <th className="col-2">Classe</th>
                                        <th className="col-1">Crédits</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        Array.isArray(module) && module.length > 0 ? (
                                            module.map((f: any) => (
                                                <tr key={f.id}>
                                                    <td className="font-weight-bold" style={{ color: 'var(--accent)' }}><code>{f.codeEC}</code></td>
                                                    <td>
                                                        <Link to={`/admin/university/module/${f.id}/details`} className="font-weight-bold">
                                                            {f.name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-light" style={{ border: '1px solid #ddd' }}>
                                                            {f.departmentCode || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-light" style={{ border: '1px solid #ddd' }}>
                                                            {f.classCode || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-info">{f.creditsEC || 0} crédits</span>
                                                    </td>
                                                    <td className="text-right">
                                                        <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                           id={`dropdown-${f.id}`} data-toggle="dropdown"
                                                           aria-haspopup="true"></i>
                                                        <div className="dropdown-menu dropdown-menu-right"
                                                              aria-labelledby={`dropdown-${f.id}`}>
                                                            <Link className="dropdown-item"
                                                                to={`/admin/university/module/${f.id}/details`}>
                                                                <i className="fas fa-edit mr-2"></i> Modifier
                                                            </Link>
                                                            <div className="dropdown-divider"></div>
                                                            <button className="dropdown-item text-danger" type="button"
                                                                onClick={() => handleDelete(f.id)}>
                                                                <i className="fas fa-trash-alt mr-2"></i> Supprimer
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center text-muted py-4">
                                                    Aucun module trouvé
                                                </td>
                                            </tr>
                                        )
                                    }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Module;