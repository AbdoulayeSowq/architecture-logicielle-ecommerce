import React, { useEffect, useRef, useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import {CreateButton} from "../../../components/Admin/ButtonIndicator";
import {createLecturer} from "../../../services/api/user";


const LecturerOnboarding = () => {
    const autogenerateNumber = Math.floor(Math.random() * 1000000);
    const [isSave, setIsSave] = useState(false);
    const [lecturer, setLecturer] = useState({
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
        lecturerId: '',
        designation: '',
        workType: '',
        officeLocation: '',
        highestDegree: '',
        major: '',
        linkedin: '',
        emergencyPhone: '',
        institution: '',
        researchInterest: '',
        profileImage: '',
        nicImage: '',
        cv: ''
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLecturer(prev => ({
                    ...prev,
                    [fieldName]: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        if (id in lecturer.address) {
            // Update address nested object
            setLecturer({
                ...lecturer,
                address: {
                    ...lecturer.address,
                    [id]: value,
                },
            });
        } else {
            // Update top-level fields
            setLecturer({
                ...lecturer,
                [id]: value,
            });
        }
    };

    useEffect(() => {
        const generatedUsername = genUsername(lecturer.firstName, autogenerateNumber);
        setLecturer({
            ...lecturer,
            username: generatedUsername,
            lecturerId: autogenerateNumber.toString(),
        });
    }, [lecturer.firstName]);

    const genUsername = (name: string, id: number) => {
        return `${name.toLowerCase()}${id}`;
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsSave(true);
        await createLecturer(lecturer);
        setTimeout(() => {
            setIsSave(false);
        }, 1000)
        console.log(lecturer);
    }

    return (

        <section className="content">
            < BreadCrumb page_name="Intégration Conférencier" parent_name="Conférencier" />
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
                                                <input className="form-control" type="text" id="firstName" name="firstName" value={lecturer.firstName} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Nom</label>
                                                <input className="form-control" type="text" id="lastName" name="lastName" value={lecturer.lastName} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-group">
                                                <label>Nom Complet (Initiales)<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" id="fullName" name="fullName" value={lecturer.fullName} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Date de Naissance<span className="text-danger">*</span></label>
                                                <div className="input-group date" id="datetimepicker4"
                                                     data-target-input="nearest">
                                                    <input type="date" className="form-control"
                                                           value={lecturer.dateOfBirth} id="dateOfBirth" name="dateOfBirth" onChange={handleChange} required/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Genre<span className="text-danger">*</span></label>
                                                <select className="form-control" id="gender" name="gender" value={lecturer.gender} onChange={handleChange} required>
                                                    <option value="">Sélectionner le Genre</option>
                                                    <option value="Male">Homme</option>
                                                    <option value="Female">Femme</option>
                                                </select>
                                            </div>
                                        </div>
                                        <label className="col-12">Adresse<span className="text-danger">*</span></label>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="addressLine1" name="addressLine1" value={lecturer.address.addressLine1} onChange={handleChange} required/>
                                                <p><small>Adresse Ligne 1</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="addressLine2" name="addressLine2" value={lecturer.address.addressLine2} onChange={handleChange} />
                                                <p><small>Adresse Ligne 2</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="city" name="city" value={lecturer.address.city} onChange={handleChange}/>
                                                <p><small>Ville</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="state" name="state" value={lecturer.address.state} onChange={handleChange}/>
                                                <p><small>État / Province</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="country" name="country" value={lecturer.address.country} onChange={handleChange}/>
                                                <p><small>Pays</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Numéro de téléphone</label>
                                                <input className="form-control" type="text" id="phone" name="phone" value={lecturer.phone} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Adresse Email<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" id="email" name="email" value={lecturer.email} onChange={handleChange}/>
                                            </div>
                                        </div>
                                    </div>
                                    <h5 className="pb-4 pt-4"><strong>Informations Professionnelles</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>ID Conférencier<em>(Auto Generated)</em></label>
                                                <input className="form-control" type="text" value={lecturer.lecturerId} id="lecturerId" name="lecturerId" onChange={handleChange} disabled />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Titre / Fonction</label>
                                                <input className="form-control" type="text" placeholder="e.g., Professor, Assistant Professor, Lecturer" id="designation" name="designation" value={lecturer.designation} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Emplacement du bureau<span className="text-danger">*</span></label>
                                                <select className="form-control" id="officeLocation" name="officeLocation" value={lecturer.officeLocation} onChange={handleChange}>
                                                    <option value="">Sélectionner l'emplacement</option>
                                                    <option value="Colombo 7">Colombo 7</option>
                                                    <option value="homagama">Homagama</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Type d'emploi<span className="text-danger">*</span></label>
                                                <select className="form-control" id="workType" name="workType" value={lecturer.workType} onChange={handleChange}>
                                                    <option value="Full Time">Temps plein</option>
                                                    <option value="Part Time">Temps partiel</option>
                                                    <option value="Visiting Course">Intervenant externe</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="pb-4 pt-4"><strong>Parcours Académique</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Diplôme le plus élevé obtenu<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" id="highestDegree" name="highestDegree" value={lecturer.highestDegree} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Spécialisation / Majeure</label>
                                                <input className="form-control" type="text" id="major" name="major" value={lecturer.major} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Université d'obtention</label>
                                                <input className="form-control" type="text" id="institution" name="institution" value={lecturer.institution} onChange={handleChange}/>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Domaines de recherche</label>
                                                <input className="form-control" type="text" id="researchInterest" name="researchInterest" value={lecturer.researchInterest} onChange={handleChange}/>
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="pb-4 pt-4"><strong>Identifiants de Connexion</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Nom d'utilisateur<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" id="username" name="username" value={lecturer.username} onChange={handleChange} required />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Role</label>
                                                <input className="form-control" type="text" value="Lecturer" id="name" name="name" onChange={handleChange} disabled />
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="pb-4 pt-4"><strong>Autres Informations</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>LinkedIn</label>
                                                <input className="form-control" type="text" placeholder="" id="linkedin" name="linkedin" value={lecturer.linkedin} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Contact d'urgence<span className="text-danger">*</span></label>
                                                <div className="input-group">
                                                    <div className="input-group-prepend">
                                                        <span className="input-group-text"><strong>+221</strong></span>
                                                    </div>
                                                    <input className="form-control" type="text" id="emergencyPhone" name="emergencyPhone" value={lecturer.emergencyPhone} onChange={handleChange} placeholder="77 123 45 67" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 mt-5"></div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <button type="button" className="btn btn-block btn-default btn-lg">Annuler</button>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <CreateButton isSaving={isSave} customClass={"btn-block btn-lg"}/>
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
                                    <div className="custom-file mb-3">
                                        <input type="file" className="custom-file-input" id="profileImage" accept="image/*" onChange={(e) => handleFileUpload(e, 'profileImage')} />
                                        <label className="custom-file-label" htmlFor="profileImage">Choisir un fichier</label>
                                    </div>
                                    {lecturer.profileImage && (
                                        <div className="mt-2 text-center">
                                            <img src={lecturer.profileImage} className="img-thumbnail" alt="Profile Preview" style={{maxHeight: '150px'}} />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    <label>National Identity Card (Image)</label>
                                    <div className="custom-file mb-3">
                                        <input type="file" className="custom-file-input" id="nicImage" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'nicImage')} />
                                        <label className="custom-file-label" htmlFor="nicImage">Choisir un fichier</label>
                                    </div>
                                    {lecturer.nicImage && (
                                        <div className="mt-2 text-primary">
                                            <i className="fas fa-check-circle mr-1"></i> File selected
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    <label>Extrait de Naissance / CV</label>
                                    <div className="custom-file mb-3">
                                        <input type="file" className="custom-file-input" id="cv" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'cv')} />
                                        <label className="custom-file-label" htmlFor="cv">Choisir un fichier</label>
                                    </div>
                                    {lecturer.cv && (
                                        <div className="mt-2 text-primary">
                                            <i className="fas fa-check-circle mr-1"></i> File selected
                                        </div>
                                    )}
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
export default LecturerOnboarding;