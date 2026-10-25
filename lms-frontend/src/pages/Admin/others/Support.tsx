import React from 'react';
import BreadCrumb from "../../../components/Admin/Breadcrumb";

const Support = () => {
    return (
        <section className="content">
            <div className="container-fluid py-4">
                <BreadCrumb page_name="Assistance" parent_name="Autres" />
                
                <div className="card mb-4 overflow-hidden position-relative" style={{ minHeight: 140 }}>
                    <div className="card-body d-flex align-items-center z-index-1 position-relative">
                        <div>
                            <h1 className="font-weight-bold" style={{ fontSize: '2rem' }}>
                                Centre d'Assistance <span className="text-primary">LMS EPT</span>
                            </h1>
                            <p className="text-muted mb-0" style={{ fontSize: '1.1rem', maxWidth: 500 }}>
                                Nous sommes là pour vous accompagner dans votre expérience d'apprentissage numérique.
                            </p>
                        </div>
                    </div>
                    <i className="fas fa-headset position-absolute text-muted" style={{ fontSize: '6rem', right: '2rem', top: '50%', transform: 'translateY(-50%) rotate(15deg)', opacity: 0.1, zIndex: 0 }} />
                </div>

                <div className="row">
                    <div className="col-md-5 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h3 className="card-title font-weight-bold mb-4">
                                    <i className="fas fa-info-circle text-primary mr-2" /> Informations de contact
                                </h3>
                                <div className="d-flex flex-column" style={{ gap: '1.5rem' }}>
                                    <div className="d-flex align-items-center" style={{ gap: '1.25rem' }}>
                                        <div className="stat-card__icon" style={{ flexShrink: 0, width: 42, height: 42 }}>
                                            <i className="fas fa-book-reader" />
                                        </div>
                                        <div>
                                            <div className="text-muted small font-weight-bold text-uppercase">Documentation</div>
                                            <div className="font-weight-bold">Guide d'utilisation interactif</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center" style={{ gap: '1.25rem' }}>
                                        <div className="stat-card__icon" style={{ flexShrink: 0, width: 42, height: 42 }}>
                                            <i className="fas fa-envelope-open-text" />
                                        </div>
                                        <div>
                                            <div className="text-muted small font-weight-bold text-uppercase">Support Email</div>
                                            <div className="font-weight-bold">support@ept.sn</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center" style={{ gap: '1.25rem' }}>
                                        <div className="stat-card__icon" style={{ flexShrink: 0, width: 42, height: 42 }}>
                                            <i className="fas fa-phone-alt" />
                                        </div>
                                        <div>
                                            <div className="text-muted small font-weight-bold text-uppercase">Ligne Directe (EPT)</div>
                                            <div className="font-weight-bold">+221 33 951 13 06</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-top text-muted small d-flex align-items-center">
                                    <span className="bg-primary rounded-circle mr-2" style={{ width: 8, height: 8, boxShadow: '0 0 0 rgba(37, 99, 235, 0.4)', animation: 'pulse 2s infinite' }} />
                                    Disponible du Lundi au Vendredi, 8h - 18h
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-7 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h3 className="card-title font-weight-bold mb-2">
                                    <i className="fas fa-ticket-alt text-primary mr-2" /> Soumettre un Ticket
                                </h3>
                                <p className="text-muted small mb-4">
                                    Vous rencontrez un problème technique ou pédagogique ? Décrivez-le nous en détail.
                                </p>
                                <div className="form-group">
                                    <label className="text-muted small font-weight-bold text-uppercase">Sujet de la demande</label>
                                    <input type="text" className="form-control py-4" placeholder="Ex: Problème d'accès à un cours..." />
                                </div>
                                <div className="form-group">
                                    <label className="text-muted small font-weight-bold text-uppercase">Description détaillée</label>
                                    <textarea className="form-control" rows={4} placeholder="Veuillez préciser le module concerné et la nature du problème..."></textarea>
                                </div>
                                <button className="btn btn-primary font-weight-bold px-4 py-2 mt-2">
                                    <i className="fas fa-paper-plane mr-2" /> Envoyer la demande
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Support;
