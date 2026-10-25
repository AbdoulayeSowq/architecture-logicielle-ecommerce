import React, { useEffect, useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import { useParams } from "react-router-dom";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";
import { getCourseNameById } from "../../../services/api/course";

const StudentDetails = () => {
    const { id: username } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState<string>('N/A');
    const [student, setStudent] = useState<any>({
        username: '',
        firstName: '',
        lastName: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        guardianName: '',
        guardianRelationship: '',
        guardianPhone: '',
        courseId: '',
        intake: '',
        studentId: '',
        joiningDate: ''
    });

    useEffect(() => {
        const fetchStudentDetails = async () => {
            const data = await getStudentDetailsByUsername(username || '');
            if (data) {
                setStudent(data);
                if (data.courseId) {
                    const cName = await getCourseNameById(data.courseId);
                    setCourseName(cName || 'N/A');
                }
            }
            setLoading(false);
        };
        fetchStudentDetails().then(r => r);
    }, [username]);

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content">
            <BreadCrumb page_name="Détails de l'étudiant" parent_name="Étudiants" />
            <div className="container-fluid">
                <div className="card card-primary card-outline">
                    <div className="card-body box-profile">
                        <div className="text-center mb-3">
                            <div className="avatar avatar--lg mx-auto mb-3" style={{ width: 100, height: 100, fontSize: '2.5rem', borderRadius: '50%', border: '3px solid var(--accent)' }}>
                                <i className="fas fa-user" />
                            </div>
                        </div>

                        <h3 className="profile-username text-center">{student.fullName}</h3>
                        <p className="text-muted text-center">{student.username}</p>

                        <ul className="list-group list-group-unbordered mb-3">
                            <li className="list-group-item">
                                <b>Matricule</b> <a className="float-right text-primary-custom font-weight-bold">{student.studentId}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Génie</b> <span className="float-right badge badge-info px-2 py-1">{student.department || 'Génie Informatique'}</span>
                            </li>
                            <li className="list-group-item">
                                <b>Niveau / Classe</b> <span className="float-right badge badge-success px-2 py-1">{student.intake || 'DIC1'}</span>
                            </li>
                            <li className="list-group-item">
                                <b>Promotion</b> <a className="float-right text-muted">{student.promotion || '2023-2024'}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Email</b> <a className="float-right">{student.email}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Téléphone</b> <a className="float-right">{student.phone}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Date d'inscription</b> <a className="float-right">{student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : 'N/A'}</a>
                            </li>
                        </ul>

                        <h5 className="mt-4">Informations du tuteur</h5>
                        <ul className="list-group list-group-unbordered mb-3">
                            <li className="list-group-item">
                                <b>Nom du tuteur</b> <a className="float-right">{student.guardianName}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Lien de parenté</b> <a className="float-right">{student.guardianRelationship}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Téléphone</b> <a className="float-right">{student.guardianPhone}</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default StudentDetails;