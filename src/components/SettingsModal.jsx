import { useState, useEffect } from 'react'

export default function SettingsModal({ onClose }) {
    const [cerebrasKey, setCerebrasKey] = useState('')
    const [geminiKey, setGeminiKey] = useState('')
    const [savedCerebrasKey, setSavedCerebrasKey] = useState('')
    const [savedGeminiKey, setSavedGeminiKey] = useState('')
    const [showCerebrasKey, setShowCerebrasKey] = useState(false)
    const [showGeminiKey, setShowGeminiKey] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        const cerebras = localStorage.getItem('cerebras_api_key') || ''
        const gemini = localStorage.getItem('gemini_api_key') || ''
        setCerebrasKey(cerebras)
        setGeminiKey(gemini)
        setSavedCerebrasKey(cerebras)
        setSavedGeminiKey(gemini)
    }, [])

    const handleSave = () => {
        localStorage.setItem('cerebras_api_key', cerebrasKey.trim())
        localStorage.setItem('gemini_api_key', geminiKey.trim())
        setSavedCerebrasKey(cerebrasKey.trim())
        setSavedGeminiKey(geminiKey.trim())

        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
    }

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2 className="settings-title">Settings</h2>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h3 className="settings-section-title">AI Integration</h3>

                        {/* Cerebras API Key */}
                        <div className="settings-card">
                            <div className="api-key-field">
                                <label className="api-key-label">Cerebras API Key (Optional)</label>
                                <div className="api-key-input-wrapper">
                                    <input
                                        type={showCerebrasKey ? "text" : "password"}
                                        className="settings-input"
                                        placeholder="Enter your Cerebras API key..."
                                        value={cerebrasKey}
                                        onChange={(e) => setCerebrasKey(e.target.value)}
                                    />
                                    <button
                                        className="btn-icon"
                                        onClick={() => setShowCerebrasKey(!showCerebrasKey)}
                                        title={showCerebrasKey ? "Hide Key" : "Show Key"}
                                    >
                                        {showCerebrasKey ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                <div className={`key-status ${savedCerebrasKey ? 'valid' : 'empty'}`}>
                                    {savedCerebrasKey ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Cerebras API Key is set
                                        </>
                                    ) : (
                                        "No Cerebras API key saved"
                                    )}
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    Get your API key from <a href="https://cloud.cerebras.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cerebras Cloud</a>.
                                    Models: llama-3.3-70b, llama3.1-8b
                                </p>
                            </div>
                        </div>

                        {/* Gemini API Key */}
                        <div className="settings-card mt-4">
                            <div className="api-key-field">
                                <label className="api-key-label">Google Gemini API Key (Optional)</label>
                                <div className="api-key-input-wrapper">
                                    <input
                                        type={showGeminiKey ? "text" : "password"}
                                        className="settings-input"
                                        placeholder="Enter your Gemini API key..."
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                    />
                                    <button
                                        className="btn-icon"
                                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                                        title={showGeminiKey ? "Hide Key" : "Show Key"}
                                    >
                                        {showGeminiKey ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                <div className={`key-status ${savedGeminiKey ? 'valid' : 'empty'}`}>
                                    {savedGeminiKey ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Gemini API Key is set
                                        </>
                                    ) : (
                                        "No Gemini API key saved"
                                    )}
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                                    Model: gemini-1.5-flash
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-secondary">
                                💡 <strong>Tip:</strong> You can configure either or both API keys. The Novelty Evaluator will try Cerebras first, then fall back to Gemini if needed.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    <button className="btn btn-secondary mr-2" onClick={onClose}>Close</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {isSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
