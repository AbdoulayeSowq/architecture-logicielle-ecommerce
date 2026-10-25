import React from 'react';
import BreadCrumb from "../../../components/Admin/Breadcrumb";

const Settings = () => {
    return (
        <section className="content">
            <BreadCrumb page_name="Paramètres" parent_name="Autres" />
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card card-primary card-outline card-outline-tabs">
                            <div className="card-header p-0 border-bottom-0">
                                <ul className="nav nav-tabs" id="settings-tab" role="tablist">
                                    <li className="nav-item">
                                        <a
                                            className="nav-link active"
                                            id="settings-general-tab"
                                            data-toggle="pill"
                                            href="#settings-general"
                                            role="tab"
                                            aria-controls="settings-general"
                                            aria-selected="true"
                                        >
                                            <i className="fas fa-cog mr-1"></i> Paramètres Généraux
                                        </a>
                                    </li>
                                    <li className="nav-item">
                                        <a
                                            className="nav-link"
                                            id="settings-notifications-tab"
                                            data-toggle="pill"
                                            href="#settings-notifications"
                                            role="tab"
                                            aria-controls="settings-notifications"
                                            aria-selected="false"
                                        >
                                            <i className="fas fa-bell mr-1"></i> Notifications
                                        </a>
                                    </li>
                                    <li className="nav-item">
                                        <a
                                            className="nav-link"
                                            id="settings-security-tab"
                                            data-toggle="pill"
                                            href="#settings-security"
                                            role="tab"
                                            aria-controls="settings-security"
                                            aria-selected="false"
                                        >
                                            <i className="fas fa-shield-alt mr-1"></i> Sécurité
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="card-body">
                                <div className="tab-content" id="settings-tabContent">

                                    {/* ── Paramètres Généraux ── */}
                                    <div
                                        className="tab-pane fade show active"
                                        id="settings-general"
                                        role="tabpanel"
                                        aria-labelledby="settings-general-tab"
                                    >
                                        <div className="card-body">
                                            <div className="form-group row">
                                                <label htmlFor="uniName" className="col-sm-3 col-form-label">
                                                    Nom de l'Université
                                                </label>
                                                <div className="col-sm-9">
                                                    <input type="text" className="form-control" id="uniName" defaultValue="EPT LMS" />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label htmlFor="uniEmail" className="col-sm-3 col-form-label">
                                                    Email de contact
                                                </label>
                                                <div className="col-sm-9">
                                                    <input type="email" className="form-control" id="uniEmail" defaultValue="contact@ept.sn" />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label htmlFor="uniLang" className="col-sm-3 col-form-label">
                                                    Langue par défaut
                                                </label>
                                                <div className="col-sm-9">
                                                    <select className="form-control" id="uniLang">
                                                        <option>Français</option>
                                                        <option>Wolof</option>
                                                        <option>English</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="form-group row mt-3">
                                                <div className="col-sm-9 offset-sm-3">
                                                    <button className="btn btn-primary">Enregistrer</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Notifications ── */}
                                    <div
                                        className="tab-pane fade"
                                        id="settings-notifications"
                                        role="tabpanel"
                                        aria-labelledby="settings-notifications-tab"
                                    >
                                        <div className="card-body">
                                            <div className="custom-control custom-switch mb-3">
                                                <input type="checkbox" className="custom-control-input" id="emailAuto" defaultChecked />
                                                <label className="custom-control-label" htmlFor="emailAuto">
                                                    Activer les emails automatiques
                                                </label>
                                            </div>
                                            <div className="custom-control custom-switch mb-3">
                                                <input type="checkbox" className="custom-control-input" id="maintenanceMode" />
                                                <label className="custom-control-label" htmlFor="maintenanceMode">
                                                    Mode maintenance
                                                </label>
                                            </div>
                                            <div className="custom-control custom-switch mb-3">
                                                <input type="checkbox" className="custom-control-input" id="newApplicantNotif" defaultChecked />
                                                <label className="custom-control-label" htmlFor="newApplicantNotif">
                                                    Notifier à chaque nouvelle candidature
                                                </label>
                                            </div>
                                            <div className="form-group row mt-3">
                                                <div className="col-sm-12">
                                                    <button className="btn btn-primary">Enregistrer</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Sécurité ── */}
                                    <div
                                        className="tab-pane fade"
                                        id="settings-security"
                                        role="tabpanel"
                                        aria-labelledby="settings-security-tab"
                                    >
                                        <div className="card-body">
                                            <div className="form-group row">
                                                <label htmlFor="sessionTimeout" className="col-sm-3 col-form-label">
                                                    Durée de session (min)
                                                </label>
                                                <div className="col-sm-9">
                                                    <input type="number" className="form-control" id="sessionTimeout" defaultValue={30} />
                                                </div>
                                            </div>
                                            <div className="custom-control custom-switch mb-3">
                                                <input type="checkbox" className="custom-control-input" id="twoFactor" />
                                                <label className="custom-control-label" htmlFor="twoFactor">
                                                    Activer l'authentification à deux facteurs
                                                </label>
                                            </div>
                                            <div className="form-group row mt-3">
                                                <div className="col-sm-9 offset-sm-3">
                                                    <button className="btn btn-primary">Enregistrer</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Settings;
