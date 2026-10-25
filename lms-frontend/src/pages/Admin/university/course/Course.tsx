import { useEffect, useState } from "react";
import BreadCrumb from "../../../../components/Admin/Breadcrumb";
import 'datatables.net-buttons-bs5';
import { Link, useNavigate } from "react-router-dom";
import { deleteCourse, getCourses } from "../../../../services/api/course";
import PageLoading from "../../../../components/Admin/PageLoading";

const Course = () => {
    const [course, setCourse] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const listCourses = async () => {
        const data = await getCourses();
        setCourse(data);
        setLoading(false);
    }

    useEffect(() => {
        listCourses().then(r => r);
    }, []);

    useEffect(() => {
        if (!loading) {
            const table = $('#course-table').DataTable({
                paging: (course?.length || 0) > 15,
                pageLength: 15,
                lengthChange: false,
                autoWidth: false,
                ordering: false,
                buttons: [
                    {
                        text: 'Ajouter Nouveau',
                        className: 'btn btn-primary',
                        action: function (e: any, dt: any, node: any, config: any) {
                            navigate("/admin/university/course/new");
                        },
                    },
                ],
            });
            table.buttons().container().appendTo('#course-table_wrapper .col-md-6:eq(0)');

            return () => {
                table.destroy();
            }
        }

    }, [loading, navigate]);

    const handleDelete = async (id: string) => {
        await deleteCourse(id);
        await listCourses();
    }

    if (loading) {
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
                                <table id="course-table" className="table table-hover text-nowrap">
                                    <thead>
                                    <tr>
                                        <th className="col-2">ID Filière</th>
                                        <th className="col-4">Nom de la Filière</th>
                                        <th className="col-3">Modules</th>
                                        <th className="col-1"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            Array.isArray(course) && course.length > 0 ? (
                                                course.map((f: any) => (
                                                    <tr key={f.id}>
                                                        <td className="font-weight-bold" style={{ color: 'var(--accent)' }}>{f.cid}</td>
                                                        <td><Link
                                                            to={`/admin/university/course/${f.id}/details`}>{f.title}</Link>
                                                        </td>
                                                        <td>{f.cmodules?.length || 0}</td>
                                                        <td>
                                                            <i className="fas fa-ellipsis-v button-cursor-pointer"
                                                               id="dropdownMenuButton1" data-toggle="dropdown"
                                                               aria-haspopup="true"></i>
                                                            <div className="dropdown-menu"
                                                                 aria-labelledby="dropdownMenuButton1">
                                                                <a className="dropdown-item"
                                                                   href={`/admin/university/course/${f.id}/details`}>Modifier</a>
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

export default Course;