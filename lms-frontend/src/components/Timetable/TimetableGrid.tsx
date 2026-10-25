import React from 'react';
import './Timetable.css';

export interface TimetableEntry {
  id?: number;
  dayOfWeek: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "12:00"
  courseName: string;
  teacherName?: string;
  type: string;      // EC, TPE, PROJECT
  online: boolean;
}

interface TimetableGridProps {
  entries: TimetableEntry[];
  classId: string;
  startDate: string;
  endDate: string;
  onEntryClick?: (entry: TimetableEntry) => void;
}

const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const MORNING_HOURS = ['8H-9H', '9H-10H', '10H-11H', '11H-12H'];
const AFTERNOON_HOURS = ['15H-16H', '16H-17H', '17H-18H', '18H-19H'];

const TimetableGrid: React.FC<TimetableGridProps> = ({ entries, classId, startDate, endDate, onEntryClick }) => {
  
  const getEntryForSlot = (day: string, hourRange: string) => {
    return entries.find(e => {
        const startH = parseInt(e.startTime.split(':')[0]);
        const slotStartH = parseInt(hourRange.split('H')[0]);
        return e.dayOfWeek === day && startH === slotStartH;
    });
  };

  const isMiddleOfEntry = (day: string, hourRange: string) => {
    return entries.some(e => {
        const startH = parseInt(e.startTime.split(':')[0]);
        const endH = parseInt(e.endTime.split(':')[0]);
        const slotStartH = parseInt(hourRange.split('H')[0]);
        return e.dayOfWeek === day && slotStartH > startH && slotStartH < endH;
    });
  };

  const renderSlot = (day: string, hourRange: string) => {
    if (isMiddleOfEntry(day, hourRange)) return null;

    const entry = getEntryForSlot(day, hourRange);
    
    if (!entry) {
        return <div className="timetable-cell" key={`${day}-${hourRange}`}></div>;
    }

    const startH = parseInt(entry.startTime.split(':')[0]);
    const endH = parseInt(entry.endTime.split(':')[0]);
    const span = endH - startH;

    return (
      <div 
        className={`timetable-cell ${onEntryClick ? 'clickable-cell' : ''}`} 
        style={{ gridRow: `span ${span}`, cursor: onEntryClick ? 'pointer' : 'default' }} 
        key={`${day}-${hourRange}`}
        onClick={() => onEntryClick && onEntryClick(entry)}
      >
        <div className={`timetable-entry-content type-${entry.type.toLowerCase()}`}>
          {entry.type === 'EC' && <div className="ec-label">E.C :</div>}
          <div className="course-name">{entry.courseName}</div>
          {entry.teacherName && <div className="teacher-name">{entry.teacherName}</div>}
          {entry.online && <div className="online-badge">(En ligne)</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div className="university-info">
          <div>ECOLE POLYTECHNIQUE DE THIES</div>
          <div>DEPARTEMENT DU GENIE INFORMATIQUE ET TELECOMMUNICATIONS</div>
        </div>
        <div className="academic-year">2025/2026</div>
        <h2>Emplois du Temps</h2>
        <div className="date-range">du {startDate} au {endDate}</div>
        <div className="class-info">Classe: {classId}</div>
      </div>

      <div className="timetable-grid">
        {/* Day Headers */}
        <div className="timetable-cell timetable-day-header">HORAIRES</div>
        {DAYS.map(day => (
          <div key={day} className="timetable-cell timetable-day-header">{day}</div>
        ))}

        {/* Morning Slots */}
        {MORNING_HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="timetable-cell timetable-hour-cell">{hour}</div>
            {DAYS.map(day => renderSlot(day, hour))}
          </React.Fragment>
        ))}

        {/* Spacer */}
        <div className="timetable-spacer"></div>

        {/* Afternoon Slots */}
        {AFTERNOON_HOURS.map((hour) => (
          <React.Fragment key={hour}>
            <div className="timetable-cell timetable-hour-cell">{hour}</div>
            {DAYS.map(day => renderSlot(day, hour))}
          </React.Fragment>
        ))}
      </div>
      
      <div className="timetable-footer">
        <div className="responsable">Responsable Pédagogique : Dr. SECK</div>
        <div className="chef">Le Chef de Département</div>
      </div>
    </div>
  );
};

export default TimetableGrid;
