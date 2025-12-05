import { useTranslation } from 'react-i18next'

export default function Header({ onAddReference, viewMode, setViewMode }) {
    const { t } = useTranslation()

    return (
        <header className="header glass">
            <div className="header-content">
                <div className="header-left">
                    <div className="logo">
                        <div className="logo-icon">📚</div>
                        <h1 className="logo-text">
                            Reference<span className="gradient-text">Hub</span>
                        </h1>
                    </div>
                </div>

                <div className="header-right">
                    <div className="view-toggle">
                        <button
                            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title={t('search.listView')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor" />
                                <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" />
                                <rect x="3" y="14" width="14" height="2" rx="1" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title={t('search.gridView')}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor" />
                                <rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor" />
                                <rect x="3" y="11" width="6" height="6" rx="1" fill="currentColor" />
                                <rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor" />
                            </svg>
                        </button>
                    </div>

                    <button className="btn btn-primary" onClick={onAddReference}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {t('header.addReference')}
                    </button>
                </div>
            </div>
        </header>
    )
}
