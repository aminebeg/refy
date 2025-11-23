import { useState, useEffect } from 'react'
import './AddReferenceModal.css'
import { extractPDFMetadata } from '../utils/pdfMetadata'
import { savePDF } from '../utils/pdfStorage'

export default function BatchAddReferencesModal({ collections, onClose, onAddBatch, droppedFiles }) {
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
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
        collectionIds: []
    })
    const [isExtracting, setIsExtracting] = useState(false)
    const [allReferences, setAllReferences] = useState([])

    // Initialize with dropped files
    useEffect(() => {
        if (droppedFiles && droppedFiles.length > 0) {
            processFiles(droppedFiles)
        }
    }, [droppedFiles])

    const processFiles = async (files) => {
        setUploadedFiles(files)
        setCurrentIndex(0)

        // Process first file
        if (files.length > 0) {
            await extractMetadataForFile(files[0], 0)
        }
    }

    const extractMetadataForFile = async (file, index) => {
        setIsExtracting(true)

        try {
            const metadata = await extractPDFMetadata(file)

            // Prepare tags
            let tagsArray = []
            if (metadata.journalRanking) {
                tagsArray.push(metadata.journalRanking)
            }

            setFormData({
                title: metadata.title || '',
                authors: metadata.authors?.length > 0 ? metadata.authors.join(', ') : '',
                year: metadata.year || new Date().getFullYear(),
                journal: metadata.journal || '',
                type: metadata.type || 'Journal Article',
                volume: metadata.volume || '',
                issue: metadata.issue || '',
                pages: metadata.pages || '',
                publisher: metadata.publisher || '',
                doi: metadata.doi || '',
                url: metadata.url || '',
                abstract: metadata.abstract || '',
                tags: tagsArray.join(', '),
                pdfFile: file, // Store the actual file object
                collectionIds: [],
                source: metadata.source || 'PDF'
            })
        } catch (error) {
            console.error('Failed to extract PDF metadata:', error)
        } finally {
            setIsExtracting(false)
        }
    }

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            processFiles(files)
        }
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

    const handleNext = async () => {
        // Generate unique ID for this reference
        const referenceId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

        // Save PDF to IndexedDB if available
        if (formData.pdfFile) {
            try {
                await savePDF(referenceId, formData.pdfFile)
                console.log('PDF saved to IndexedDB with ID:', referenceId)
            } catch (error) {
                console.error('Failed to save PDF to IndexedDB:', error)
            }
        }

        // Save current reference
        const reference = {
            ...formData,
            id: referenceId, // Use the same ID we used for the PDF
            pdfId: formData.pdfFile ? referenceId : null, // Store PDF ID if we have a PDF
            hasPDF: !!formData.pdfFile, // Flag to indicate PDF is available
            authors: formData.authors.split(',').map(a => a.trim()).filter(Boolean),
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            year: parseInt(formData.year),
            pdfFile: undefined // Remove the file object from the reference data
        }

        setAllReferences([...allReferences, reference])

        // Move to next file
        if (currentIndex < uploadedFiles.length - 1) {
            const nextIndex = currentIndex + 1
            setCurrentIndex(nextIndex)
            extractMetadataForFile(uploadedFiles[nextIndex], nextIndex)
        } else {
            // All done, submit all references
            onAddBatch([...allReferences, reference])
            onClose()
        }
    }

    const handleSkip = () => {
        // Move to next without saving
        if (currentIndex < uploadedFiles.length - 1) {
            const nextIndex = currentIndex + 1
            setCurrentIndex(nextIndex)
            extractMetadataForFile(uploadedFiles[nextIndex], nextIndex)
        } else {
            // Submit what we have
            if (allReferences.length > 0) {
                onAddBatch(allReferences)
            }
            onClose()
        }
    }

    const handleAddAll = () => {
        if (!formData.title.trim() || !formData.authors.trim()) {
            alert('Please fill in at least the title and authors')
            return
        }
        handleNext()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-upload" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>
                            {uploadedFiles.length === 0 ? 'Upload References' :
                                uploadedFiles.length === 1 ? 'Add Reference' :
                                    `Add References (${currentIndex + 1} of ${uploadedFiles.length})`}
                        </h2>
                        <p className="modal-subtitle">
                            {uploadedFiles.length === 0 ? 'Upload one or multiple PDF files' :
                                uploadedFiles.length === 1 ? 'Review and edit the extracted metadata' :
                                    `${allReferences.length} completed, ${uploadedFiles.length - currentIndex - 1} remaining`}
                        </p>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {uploadedFiles.length === 0 ? (
                    /* Upload Zone */
                    <div className="upload-zone">
                        <input
                            type="file"
                            accept=".pdf"
                            multiple
                            onChange={handleFileUpload}
                            className="file-input"
                            id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" className="upload-zone-label">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <path d="M32 8v32m0 0l-12-12m12 12l12-12M8 48h48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <h3>Drop PDF files here or click to browse</h3>
                            <p>You can upload one or multiple PDF files at once</p>
                            <div className="upload-features">
                                <div className="upload-feature">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span>Automatic metadata extraction</span>
                                </div>
                                <div className="upload-feature">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M13 7L9 11l-2-2M2 10a8 8 0 1116 0 8 8 0 01-16 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>DOI, journal ranking & more</span>
                                </div>
                                <div className="upload-feature">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span>Complete bibliographic data</span>
                                </div>
                            </div>
                        </label>
                    </div>
                ) : (
                    /* Edit Form */
                    <form className="modal-content modal-content-compact">
                        {/* Progress indicator */}
                        {uploadedFiles.length > 1 && (
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${((currentIndex + 1) / uploadedFiles.length) * 100}%` }}
                                />
                            </div>
                        )}

                        {/* File info */}
                        <div className="current-file-info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M7 3h10l6 6v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" fill="var(--danger-500)" />
                                <path d="M17 3v6h6" stroke="var(--bg-primary)" strokeWidth="2" />
                                <text x="12" y="17" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">PDF</text>
                            </svg>
                            <div>
                                <div className="file-name">{uploadedFiles[currentIndex]?.name}</div>
                                {formData.source && (
                                    <div className="metadata-source">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <circle cx="6" cy="6" r="5" fill="var(--primary-500)" />
                                            <path d="M4 6l1.5 1.5L8 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Metadata from {formData.source}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isExtracting && (
                            <div className="extracting-banner">
                                <div className="spinner-enhanced"></div>
                                <span>Extracting metadata from PDF...</span>
                            </div>
                        )}

                        {/* Compact form fields */}
                        <div className="form-fields-compact">
                            <div className="form-group">
                                <label>Title *</label>
                                <input name="title" className="input" value={formData.title} onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label>Authors * <span className="label-hint">(comma-separated)</span></label>
                                <input name="authors" className="input" value={formData.authors} onChange={handleChange} required />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Year</label>
                                    <input name="year" type="number" className="input" value={formData.year} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select name="type" className="input" value={formData.type} onChange={handleChange}>
                                        <option>Journal Article</option>
                                        <option>Conference Paper</option>
                                        <option>Book Chapter</option>
                                        <option>Thesis</option>
                                        <option>Technical Report</option>
                                        <option>Preprint</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Journal / Conference</label>
                                <input name="journal" className="input" value={formData.journal} onChange={handleChange} />
                            </div>

                            <details className="form-details">
                                <summary>Publication Details</summary>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Volume</label>
                                        <input name="volume" className="input" value={formData.volume} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Issue</label>
                                        <input name="issue" className="input" value={formData.issue} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Pages</label>
                                        <input name="pages" className="input" value={formData.pages} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Publisher</label>
                                        <input name="publisher" className="input" value={formData.publisher} onChange={handleChange} />
                                    </div>
                                </div>
                            </details>

                            <details className="form-details">
                                <summary>Identifiers & Links</summary>
                                <div className="form-group">
                                    <label>DOI</label>
                                    <input name="doi" className="input" value={formData.doi} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>URL</label>
                                    <input name="url" type="url" className="input" value={formData.url} onChange={handleChange} />
                                </div>
                            </details>

                            <details className="form-details">
                                <summary>Abstract & Tags</summary>
                                <div className="form-group">
                                    <label>Abstract</label>
                                    <textarea name="abstract" className="input" value={formData.abstract} onChange={handleChange} rows={4} />
                                </div>
                                <div className="form-group">
                                    <label>Tags <span className="label-hint">(comma-separated)</span></label>
                                    <input name="tags" className="input" value={formData.tags} onChange={handleChange} />
                                </div>
                            </details>

                            {collections && collections.length > 0 && (
                                <details className="form-details">
                                    <summary>Collections</summary>
                                    <div className="modal-collections-list">
                                        {collections.map(collection => (
                                            <label key={collection.id} className="collection-checkbox">
                                                <input type="checkbox" checked={formData.collectionIds.includes(collection.id)} onChange={() => toggleCollection(collection.id)} />
                                                <div className="collection-checkbox-color" style={{ color: collection.color }} />
                                                <span className="collection-checkbox-label">{collection.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="modal-footer modal-footer-upload">
                    {uploadedFiles.length > 0 ? (
                        <>
                            <div className="footer-left">
                                {uploadedFiles.length > 1 && (
                                    <button type="button" className="btn btn-text" onClick={handleSkip}>
                                        Skip this one
                                    </button>
                                )}
                            </div>
                            <div className="footer-right">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleAddAll}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {uploadedFiles.length === 1 ? 'Add Reference' :
                                        currentIndex < uploadedFiles.length - 1 ? 'Next' : 'Finish'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
