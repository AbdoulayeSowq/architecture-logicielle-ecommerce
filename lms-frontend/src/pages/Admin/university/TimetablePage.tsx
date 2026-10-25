import React, { useState, useEffect } from 'react';
import TimetableGrid, { TimetableEntry } from '../../../components/Timetable/TimetableGrid';
import { getClasses } from '../../../services/api/university';
import { createTimetable } from '../../../services/api/timetable';
import { getLecturerDetailsByUsername } from '../../../services/api/user';

const normalizeClassName = (name: string) => {
    return (name || '').toLowerCase().replace(/[-_\s]/g, '');
};

const TimetablePage = () => {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    
    // Form state
    const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
        dayOfWeek: 'LUNDI',
        startTime: '08:00',
        endTime: '09:00',
        courseName: '',
        teacherName: '',
        type: 'EC',
        online: false
    });

    useEffect(() => {
        const role = localStorage.getItem('role') || '';
        if (role !== 'RESP_PEDAGO') {
            setForbidden(true);
            setLoading(false);
            return;
        }

        const stored = localStorage.getItem('user');
        const uname = stored ? (JSON.parse(stored).username || JSON.parse(stored).email || '') : '';

        const init = async () => {
            try {
                const [me, allClasses] = await Promise.all([
                    getLecturerDetailsByUsername(uname).catch(() => null),
                    getClasses().catch(() => [])
                ]);

                if (me && me.supervisedClassName) {
                    const supervisedNames = me.supervisedClassName.split(',')
                        .map((c: string) => normalizeClassName(c))
                        .filter(Boolean);

                    const filtered = (allClasses || []).filter((c: any) => {
                        const normName = normalizeClassName(c.name);
                        return supervisedNames.includes(normName);
                    });
                    setClasses(filtered);
                } else {
                    setClasses([]);
                }
            } catch (err) {
                console.error("Error loading timetable page data:", err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const addEntry = () => {
        if (newEntry.type === 'EC' && !newEntry.courseName?.trim()) {
            alert("Veuillez saisir le nom du cours.");
            return;
        }
        
        const finalEntry = {
            ...newEntry,
            courseName: newEntry.courseName?.trim() || (newEntry.type === 'TPE' ? 'TPE' : newEntry.type === 'PROJECT' ? 'Projets Transversaux' : 'Sans titre')
        };
        
        if (editingId) {
            setEntries(entries.map(e => e.id === editingId ? { ...finalEntry, id: editingId } as TimetableEntry : e));
            setEditingId(null);
        } else {
            setEntries([...entries, { ...finalEntry, id: Date.now() } as TimetableEntry]);
        }

        setNewEntry({
            dayOfWeek: 'LUNDI',
            startTime: '08:00',
            endTime: '09:00',
            courseName: '',
            teacherName: '',
            type: 'EC',
            online: false
        });
    };

    const handleEntryClick = (entry: TimetableEntry) => {
        setNewEntry(entry);
        setEditingId(entry.id || null);
    };

    const removeEntry = () => {
        if (editingId) {
            setEntries(entries.filter(e => e.id !== editingId));
            cancelEdit();
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewEntry({
            dayOfWeek: 'LUNDI',
            startTime: '08:00',
            endTime: '09:00',
            courseName: '',
            teacherName: '',
            type: 'EC',
            online: false
        });
    };

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedClass) {
            alert("Veuillez sélectionner une classe.");
            return;
        }
        if (!startDate || !endDate) {
            alert("Veuillez définir la période (dates de début et de fin).");
            return;
        }

        const data = {
            classId: selectedClass.name,
            startDate,
            endDate,
            published: true,
            entries: entries.map(({ id, ...rest }) => rest)
        };

        
        console.log("Tentative d'enregistrement de l'emploi du temps :", data);
        setSaving(true);
        
        try {
            const result = await createTimetable(data);
            console.log("Résultat de l'enregistrement :", result);
            if (result) {
                // Succès notifié par le service
                setEntries([]);
                setEditingId(null);
            }
        } catch (err: any) {
            console.error("Erreur lors de l'enregistrement :", err);
            alert("Une erreur est survenue lors de l'enregistrement. Vérifiez la console.");
        } finally {
            setSaving(false);
        }
    };    if (loading) {
        return (
            <div className="content-wrapper" style={{ marginLeft: 0 }}>
                <div className="content-header">
                    <div className="container-fluid">
                        <div className="row mb-2">
                            <div className="col-sm-6">
                                <h1>Chargement...</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (forbidden) {
        return (
            <div className="content-wrapper" style={{ marginLeft: 0 }}>
                <div className="content-header">
                    <div className="container-fluid">
                        <div className="row mb-2">
                            <div className="col-sm-6">
                                <h1>Accès Refusé</h1>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="content" style={{ padding: '0 1rem' }}>
                    <div className="container-fluid">
                        <div className="alert alert-danger" style={{ borderRadius: '12px' }}>
                            <h5><i className="icon fas fa-ban"></i> Erreur d'autorisation</h5>
                            Seuls les Responsables Pédagogiques sont autorisés à accéder à la création et à la modification des emplois du temps.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper" style={{ marginLeft: 0 }}>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1>Gestion des Emplois du Temps</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="card card-outline card-primary shadow-sm">
                                <div className="card-header">
                                    <h3 className="card-title">{editingId ? 'Modifier la session' : 'Ajouter une session'}</h3>
                                </div>
                                <div className="card-body">
                                    {!editingId && (
                                        <>
                                            <div className="form-group">
                                                <label>Classe</label>
                                                <select 
                                                    className="form-control" 
                                                    onChange={(e) => setSelectedClass(classes.find(c => c.clid === e.target.value))}
                                                >
                                                    <option value="">Sélectionner une classe</option>
                                                    {classes.map(c => <option key={c.clid} value={c.clid}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="row">
                                                <div className="col-6">
                                                    <div className="form-group">
                                                        <label>Du</label>
                                                        <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="form-group">
                                                        <label>Au</label>
                                                        <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                            <hr />
                                        </>
                                    )}

                                    <div className="form-group">
                                        <label>Jour</label>
                                        <select className="form-control" value={newEntry.dayOfWeek} onChange={e => setNewEntry({...newEntry, dayOfWeek: e.target.value})}>
                                            {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="form-group">
                                                <label>Début</label>
                                                <input type="time" className="form-control" value={newEntry.startTime} onChange={e => setNewEntry({...newEntry, startTime: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="form-group">
                                                <label>Fin</label>
                                                <input type="time" className="form-control" value={newEntry.endTime} onChange={e => setNewEntry({...newEntry, endTime: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="d-block small text-muted mb-2">Raccourcis horaires :</label>
                                        <div className="d-flex flex-wrap gap-2" style={{ gap: '6px' }}>
                                            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setNewEntry({...newEntry, startTime: '08:00', endTime: '12:00'})}>8h - 12h</button>
                                            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setNewEntry({...newEntry, startTime: '15:00', endTime: '19:00'})}>15h - 19h</button>
                                            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setNewEntry({...newEntry, startTime: '08:00', endTime: '10:00'})}>8h - 10h</button>
                                            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setNewEntry({...newEntry, startTime: '10:00', endTime: '12:00'})}>10h - 12h</button>
                                            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setNewEntry({...newEntry, startTime: '15:00', endTime: '17:00'})}>15h - 17h</button>
                                            <button type="button" className="btn btn-xs btn-outline-secondary" onClick={() => setNewEntry({...newEntry, startTime: '17:00', endTime: '19:00'})}>17h - 19h</button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Type</label>
                                        <select className="form-control" value={newEntry.type} onChange={e => {
                                            const type = e.target.value;
                                            let courseName = newEntry.courseName;
                                            let teacherName = newEntry.teacherName;
                                            if (type === 'TPE') {
                                                courseName = 'TPE';
                                                teacherName = '';
                                            } else if (type === 'PROJECT') {
                                                courseName = 'Projets Transversaux';
                                                teacherName = '';
                                            } else if (type === 'OTHER') {
                                                courseName = '';
                                                teacherName = '';
                                            } else if (type === 'EC') {
                                                if (courseName === 'TPE' || courseName === 'Projets Transversaux') {
                                                    courseName = '';
                                                }
                                            }
                                            setNewEntry({...newEntry, type, courseName, teacherName});
                                        }}>
                                            <option value="EC">E.C (Cours)</option>
                                            <option value="TPE">TPE</option>
                                            <option value="PROJECT">Projet</option>
                                            <option value="OTHER">Autre (Férié, etc.)</option>
                                        </select>
                                    </div>

                                    {(newEntry.type === 'EC' || newEntry.type === 'OTHER') && (
                                        <>
                                            <div className="form-group">
                                                <label>{newEntry.type === 'OTHER' ? 'Description' : 'Cours'}</label>
                                                <input type="text" className="form-control" value={newEntry.courseName} onChange={e => setNewEntry({...newEntry, courseName: e.target.value})} placeholder={newEntry.type === 'OTHER' ? 'Ex: Jour Férié' : 'Ex: Deep Learning'} />
                                            </div>
                                            {newEntry.type === 'EC' && (
                                                <div className="form-group">
                                                    <label>Enseignant</label>
                                                    <input type="text" className="form-control" value={newEntry.teacherName} onChange={e => setNewEntry({...newEntry, teacherName: e.target.value})} placeholder="Ex: Pr. NGOM" />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="custom-control custom-switch mb-3">
                                        <input type="checkbox" className="custom-control-input" id="onlineSwitch" checked={newEntry.online} onChange={e => setNewEntry({...newEntry, online: e.target.checked})} />
                                        <label className="custom-control-label" htmlFor="onlineSwitch">Session en ligne</label>
                                    </div>

                                    <div className="d-flex flex-column gap-2">
                                        <button className={`btn ${editingId ? 'btn-info' : 'btn-primary'}`} onClick={addEntry}>
                                            {editingId ? 'Mettre à jour la session' : 'Ajouter au planning'}
                                        </button>
                                        {editingId && (
                                            <>
                                                <button className="btn btn-danger mt-2" onClick={removeEntry}>Supprimer la session</button>
                                                <button className="btn btn-secondary mt-2" onClick={cancelEdit}>Annuler</button>
                                            </>
                                        )}
                                    </div>
                                    
                                    <button className="btn btn-primary btn-block mt-4" onClick={handleSave} disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save mr-2"></i> Enregistrer & Publier
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="alert alert-light border shadow-sm">
                                <small className="text-muted">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Astuce: Cliquez sur une session dans l'aperçu pour la modifier ou la supprimer.
                                </small>
                            </div>
                        </div>

                        <div className="col-md-8">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white">
                                    <h3 className="card-title">Aperçu en temps réel</h3>
                                </div>
                                <div className="card-body p-4" style={{ background: '#f8fafc', minHeight: '600px' }}>
                                    <TimetableGrid 
                                        entries={entries} 
                                        classId={selectedClass?.name || '---'} 
                                        startDate={startDate || '...'} 
                                        endDate={endDate || '...'} 
                                        onEntryClick={handleEntryClick}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimetablePage;
