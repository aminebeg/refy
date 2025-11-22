import { useState, useEffect } from 'react'
import './TechnicalSheet.css'

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

    const handleSave = () => {
        onSave(reference.id, { technicalReview: review })
        onClose()
    }

    const handleFieldChange = (field, value) => {
        setReview(prev => ({ ...prev, [field]: value }))
    }

    const handleAIAssist = async (field) => {
        setIsAIAssisting(true)
        // Placeholder for AI integration
        // You can integrate with OpenAI API or other AI services here
        alert('AI assistance will be integrated here. This will analyze the PDF and help fill in the review fields.')
        setIsAIAssisting(false)
    }

    const ratingStars = [1, 2, 3, 4, 5]

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
                        <button className="btn btn-secondary" onClick={handleSave}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13 2l-8 8-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Save Review
                        </button>
                        <button className="btn-icon" onClick={onClose} title="Close">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="technical-sheet-content">
                    <div className="review-grid">
                        {/* Rating - Top Priority */}
                        <div className="review-section rating-section">
                            <h3 className="review-section-title">Overall Rating</h3>
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
                            <div className="rating-text">
                                {review.rating > 0 ?
                                    ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][review.rating - 1]
                                    : 'Rate this paper'}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">
                                    <span style={{ marginRight: '8px' }}>📝</span> Summary
                                </h3>
                                <button
                                    className="btn-ai-assist"
                                    onClick={() => handleAIAssist('summary')}
                                    disabled={isAIAssisting}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                                    </svg>
                                    AI Assist
                                </button>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Brief overview of the paper..."
                                value={review.summary}
                                onChange={(e) => handleFieldChange('summary', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Research Question */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">
                                    <span style={{ marginRight: '8px' }}>❓</span> Research Question
                                </h3>
                                <button
                                    className="btn-ai-assist"
                                    onClick={() => handleAIAssist('researchQuestion')}
                                    disabled={isAIAssisting}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                                    </svg>
                                    AI Assist
                                </button>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="What problem does this paper address?"
                                value={review.researchQuestion}
                                onChange={(e) => handleFieldChange('researchQuestion', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Methodology */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">
                                    <span style={{ marginRight: '8px' }}>🔬</span> Methodology
                                </h3>
                                <button
                                    className="btn-ai-assist"
                                    onClick={() => handleAIAssist('methodology')}
                                    disabled={isAIAssisting}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                                    </svg>
                                    AI Assist
                                </button>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Methods, approaches, and techniques used..."
                                value={review.methodology}
                                onChange={(e) => handleFieldChange('methodology', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Key Findings */}
                        <div className="review-section">
                            <div className="section-header-with-ai">
                                <h3 className="review-section-title">
                                    <span style={{ marginRight: '8px' }}>💡</span> Key Findings
                                </h3>
                                <button
                                    className="btn-ai-assist"
                                    onClick={() => handleAIAssist('keyFindings')}
                                    disabled={isAIAssisting}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                                    </svg>
                                    AI Assist
                                </button>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Main results and discoveries..."
                                value={review.keyFindings}
                                onChange={(e) => handleFieldChange('keyFindings', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Strengths */}
                        <div className="review-section">
                            <h3 className="review-section-title">
                                <span style={{ marginRight: '8px' }}>✅</span> Strengths
                            </h3>
                            <textarea
                                className="review-textarea"
                                placeholder="What are the strong points of this paper?"
                                value={review.strengths}
                                onChange={(e) => handleFieldChange('strengths', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Weaknesses */}
                        <div className="review-section">
                            <h3 className="review-section-title">
                                <span style={{ marginRight: '8px' }}>⚠️</span> Weaknesses
                            </h3>
                            <textarea
                                className="review-textarea"
                                placeholder="What are the limitations or weak points?"
                                value={review.weaknesses}
                                onChange={(e) => handleFieldChange('weaknesses', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Contributions */}
                        <div className="review-section">
                            <h3 className="review-section-title">
                                <span style={{ marginRight: '8px' }}>🌟</span> Contributions
                            </h3>
                            <textarea
                                className="review-textarea"
                                placeholder="How does this advance the field?"
                                value={review.contributions}
                                onChange={(e) => handleFieldChange('contributions', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Future Work */}
                        <div className="review-section">
                            <h3 className="review-section-title">
                                <span style={{ marginRight: '8px' }}>🚀</span> Future Work
                            </h3>
                            <textarea
                                className="review-textarea"
                                placeholder="Potential directions for future research..."
                                value={review.futureWork}
                                onChange={(e) => handleFieldChange('futureWork', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Personal Notes */}
                        <div className="review-section">
                            <h3 className="review-section-title">
                                <span style={{ marginRight: '8px' }}>💭</span> Personal Notes
                            </h3>
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

                {/* Footer */}
                <div className="technical-sheet-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13 2l-8 8-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Save Review
                    </button>
                </div>
            </div>
        </div>
    )
}
