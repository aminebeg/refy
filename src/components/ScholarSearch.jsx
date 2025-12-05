import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {enhanceSearchQuery} from '../utils/cerebrasService'
import {getJournalRanking} from '../utils/journalRanking'

export default function ScholarSearch({onAddReference}) {
    const {t} = useTranslation()
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isEnhancing, setIsEnhancing] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [error, setError] = useState(null)
    const [selectedYear, setSelectedYear] = useState('all')
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [currentQuery, setCurrentQuery] = useState('')

    // New Filter States
    const [showArxiv, setShowArxiv] = useState(true)
    const [showConferences, setShowConferences] = useState(true)
    const [qualityFilter, setQualityFilter] = useState('all')
    const [enableAI, setEnableAI] = useState(true)

    const handleSearch = async (e, loadMore = false) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim() && !loadMore) return

        const currentOffset = loadMore ? offset : 0

        if (loadMore) {
            setIsLoadingMore(true)
        } else {
            setIsSearching(true)
            setSearchResults([])
            setOffset(0)
        }

        setError(null)

        try {
            const apiKey = localStorage.getItem('cerebras_api_key')
            let queryToSearch = loadMore ? currentQuery : searchQuery

            if (!loadMore && apiKey && apiKey.trim() && enableAI) {
                setIsEnhancing(true)
                try {
                    const enhancedQuery = await enhanceSearchQuery(apiKey.trim(), searchQuery)
                    if (enhancedQuery && enhancedQuery !== searchQuery) {
                        queryToSearch = enhancedQuery
                        console.log('Enhanced query:', queryToSearch)
                    }
                } catch (aiError) {
                    console.warn('AI enhancement failed, using original query:', aiError)
                } finally {
                    setIsEnhancing(false)
                }
            }

            setCurrentQuery(queryToSearch)

            let url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(queryToSearch)}&offset=${currentOffset}&limit=20&fields=title,authors,year,abstract,venue,citationCount,externalIds,url,publicationDate`

            if (selectedYear !== 'all') {
                const currentYear = new Date().getFullYear()
                let yearFilter = ''
                if (selectedYear === 'recent') {
                    yearFilter = `&year=${currentYear - 2}-${currentYear}`
                } else if (selectedYear === '5years') {
                    yearFilter = `&year=${currentYear - 5}-${currentYear}`
                } else {
                    yearFilter = `&year=${selectedYear}`
                }
                url += yearFilter
            }

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Failed to fetch results from Semantic Scholar')
            }

            const data = await response.json()

            if (data.data && data.data.length > 0) {
                // Enrich results with journal rankings
                const enrichedResults = await Promise.all(data.data.map(async (result) => {
                    let ranking = null;
                    if (result.venue) {
                        try {
                            ranking = await getJournalRanking(result.venue);
                        } catch (err) {
                            console.warn(`Failed to get ranking for ${result.venue}`, err);
                        }
                    }
                    return {...result, ranking};
                }));

                if (loadMore) {
                    setSearchResults(prev => [...prev, ...enrichedResults])
                    setOffset(currentOffset + 20)
                } else {
                    setSearchResults(enrichedResults)
                    setOffset(20)
                }
                setHasMore(data.total > (loadMore ? currentOffset + 20 : 20))
            } else {
                if (!loadMore) {
                    setSearchResults([])
                }
                setHasMore(false)
            }
        } catch (err) {
            console.error('Scholar search error:', err)
            setError(err.message || 'Failed to search papers. Please try again.')
        } finally {
            setIsSearching(false)
            setIsLoadingMore(false)
        }
    }

    const handleAddToLibrary = (result) => {
        const reference = {
            title: result.title || 'Untitled',
            authors: result.authors?.map(a => a.name) || [],
            year: result.year || new Date().getFullYear(),
            journal: result.venue || '',
            type: 'Journal Article',
            abstract: result.abstract || '',
            tags: result.ranking ? [result.ranking] : [],
            notes: '',
            doi: result.externalIds?.DOI || '',
            link: result.url || '',
            favorite: false,
            collectionIds: []
        }

        onAddReference(reference)

        const button = document.querySelector(`[data-paper-id="${result.paperId}"]`)
        if (button) {
            button.textContent = `✓ ${t('scholarSearch.added')}`
            button.classList.add('added')
            setTimeout(() => {
                button.textContent = t('scholarSearch.addToLibrary')
                button.classList.remove('added')
            }, 2000)
        }
    }

    const getPublicationType = (result) => {
        const venue = result.venue?.toLowerCase() || ''

        if (result.externalIds?.ArXiv || venue.includes('arxiv')) {
            return {type: 'arXiv', label: 'arXiv Preprint', color: 'arxiv'}
        }

        const conferencePatterns = [
            'conference', 'proceedings', 'workshop', 'symposium',
            'nips', 'neurips', 'icml', 'iclr', 'cvpr', 'iccv', 'eccv',
            'acl', 'emnlp', 'naacl', 'coling', 'aaai', 'ijcai',
            'kdd', 'www', 'sigir', 'icde', 'vldb', 'sigmod'
        ]

        if (conferencePatterns.some(pattern => venue.includes(pattern))) {
            return {type: 'conference', label: 'Conference', color: 'conference'}
        }

        if (venue) {
            return {type: 'journal', label: 'Journal', color: 'journal'}
        }

        return null
    }

    const getQualityTier = (result) => {
        if (!result.ranking) return null;

        const tier = result.ranking; // Q1, Q2, Q3, Q4
        const labels = {
            'Q1': 'Top Tier',
            'Q2': 'High Impact',
            'Q3': 'Standard',
            'Q4': 'Emerging'
        };

        return {
            tier: tier,
            label: labels[tier] || tier,
            color: tier.toLowerCase()
        };
    }

    // Filter Results
    const filteredResults = searchResults.filter(result => {
        const pubType = getPublicationType(result)
        const qualityTier = getQualityTier(result)

        // Filter by Type
        if (!showArxiv && pubType?.type === 'arXiv') return false
        if (!showConferences && pubType?.type === 'conference') return false

        // Filter by Quality
        if (qualityFilter !== 'all') {
            if (!qualityTier) return false
            if (qualityFilter === 'q1' && qualityTier.tier !== 'Q1') return false
            if (qualityFilter === 'q2' && qualityTier.tier !== 'Q2') return false
            if (qualityFilter === 'q3' && qualityTier.tier !== 'Q3') return false
            if (qualityFilter === 'q4' && qualityTier.tier !== 'Q4') return false
        }

        return true
    })

    return (
        <div className="scholar-search">
            <div className="scholar-search-header-container">
                <form className="scholar-search-form" onSubmit={handleSearch}>
                    <div className="search-controls">
                        <div className="search-input-wrapper">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <input
                                type="text"
                                className="scholar-search-input"
                                placeholder={t('scholarSearch.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isEnhancing && (
                                <div className="ai-enhancing-badge">
                                    <div className="mini-spinner"></div>
                                    <span>{t('scholarSearch.aiAugmenting')}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn-search"
                            disabled={isSearching || !searchQuery.trim()}
                        >
                            {isSearching ? (
                                <>
                                    <div className="spinner-small"></div>
                                    {t('scholarSearch.searching')}
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M11 11l4.5 4.5" stroke="currentColor" strokeWidth="2"
                                              strokeLinecap="round"/>
                                    </svg>
                                    {t('scholarSearch.search')}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="filter-controls">
                        <div className="filter-group">
                            <label className="toggle-switch" title="Use AI to improve search queries">
                                <input
                                    type="checkbox"
                                    checked={enableAI}
                                    onChange={(e) => setEnableAI(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                                <span className="toggle-label">
                                    <span className="ai-label-text">{t('scholarSearch.aiAugment')}</span>
                                    {enableAI && <span className="ai-sparkle">✨</span>}
                                </span>
                            </label>

                            <div className="divider-vertical"></div>

                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={showArxiv}
                                    onChange={(e) => setShowArxiv(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                                <span className="toggle-label">{t('scholarSearch.showArxiv')}</span>
                            </label>

                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={showConferences}
                                    onChange={(e) => setShowConferences(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                                <span className="toggle-label">{t('scholarSearch.showConferences')}</span>
                            </label>
                        </div>

                        <div className="filter-group">
                            <select
                                className="filter-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="all">{t('scholarSearch.allYears')}</option>
                                <option value="recent">{t('scholarSearch.last2Years')}</option>
                                <option value="5years">{t('scholarSearch.last5Years')}</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>

                            <select
                                className="filter-select"
                                value={qualityFilter}
                                onChange={(e) => setQualityFilter(e.target.value)}
                            >
                                <option value="all">{t('scholarSearch.allQualities')}</option>
                                <option value="q1">{t('scholarSearch.q1TopTier')}</option>
                                <option value="q2">{t('scholarSearch.q2HighImpact')}</option>
                                <option value="q3">{t('scholarSearch.q3Standard')}</option>
                                <option value="q4">{t('scholarSearch.q4Emerging')}</option>
                            </select>
                        </div>
                    </div>
                </form>

                {currentQuery && currentQuery !== searchQuery && (
                    <div className="enhanced-query-display">
                        <div className="enhanced-query-content">
                            <span className="enhanced-label">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M7 0.5L8.5 5.5L13.5 7L8.5 8.5L7 13.5L5.5 8.5L0.5 7L5.5 5.5L7 0.5Z"
                                          fill="currentColor"/>
                                </svg>
                                {t('scholarSearch.aiAugmentedQuery')}
                            </span>
                            <span className="enhanced-text">{currentQuery}</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="scholar-error">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 6v4M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>{error}</p>
                </div>
            )}

            {isSearching && (
                <div className="scholar-loading">
                    <div className="spinner-large"></div>
                    <p>{t('scholarSearch.searchingDatabase')}</p>
                </div>
            )}

            {!isSearching && filteredResults.length > 0 && (
                <div className="scholar-results">
                    <div className="results-header">
                        <h2>{t('scholarSearch.found')} {filteredResults.length} {t('scholarSearch.results').toLowerCase()} {searchResults.length !== filteredResults.length && `(${t('scholarSearch.filteredFrom')} ${searchResults.length})`} {hasMore && '+'}</h2>
                    </div>
                    <div className="results-list">
                        {filteredResults.map((result, index) => {
                            const pubType = getPublicationType(result)
                            const qualityTier = getQualityTier(result)

                            return (
                                <div key={result.paperId || index} className="result-card">
                                    <div className="result-content">
                                        <div className="result-title-row">
                                            <h3 className="result-title">{result.title}</h3>
                                            <div className="publication-badges">
                                                {pubType && (
                                                    <span className={`pub-type-badge ${pubType.color}`}>
                                                        {pubType.label}
                                                    </span>
                                                )}
                                                {qualityTier && (
                                                    <span className={`quality-badge ${qualityTier.color}`}
                                                          title={`${result.venue} - ${qualityTier.label}`}>
                                                        {qualityTier.tier}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="result-meta">
                                            {result.authors && result.authors.length > 0 && (
                                                <span className="result-authors">
                                                    {result.authors.slice(0, 3).map(a => a.name).join(', ')}
                                                    {result.authors.length > 3 && ` ${t('scholarSearch.etAl')}`}
                                                </span>
                                            )}
                                            {result.venue && (
                                                <span className="result-journal">
                                                    📄 {result.venue}
                                                </span>
                                            )}
                                            {result.year && (
                                                <span className="result-year">({result.year})</span>
                                            )}
                                        </div>
                                        {result.abstract && (
                                            <p className="result-snippet">
                                                {result.abstract.length > 300
                                                    ? result.abstract.substring(0, 300) + '...'
                                                    : result.abstract}
                                            </p>
                                        )}
                                        <div className="result-footer">
                                            {result.citationCount !== null && result.citationCount !== undefined && (
                                                <span className="result-citations">
                                                    📊 {result.citationCount} {t('scholarSearch.citations')}
                                                </span>
                                            )}
                                            {result.externalIds?.DOI && (
                                                <span className="result-doi">
                                                    🔗 {result.externalIds.DOI}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="result-actions">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleAddToLibrary(result)}
                                            data-paper-id={result.paperId}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 3v10M13 8H3" stroke="currentColor" strokeWidth="2"
                                                      strokeLinecap="round"/>
                                            </svg>
                                            {t('scholarSearch.addToLibrary')}
                                        </button>
                                        {result.url && (
                                            <a
                                                href={result.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path
                                                        d="M12 8.5v3a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 012 11.5v-7A1.5 1.5 0 013.5 3h3M9 2h5v5M6.5 9.5L14 2"
                                                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                                        strokeLinejoin="round"/>
                                                </svg>
                                                {t('scholarSearch.view')}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {hasMore && (
                        <div className="load-more-section">
                            <button
                                className="btn-load-more"
                                onClick={() => handleSearch(null, true)}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? (
                                    <>
                                        <div className="spinner-small"></div>
                                        {t('scholarSearch.loadingMore')}
                                    </>
                                ) : (
                                    t('scholarSearch.loadMore')
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!isSearching && filteredResults.length === 0 && searchResults.length > 0 && (
                <div className="scholar-empty">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M32 8v48M8 32h48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                              opacity="0.2"/>
                        <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                    </svg>
                    <h3>{t('scholarSearch.noResultsFilters')}</h3>
                    <p>{t('scholarSearch.adjustFilters')}</p>
                </div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="scholar-empty">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                        <path d="M26 26l12 12M38 26l-12 12" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round"/>
                    </svg>
                    <h3>{t('scholarSearch.noResults')}</h3>
                    <p>{t('scholarSearch.tryDifferentKeywords')}</p>
                </div>
            )}

            {!isSearching && searchResults.length === 0 && !searchQuery && (
                <div className="scholar-welcome">
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                        <circle cx="50" cy="50" r="48" fill="url(#grad1)"/>
                        <path d="M40 35l20 15-20 15V35z" fill="white" opacity="0.9"/>
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="rgba(99, 102, 241, 0.15)"/>
                                <stop offset="100%" stopColor="rgba(236, 72, 153, 0.1)"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <h3>{t('scholarSearch.welcomeTitle')}</h3>
                    <p>{t('scholarSearch.welcomeDescription')}</p>

                    {localStorage.getItem('cerebras_api_key') && (
                        <div className="ai-enhancement-info">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" fill="rgba(99, 102, 241, 0.1)" stroke="currentColor"
                                        strokeWidth="1.5"/>
                                <path d="M10 6l2 4-2 4-2-4 2-4z" fill="currentColor"/>
                            </svg>
                            <p className="ai-enabled">✨ {t('scholarSearch.aiAugmentationEnabled')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
