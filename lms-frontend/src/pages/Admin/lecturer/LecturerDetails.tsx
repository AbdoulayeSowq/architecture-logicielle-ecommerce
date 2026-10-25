import React, { useEffect, useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import { useParams } from "react-router-dom";
import { getLecturerDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";
import { getDepartmentById } from "../../../services/api/university";

const LecturerDetails = () => {
    const { id: username } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [departmentName, setDepartmentName] = useState<string>('N/A');
    const [lecturer, setLecturer] = useState<any>({
        username: '',
        firstName: '',
        lastName: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        designation: '',
        departmentId: '',
        lecturerId: '',
        joiningDate: ''
    });

    useEffect(() => {
        const fetchLecturerDetails = async () => {
            const data = await getLecturerDetailsByUsername(username || '');
            if (data) {
                setLecturer(data);
                if (data.departmentId) {
                    try {
                        const deptData = await getDepartmentById(data.departmentId);
                        setDepartmentName(deptData?.name || 'N/A');
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
            setLoading(false);
        };
        fetchLecturerDetails().then(r => r);
    }, [username]);

    if (loading) {
        return <PageLoading />
    }

    return (
        <section className="content">
            <BreadCrumb page_name="Détails du professeur" parent_name="Professeurs" />
            <div className="container-fluid">
                <div className="card card-primary card-outline">
                    <div className="card-body box-profile">
                        <div className="text-center mb-3">
                            <div className="avatar avatar--lg mx-auto mb-3" style={{ width: 100, height: 100, fontSize: '2.5rem', borderRadius: '50%', border: '3px solid var(--accent)' }}>
                                <i className="fas fa-user" />
                            </div>
                        </div>

                        <h3 className="profile-username text-center">{lecturer.fullName}</h3>
                        <p className="text-muted text-center">{lecturer.designation}</p>

                        <ul className="list-group list-group-unbordered mb-3">
                            <li className="list-group-item">
                                <b>Identifiant (ID)</b> <a className="float-right">{lecturer.lecturerId}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Nom d'utilisateur</b> <a className="float-right">{lecturer.username}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Email</b> <a className="float-right">{lecturer.email}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Téléphone</b> <a className="float-right">{lecturer.phone}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Sexe</b> <a className="float-right">{lecturer.gender}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Département</b> <a className="float-right">{departmentName}</a>
                            </li>
                            <li className="list-group-item">
                                <b>Date d'embauche</b> <a className="float-right">{lecturer.joiningDate ? new Date(lecturer.joiningDate).toLocaleDateString() : 'N/A'}</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LecturerDetails;
