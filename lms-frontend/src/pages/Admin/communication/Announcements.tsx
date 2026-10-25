import { h } from 'gridjs';
import { Grid } from 'gridjs-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteAnnouncement, getAllAnnouncements } from '../../../services/api/announcement';
import PageLoading from '../../../components/Admin/PageLoading';
import { Button } from '../../../components/ui';

const AUDIENCE_BADGES: Record<string, string> = {
  ALL:       'badge-secondary',
  STUDENTS:  'badge-info',
  LECTURERS: 'badge-warning',
  COURSE:    'badge-primary',
  CLASS:     'badge-success',
};

const Announcements = () => {
    const [rows, setRows] = useState<(string | null)[][]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        const all = await getAllAnnouncements();
        if (Array.isArray(all)) {
            const mapped = all.map((a: any) => [
                a.title || '',
                (a.description || '').length > 50 ? (a.description || '').substring(0, 47) + '...' : (a.description || ''),
                (a.type || '').toUpperCase(),
                a.targetAudience || 'ALL',
                a.targetId || '—',
            ]);
            setRows(mapped);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    if (loading) return <PageLoading />;

    return (
        <section className="content">
            <div className="container-fluid py-4">
                <div className="d-flex align-items-center mb-4" style={{ gap: '1.5rem' }}>
                    <Button variant="secondary" onClick={() => window.history.back()} title="Retour">
                        <i className="fas fa-arrow-left" />
                    </Button>
                    <h2 className="mb-0 font-weight-bold" style={{ fontSize: '1.85rem' }}>Annonces</h2>
                </div>

                <div className="card shadow-sm border-0">
                    <div className="card-header bg-white border-0 pt-4 px-4">
                        <Link to="/admin/announcements/new" className="btn btn-primary font-weight-bold" style={{ borderRadius: '10px' }}>
                            <i className="fas fa-plus mr-2" /> Nouvelle annonce
                        </Link>
                    </div>
                    <div className="card-body px-4 pb-4">
                        <Grid
                            data={rows}
                            columns={[
                                { name: 'Titre', width: '25%' },
                                { name: 'Description', width: '45%' },
                                { name: 'Type', width: '10%' },
                                {
                                    name: 'Audience',
                                    width: '10%',
                                    formatter: (cell: any) => {
                                        const cls = AUDIENCE_BADGES[cell] || 'badge-secondary';
                                        return h('span', { className: `badge ${cls} px-2 py-1` }, cell);
                                    }
                                },
                                { name: 'Cible', width: '10%' }
                            ]}
                            search={true}
                            pagination={{ limit: 10 }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
const gridStyles = `
  .gridjs-container {
    color: var(--text-primary);
    padding: 0;
    font-size: 0.85rem !important;
  }
  .gridjs-wrapper {
    box-shadow: none;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .gridjs-table {
    background-color: var(--bg-card) !important;
    width: 100%;
  }
  .gridjs-th {
    background-color: var(--bg-elevated) !important;
    color: var(--text-muted) !important;
    border: 1px solid var(--border) !important;
    padding: 10px 12px !important;
    font-weight: 700;
    font-size: 0.7rem !important;
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }
  .gridjs-td {
    background-color: var(--bg-card) !important;
    border: 1px solid var(--border-light) !important;
    color: var(--text-primary) !important;
    padding: 10px 12px !important;
  }
  .gridjs-tr:hover .gridjs-td {
    background-color: var(--bg-hover) !important;
  }
  .gridjs-search {
    float: right;
    margin-bottom: 15px;
  }
  .gridjs-search-input {
    background-color: var(--bg-input) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font-size: 0.85rem;
  }
  .gridjs-search-input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1) !important;
  }
  .gridjs-footer {
    background-color: var(--bg-card) !important;
    border: none;
    padding: 15px 0 0 0;
  }
  .gridjs-pagination .gridjs-summary {
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .gridjs-pagination .gridjs-pages button {
    background-color: var(--bg-elevated) !important;
    color: var(--text-secondary) !important;
    border: 1px solid var(--border) !important;
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    margin-left: 5px;
    font-size: 0.8rem;
  }
  .gridjs-pagination .gridjs-pages button:hover {
    background-color: var(--bg-hover) !important;
    color: var(--accent) !important;
  }
  .gridjs-pagination .gridjs-pages button.gridjs-currentPage {
    background-color: var(--accent) !important;
    color: white !important;
    font-weight: 700;
  }
  .gridjs-pagination .gridjs-pages button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default function AnnouncementsWithStyle() {
  return (
    <>
      <style>{gridStyles}</style>
      <Announcements />
    </>
  );
}