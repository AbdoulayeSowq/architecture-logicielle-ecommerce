import React, { useState, useEffect } from 'react';
import TimetableGrid from '../../../components/Timetable/TimetableGrid';
import { getLatestPublishedTimetable } from '../../../services/api/timetable';
import { getStudentDetailsByUsername } from '../../../services/api/user';
import { Loading } from '../../../components/ui';

const StudentTimetablePage = () => {
    const [timetable, setTimetable] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);

    useEffect(() => {
        const fetchProfileAndTimetable = async () => {
            try {
                const stored = localStorage.getItem('user');
                const userObj = stored ? JSON.parse(stored) : null;
                const username = userObj ? (userObj.username || userObj.email || '') : '';
                
                    const profile = await getStudentDetailsByUsername(username);
                    setStudent(profile);
                    
                    if (profile) {
                        const intake = profile.intake || '';
                        const dept = profile.department || '';
                        
                        // Standardized format: INTAKE-DEPT (e.g. DIC1-GIT)
                        const classId = dept ? `${intake}-${dept}` : intake;
                        
                        console.log(`Chargement de l'emploi du temps standardisé : ${classId}`);
                        const data = await getLatestPublishedTimetable(classId);
                        setTimetable(data);
                    }
            } catch (err) {
                console.error("Error loading student timetable:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileAndTimetable();
    }, []);

    if (loading) return <Loading text="Chargement de l'emploi du temps..." />;

    if (!timetable) {
        return (
            <div className="content p-4">
                <div className="alert alert-light border shadow-sm" style={{ borderRadius: '15px' }}>
                    <h5><i className="icon fas fa-calendar-times text-muted mr-2"></i> Aucun emploi du temps disponible</h5>
                    L'emploi du temps pour votre classe (<strong>{student?.intake || 'Non définie'}</strong>) n'a pas encore été publié pour cette semaine.
                </div>
            </div>
        );
    }

    return (
        <div className="content p-4">
            <div className="card shadow-none border-0 bg-transparent">
                <div className="card-body p-0">
                    <TimetableGrid 
                        entries={timetable.entries} 
                        classId={timetable.classId} 
                        startDate={new Date(timetable.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} 
                        endDate={new Date(timetable.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} 
                    />
                </div>
                <div className="mt-4 text-center">
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <i className="fas fa-print mr-2"></i> Imprimer l'emploi du temps
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentTimetablePage;
