import { useState, useEffect } from 'react'
import { getPDFUrl, getPDFBlob, savePDF } from '../utils/pdfStorage'
import { extractPDFMetadata } from '../utils/pdfMetadata'
import TechnicalSheet from './TechnicalSheet'

export default function ReferenceDetails({
    reference,
    collections,
    onClose,
    onUpdate,
    onDelete,
    onToggleFavorite
}) {
    const [notes, setNotes] = useState(reference.notes || '')
    const [isEditing, setIsEditing] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [pdfUrl, setPdfUrl] = useState(null)
    const [pdfFileName, setPdfFileName] = useState(null)
    const [isUploadingPdf, setIsUploadingPdf] = useState(false)
    const [isEditingDoi, setIsEditingDoi] = useState(false)
    const [editedDoi, setEditedDoi] = useState(reference.doi || '')
    const [selectedCollections, setSelectedCollections] = useState(reference.collectionIds || [])
    const [showTechnicalSheet, setShowTechnicalSheet] = useState(false)

    // Load PDF URL and filename from IndexedDB when component mounts
    useEffect(() => {
        const loadPDF = async () => {
            if (reference.pdfId || reference.hasPDF) {
                const pdfData = await getPDFBlob(reference.pdfId || reference.id)
                if (pdfData) {
                    const url = URL.createObjectURL(pdfData.blob)
                    setPdfUrl(url)
                    setPdfFileName(pdfData.name)
                }
            }
        }
        loadPDF()

        // Cleanup: revoke the blob URL when component unmounts
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
            }
        }
    }, [reference.id, reference.pdfId])

    const handleSaveNotes = () => {
        onUpdate(reference.id, { notes })
        setIsEditing(false)
    }

    const handleDelete = () => {
        onDelete(reference.id)
        onClose()
    }

    const copyBibTeX = () => {
        // Generate citation key
        const firstAuthorLastName = reference.authors[0]?.split(',')[0]?.replace(/[^a-zA-Z]/g, '') || 'Unknown';
        const citationKey = reference.citationKey || `${firstAuthorLastName}${reference.year}`;

        // Determine BibTeX entry type
        const entryTypeMap = {
            'Journal Article': 'article',
            'Conference Paper': 'inproceedings',
            'Book Chapter': 'inbook',
            'Book': 'book',
            'Thesis': 'phdthesis',
            'Technical Report': 'techreport',
            'Preprint': 'misc'
        };
        const entryType = entryTypeMap[reference.type] || 'article';

        // Build BibTeX entry
        let bibtex = `@${entryType}{${citationKey},\n`;
        bibtex += `  title={${reference.title}},\n`;

        if (reference.authors && reference.authors.length > 0) {
            bibtex += `  author={${reference.authors.join(' and ')}},\n`;
        }

        if (reference.editors && reference.editors.length > 0) {
            bibtex += `  editor={${reference.editors.join(' and ')}},\n`;
        }

        if (reference.journal) {
            bibtex += `  journal={${reference.journal}},\n`;
        }

        if (reference.year) {
            bibtex += `  year={${reference.year}},\n`;
        }

        if (reference.volume) {
            bibtex += `  volume={${reference.volume}},\n`;
        }

        if (reference.issue) {
            bibtex += `  number={${reference.issue}},\n`;
        }

        if (reference.pages) {
            bibtex += `  pages={${reference.pages}},\n`;
        }

        if (reference.doi) {
            bibtex += `  doi={${reference.doi}},\n`;
        }

        if (reference.publisher) {
            bibtex += `  publisher={${reference.publisher}},\n`;
        }

        if (reference.isbn) {
            bibtex += `  isbn={${reference.isbn}},\n`;
        }

        if (reference.issn) {
            bibtex += `  issn={${reference.issn}},\n`;
        }

        if (reference.url) {
            bibtex += `  url={${reference.url}},\n`;
        }

        if (reference.abstract) {
            // Escape special characters in abstract
            const cleanAbstract = reference.abstract.replace(/[{}]/g, '');
            bibtex += `  abstract={${cleanAbstract}},\n`;
        }

        // Remove trailing comma and newline, then close
        bibtex = bibtex.slice(0, -2) + '\n}';

        navigator.clipboard.writeText(bibtex);
        alert('BibTeX copied to clipboard!');
    }

    const copyAPA = () => {
        const authors = reference.authors.join(', ')
        const apa = `${authors} (${reference.year}). ${reference.title}. ${reference.journal || ''}.`
        navigator.clipboard.writeText(apa)
        alert('APA citation copied to clipboard!')
    }

    const handleDownloadPDF = async () => {
        if (reference.pdfId || reference.hasPDF) {
            const pdfData = await getPDFBlob(reference.pdfId || reference.id)
            if (pdfData) {
                const link = document.createElement('a')
                const url = URL.createObjectURL(pdfData.blob)
                link.href = url
                link.download = pdfData.name || `${reference.title.substring(0, 50)}.pdf`
                link.click()
                URL.revokeObjectURL(url)
            } else {
                alert('PDF file not found.')
            }
        }
    }

    const toggleCollection = (collectionId) => {
        const newCollections = selectedCollections.includes(collectionId)
            ? selectedCollections.filter(id => id !== collectionId)
            : [...selectedCollections, collectionId]

        setSelectedCollections(newCollections)
        onUpdate(reference.id, { collectionIds: newCollections })
    }

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file')
            return
        }

        setIsUploadingPdf(true)
        try {
            // Save PDF to IndexedDB
            const pdfId = reference.pdfId || reference.id
            await savePDF(pdfId, file)

            // Extract metadata and update reference if fields are empty
            const metadata = await extractPDFMetadata(file)
            const updates = {
                pdfId: pdfId,
                hasPDF: true
            }

            // Only update empty fields
            if (!reference.title && metadata.title) updates.title = metadata.title
            if ((!reference.authors || reference.authors.length === 0) && metadata.authors?.length > 0) {
                updates.authors = metadata.authors
            }
            if (!reference.year && metadata.year) updates.year = metadata.year
            if (!reference.journal && metadata.journal) updates.journal = metadata.journal
            if (!reference.abstract && metadata.abstract) updates.abstract = metadata.abstract
            if (!reference.doi && metadata.doi) updates.doi = metadata.doi
            if (metadata.journalRanking && !reference.tags?.includes(metadata.journalRanking)) {
                updates.tags = [...(reference.tags || []), metadata.journalRanking]
            }

            onUpdate(reference.id, updates)

            // Load the PDF for display
            const url = URL.createObjectURL(file)
            setPdfUrl(url)
            setPdfFileName(file.name)

            alert('PDF uploaded successfully!')
        } catch (error) {
            console.error('Error uploading PDF:', error)
            alert('Failed to upload PDF. Please try again.')
        } finally {
            setIsUploadingPdf(false)
        }
    }

    return (
        <div className="reference-details-overlay" onClick={onClose}>
            <aside className="reference-details glass" onClick={(e) => e.stopPropagation()}>
                <div className="details-header">
                    <h2>Reference Details</h2>
                    <button className="btn-icon" onClick={onClose} title="Close">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="details-content">
                    <div className="details-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowTechnicalSheet(true)}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Technical Review
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => onToggleFavorite(reference.id)}
                        >
                            {reference.favorite ? '⭐ Favorited' : '☆ Add to Favorites'}
                        </button>
                    </div>

                    <div className="details-section">
                        <h3 className="reference-title-large">{reference.title}</h3>
                        <div className="reference-meta-large">
                            <span className="badge badge-primary">{reference.type}</span>
                            <span>{reference.year}</span>
                        </div>
                    </div>

                    <div className="details-section">
                        <h4 className="section-title">Authors</h4>
                        <p className="authors-text">
                            {reference.authors.join(', ')}
                        </p>
                    </div>

                    {reference.journal && (
                        <div className="details-section">
                            <h4 className="section-title">Journal</h4>
                            <p className="journal-name">{reference.journal}</p>
                        </div>
                    )}

                    <div className="details-section">
                        <h4 className="section-title">DOI (Digital Object Identifier)</h4>
                        <div className="doi-container">
                            {isEditingDoi ? (
                                <div className="doi-edit-container">
                                    <input
                                        type="text"
                                        value={editedDoi}
                                        onChange={(e) => setEditedDoi(e.target.value)}
                                        className="doi-input"
                                        placeholder="10.xxxx/xxxxx"
                                    />
                                    <div className="doi-edit-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {
                                                onUpdate(reference.id, { doi: editedDoi });
                                                setIsEditingDoi(false);
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setEditedDoi(reference.doi || '');
                                                setIsEditingDoi(false);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {reference.doi ? (
                                        <div className="doi-display">
                                            <a
                                                href={`https://doi.org/${reference.doi}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="doi-link"
                                                title="Open DOI link"
                                            >
                                                {reference.doi}
                                            </a>
                                            <button
                                                className="btn btn-icon btn-sm"
                                                onClick={() => setIsEditingDoi(true)}
                                                title="Edit DOI"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M10 1l3 3-8 8H2v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setIsEditingDoi(true)}
                                        >
                                            Add DOI
                                        </button>
                                    )}
                                    {reference.doi && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={async () => {
                                                const { lookupDOI } = await import('../utils/doiLookup');
                                                const metadata = await lookupDOI(reference.doi);
                                                if (metadata) {
                                                    onUpdate(reference.id, {
                                                        title: metadata.title || reference.title,
                                                        authors: metadata.authors.length > 0 ? metadata.authors : reference.authors,
                                                        year: metadata.year || reference.year,
                                                        journal: metadata.journal || reference.journal,
                                                        abstract: metadata.abstract || reference.abstract,
                                                        type: metadata.type || reference.type,
                                                        volume: metadata.volume || reference.volume,
                                                        issue: metadata.issue || reference.issue,
                                                        pages: metadata.pages || reference.pages,
                                                        doi: metadata.doi || reference.doi,
                                                        publisher: metadata.publisher || reference.publisher,
                                                        isbn: metadata.isbn || reference.isbn,
                                                        issn: metadata.issn || reference.issn,
                                                        url: metadata.url || reference.url
                                                    });
                                                    alert('Metadata updated from DOI!');
                                                } else {
                                                    alert('Could not fetch metadata for this DOI');
                                                }
                                            }}
                                            title="Fetch latest metadata from CrossRef using DOI"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '4px' }}>
                                                <path d="M13.5 8a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            Lookup DOI
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* PDF Section - Always visible */}
                    <div className="details-section">
                        <h4 className="section-title">PDF Document</h4>
                        {(reference.hasPDF || reference.pdfId || pdfUrl) ? (
                            <div className="pdf-info">
                                <div className="pdf-header">
                                    <div className="pdf-icon-wrapper">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <path d="M12 6h20l8 8v26a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="var(--danger-500)" />
                                            <path d="M32 6v8h8" stroke="var(--bg-primary)" strokeWidth="2" />
                                            <text x="24" y="32" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">PDF</text>
                                        </svg>
                                    </div>
                                    <div className="pdf-filename">
                                        <div className="filename-label">Attached PDF:</div>
                                        <div className="filename-text">{pdfFileName || 'document.pdf'}</div>
                                    </div>
                                </div>
                                <div className="pdf-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
                                        disabled={!pdfUrl}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        Read PDF
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="pdf-upload-section">
                                <div className="no-pdf-message">
                                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.3">
                                        <path d="M20 12h20l12 12v28a4 4 0 01-4 4H20a4 4 0 01-4-4V16a4 4 0 014-4z" stroke="currentColor" strokeWidth="3" />
                                        <path d="M40 12v12h12" stroke="currentColor" strokeWidth="3" />
                                        <path d="M32 32v8m-4-4h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    <p>No PDF attached to this reference</p>
                                </div>
                                <input
                                    type="file"
                                    id="pdf-upload-input"
                                    accept=".pdf"
                                    onChange={handlePdfUpload}
                                    className="file-input-hidden"
                                    disabled={isUploadingPdf}
                                />
                                <label htmlFor="pdf-upload-input" className="btn btn-primary" style={{ marginTop: '12px', cursor: isUploadingPdf ? 'wait' : 'pointer' }}>
                                    {isUploadingPdf ? (
                                        <>
                                            <div className="spinner-small" style={{ marginRight: '8px' }}></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
                                                <path d="M8 10V2m0 0L5 5m3-3l3 3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            Upload PDF
                                        </>
                                    )}
                                </label>
                                <p className="text-xs text-tertiary" style={{ marginTop: '8px', textAlign: 'center' }}>Metadata will be extracted automatically</p>
                            </div>
                        )}
                    </div>

                    {reference.abstract && (
                        <div className="details-section">
                            <h4 className="section-title">Abstract</h4>
                            <p className="abstract-text">{reference.abstract}</p>
                        </div>
                    )}

                    {reference.tags && reference.tags.length > 0 && (
                        <div className="details-section">
                            <h4 className="section-title">Tags</h4>
                            <div className="tags-list">
                                {reference.tags.map((tag, index) => (
                                    <span key={index} className="tag-large">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {collections && collections.length > 0 && (
                        <div className="details-section">
                            <h4 className="section-title">Collections</h4>
                            <div className="collections-list">
                                {collections.map(collection => (
                                    <label key={collection.id} className="collection-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedCollections.includes(collection.id)}
                                            onChange={() => toggleCollection(collection.id)}
                                        />
                                        <span
                                            className="collection-checkbox-color"
                                            style={{ backgroundColor: collection.color }}
                                        />
                                        <span className="collection-checkbox-label">{collection.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="details-section">
                        <div className="section-header">
                            <h4 className="section-title">Notes</h4>
                            {!isEditing && (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="notes-editor">
                                <textarea
                                    className="notes-textarea"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add your notes here..."
                                    rows={6}
                                />
                                <div className="notes-actions">
                                    <button className="btn btn-primary" onClick={handleSaveNotes}>
                                        Save Notes
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setNotes(reference.notes || '')
                                            setIsEditing(false)
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="notes-display">
                                {notes || 'No notes yet. Click Edit to add notes.'}
                            </p>
                        )}
                    </div>

                    <div className="details-section">
                        <h4 className="section-title">Export Citation</h4>
                        <div className="export-buttons">
                            <button className="btn btn-secondary" onClick={copyBibTeX}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <rect x="4" y="2" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Copy BibTeX
                            </button>
                            <button className="btn btn-secondary" onClick={copyAPA}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <rect x="4" y="2" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Copy APA
                            </button>
                        </div>
                    </div>

                    <div className="details-section">
                        <h4 className="section-title text-danger">Danger Zone</h4>
                        {!showDeleteConfirm ? (
                            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M2 3h12M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1M13 3v10a2 2 0 01-2 2H5a2 2 0 01-2-2V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Delete Reference
                            </button>
                        ) : (
                            <div className="delete-confirm">
                                <p className="text-sm mb-2">Are you sure? This cannot be undone.</p>
                                <div className="flex gap-2">
                                    <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                                        Yes, Delete
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            {showTechnicalSheet && (
                <TechnicalSheet
                    reference={reference}
                    onClose={() => setShowTechnicalSheet(false)}
                    onSave={onUpdate}
                />
            )}
        </div>
    )
}
