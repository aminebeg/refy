import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { extractPDFMetadata } from '../utils/pdfMetadata'
import '../novelty-evaluator.css'

export default function NoveltyEvaluator() {
    const { t } = useTranslation()
    const [inputType, setInputType] = useState('text') // 'text', 'pdf', 'code'
    const [inputContent, setInputContent] = useState('')
    const [pdfFile, setPdfFile] = useState(null)
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluation, setEvaluation] = useState(null)
    const [error, setError] = useState(null)
    const [isDragging, setIsDragging] = useState(false)

    const EVALUATION_PROMPT = `You are an extremely strict editor at a top-tier Q1 journal (Nature, Science, Nature Materials, Nature Machine Intelligence, Science Advances, PNAS, JACS, IEEE TPAMI, etc.) in 2025. 
Your desk-reject rate for "lack of novelty / insufficient advance / limited conceptual impact" is 90–95 %. 
You have seen thousands of manuscripts and rejection letters. 
Your job is to assess whether the submitted work clears the novelty and impact threshold for such journals — nothing less.

The four acceptable types of novelty (one is enough if executed brilliantly):
1. New problem/setting that the field must now care about
2. New conceptual idea/principle (not just another module/loss/ablation)
3. New deep evidence/understanding that rewrites what we thought was settled
4. New resource/benchmark/dataset/tool that immediately changes how the community works

Everything else ("we beat SOTA by 2.3 %", "U-Net with new skip connections", "we combined X and Y", "larger model on same data") is almost always rejected as incremental.

Evaluate the paper/abstract below with maximum harshness and answer in the following structured format. 
Do not sugar-coat anything.

=== PAPER / ABSTRACT STARTS HERE ===
{CONTENT}
=== PAPER / ABSTRACT ENDS HERE ===

Now answer EXACTLY in this template:

1. Primary novelty axis claimed by the authors (problem / idea / understanding / resource / none clear):
2. Is the claimed advance truly new in 2023–2025 literature? (Yes / Borderline / No — similar work already exists)
3. Is it surprising/interesting to scientists two sub-fields away? (Yes / Only to direct competitors / No)
4. After this paper exists, is the field meaningfully different? (Yes — specify how / Only marginally / No)
5. Red-flag incremental patterns detected (check all that apply):
   - Yet another architecture tweak / variant
   - Story framed as "+X % on standard benchmark"
   - Novelty buried deep in the paper
   - No column in comparison table that only this method ticks
   - Real gap not clearly articulated in intro/abstract
   - Problem only matters to <500 people and not justified broader
   - Other: ____
6. "Wow" figure or result that would make an editor stop scrolling and send to review? (Yes — describe it / No)
7. Honest predicted outcome at a 2025 top journal:
   - Clear accept / strong chance after minor revision
   - Likely major revision or reject with encouragement to resubmit
   - Almost certain desk-reject for insufficient novelty/impact
   - 100 % instant desk-reject
8. One-sentence editor rejection quote the authors are most likely to receive:
9. Brutal but actionable 3-bullet prescription to make this genuinely novel and competitive (or "lower the target journal to Q1 sub-field level instead" if unsalvageable):

Proceed.`

    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (file) {
            await processFile(file)
        }
        e.target.value = '' // Reset input
    }

    const processFile = async (file) => {
        if (file.type === 'application/pdf') {
            setPdfFile(file)
            setInputType('pdf')
            try {
                const metadata = await extractPDFMetadata(file)
                const content = `Title: ${metadata.title || 'Unknown'}
Authors: ${metadata.authors?.join(', ') || 'Unknown'}
Year: ${metadata.year || 'Unknown'}
Abstract: ${metadata.abstract || 'No abstract available'}`
                setInputContent(content)
            } catch (err) {
                console.error('Failed to extract PDF metadata:', err)
                setError('Failed to extract text from PDF. Please try pasting the text manually.')
            }
        } else if (file.type.startsWith('text/') || file.name.endsWith('.py') || file.name.endsWith('.js') || file.name.endsWith('.java')) {
            setInputType('code')
            const text = await file.text()
            setInputContent(text)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            await processFile(file)
        }
    }

    const handleEvaluate = async () => {
        if (!inputContent.trim()) {
            setError(t('noveltyEvaluator.provideContent'))
            return
        }

        const cerebrasKey = localStorage.getItem('cerebras_api_key')
        const geminiKey = localStorage.getItem('gemini_api_key')

        if (!cerebrasKey && !geminiKey) {
            setError(t('noveltyEvaluator.configureApiKey'))
            return
        }

        setIsEvaluating(true)
        setError(null)
        setEvaluation(null)

        try {
            const prompt = EVALUATION_PROMPT.replace('{CONTENT}', inputContent)

            let evaluationText = null

            // Try Cerebras first if key is available
            if (cerebrasKey && cerebrasKey.trim()) {
                const cerebrasModels = ['llama-3.3-70b', 'llama3.1-8b']

                for (const model of cerebrasModels) {
                    try {
                        console.log(`Trying Cerebras model: ${model}`)
                        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${cerebrasKey.trim()}`
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [
                                    {
                                        role: 'user',
                                        content: prompt
                                    }
                                ],
                                temperature: 0.3,
                                max_tokens: 2000
                            })
                        })

                        if (response.ok) {
                            const data = await response.json()
                            evaluationText = data.choices?.[0]?.message?.content
                            if (evaluationText) {
                                console.log(`✅ Success with Cerebras model: ${model}`)
                                break
                            }
                        } else if (response.status === 401) {
                            throw new Error('Invalid Cerebras API key')
                        }
                    } catch (err) {
                        console.warn(`Cerebras model ${model} failed:`, err.message)
                        if (err.message.includes('Invalid')) throw err
                    }
                }
            }

            // If Cerebras failed or not available, try Gemini
            if (!evaluationText && geminiKey && geminiKey.trim()) {
                try {
                    console.log('Trying Gemini API...')
                    const { GoogleGenerativeAI } = await import('@google/generative-ai')
                    const genAI = new GoogleGenerativeAI(geminiKey.trim())
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

                    const result = await model.generateContent(prompt)
                    evaluationText = result.response.text()
                    console.log('✅ Success with Gemini')
                } catch (err) {
                    console.error('Gemini failed:', err)
                    throw new Error(`Gemini API error: ${err.message}`)
                }
            }

            if (!evaluationText) {
                throw new Error('No evaluation returned from API. Please check your API keys.')
            }

            setEvaluation(evaluationText)
        } catch (err) {
            console.error('Evaluation error:', err)
            setError(err.message || 'Failed to evaluate. Please try again.')
        } finally {
            setIsEvaluating(false)
        }
    }

    const handleClear = () => {
        setInputContent('')
        setPdfFile(null)
        setEvaluation(null)
        setError(null)
    }

    return (
        <div className="novelty-evaluator">
            <div className="evaluator-header">
                <div className="evaluator-title-section">
                    <h1 className="evaluator-title">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path d="M14 2L16.5 11.5L26 14L16.5 16.5L14 26L11.5 16.5L2 14L11.5 11.5L14 2Z" fill="url(#sparkle-grad)" stroke="currentColor" strokeWidth="1.5" />
                            <defs>
                                <linearGradient id="sparkle-grad" x1="2" y1="2" x2="26" y2="26">
                                    <stop offset="0%" stopColor="rgba(236, 72, 153, 0.8)" />
                                    <stop offset="100%" stopColor="rgba(99, 102, 241, 0.8)" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {t('noveltyEvaluator.title')}
                    </h1>
                    <p className="evaluator-subtitle">
                        {t('noveltyEvaluator.subtitle')}
                    </p>
                </div>

                <div className="input-type-selector">
                    <button
                        className={`type-btn ${inputType === 'text' ? 'active' : ''}`}
                        onClick={() => setInputType('text')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        {t('noveltyEvaluator.text')}
                    </button>
                    <button
                        className={`type-btn ${inputType === 'pdf' ? 'active' : ''}`}
                        onClick={() => setInputType('pdf')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('noveltyEvaluator.pdf')}
                    </button>
                    <button
                        className={`type-btn ${inputType === 'code' ? 'active' : ''}`}
                        onClick={() => setInputType('code')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M5 11L2 8l3-3M11 5l3 3-3 3M9 2L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('noveltyEvaluator.code')}
                    </button>
                </div>
            </div>

            <div className="evaluator-content">
                {inputType === 'pdf' ? (
                    <div
                        className={`pdf-upload-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="file-input-hidden"
                            id="pdf-evaluator-input"
                        />
                        <label htmlFor="pdf-evaluator-input" className="upload-label">
                            {pdfFile ? (
                                <>
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <path d="M28 6H12a4 4 0 00-4 4v28a4 4 0 004 4h24a4 4 0 004-4V18L28 6z" fill="rgba(99, 102, 241, 0.1)" stroke="currentColor" strokeWidth="2" />
                                        <path d="M28 6v12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="24" cy="28" r="8" fill="rgba(34, 197, 94, 0.2)" stroke="rgb(34, 197, 94)" strokeWidth="2" />
                                        <path d="M21 28l2 2 4-4" stroke="rgb(34, 197, 94)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <h3>{pdfFile.name}</h3>
                                    <p>{t('noveltyEvaluator.pdfLoaded')}</p>
                                    <button className="btn-secondary mt-2" onClick={handleClear}>
                                        {t('noveltyEvaluator.chooseDifferentFile')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                        <path d="M32 16v32M48 32H16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" opacity="0.3" />
                                    </svg>
                                    <h3>{t('noveltyEvaluator.dropPdfHere')}</h3>
                                    <p>{t('noveltyEvaluator.extractText')}</p>
                                </>
                            )}
                        </label>
                    </div>
                ) : (
                    <div className="text-input-section">
                        <textarea
                            className="evaluator-textarea"
                            placeholder={inputType === 'code'
                                ? t('noveltyEvaluator.codePlaceholder')
                                : t('noveltyEvaluator.textPlaceholder')}
                            value={inputContent}
                            onChange={(e) => setInputContent(e.target.value)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        />
                        {inputContent && (
                            <div className="input-stats">
                                <span>{inputContent.length} {t('noveltyEvaluator.characters')}</span>
                                <button className="btn-link" onClick={handleClear}>{t('noveltyEvaluator.clear')}</button>
                            </div>
                        )}
                    </div>
                )}

                <div className="evaluator-actions">
                    <button
                        className="btn-evaluate"
                        onClick={handleEvaluate}
                        disabled={isEvaluating || !inputContent.trim()}
                    >
                        {isEvaluating ? (
                            <>
                                <div className="spinner-small"></div>
                                {t('noveltyEvaluator.evaluating')}
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor" />
                                </svg>
                                {t('noveltyEvaluator.evaluate')}
                            </>
                        )}
                    </button>

                    {!localStorage.getItem('cerebras_api_key') && !localStorage.getItem('gemini_api_key') && (
                        <p className="api-warning">
                            ⚠️ {t('noveltyEvaluator.noApiKey')}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="evaluator-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M10 6v4M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                {evaluation && (
                    <div className="evaluation-result">
                        <div className="result-header">
                            <h2>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                {t('noveltyEvaluator.evaluationComplete')}
                            </h2>
                            <button className="btn-icon" onClick={() => setEvaluation(null)} title={t('noveltyEvaluator.close')}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <div className="result-content">
                            <pre className="evaluation-text">{evaluation}</pre>
                        </div>
                        <div className="result-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    navigator.clipboard.writeText(evaluation)
                                    alert(t('noveltyEvaluator.evaluationCopied'))
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                {t('noveltyEvaluator.copyToClipboard')}
                            </button>
                            <button className="btn-primary" onClick={handleClear}>
                                {t('noveltyEvaluator.evaluateAnother')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!evaluation && !isEvaluating && (
                <div className="evaluator-info">
                    <h3>{t('noveltyEvaluator.howItWorks')}</h3>
                    <div className="info-grid">
                        <div className="info-card">
                            <div className="info-icon">📄</div>
                            <h4>{t('noveltyEvaluator.step1Title')}</h4>
                            <p>{t('noveltyEvaluator.step1Description')}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-icon">🤖</div>
                            <h4>{t('noveltyEvaluator.step2Title')}</h4>
                            <p>{t('noveltyEvaluator.step2Description')}</p>
                        </div>
                        <div className="info-card">
                            <div className="info-icon">📊</div>
                            <h4>{t('noveltyEvaluator.step3Title')}</h4>
                            <p>{t('noveltyEvaluator.step3Description')}</p>
                        </div>
                    </div>
                    <div className="evaluation-criteria">
                        <h4>{t('noveltyEvaluator.evaluationCriteriaTitle')}</h4>
                        <ul>
                            <li>✓ {t('noveltyEvaluator.criteria1')}</li>
                            <li>✓ {t('noveltyEvaluator.criteria2')}</li>
                            <li>✓ {t('noveltyEvaluator.criteria3')}</li>
                            <li>✓ {t('noveltyEvaluator.criteria4')}</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
