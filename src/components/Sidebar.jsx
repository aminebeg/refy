import { useState } from 'react'
import { X, Plus, Edit2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Sidebar({
    folders,
    selectedFolder,
    onSelectFolder,
    collections,
    selectedCollection,
    onSelectCollection,
    onAddCollection,
    onDeleteCollection,
    onRenameCollection,
    referenceCount,
    onAddReference,
    onFilesDrop,
    viewMode,
    setViewMode,
    onOpenSettings
}) {
    const { t } = useTranslation()
    const [isAddingCollection, setIsAddingCollection] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')
    const [editingCollectionId, setEditingCollectionId] = useState(null)
    const [editingName, setEditingName] = useState('')
    const [deletingCollectionId, setDeletingCollectionId] = useState(null)
    const [isDraggingOver, setIsDraggingOver] = useState(false)

    const handleAddCollection = () => {
        if (newCollectionName.trim()) {
            onAddCollection(newCollectionName.trim())
            setNewCollectionName('')
            setIsAddingCollection(false)
        }
    }

    const handleRenameCollection = (id) => {
        if (editingName.trim()) {
            onRenameCollection(id, editingName.trim())
            setEditingCollectionId(null)
            setEditingName('')
        }
    }

    const startEditingCollection = (collection) => {
        setEditingCollectionId(collection.id)
        setEditingName(collection.name)
    }

    const handleDeleteCollection = (collectionId) => {
        onDeleteCollection(collectionId)
        setDeletingCollectionId(null)
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf')
        if (files.length > 0) {
            onFilesDrop(files)
        }
        e.target.value = '' // Reset input
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingOver(false)

        const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
        if (files.length > 0) {
            onFilesDrop(files)
        }
    }

    return (
        <aside className="sidebar">
            {/* Sidebar Header with Smart Add Button */}
            <div className="sidebar-top">
                <div
                    className={`add-ref-dropzone ${isDraggingOver ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleFileSelect}
                        className="file-input-hidden"
                        id="pdf-file-input"
                    />
                    <label htmlFor="pdf-file-input" className="add-ref-label">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3v10M13 8H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>{isDraggingOver ? t('batchAdd.dragDrop') : t('header.addReference')}</span>
                    </label>
                    {!isDraggingOver && (
                        <div className="add-ref-hint">{t('batchAdd.orClick')}</div>
                    )}
                </div>

                <div className="view-toggle">
                    <button
                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title={t('search.listView')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" />
                            <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                            <rect x="2" y="11" width="12" height="2" rx="1" fill="currentColor" />
                        </svg>
                    </button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title={t('search.gridView')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
                            <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
                            <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
                            <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="sidebar-section">
                <h3 className="sidebar-title">Library</h3>
                <nav className="sidebar-nav">
                    {folders.map(folder => (
                        <button
                            key={folder}
                            className={`sidebar-item ${selectedFolder === folder && !selectedCollection ? 'active' : ''}`}
                            onClick={() => {
                                onSelectFolder(folder)
                                onSelectCollection(null)
                            }}
                        >
                            <span className="sidebar-icon">
                                {folder === 'All Papers' && '📄'}
                                {folder === 'Recently Added' && '🕐'}
                                {folder === 'Favorites' && '⭐'}
                            </span>
                            <span className="sidebar-label">
                                {folder === 'All Papers' && t('sidebar.allPapers')}
                                {folder === 'Recently Added' && t('sidebar.recentlyAdded')}
                                {folder === 'Favorites' && t('sidebar.favorites')}
                            </span>
                            {folder === 'All Papers' && (
                                <span className="sidebar-count">{referenceCount}</span>
                            )}
                        </button>
                    ))}
                    <button
                        className={`sidebar-item ${selectedFolder === 'Search Scholar' && !selectedCollection ? 'active' : ''}`}
                        onClick={() => {
                            onSelectFolder('Search Scholar')
                            onSelectCollection(null)
                        }}
                    >
                        <span className="sidebar-icon">🔍</span>
                        <span className="sidebar-label">{t('sidebar.searchScholar')}</span>
                    </button>
                    <button
                        className={`sidebar-item ${selectedFolder === 'Novelty Evaluator' && !selectedCollection ? 'active' : ''}`}
                        onClick={() => {
                            onSelectFolder('Novelty Evaluator')
                            onSelectCollection(null)
                        }}
                    >
                        <span className="sidebar-icon">✨</span>
                        <span className="sidebar-label">{t('sidebar.noveltyEvaluator')}</span>
                    </button>
                </nav>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-header">
                    <h3 className="sidebar-title">{t('sidebar.collections')}</h3>
                    <button
                        className="btn-icon-small"
                        onClick={() => setIsAddingCollection(true)}
                        title={t('collections.newCollection')}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 3v8M11 7H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {isAddingCollection && (
                    <div className="add-collection-form">
                        <input
                            type="text"
                            className="collection-input"
                            placeholder="Collection name..."
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddCollection()
                                if (e.key === 'Escape') {
                                    setIsAddingCollection(false)
                                    setNewCollectionName('')
                                }
                            }}
                            autoFocus
                        />
                        <div className="collection-form-actions">
                            <button className="btn-xs btn-primary" onClick={handleAddCollection}>{t('common.add')}</button>
                            <button
                                className="btn-xs btn-secondary"
                                onClick={() => {
                                    setIsAddingCollection(false)
                                    setNewCollectionName('')
                                }}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {collections.length === 0 && !isAddingCollection && (
                        <div className="empty-collections">
                            <span className="text-xs text-tertiary">{t('collections.noCollections')}</span>
                        </div>
                    )}
                    {collections.map(collection => (
                        <div key={collection.id} className="collection-item-wrapper">
                            {editingCollectionId === collection.id ? (
                                <div className="edit-collection-form">
                                    <input
                                        type="text"
                                        className="collection-input"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameCollection(collection.id)
                                            if (e.key === 'Escape') {
                                                setEditingCollectionId(null)
                                                setEditingName('')
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <div className="collection-form-actions">
                                        <button className="btn-xs btn-primary" onClick={() => handleRenameCollection(collection.id)}>{t('common.save')}</button>
                                        <button
                                            className="btn-xs btn-secondary"
                                            onClick={() => {
                                                setEditingCollectionId(null)
                                                setEditingName('')
                                            }}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : deletingCollectionId === collection.id ? (
                                <div className="delete-collection-confirm">
                                    <p className="text-sm mb-1">{t('collections.deleteCollection')} "{collection.name}"?</p>
                                    <div className="collection-form-actions">
                                        <button
                                            className="btn-xs btn-danger"
                                            onClick={() => handleDeleteCollection(collection.id)}
                                        >
                                            {t('editReference.yesDelete')}
                                        </button>
                                        <button
                                            className="btn-xs btn-secondary"
                                            onClick={() => setDeletingCollectionId(null)}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className={`sidebar-item collection-item ${selectedCollection === collection.id ? 'active' : ''}`}
                                    onClick={() => {
                                        onSelectCollection(collection.id)
                                        onSelectFolder('All Papers')
                                    }}
                                >
                                    <span
                                        className="collection-color"
                                        style={{ backgroundColor: collection.color }}
                                    />
                                    <span className="sidebar-label">{collection.name}</span>
                                    <div className="collection-actions">
                                        <button
                                            className="btn-icon-tiny"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                startEditingCollection(collection)
                                            }}
                                            title={t('sidebar.editCollection')}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        <button
                                            className="btn-icon-tiny"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeletingCollectionId(collection.id)
                                            }}
                                            title={t('sidebar.deleteCollection')}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path d="M2 2.5h8M3.5 2.5V2a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v.5M9.5 2.5v7a1 1 0 01-1 1h-5a1 1 0 01-1-1v-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </button>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="sidebar-footer">
                <div className="storage-info">
                    <div className="storage-label">
                        <span className="text-sm text-secondary">Storage</span>
                        <span className="text-xs text-tertiary">{referenceCount} references</span>
                    </div>
                    <div className="storage-bar">
                        <div
                            className="storage-progress"
                            style={{ width: `${Math.min((referenceCount / 100) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <button className="sidebar-item mt-4" onClick={onOpenSettings}>
                    <span className="sidebar-icon">⚙️</span>
                    <span className="sidebar-label">{t('settings.title')}</span>
                </button>
            </div>
        </aside>
    )
}
