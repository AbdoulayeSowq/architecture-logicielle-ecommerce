import { useState } from "react";
import BreadCrumb from "../../../components/Admin/Breadcrumb";
import {
  createAssignment,
  createEvent,
  createExam,
  createMaintenance,
} from "../../../services/api/announcement";
import { CreateButton } from "../../../components/Admin/ButtonIndicator";
import { useNavigate } from "react-router-dom";

type Audience = "ALL" | "STUDENTS" | "LECTURERS" | "COURSE" | "CLASS";

const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL: "Tout le monde",
  STUDENTS: "Tous les étudiants",
  LECTURERS: "Tous les enseignants",
  COURSE: "Un cours spécifique (courseCode)",
  CLASS: "Une classe spécifique (classId)",
};

const NewAnnounce = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    targetAudience: "ALL" as Audience,
    targetId: "",
    // Assignment
    assignmentCourseCode: "",
    assignmentDueDate: "",
    assignmentInstructions: "",
    assignmentInstructor: "",
    // Exam
    examCourseCode: "",
    examDate: "",
    examTime: "",
    examLocation: "",
    examInstructor: "",
    examResources: "",
    // Event
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    eventOrganizer: "",
    eventContact: "",
    eventFlyer: "",
    eventRegistration: "",
    // Maintenance
    maintenanceStart: "",
    maintenanceEnd: "",
    maintenanceServices: "",
    maintenanceContact: "",
  });

  const needsTargetId = (aud: Audience) => aud === "COURSE" || aud === "CLASS";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const buildBase = () => ({
    title: formData.title,
    description: formData.description,
    targetAudience: formData.targetAudience,
    targetId: needsTargetId(formData.targetAudience) ? formData.targetId : undefined,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    let res: any;
    switch (formData.type) {
      case "assignment":
        res = await createAssignment({
          ...buildBase(),
          type: formData.type,
          assignmentCourseCode: formData.assignmentCourseCode,
          assignmentDueDate: formData.assignmentDueDate,
          assignmentInstructions: formData.assignmentInstructions,
          assignmentInstructor: formData.assignmentInstructor,
        });
        break;
      case "exam":
        res = await createExam({
          ...buildBase(),
          type: formData.type,
          examCourseCode: formData.examCourseCode,
          examDate: formData.examDate,
          examTime: formData.examTime,
          examLocation: formData.examLocation,
          examInstructor: formData.examInstructor,
          examResources: formData.examResources,
        });
        break;
      case "event":
        res = await createEvent({
          ...buildBase(),
          type: formData.type,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          eventLocation: formData.eventLocation,
          eventOrganizer: formData.eventOrganizer,
          eventContact: formData.eventContact,
          eventFlyer: formData.eventFlyer,
          eventRegistration: formData.eventRegistration,
        });
        break;
      case "maintenance":
        res = await createMaintenance({
          ...buildBase(),
          type: formData.type,
          maintenanceStart: formData.maintenanceStart,
          maintenanceEnd: formData.maintenanceEnd,
          maintenanceServices: formData.maintenanceServices,
          maintenanceContact: formData.maintenanceContact,
        });
        break;
      default:
        break;
    }
    setIsCreating(false);
    if (res && res.status === 200) navigate("/admin/announcements");
  };

  return (
    <section className="content" style={{ padding: '2rem 1rem' }}>
      {/* BreadCrumb removed per user request */}
      <div className="container-fluid">
        <div className="row">
          <div className="col-7">
            <div className="card">
              <div className="card-body">
                <form autoComplete="on" onSubmit={handleSubmit}>
                  {/* ── Champs communs ── */}
                  <div className="form-group">
                    <label htmlFor="title">Titre <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" id="title" value={formData.title} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description <span className="text-danger">*</span></label>
                    <textarea className="form-control" id="description" value={formData.description} onChange={handleChange} rows={4} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="type">Type <span className="text-danger">*</span></label>
                    <select className="form-control" id="type" value={formData.type} onChange={handleChange} required>
                      <option value="">Sélectionner le type</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="event">Event</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  {/* ── Audience cible ── */}
                  <div className="form-group">
                    <label htmlFor="targetAudience">Audience cible <span className="text-danger">*</span></label>
                    <select className="form-control" id="targetAudience" value={formData.targetAudience} onChange={handleChange} required>
                      {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
                        <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>
                      ))}
                    </select>
                  </div>

                  {needsTargetId(formData.targetAudience) && (
                    <div className="form-group">
                      <label htmlFor="targetId">
                        {formData.targetAudience === "COURSE" ? "Code du cours" : "ID de la classe"}
                        <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="targetId"
                        placeholder={formData.targetAudience === "COURSE" ? "Ex: CS101" : "Ex: DIC1-GIT"}
                        value={formData.targetId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}

                  {/* ── Assignment ── */}
                  {formData.type === "assignment" && (
                    <div id="assignmentFields">
                      <div className="form-group">
                        <label htmlFor="assignmentCourseCode">Course Code</label>
                        <input type="text" className="form-control" id="assignmentCourseCode" value={formData.assignmentCourseCode} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="assignmentDueDate">Due Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="assignmentDueDate" value={formData.assignmentDueDate} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="assignmentInstructions">Instructions</label>
                        <textarea className="form-control" id="assignmentInstructions" value={formData.assignmentInstructions} onChange={handleChange} rows={3} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="assignmentInstructor">Instructor</label>
                        <input type="text" className="form-control" id="assignmentInstructor" value={formData.assignmentInstructor} onChange={handleChange} />
                      </div>
                    </div>
                  )}

                  {/* ── Exam ── */}
                  {formData.type === "exam" && (
                    <div id="examFields">
                      <div className="form-group">
                        <label htmlFor="examCourseCode">Course Code</label>
                        <input type="text" className="form-control" id="examCourseCode" value={formData.examCourseCode} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="examDate">Exam Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="examDate" value={formData.examDate} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="examTime">Exam Time</label>
                        <input type="time" className="form-control" id="examTime" value={formData.examTime} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="examLocation">Location</label>
                        <input type="text" className="form-control" id="examLocation" value={formData.examLocation} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="examInstructor">Instructor</label>
                        <input type="text" className="form-control" id="examInstructor" value={formData.examInstructor} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="examResources">Additional Resources</label>
                        <input type="url" className="form-control" id="examResources" value={formData.examResources} onChange={handleChange} />
                      </div>
                    </div>
                  )}

                  {/* ── Event ── */}
                  {formData.type === "event" && (
                    <div id="eventFields">
                      <div className="form-group">
                        <label htmlFor="eventDate">Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="eventDate" value={formData.eventDate} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eventTime">Time</label>
                        <input type="time" className="form-control" id="eventTime" value={formData.eventTime} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eventLocation">Location</label>
                        <input type="text" className="form-control" id="eventLocation" value={formData.eventLocation} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eventOrganizer">Organizer</label>
                        <input type="text" className="form-control" id="eventOrganizer" value={formData.eventOrganizer} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eventContact">Contact</label>
                        <input type="text" className="form-control" id="eventContact" value={formData.eventContact} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eventFlyer">Flyer Link</label>
                        <input type="url" className="form-control" id="eventFlyer" value={formData.eventFlyer} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="eventRegistration">Registration Link</label>
                        <input type="url" className="form-control" id="eventRegistration" value={formData.eventRegistration} onChange={handleChange} />
                      </div>
                    </div>
                  )}

                  {/* ── Maintenance ── */}
                  {formData.type === "maintenance" && (
                    <div id="maintenanceFields">
                      <div className="form-group">
                        <label htmlFor="maintenanceStart">Start <span className="text-danger">*</span></label>
                        <input type="datetime-local" className="form-control" id="maintenanceStart" value={formData.maintenanceStart} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintenanceEnd">End <span className="text-danger">*</span></label>
                        <input type="datetime-local" className="form-control" id="maintenanceEnd" value={formData.maintenanceEnd} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintenanceServices">Affected Services</label>
                        <textarea className="form-control" id="maintenanceServices" value={formData.maintenanceServices} onChange={handleChange} rows={3} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintenanceContact">Contact</label>
                        <input type="text" className="form-control" id="maintenanceContact" value={formData.maintenanceContact} onChange={handleChange} />
                      </div>
                    </div>
                  )}

                  <CreateButton isSaving={isCreating} />
                </form>
              </div>
            </div>
          </div>

          <div className="col-5">
            <div className="card">
              <div className="card-body">
                <h5><strong>Guide d'audience</strong></h5>
                <ul>
                  <li><strong>Tout le monde :</strong> admins, étudiants, profs.</li>
                  <li><strong>Étudiants :</strong> visible par tous les étudiants.</li>
                  <li><strong>Enseignants :</strong> visible par tous les profs.</li>
                  <li><strong>Un cours :</strong> saisissez le code du cours (ex: CS101).</li>
                  <li><strong>Une classe :</strong> saisissez l'ID de classe (ex: DIC1-GIT).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewAnnounce;