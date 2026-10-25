import React, { useEffect, useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import { CreateButton } from "../../../components/Admin/ButtonIndicator";
import { createLecturer } from "../../../services/api/user";

const NewLecturer = () => {
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
        department: '',
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
            setLecturer({
                ...lecturer,
                address: {
                    ...lecturer.address,
                    [id]: value,
                },
            });
        } else {
            setLecturer({
                ...lecturer,
                [id]: value,
            });
        }
    };

    useEffect(() => {
        if (lecturer.firstName) {
            const generatedUsername = genUsername(lecturer.firstName, autogenerateNumber);
            setLecturer(prev => ({
                ...prev,
                username: generatedUsername,
                lecturerId: prev.lecturerId || autogenerateNumber.toString(),
            }));
        }
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
            <BreadCrumb page_name="Nouveau Conférencier" parent_name="Conférencier" />
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
                                                <input className="form-control" type="text" id="firstName" name="firstName" value={lecturer.firstName} onChange={handleChange} required/>
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
                                                <input className="form-control" type="text" id="fullName" name="fullName" value={lecturer.fullName} onChange={handleChange} required/>
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
                                                <input className="form-control" type="text" id="city" name="city" value={lecturer.address.city} onChange={handleChange} required/>
                                                <p><small>Ville</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="state" name="state" value={lecturer.address.state} onChange={handleChange} required/>
                                                <p><small>État / Province</small></p>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-4">
                                            <div className="form-group">
                                                <input className="form-control" type="text" id="country" name="country" value={lecturer.address.country} onChange={handleChange} required/>
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
                                                <input className="form-control" type="email" id="email" name="email" value={lecturer.email} onChange={handleChange} required/>
                                            </div>
                                        </div>
                                    </div>
                                    <h5 className="pb-4 pt-4"><strong>Informations Professionnelles (EPT)</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>ID Enseignant <em>(Auto Generated)</em></label>
                                                <input className="form-control" type="text" value={lecturer.lecturerId} id="lecturerId" name="lecturerId" onChange={handleChange} disabled />
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Département<span className="text-danger">*</span></label>
                                                <select className="form-control" id="department" name="department" value={lecturer.department} onChange={handleChange} required>
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
                                                <label>Désignation / Titre<span className="text-danger">*</span></label>
                                                <select className="form-control" id="designation" name="designation" value={lecturer.designation} onChange={handleChange} required>
                                                    <option value="">Sélectionner le titre</option>
                                                    <option value="Professeur Titulaire">Professeur Titulaire</option>
                                                    <option value="Maître de Conférences">Maître de Conférences</option>
                                                    <option value="Maître Assistant">Maître Assistant</option>
                                                    <option value="Docteur Ingénieur">Docteur Ingénieur</option>
                                                    <option value="Ingénieur de Conception">Ingénieur de Conception</option>
                                                    <option value="Vacataire">Vacataire</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Type d'emploi<span className="text-danger">*</span></label>
                                                <select className="form-control" id="workType" name="workType" value={lecturer.workType} onChange={handleChange} required>
                                                    <option value="">Sélectionner le type</option>
                                                    <option value="Permanent">Permanent</option>
                                                    <option value="Contractuel">Contractuel</option>
                                                    <option value="Vacataire">Vacataire</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <h5 className="pb-4 pt-4"><strong>Parcours Académique</strong></h5>
                                    <div className="row">
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <label>Diplôme le plus élevé obtenu<span className="text-danger">*</span></label>
                                                <input className="form-control" type="text" id="highestDegree" name="highestDegree" value={lecturer.highestDegree} onChange={handleChange} required/>
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
                                                <label>Mot de passe</label>
                                                <input className="form-control" type="text" value="Generates In Creation" disabled />
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
                                                    <input className="form-control" type="text" id="emergencyPhone" name="emergencyPhone" value={lecturer.emergencyPhone} onChange={handleChange} placeholder="77 123 45 67" required/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 mt-5"></div>
                                        <div className="col-12 col-sm-6">
                                            <div className="form-group">
                                                <button type="button" className="btn btn-block btn-default btn-lg">Enregistrer comme brouillon</button>
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
                                    <div className="list-group list-group-numbered">
                                        <div
                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                            <div className="ms-2 me-auto">
                                                <img src={lecturer.profileImage || "/dist/img/avatar.png"} style={{width: "45px", height: "45px", objectFit: "cover"}} className="img-thumbnail"
                                                     alt="..."></img>
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
                                        <div
                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                            <div className="ms-2 me-auto">
                                                <i className="far fa-file-pdf fa-lg mr-2 text-danger"></i>
                                                {lecturer.nicImage ? 'NIC Document Selected' : 'No document selected'}
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
                                    <label>Extrait de Naissance / CV</label>
                                    <div className="list-group list-group-numbered">
                                        <div className="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                                            <div className="ms-2 me-auto">
                                                <i className="far fa-file-pdf fa-lg mr-2 text-danger"></i>
                                                {lecturer.cv ? 'CV Document Selected' : 'No document selected'}
                                            </div>
                                            <div className="row">
                                                <input 
                                                    type="file" 
                                                    id="cvUpload" 
                                                    style={{ display: 'none' }} 
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => handleFileUpload(e, 'cv')}
                                                />
                                                <button type="button"
                                                        className="btn btn-default ml-2 btn-sm btn-custom-view"
                                                        onClick={() => document.getElementById('cvUpload')?.click()}
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
export default NewLecturer;
