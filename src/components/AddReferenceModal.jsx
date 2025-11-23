import { useState, useEffect } from 'react'
import { extractPDFMetadata } from '../utils/pdfMetadata'

export default function AddReferenceModal({ collections, onClose, onAdd, droppedFiles, currentFileIndex }) {
    const [formData, setFormData] = useState({
        title: '',
        authors: '',
        year: new Date().getFullYear(),
        journal: '',
        type: 'Journal Article',
        volume: '',
        issue: '',
        pages: '',
        publisher: '',
        doi: '',
        url: '',
        abstract: '',
        tags: '',
        pdf: null,
        collectionIds: []
    })
    const [pdfFileName, setPdfFileName] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        publication: true,
        identifiers: false,
        content: false,
        organization: false
    })

    // When a new file is selected (by index), reset form
    useEffect(() => {
        setFormData({
            title: '',
            authors: '',
            year: new Date().getFullYear(),
            journal: '',
            type: 'Journal Article',
            volume: '',
            issue: '',
            pages: '',
            publisher: '',
            doi: '',
            url: '',
            abstract: '',
            tags: '',
            pdf: null,
            collectionIds: []
        })
        setPdfFileName('')
        setIsExtracting(false)
    }, [currentFileIndex])

    // Process the current dropped file
    useEffect(() => {
        if (droppedFiles && droppedFiles.length > 0) {
            const file = droppedFiles[currentFileIndex]
            if (file) {
                console.log('Processing dropped file:', file.name)
                handleFileChange({ target: { files: [file] } })
            }
        }
    }, [droppedFiles, currentFileIndex])

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (file && file.type === 'application/pdf') {
            setIsExtracting(true)
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, pdf: reader.result }))
                setPdfFileName(file.name)
            }
            reader.readAsDataURL(file)
            try {
                const metadata = await extractPDFMetadata(file)
                setFormData(prev => ({
                    ...prev,
                    title: prev.title || metadata.title || '',
                    authors: prev.authors || (metadata.authors?.length > 0 ? metadata.authors.join(', ') : ''),
                    year: prev.year === new Date().getFullYear() ? metadata.year : prev.year,
                    journal: prev.journal || metadata.journal || '',
                    volume: prev.volume || metadata.volume || '',
                    issue: prev.issue || metadata.issue || '',
                    pages: prev.pages || metadata.pages || '',
                    publisher: prev.publisher || metadata.publisher || '',
                    doi: prev.doi || metadata.doi || '',
                    url: prev.url || metadata.url || '',
                    abstract: prev.abstract || metadata.abstract || '',
                    tags: prev.tags || (metadata.journalRanking ? metadata.journalRanking : '')
                }))
                console.log('Extracted metadata:', metadata)
            } catch (error) {
                console.error('Failed to extract PDF metadata:', error)
            } finally {
                setIsExtracting(false)
            }
        } else if (file) {
            alert('Please select a PDF file')
            e.target.value = ''
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.title.trim() || !formData.authors.trim()) {
            alert('Please fill in at least the title and authors')
            return
        }
        const reference = {
            ...formData,
            authors: formData.authors.split(',').map(a => a.trim()).filter(Boolean),
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            year: parseInt(formData.year)
        }
        onAdd(reference)
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const toggleCollection = (collectionId) => {
        const newCollections = formData.collectionIds.includes(collectionId)
            ? formData.collectionIds.filter(id => id !== collectionId)
            : [...formData.collectionIds, collectionId]
        setFormData({ ...formData, collectionIds: newCollections })
    }

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-enhanced" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Add New Reference</h2>
                        <p className="modal-subtitle">Fill in the details below or upload a PDF for automatic extraction</p>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-content modal-content-enhanced">
                    {/* PDF Upload Section - Always visible */}
                    <div className="upload-section">
                        <label className="upload-label">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 3v10m0 0l-3-3m3 3l3-3M4 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Upload PDF for Auto-Fill
                        </label>
                        <div className="file-input-wrapper-enhanced">
                            <input id="pdf" type="file" accept=".pdf" onChange={handleFileChange} className="file-input" />
                            <label htmlFor="pdf" className="file-input-label-enhanced">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 18V15M7 15V12M7 15H10M7 15H4M17 18V16M17 16V14M17 16H20M17 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8h18" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <div>
                                    <span className="file-label-text">{pdfFileName || 'Drop PDF here or click to browse'}</span>
                                    {!pdfFileName && <span className="file-label-hint">Metadata will be extracted automatically</span>}
                                </div>
                            </label>
                        </div>
                        {isExtracting && (
                            <div className="extracting-indicator-enhanced">
                                <div className="spinner-enhanced"></div>
                                <span>Extracting metadata from PDF...</span>
                            </div>
                        )}
                        {pdfFileName && !isExtracting && (
                            <div className="file-selected-enhanced">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {pdfFileName}
                            </div>
                        )}
                    </div>

                    {/* Basic Information - Collapsible */}
                    <div className="form-section">
                        <button type="button" className="section-header" onClick={() => toggleSection('basic')}>
                            <div className="section-header-content">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>Basic Information</span>
                                <span className="required-badge">Required</span>
                            </div>
                            <svg className={`chevron ${expandedSections.basic ? 'expanded' : ''} `} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {expandedSections.basic && (
                            <div className="section-content">
                                <div className="form-group">
                                    <label htmlFor="title">Title *</label>
                                    <input id="title" name="title" type="text" className="input" value={formData.title} onChange={handleChange} placeholder="Enter the paper title" required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="authors">Authors * <span className="label-hint">(comma-separated)</span></label>
                                    <input id="authors" name="authors" type="text" className="input" value={formData.authors} onChange={handleChange} placeholder="Smith, J., Johnson, A." required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="year">Year</label>
                                        <input id="year" name="year" type="number" className="input" value={formData.year} onChange={handleChange} min="1900" max={new Date().getFullYear() + 5} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="type">Type</label>
                                        <select id="type" name="type" className="input" value={formData.type} onChange={handleChange}>
                                            <option>Journal Article</option>
                                            <option>Conference Paper</option>
                                            <option>Book Chapter</option>
                                            <option>Thesis</option>
                                            <option>Technical Report</option>
                                            <option>Preprint</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Publication Details - Collapsible */}
                    <div className="form-section">
                        <button type="button" className="section-header" onClick={() => toggleSection('publication')}>
                            <div className="section-header-content">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M6 2v16M14 2v16M6 2h8M6 18h8M2 6h16M2 10h16M2 14h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>Publication Details</span>
                            </div>
                            <svg className={`chevron ${expandedSections.publication ? 'expanded' : ''} `} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {expandedSections.publication && (
                            <div className="section-content">
                                <div className="form-group">
                                    <label htmlFor="journal">Journal / Conference</label>
                                    <input id="journal" name="journal" type="text" className="input" value={formData.journal} onChange={handleChange} placeholder="e.g., Nature, ICML 2023" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="volume">Volume</label>
                                        <input id="volume" name="volume" type="text" className="input" value={formData.volume} onChange={handleChange} placeholder="25" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="issue">Issue</label>
                                        <input id="issue" name="issue" type="text" className="input" value={formData.issue} onChange={handleChange} placeholder="3" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="pages">Pages</label>
                                        <input id="pages" name="pages" type="text" className="input" value={formData.pages} onChange={handleChange} placeholder="123-145" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="publisher">Publisher</label>
                                        <input id="publisher" name="publisher" type="text" className="input" value={formData.publisher} onChange={handleChange} placeholder="Springer" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Identifiers - Collapsible */}
                    <div className="form-section">
                        <button type="button" className="section-header" onClick={() => toggleSection('identifiers')}>
                            <div className="section-header-content">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>Identifiers & Links</span>
                            </div>
                            <svg className={`chevron ${expandedSections.identifiers ? 'expanded' : ''} `} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {expandedSections.identifiers && (
                            <div className="section-content">
                                <div className="form-group">
                                    <label htmlFor="doi">DOI <span className="label-hint">(Digital Object Identifier)</span></label>
                                    <input id="doi" name="doi" type="text" className="input" value={formData.doi} onChange={handleChange} placeholder="10.1234/example.2023.5678" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="url">URL</label>
                                    <input id="url" name="url" type="url" className="input" value={formData.url} onChange={handleChange} placeholder="https://..." />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content - Collapsible */}
                    <div className="form-section">
                        <button type="button" className="section-header" onClick={() => toggleSection('content')}>
                            <div className="section-header-content">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h0a2 2 0 002-2M9 5a2 2 0 012-2h0a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span>Abstract & Tags</span>
                            </div>
                            <svg className={`chevron ${expandedSections.content ? 'expanded' : ''} `} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {expandedSections.content && (
                            <div className="section-content">
                                <div className="form-group">
                                    <label htmlFor="abstract">Abstract</label>
                                    <textarea id="abstract" name="abstract" className="input" value={formData.abstract} onChange={handleChange} placeholder="Enter the abstract..." rows={5} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="tags">Tags <span className="label-hint">(comma-separated)</span></label>
                                    <input id="tags" name="tags" type="text" className="input" value={formData.tags} onChange={handleChange} placeholder="Machine Learning, NLP, Deep Learning" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collections - Collapsible */}
                    {collections && collections.length > 0 && (
                        <div className="form-section">
                            <button type="button" className="section-header" onClick={() => toggleSection('organization')}>
                                <div className="section-header-content">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M3 7h14M3 7l2-5h10l2 5M3 7v10a2 2 0 002 2h10a2 2 0 002-2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span>Collections</span>
                                </div>
                                <svg className={`chevron ${expandedSections.organization ? 'expanded' : ''} `} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {expandedSections.organization && (
                                <div className="section-content">
                                    <div className="modal-collections-list">
                                        {collections.map(collection => (
                                            <label key={collection.id} className="collection-checkbox">
                                                <input type="checkbox" checked={formData.collectionIds.includes(collection.id)} onChange={() => toggleCollection(collection.id)} />
                                                <div className="collection-checkbox-color" style={{ color: collection.color }} />
                                                <span className="collection-checkbox-label">{collection.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </form>

                <div className="modal-footer modal-footer-enhanced">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add Reference
                    </button>
                </div>
            </div>
        </div>
    )
}
