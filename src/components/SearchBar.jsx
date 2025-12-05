import { useTranslation } from 'react-i18next'

export default function SearchBar({ searchQuery, setSearchQuery, resultCount }) {
    const { t } = useTranslation()

    return (
        <div className="search-bar-container">
            <div className="search-bar">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    className="search-input"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="search-clear"
                        onClick={() => setSearchQuery('')}
                        title={t('common.close')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>
            {searchQuery && (
                <div className="search-results-info fade-in">
                    {t('search.results')}: {resultCount}
                </div>
            )}
        </div>
    )
}
