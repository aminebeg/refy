import { useState, useEffect } from 'react'
import './SettingsModal.css'

export default function SettingsModal({ onClose }) {
    const [apiKey, setApiKey] = useState('')
    const [savedKey, setSavedKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        const key = localStorage.getItem('cerebras_api_key') || ''
        setApiKey(key)
        setSavedKey(key)
    }, [])

    const handleSave = () => {
        localStorage.setItem('cerebras_api_key', apiKey.trim())
        setSavedKey(apiKey.trim())

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
                        <div className="settings-card">
                            <div className="api-key-field">
                                <label className="api-key-label">Cerebras API Key</label>
                                <div className="api-key-input-wrapper">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        className="settings-input"
                                        placeholder="Enter your API key..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                    <button
                                        className="btn-icon"
                                        onClick={() => setShowKey(!showKey)}
                                        title={showKey ? "Hide Key" : "Show Key"}
                                    >
                                        {showKey ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                <div className={`key-status ${savedKey ? 'valid' : 'empty'}`}>
                                    {savedKey ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            API Key is set and ready to use
                                        </>
                                    ) : (
                                        "No API key saved"
                                    )}
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    Get your API key from <a href="https://cloud.cerebras.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cerebras Cloud</a>.
                                    Your key is stored locally in your browser.
                                </p>
                            </div>
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
