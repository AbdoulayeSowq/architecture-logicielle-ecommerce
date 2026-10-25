import Navbar from "../../components/Admin/Navbar";
import Sidebar from "../../components/Admin/SideBar";

const AdminLayout = ({ children }: { children: any }) => {
    return (
        <div className="wrapper" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
            <Navbar />
            <Sidebar />
            <div className="content-wrapper" style={{ background: 'var(--bg-base)', marginLeft: 'var(--sidebar-w)', transition: 'var(--t)' }}>
                {children}
            </div>
        </div>
    );
}

export default AdminLayout;