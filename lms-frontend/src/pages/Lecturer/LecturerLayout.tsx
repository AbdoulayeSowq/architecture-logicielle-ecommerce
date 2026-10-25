import Navbar from "../../components/Lecturer/Navbar";
import ChatBotWidget from "../../components/ChatBot/ChatBotWidget";
import ActiveMeetingBanner from "../../components/Meeting/ActiveMeetingBanner";

const LecturerLayout = ({ children }: { children: any }) => {
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

export default LecturerLayout;