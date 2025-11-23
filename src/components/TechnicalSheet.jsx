import { useState } from 'react'
import { extractPDFText } from '../utils/pdfTextExtractor'
import { analyzePaperWithCerebras } from '../utils/cerebrasService'
import { getPDFBlob } from '../utils/pdfStorage'

export default function TechnicalSheet({ reference, onClose, onSave }) {
    const [review, setReview] = useState({
        summary: '',
        researchQuestion: '',
        methodology: '',
        keyFindings: '',
        strengths: '',
        weaknesses: '',
        contributions: '',
        futureWork: '',
        personalNotes: '',
        rating: 0,
        ...reference.technicalReview
    })

    const [isAIAssisting, setIsAIAssisting] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')

    const handleSave = () => {
        onSave(reference.id, { technicalReview: review })
        onClose()
    }

    const handleFieldChange = (field, value) => {
        setReview(prev => ({ ...prev, [field]: value }))
    }

    const handleAutoFill = async () => {
        const rawApiKey = localStorage.getItem('cerebras_api_key')
        const apiKey = rawApiKey ? rawApiKey.trim() : null

        if (!apiKey) {
            alert("Please set your Cerebras API Key in Settings (gear icon in sidebar) to use AI features.")
            return
        }

        if (!reference.pdfId && !reference.hasPDF) {
            alert("No PDF attached to this reference. Please upload a PDF first.")
            return
        }

        setIsAIAssisting(true)
        setStatusMessage('Extracting text from PDF...')

        try {
            // 1. Get PDF Blob
            const pdfId = reference.pdfId || reference.id
            console.log('Fetching PDF blob for ID:', pdfId)
            const pdfData = await getPDFBlob(pdfId)

            if (!pdfData || !pdfData.blob) {
                console.error("PDF Blob not found in storage")
                throw new Error("Could not load PDF file. Please ensure the PDF is saved correctly.")
            }
            const pdfBlob = pdfData.blob
            console.log("PDF Blob retrieved, size:", pdfBlob.size)
            setStatusMessage('Reading PDF text...')
            const text = await extractPDFText(pdfBlob)
            console.log("Extracted text length:", text?.length)

            if (!text || text.length < 100) {
                throw new Error("Could not extract enough text from the PDF. It might be an image-only PDF.")
            }
            setStatusMessage(`Analyzed ${text.length} chars. Sending to Cerebras AI...`)

            // 3. Analyze with Cerebras
            const analysis = await analyzePaperWithCerebras(text, apiKey)

            // 4. Update State
            setReview(prev => ({
                ...prev,
                ...analysis
            }))

            setStatusMessage('Success! Review updated.')
            setTimeout(() => setStatusMessage(''), 3000)

        } catch (error) {
            console.error('Auto-fill error:', error)
            setStatusMessage(`❌ ${error.message}`)
        } finally {
            setIsAIAssisting(false)
        }
    }

    const ratingStars = [1, 2, 3, 4, 5]
    const hasApiKey = !!localStorage.getItem('cerebras_api_key')

    return (
        <div className="technical-sheet-overlay" onClick={onClose}>
            <div className="technical-sheet-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="technical-sheet-header">
                    <div className="header-content">
                        <h1 className="sheet-title">Technical Review Sheet</h1>
                        <p className="reference-title-small">{reference.title}</p>
                    </div>
                    <div className="header-actions">
                        <button
                            className={`btn-auto-fill ${isAIAssisting ? 'loading' : ''}`}
                            onClick={handleAutoFill}
                            disabled={isAIAssisting}
                            title={!hasApiKey ? "Set API Key in Settings first" : "Auto-fill review using Cerebras AI"}
                        >
                            {isAIAssisting ? (
                                <>
                                    <span className="spinner"></span>
                                    <span style={{ fontSize: '0.8125rem' }}>{statusMessage}</span>
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                        <path d="M12 2a10 10 0 0 1 10 10" opacity="0.5" />
                                    </svg>
                                    ✨ Auto-Fill
                                </>
                            )}
                        </button>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13 2l-8 8-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Save
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="technical-sheet-content">
                    <div className="review-grid">
                        {/* Rating - Inline */}
                        <div className="review-section rating-section">
                            <div className="rating-content">
                                <h3 className="review-section-title">📊 Overall Rating</h3>
                                <div className="rating-stars">
                                    {ratingStars.map(star => (
                                        <button
                                            key={star}
                                            className={`star-btn ${star <= review.rating ? 'active' : ''}`}
                                            onClick={() => handleFieldChange('rating', star)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="rating-text">
                                {review.rating > 0 ?
                                    ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][review.rating - 1]
                                    : 'Click to rate'}
                            </div>
                        </div>

                        {/* Summary - Full Width */}
                        <div className="review-section full-width">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">📝 Summary</h3>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Brief overview of the paper..."
                                value={review.summary}
                                onChange={(e) => handleFieldChange('summary', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Research Question - Left Column */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">❓ Research Question</h3>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="What problem does this paper address?"
                                value={review.researchQuestion}
                                onChange={(e) => handleFieldChange('researchQuestion', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Methodology - Right Column */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">🔬 Methodology</h3>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Methods, approaches, and techniques used..."
                                value={review.methodology}
                                onChange={(e) => handleFieldChange('methodology', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Key Findings - Left Column */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">💡 Key Findings</h3>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Main results and discoveries..."
                                value={review.keyFindings}
                                onChange={(e) => handleFieldChange('keyFindings', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Contributions - Right Column */}
                        <div className="review-section">
                            <h3 className="review-section-title">🌟 Contributions</h3>
                            <textarea
                                className="review-textarea"
                                placeholder="How does this advance the field?"
                                value={review.contributions}
                                onChange={(e) => handleFieldChange('contributions', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Strengths - Left Column */}
                        <div className="review-section">
                            <h3 className="review-section-title">✅ Strengths</h3>
                            <textarea
                                className="review-textarea"
                                placeholder="What are the strong points of this paper?"
                                value={review.strengths}
                                onChange={(e) => handleFieldChange('strengths', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Weaknesses - Right Column */}
                        <div className="review-section">
                            <h3 className="review-section-title">⚠️ Weaknesses</h3>
                            <textarea
                                className="review-textarea"
                                placeholder="What are the limitations or weak points?"
                                value={review.weaknesses}
                                onChange={(e) => handleFieldChange('weaknesses', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Future Work - Left Column */}
                        <div className="review-section">
                            <h3 className="review-section-title">🚀 Future Work</h3>
                            <textarea
                                className="review-textarea"
                                placeholder="Potential directions for future research..."
                                value={review.futureWork}
                                onChange={(e) => handleFieldChange('futureWork', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Personal Notes - Right Column */}
                        <div className="review-section">
                            <h3 className="review-section-title">💭 Personal Notes</h3>
                            <textarea
                                className="review-textarea"
                                placeholder="Your thoughts, questions, ideas for your own work..."
                                value={review.personalNotes}
                                onChange={(e) => handleFieldChange('personalNotes', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
