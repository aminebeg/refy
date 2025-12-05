import { useTranslation } from 'react-i18next'

export default function ReferenceList({
    references,
    selectedReference,
    onSelectReference,
    onToggleFavorite,
    viewMode,
    isSelectionMode,
    selectedReferenceIds,
    onToggleSelection,
    onEnterSelectionMode,
    onExitSelectionMode,
    onSelectAll,
    onDeleteSelected
}) {
    const { t } = useTranslation()

    if (references.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>{t('referenceList.noReferences')}</h3>
                <p>{t('referenceList.startBuilding')}</p>
            </div>
        )
    }

    const allSelected = references.length > 0 && selectedReferenceIds.length === references.length

    return (
        <>
            {/* Bulk Actions Toolbar */}
            {isSelectionMode && (
                <div className="bulk-actions-toolbar">
                    <div className="bulk-actions-left">
                        <label className="bulk-select-all">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => allSelected ? onExitSelectionMode() : onSelectAll()}
                            />
                            <span>
                                {selectedReferenceIds.length > 0
                                    ? `${selectedReferenceIds.length} ${t('referenceList.selected')}`
                                    : t('referenceList.selectAll')}
                            </span>
                        </label>
                    </div>
                    <div className="bulk-actions-right">
                        {selectedReferenceIds.length > 0 && (
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={onDeleteSelected}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M11 3v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                {t('referenceList.deleteSelected')} {selectedReferenceIds.length}
                            </button>
                        )}
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={onExitSelectionMode}
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            )}

            <div className={`reference-list ${viewMode}-view`}>
                {references.map(reference => (
                    <article
                        key={reference.id}
                        className={`reference-card hover-lift ${selectedReference?.id === reference.id ? 'selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
                        onClick={() => !isSelectionMode && onSelectReference(reference)}
                    >
                        {isSelectionMode && (
                            <div className="reference-checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    className="reference-checkbox"
                                    checked={selectedReferenceIds.includes(reference.id)}
                                    onChange={(e) => {
                                        e.stopPropagation()
                                        onToggleSelection(reference.id)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className="reference-header">
                            <div className="reference-badges">
                                <div className="reference-type-badge badge badge-primary">
                                    {reference.type}
                                </div>
                                {(reference.hasPDF || reference.pdfId) && (
                                    <div className="indicator-badge pdf-indicator" title={t('referenceList.pdfAttached')}>
                                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                            <path d="M3 1h5l3 3v6a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" fill="currentColor" />
                                            <path d="M8 1v3h3" stroke="white" strokeWidth="0.5" />
                                        </svg>
                                        <span>PDF</span>
                                    </div>
                                )}
                                {reference.technicalReview && Object.keys(reference.technicalReview).some(key =>
                                    key !== 'rating' && reference.technicalReview[key] && reference.technicalReview[key].toString().trim()
                                ) && (
                                        <div className="indicator-badge review-indicator" title="Technical review completed">
                                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 3h8M2 6h8M2 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            <span>Review</span>
                                        </div>
                                    )}
                            </div>
                            <div className="reference-header-actions">
                                {!isSelectionMode && (
                                    <button
                                        className="favorite-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onToggleFavorite(reference.id)
                                        }}
                                        title={reference.favorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        {reference.favorite ? '⭐' : '☆'}
                                    </button>
                                )}
                                {!isSelectionMode && (
                                    <button
                                        className="select-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onEnterSelectionMode()
                                            onToggleSelection(reference.id)
                                        }}
                                        title="Select for bulk actions"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M6 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <h3 className="reference-title">{reference.title}</h3>

                        <div className="reference-authors">
                            {reference.authors.join(', ')}
                        </div>

                        <div className="reference-meta">
                            <span className="reference-year">{reference.year}</span>
                            {reference.journal && (
                                <>
                                    <span className="meta-separator">•</span>
                                    <span className="reference-journal">{reference.journal}</span>
                                </>
                            )}
                        </div>

                        {reference.abstract && (
                            <p className="reference-abstract">
                                {reference.abstract.length > 150
                                    ? `${reference.abstract.substring(0, 150)}...`
                                    : reference.abstract}
                            </p>
                        )}

                        {reference.tags && reference.tags.length > 0 && (
                            <div className="reference-tags">
                                {reference.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </>
    )
}
