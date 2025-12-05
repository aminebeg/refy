import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function SettingsModal({ onClose }) {
    const { t } = useTranslation()
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
                    <h2 className="settings-title">{t('settings.title')}</h2>
                    <button className="btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    {/* Language Selection */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">{t('settings.language')}</h3>
                        <div className="settings-card">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3 className="settings-section-title">{t('settings.aiIntegration')}</h3>

                        {/* Cerebras API Key */}
                        <div className="settings-card">
                            <div className="api-key-field">
                                <label className="api-key-label">{t('settings.cerebrasApiKey')}</label>
                                <div className="api-key-input-wrapper">
                                    <input
                                        type={showCerebrasKey ? "text" : "password"}
                                        className="settings-input"
                                        placeholder={t('settings.enterApiKey')}
                                        value={cerebrasKey}
                                        onChange={(e) => setCerebrasKey(e.target.value)}
                                    />
                                    <button
                                        className="btn-icon"
                                        onClick={() => setShowCerebrasKey(!showCerebrasKey)}
                                        title={showCerebrasKey ? t('settings.hideKey') : t('settings.showKey')}
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
                                            {t('settings.keySet').replace('API Key', 'Cerebras API Key')}
                                        </>
                                    ) : (
                                        t('settings.noKeySaved').replace('API key', 'Cerebras API key')
                                    )}
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    {t('settings.getCerebrasKey')} <a href="https://cloud.cerebras.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cerebras Cloud</a>.
                                    {' '}{t('settings.cerebrasModels')}
                                </p>
                            </div>
                        </div>

                        {/* Gemini API Key */}
                        <div className="settings-card mt-4">
                            <div className="api-key-field">
                                <label className="api-key-label">{t('settings.geminiApiKey')}</label>
                                <div className="api-key-input-wrapper">
                                    <input
                                        type={showGeminiKey ? "text" : "password"}
                                        className="settings-input"
                                        placeholder={t('settings.enterApiKey')}
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                    />
                                    <button
                                        className="btn-icon"
                                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                                        title={showGeminiKey ? t('settings.hideKey') : t('settings.showKey')}
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
                                            {t('settings.keySet').replace('API Key', 'Gemini API Key')}
                                        </>
                                    ) : (
                                        t('settings.noKeySaved').replace('API key', 'Gemini API key')
                                    )}
                                </div>
                                <p className="text-xs text-tertiary mt-2">
                                    {t('settings.getGeminiKey')} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                                    {' '}{t('settings.geminiModels')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-secondary">
                                💡 <strong>{t('common.success')}:</strong> {t('settings.apiTip')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {isSaved ? t('common.saved') : t('common.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    )
}
