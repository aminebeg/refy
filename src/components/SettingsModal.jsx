import { useState, useEffect } from 'react'
import { checkOllamaStatus } from '../utils/ollamaService'

export default function SettingsModal({ onClose }) {
    const [ollamaStatus, setOllamaStatus] = useState('checking')
    const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('ollama_model') || 'deepseek')
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        checkOllamaStatus(selectedModel).then(available => {
            setOllamaStatus(available ? 'available' : 'unavailable')
        })
    }, [selectedModel])

    const handleSave = () => {
        localStorage.setItem('ollama_model', selectedModel)
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
                        <h3 className="settings-section-title">AI Integration (Ollama)</h3>

                        <div className="settings-card">
                            <div className="api-key-field">
                                <label className="api-key-label">Ollama Model</label>
                                <select
                                    className="settings-input"
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    <option value="deepseek">DeepSeek</option>
                                    <option value="llama3">Llama 3</option>
                                    <option value="mistral">Mistral</option>
                                    <option value="phi">Phi</option>
                                </select>
                            </div>
                        </div>

                        <div className="settings-card mt-4">
                            <div className="api-key-field">
                                <label className="api-key-label">Ollama Status</label>
                                <div className={`key-status ${ollamaStatus === 'available' ? 'valid' : 'empty'}`}>
                                    {ollamaStatus === 'checking' ? (
                                        "Checking..."
                                    ) : ollamaStatus === 'available' ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Ollama is running with {selectedModel} model
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                            Ollama not available - Make sure Ollama is running locally
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    Ensure Ollama is running with: <code>ollama run {selectedModel}</code>
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