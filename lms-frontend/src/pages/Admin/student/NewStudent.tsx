import React, {useEffect, useRef, useState} from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import Inputmask from "inputmask";
import {useParams} from "react-router-dom";
import PageLoading from "../../../components/Admin/PageLoading";
import {getCourseNameById} from "../../../services/api/course";
import {CreateButton} from "../../../components/Admin/ButtonIndicator";
import {createStudent} from "../../../services/api/user";

const NewStudent = () => {
    const { id } = useParams<{ id: string }>();
    const autogeneratenumber = Math.floor(Math.random() * 1000000);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const [isApprove, setIsApprove] = useState(false);
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState<string>('');
    const [applicant, setApplicant] = useState({
        username: '',
        firstName: '',
        lastName: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        address: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            country: '',
        },
        phone: '',
        email: '',
        guardianName: '',
        guardianRelationship: '',
        guardianPhone: '',
        guardianEmail: '',
        course: '',
        intake: '',
        department: '',
        promotion: '',
        studentId: '',
        profileImage: '',
        nicImage: '',
        birthCertificate: ''
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setApplicant(prev => ({
                    ...prev,
                    [fieldName]: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };


    const genUsername = (name: string, id: number) => {
        return `${name.toLowerCase()}${id}`;
    };

    const fetchCourseName = async (id: string) => {
        const name = await getCourseNameById(id);
        setCourseName(name);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        setIsApprove(true);
        await createStudent(applicant);
        setTimeout(() => {
            setIsApprove(false);
        }, 1000);
        console.log(applicant);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        if (id in applicant.address) {
            // Update address nested object
            setApplicant({
                ...applicant,
                address: {
                    ...applicant.address,
                    [id]: value,
                },
            });
        } else {
            // Update top-level fields
            setApplicant({
                ...applicant,
                [id]: value,
            });
        }
    };

    useEffect(() => {
        if (phoneInputRef.current) {
            Inputmask({ mask: '99 999 99 99' }).mask(phoneInputRef.current);
        }
        if (emailInputRef.current) {
            Inputmask({ alias: 'email' }).mask(emailInputRef.current);
        }
        if (usernameInputRef.current) {
            Inputmask({ regex: "^[a-z._]*[0-9]{0,3}[a-z._]*$" }).mask(usernameInputRef.current);
        }
    }, []);

    // useEffect(() => {
    //     if (applicant.course) {
    //         fetchCourseName(applicant.course).then(r => r);
    //     }
    // }, [applicant.course]);


    // if (loading) {
    //     return <PageLoading />
    // }


    return (
        <section className="content">
            < BreadCrumb page_name="Intégration Étudiant" parent_name="Étudiant" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-7">
                        {/* Default box */}
                        <div className="card">
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <h5 className="pb-4"><strong>Informations de Base</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Prénom<span className="text-danger">*</span></label>
                                                <input className="form-control" id="firstName" value={applicant.firstName} onChange={handleChange} type="text"
                                                       />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Nom</label>
                                                <input className="form-control" value={applicant.lastName} id="lastName"  onChange={handleChange} type="text"
                                                       />
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-group">
                                                <label>Nom Complet (Initiales)<span
                                                    className="text-danger">*</span></label>
                                                <input className="form-control" type="text" value={applicant.fullName} id="fullName" onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Date de Naissance<span className="text-danger">*</span></label>
                                                <div className="input-group date" id="datetimepicker4"
                                                     data-target-input="nearest">
                                                    <input type="date" className="form-control"
                                                           value={applicant.dateOfBirth} id="dateOfBirth"  onChange={handleChange}/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Genre<span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" value={applicant.gender}
                                                       id="gender" onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <label className="col-12">Adresse<span className="text-danger">*</span></label>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <input className="form-control" type="text"
                                                       value={applicant.address.addressLine1} id="addressLine1"  onChange={handleChange}/>
                                                <p><small>Adresse Ligne 1</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <input className="form-control" type="text"
                                                       value={applicant.address.addressLine2} id="addressLine2"  onChange={handleChange}/>
                                                <p><small>Adresse Ligne 2</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text"
                                                       value={applicant.address.city} id="city"  onChange={handleChange}/>
                                                <p><small>Ville</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text"
                                                       value={applicant.address.state} id="state"  onChange={handleChange}/>
                                                <p><small>État / Province</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text"
                                                       value={applicant.address.country} id="country"  onChange={handleChange}/>
                                                <p><small>Pays</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Numéro de téléphone</label>
                                                <input className="form-control" type="text" value={applicant.phone} id="phone"  onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Adresse Email<span className="text-danger">*</span></label>
                                                <input className="form-control" type="email" value={applicant.email} id="email"  onChange={handleChange}/>
                                            </div>
                                        </div>
                                    </div>
                                    <h5 className="pb-4 pt-4"><strong>Informations du Tuteur</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Nom du Tuteur<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" placeholder=""
                                                       value={applicant.guardianName} id="guardianName"  onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Lien de parenté<span
                                                    className="text-danger">*</span></label>
                                                <input className="form-control" type="text" placeholder=""
                                                       value={applicant.guardianRelationship} id="guardianRelationship"  onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Numéro de téléphone<span className="text-danger">*</span></label>
                                                <div className="input-group">
                                                    <div className="input-group-prepend">
                                                        <span className="input-group-text"><strong>+221</strong></span>
                                                    </div>
                                                    <input className="form-control" type="text" placeholder="77 123 45 67"
                                                           value={applicant.guardianPhone} id="guardianPhone"  onChange={handleChange} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Adresse Email</label>
                                                <input className="form-control" type="text"
                                                       placeholder="example@domain.com" value={applicant.guardianEmail} id="guardianEmail"  onChange={handleChange}/>
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="pb-4 pt-4"><strong>Informations Académiques (EPT)</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Matricule <em>(Auto Generated)</em></label>
                                                <input className="form-control" type="text" value={applicant.studentId}
                                                       id="studentId"  onChange={handleChange}  />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Département<span className="text-danger">*</span></label>
                                                <select className="form-control" id="department" onChange={handleChange} required>
                                                    <option value="">Sélectionner le département</option>
                                                    <option value="GIT">Génie Informatique et Télécoms</option>
                                                    <option value="GC">Génie Civil</option>
                                                    <option value="GEM">Génie Électromécanique</option>
                                                    <option value="GA">Génie Aéronautique</option>
                                                    <option value="GI">Génie Industriel</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Niveau / Classe<span className="text-danger">*</span></label>
                                                <select className="form-control" id="intake" onChange={handleChange} required>
                                                    <option value="">Sélectionner le niveau</option>
                                                    <option value="TC1">TC1</option>
                                                    <option value="TC2">TC2</option>
                                                    <option value="DIC1">DIC1</option>
                                                    <option value="DIC2">DIC2</option>
                                                    <option value="DIC3">DIC3</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Promotion<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" placeholder="ex: 2023-2024" id="promotion" onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="pb-4 pt-4"><strong>Identifiants de Connexion</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Nom d'utilisateur<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text"
                                                       id="username"
                                                       onChange={handleChange}
                                                       value={applicant.username}
                                                       required/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Mot de passe</label>
                                                <input className="form-control" type="text"
                                                       value="Generates In Creation" />
                                            </div>
                                        </div>
                                        <div className="col-12 mt-5"></div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <button type="button" className="btn btn-block btn-default btn-lg">Save
                                                    As Draft
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <CreateButton isSaving={isApprove} customClass={"btn-block btn-lg"} />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        {/* /.card */}
                    </div>
                    <div className="col-5">
                        {/* Default box */}
                        <div className="card">
                            <div className="card-body col">
                                <div className="mt-3">
                                    <label>Image de Profil</label>
                                    <div className="list-group list-group-numbered">
                                        <div className="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                            <div className="ms-2 me-auto">
                                                <img src={applicant.profileImage || "/dist/img/avatar.png"} style={{width: "45px", height: "45px", objectFit: "cover"}} className="img-thumbnail" alt="..."></img>
                                            </div>
                                            <div className="row">
                                                <input 
                                                    type="file" 
                                                    id="profileImageUpload" 
                                                    style={{ display: 'none' }} 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'profileImage')}
                                                />
                                                <button type="button"
                                                        className="btn btn-default ml-2 btn-sm btn-custom-view"
                                                        onClick={() => document.getElementById('profileImageUpload')?.click()}
                                                >Téléverser</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label>Carte d'Identité Nationale</label>
                                    <div className="list-group list-group-numbered">
                                        <div className="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                            <div className="ms-2 me-auto">
                                                <i className="far fa-file-pdf fa-lg mr-2 text-danger"></i>
                                                {applicant.nicImage ? 'NIC Document Selected' : 'No document selected'}
                                            </div>
                                            <div className="row">
                                                <input 
                                                    type="file" 
                                                    id="nicImageUpload" 
                                                    style={{ display: 'none' }} 
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => handleFileUpload(e, 'nicImage')}
                                                />
                                                <button type="button"
                                                        className="btn btn-default ml-2 btn-sm btn-custom-view"
                                                        onClick={() => document.getElementById('nicImageUpload')?.click()}
                                                >Téléverser</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label>Extrait de Naissance</label>
                                    <div className="list-group list-group-numbered">
                                        <div className="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                            <div className="ms-2 me-auto">
                                                <i className="far fa-file-pdf fa-lg mr-2 text-danger"></i>
                                                {applicant.birthCertificate ? 'Birth Certificate Selected' : 'No document selected'}
                                            </div>
                                            <div className="row">
                                                <input 
                                                    type="file" 
                                                    id="birthCertificateUpload" 
                                                    style={{ display: 'none' }} 
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => handleFileUpload(e, 'birthCertificate')}
                                                />
                                                <button type="button"
                                                        className="btn btn-default ml-2 btn-sm btn-custom-view"
                                                        onClick={() => document.getElementById('birthCertificateUpload')?.click()}
                                                >Téléverser</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* /.card */}
                    </div>
                </div>
            </div>
        </section>
    );
}
export default NewStudent;