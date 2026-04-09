import { useState, useRef, useEffect } from 'react'
import { extractPDFText } from '../utils/pdfTextExtractor'
import { callOllama, checkOllamaStatus } from '../utils/ollamaService'
import { getPDFBlob } from '../utils/pdfStorage'

export default function PaperChat({ reference, onClose }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `I've loaded "${reference.title}". Ask me anything about this paper - I can help you understand the methodology, results, discuss limitations, or answer any questions you have.`
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [paperText, setPaperText] = useState('')
    const [isLoadingPaper, setIsLoadingPaper] = useState(true)
    const [error, setError] = useState(null)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        loadPaper()
    }, [reference])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadPaper = async () => {
        try {
            const model = localStorage.getItem('ollama_model') || 'deepseek'
            const ollamaAvailable = await checkOllamaStatus(model)
            if (!ollamaAvailable) {
                throw new Error(`Ollama is not running with ${model}. Please start Ollama first.`)
            }

            if (!reference.pdfId && !reference.hasPDF) {
                throw new Error("No PDF attached to this reference.")
            }

            const pdfId = reference.pdfId || reference.id
            const pdfData = await getPDFBlob(pdfId)

            if (!pdfData || !pdfData.blob) {
                throw new Error("Could not load PDF file.")
            }

            const text = await extractPDFText(pdfData.blob)
            if (!text || text.length < 100) {
                throw new Error("Could not extract text from PDF.")
            }

            setPaperText(text)
            setIsLoadingPaper(false)
        } catch (err) {
            setError(err.message)
            setIsLoadingPaper(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const model = localStorage.getItem('ollama_model') || 'deepseek'

            const systemPrompt = `You are an expert research paper analyst. Your role is to help the user deeply understand and discuss the research paper provided below.

INSTRUCTIONS:
- Answer questions based ONLY on the paper content provided
- If the paper doesn't contain information to answer a question, say so clearly
- Be precise with technical details, numbers, and citations from the paper
- Use a helpful, academic but conversational tone
- When discussing methodology, explain both what they did and why
- When discussing results, reference specific numbers and comparisons from the paper

PAPER CONTENT:
${paperText.substring(0, 120000)}`

            const conversationMessages = [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content }))
            ]

            const response = await callOllama(conversationMessages, { model, temperature: 0.3 })

            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (err) {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `Error: ${err.message}` 
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="paper-chat-overlay" onClick={onClose}>
            <div className="paper-chat-modal fullsize-modal" onClick={e => e.stopPropagation()}>
                <div className="paper-chat-header">
                    <div className="chat-header-info">
                        <h3>Paper Chat</h3>
                        <span className="chat-paper-title">{reference.title}</span>
                    </div>
                    <button className="btn-close-minimal" onClick={onClose}>✕</button>
                </div>

                <div className="paper-chat-content">
                    {isLoadingPaper ? (
                        <div className="chat-loading">
                            <div className="spinner"></div>
                            <p>Loading paper...</p>
                        </div>
                    ) : error ? (
                        <div className="chat-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.role}`}>
                                    <div className="message-role">
                                        {msg.role === 'user' ? 'You' : 'AI'}
                                    </div>
                                    <div className="message-content">
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="chat-message assistant">
                                    <div className="message-role">AI</div>
                                    <div className="message-content typing">
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <form className="paper-chat-input" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about this paper..."
                        disabled={isLoading || isLoadingPaper || error}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || isLoadingPaper || error || !input.trim()}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M18 10L3.5 2.5M18 10L10 18M18 10L12 6L3.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    )
}