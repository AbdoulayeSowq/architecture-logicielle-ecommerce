
const PageLoading = () => {
    return (
        <div className="custom-spinner-container">
            <div className="lms-spinner" />
            <p style={{
                color: 'var(--text-muted)',
                fontSize: '.875rem',
                fontWeight: 500,
                margin: 0,
                fontFamily: "'Inter', sans-serif",
            }}>
                Chargement...
            </p>
        </div>
    );
}

export default PageLoading;