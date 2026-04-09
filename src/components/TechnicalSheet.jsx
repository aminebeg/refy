import { useState } from 'react'
import { extractPDFText } from '../utils/pdfTextExtractor'
import { analyzePaperWithOllama, checkOllamaStatus } from '../utils/ollamaService'
import { getPDFBlob } from '../utils/pdfStorage'

export default function TechnicalSheet({ reference, onClose, onSave }) {
    const [review, setReview] = useState({
        summary: '',
        researchQuestion: '',
        methodology: '',
        dataset: '',
        metrics: '',
        keyFindings: '',
        majorResults: '',
        comparison: '',
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

    const handleAutoFill = async () => {
        const model = localStorage.getItem('ollama_model') || 'deepseek'
        const ollamaAvailable = await checkOllamaStatus(model)
        if (!ollamaAvailable) {
            alert(`Ollama is not running with the ${model} model. Please start Ollama or change the model in Settings.`)
            return
        }

        if (!reference.pdfId && !reference.hasPDF) {
            alert("No PDF attached to this reference. Please upload a PDF first.")
            return
        }

        setIsAIAssisting(true)
        setStatusMessage('Extracting text from PDF...')

        try {
            const pdfId = reference.pdfId || reference.id
            const pdfData = await getPDFBlob(pdfId)

            if (!pdfData || !pdfData.blob) {
                throw new Error("Could not load PDF file. Please ensure the PDF is saved correctly.")
            }
            const pdfBlob = pdfData.blob
            setStatusMessage('Reading PDF text...')
            const text = await extractPDFText(pdfBlob)

            if (!text || text.length < 100) {
                throw new Error("Could not extract enough text from the PDF. It might be an image-only PDF.")
            }
            setStatusMessage('AI is thinking... this may take a minute.')
            
            const analysis = await analyzePaperWithOllama(text, model)

            if (!analysis || Object.keys(analysis).length === 0) {
                throw new Error("AI analysis returned no results.")
            }

            setStatusMessage('Done!')
            setReview(prev => ({
                ...prev,
                ...analysis
            }))

            setStatusMessage('Success!')
            setTimeout(() => setStatusMessage(''), 3000)

        } catch (error) {
            console.error('Auto-fill error:', error)
            setStatusMessage(`❌ Error: ${error.message}`)
            alert(`Auto-fill failed: ${error.message}`)
        } finally {
            setIsAIAssisting(false)
        }
    }

    return (
        <div className="technical-sheet-overlay" onClick={onClose}>
            <div className="technical-sheet-modal premium-sheet fullsize-modal" onClick={(e) => e.stopPropagation()}>
                <div className="technical-sheet-header-refined">
                    <div className="header-brand">
                        <div className="ai-status-indicator">
                            <span className="pulse-dot"></span>
                            TechSheet AI
                        </div>
                    </div>
                    <div className="header-actions">
                        {statusMessage && <span className="status-msg-fade">{statusMessage}</span>}
                        <button 
                            className="btn-auto-fill-sleek" 
                            onClick={handleAutoFill}
                            disabled={isAIAssisting}
                        >
                            {isAIAssisting ? '⏳ Analyzing...' : '✨ Auto-Fill Report'}
                        </button>
                        <div className="divider-v"></div>
                        <button className="btn-save-minimal" onClick={handleSave}>Save</button>
                        <button className="btn-close-minimal" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="technical-sheet-content center-focused">
                    {review.fullMarkdown || (review.personalNotes && review.personalNotes.startsWith('# Technical Sheet')) ? (
                        <div className="academic-document-card">
                             <div className="document-actions-top">
                                <button 
                                    className="btn-copy-report"
                                    onClick={() => {
                                        navigator.clipboard.writeText(review.fullMarkdown || review.personalNotes)
                                        setStatusMessage('✓ Copied')
                                        setTimeout(() => setStatusMessage(''), 2000)
                                    }}
                                >
                                    Copy Report
                                </button>
                            </div>
                            <div className="document-body">
                                {(review.fullMarkdown || review.personalNotes).split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) return <h1 key={i} className="doc-title">{line.replace('# ', '')}</h1>
                                    if (line.startsWith('## ')) return <h2 key={i} className="doc-section-head">{line.replace('## ', '')}</h2>
                                    if (line.startsWith('**Authors:**')) return <p key={i} className="doc-meta"><strong>Authors:</strong> {line.replace('**Authors:**', '').replace(/\*\*/g, '')}</p>
                                    if (line.includes('**Venue')) return <p key={i} className="doc-meta"><strong>Venue & Year:</strong> {line.split(':')[1]?.replace(/\*\*/g, '')}</p>
                                    if (line.startsWith('**Date:')) return <p key={i} className="doc-meta"><strong>Date:</strong> {line.replace('**Date:', '')}</p>
                                    if (line.startsWith('- ')) return <li key={i} className="doc-list-item">{line.replace('- ', '')}</li>
                                    if (line.trim() === '---') return <hr key={i} className="doc-separator" />
                                    if (line.trim() === '') return <div key={i} className="doc-spacer" />
                                    return <p key={i} className="doc-paragraph">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-analysis-welcome">
                            <div className="welcome-inner">
                                <div className="ai-orb"></div>
                                <h2>Research Insight Ready</h2>
                                <p>Generate a structured, PhD-level analysis of this paper in one click.</p>
                                <button 
                                    className="btn-generate-hero"
                                    disabled={isAIAssisting}
                                    onClick={handleAutoFill}
                                >
                                    {isAIAssisting ? 'TechSheet AI is analyzing...' : 'Generate Technical Sheet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
