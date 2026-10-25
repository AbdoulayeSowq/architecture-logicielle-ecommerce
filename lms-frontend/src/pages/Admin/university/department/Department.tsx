import { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import { deleteDepartment, getDepartments } from "../../../../services/api/university";
import { getLecturerDetailsByUsername } from "../../../../services/api/user";
import { Link, useNavigate } from "react-router-dom";
import PageLoading from "../../../../components/Admin/PageLoading";


const Department = () => {

    const [department, setDepartment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string>('');
    const navigate = useNavigate();

    const matchesDepartment = (deptItem: any, code: string): boolean => {
        if (!code) return false;
        const target = code.trim().toLowerCase();
        // Exact match on did, abbreviation, or name
        const candidates = [deptItem?.did, deptItem?.abbreviation, deptItem?.name]
            .filter(Boolean).map((s: string) => String(s).toLowerCase());
        return candidates.some(c => c === target);
    };

    const listDepartments = async () => {
        try {
            const role = localStorage.getItem('role') || '';
            const data = await getDepartments();
            let list = Array.isArray(data) ? data : [];

            if (role === 'CHEF_DEPT' || role === 'RESP_PEDAGO') {
                const stored = localStorage.getItem('user');
                const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';
                const me = await getLecturerDetailsByUsername(uname).catch(() => null);

                if (role === 'CHEF_DEPT') {
                    if (me?.supervisedDepartmentCode) {
                        list = list.filter((d: any) => matchesDepartment(d, me.supervisedDepartmentCode));
                        // Redirect directly to department details if only one department
                        if (list.length === 1) {
                            navigate(`/admin/university/department/${list[0].id}/details`, { replace: true });
                            return;
                        }
                    } else {
                        // Pas de département assigné → liste vide (jamais la vue globale)
                        list = [];
                    }
                } else if (role === 'RESP_PEDAGO') {
                    // Toujours filtrer, même si supervisedClassName est null/vide
                    if (me?.supervisedClassName) {
                        const suffixes = me.supervisedClassName.split(',')
                            .map((c: string) => c.trim().toLowerCase())
                            .map((c: string) => {
                                if (c.includes('-')) return c.substring(c.lastIndexOf('-') + 1).trim();
                                if (c.includes(' ')) return c.substring(c.lastIndexOf(' ') + 1).trim();
                                return c;
                            })
                            .filter(Boolean);
                        list = list.filter((d: any) => suffixes.some((s: string) => matchesDepartment(d, s)));
                    } else {
                        // Pas de classe assignée ou erreur → liste vide (jamais la vue globale)
                        list = [];
                    }
                }
            }
            setDepartment(list);
        } catch (error) {
            console.error("Error listing departments:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setRole(localStorage.getItem('role') || '');
        listDepartments();
    }, []);

    useEffect(() => {
        if (!loading) {
            const role = localStorage.getItem('role');
            const buttons = role === 'CHEF_DEPT' || role === 'RESP_PEDAGO' ? [] : [
                {
                    text: 'Create New',
                    className: 'btn btn-primary',
                    action: function (e: any, dt: any, node: any, config: any) {
                        navigate("/admin/university/department/new");
                    },
                },
            ];
            const table = $('#department-table').DataTable({
                paging: (department?.length || 0) > 15,
                pageLength: 15,
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons,
            });
            if (buttons.length > 0) {
                table.buttons().container().appendTo('#department-table_wrapper .col-md-6:eq(0)');
            }

            return () => {
                table.destroy();
            }
        }

    }, [loading]);

    const handleDelete = async (id: string) => {
        await deleteDepartment(id);
        listDepartments();
    }

    if (loading && (!Array.isArray(department) || department.length === 0)) {
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
                                <table id="department-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">ID Département</th>
                                        <th className="col-4">Nom du Département</th>
                                        <th className="col-3">Filières</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            Array.isArray(department) && department.length > 0 ? (
                                                department.map((f: any) => (
                                                    <tr key={f.id}>
                                                        <td className="font-weight-bold" style={{ color: 'var(--accent)' }}>{f.did}</td>
                                                        <td><Link
                                                            to={`/admin/university/department/${f.id}/details`}>{f.name}</Link>
                                                        </td>
                                                        <td>{f.courses?.length || 0}</td>
                                                        <td>
                                                            {role !== 'CHEF_DEPT' && role !== 'RESP_PEDAGO' && (
                                                                <>
                                                                    <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                                       id="dropdownMenuButton1" data-toggle="dropdown"
                                                                       aria-haspopup="true"></i>
                                                                    <div className="dropdown-menu"
                                                                         aria-labelledby="dropdownMenuButton1">
                                                                        <a className="dropdown-item"
                                                                           href={`/admin/university/department/${f.id}/details`}>Modifier</a>
                                                                        <a className="dropdown-item text-danger" type="button"
                                                                           onClick={() => handleDelete(f.id)}>Supprimer</a>
                                                                    </div>
                                                                </>
                                                            )}
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
                </div>
            </div>
        </section>
    );
}

export default Department;