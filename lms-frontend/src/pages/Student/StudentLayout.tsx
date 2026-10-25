import Navbar from "../../components/Student/Navbar";
import ChatBotWidget from "../../components/ChatBot/ChatBotWidget";
import ActiveMeetingBanner from "../../components/Meeting/ActiveMeetingBanner";

// Note : le quiz (/student/:moduleId/quiz/:quizId) et la prise de devoir
// (.../take) sont déclarés hors de "/student/*" dans App.tsx et enveloppés
// dans FocusLayout — ils ne passent donc jamais par ce layout. Un mode
// "focus" basé sur location.pathname existait ici auparavant mais ne
// pouvait plus jamais se déclencher ; supprimé pour éviter la confusion.
const StudentLayout = ({ children }: { children: any }) => {
    return (
        <div className="wrapper">
            <Navbar />
            <div className="content-wrapper">
                {children}
            </div>
            <ChatBotWidget />
            {/* Bannière flottante si une réunion est active en arrière-plan */}
            <ActiveMeetingBanner />
        </div>
    );
}

export default StudentLayout;