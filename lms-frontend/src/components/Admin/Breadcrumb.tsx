import { Link } from "react-router-dom";

interface BreadCrumbProps {
    title?: string;
    parent_name: string;
    page_name: string;
}

const BreadCrumb = ({ title, parent_name, page_name }: BreadCrumbProps) => {
    return (
        <div className="content-header" style={{ padding: '1.5rem 0.5rem' }}>
            <div className="container-fluid">
                <div className="row align-items-center">
                    <div className="col-sm-6">
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.75rem', 
                            fontWeight: 800, 
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.5px'
                        }}>
                            {title || page_name}
                        </h1>
                    </div>
                    <div className="col-sm-6">
                        <ol className="breadcrumb float-sm-right" style={{ 
                            background: 'transparent', 
                            padding: 0, 
                            margin: 0,
                            fontSize: '0.85rem'
                        }}>
                            <li className="breadcrumb-item">
                                <Link to="/admin/index" style={{ color: 'var(--accent)', fontWeight: 500 }}>{parent_name}</Link>
                            </li>
                            <li className="breadcrumb-item active" style={{ color: 'var(--text-muted)' }}>
                                {page_name}
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BreadCrumb;