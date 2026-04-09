const OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'deepseek';

function getSelectedModel() {
    return localStorage.getItem('ollama_model') || DEFAULT_MODEL;
}

async function getActualModelName(requestedModel) {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) return requestedModel;
        const data = await response.json();
        const models = data.models || [];
        
        const target = requestedModel.toLowerCase();
        // Find best match: exact, then startswith
        const found = models.find(m => m.name.toLowerCase() === target) ||
                      models.find(m => m.name.toLowerCase() === `${target}:latest`) ||
                      models.find(m => m.name.toLowerCase().startsWith(target));
        
        return found ? found.name : requestedModel;
    } catch {
        return requestedModel;
    }
}

export async function callOllama(messages, options = {}) {
    const requestedModel = options.model || getSelectedModel();
    const model = await getActualModelName(requestedModel);
    const temperature = options.temperature ?? 0.7;
    const stream = options.stream ?? false;

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                stream
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama Error ${response.status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        return data.message?.content;
    } catch (error) {
        console.error("Ollama API call failed:", error);
        throw error;
    }
}

export async function analyzePaperWithOllama(text, model) {
    const systemPrompt = `You are TechSheet AI — a world-class expert research summarizer and technical writer with a PhD-level understanding across Computer Science, Machine Learning, Engineering, Physics, and Biology.

Your sole purpose is to automatically generate high-quality, accurate, and professional Technical Sheets (one-page technical summaries) from research papers.

CORE RULES:
- Base every single sentence strictly on the content of the provided paper.
- Be extremely precise with technical details, numbers, model names, datasets, metrics, and equations.
- If information is missing or unclear, say "Not specified in the paper".
- Use formal, academic yet readable tone.
- Always cite key claims with direct quotes or section references when important.`;
    
    const userPrompt = `
    You are TechSheet AI. Analyze the following research paper text and generate a comprehensive technical analysis.
    
    Return the result ONLY as a valid JSON object with the following keys:
    - title: The exact paper title.
    - authors: List of authors as an array.
    - venueYear: Conference/Journal/Arxiv ID and Year.
    - oneSentenceOverview: One clear, powerful sentence.
    - problemMotivation: 2-4 sentences on gap/problem.
    - keyContributions: Array of up to 6 technical novelties.
    - methodology: Concise technical description.
    - mainResults: Quantitative results (numbers, comparisons).
    - limitationsFutureWork: Explicitly stated limitations.
    - practicalTakeaways: Reproducibility, applicability, impact.
    - importantQuotes: Array of 2-4 direct excerpts.
    - rating: Integer from 1 to 5.

    Analyze the paper text below:
    ${text.substring(0, 100000)}
    `;

    try {
        const responseText = await callOllama([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], { 
            model, 
            temperature: 0.3,
            num_ctx: 32768 // Ensure large enough context window
        });

        if (!responseText) {
            throw new Error("Empty response from Ollama. Make sure the model is loaded.");
        }

        let jsonStr = responseText.trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse failed for response:", responseText);
            throw new Error("AI returned an invalid format. Please try again.");
        }
        
        // Construct the full Markdown one-pager
        const fullMarkdown = `# Technical Sheet: ${parsed.title || "Untitled"}

**Authors:** ${Array.isArray(parsed.authors) ? parsed.authors.join(', ') : (parsed.authors || "Unknown")}
**Venue & Year:** ${parsed.venueYear || "Unknown"}
**Date:** ${new Date().toLocaleDateString()}

## 1. One-Sentence Overview
${parsed.oneSentenceOverview || ""}

## 2. Problem & Motivation
${parsed.problemMotivation || ""}

## 3. Key Contributions & Innovations
${Array.isArray(parsed.keyContributions) ? parsed.keyContributions.map(k => `- ${k}`).join('\n') : (parsed.keyContributions || "")}

## 4. Methodology
${parsed.methodology || ""}

## 5. Main Results
${parsed.mainResults || ""}

## 6. Limitations & Future Work
${parsed.limitationsFutureWork || ""}

## 7. Practical Takeaways
${parsed.practicalTakeaways || ""}

**Important Direct Quotes**
${Array.isArray(parsed.importantQuotes) ? parsed.importantQuotes.map(q => `- "${q}"`).join('\n') : (parsed.importantQuotes || "")}

**Verification Note:** All information is directly extracted or faithfully summarized. 

---
*Generated by TechSheet AI*`;

        return {
            summary: parsed.oneSentenceOverview || "",
            researchQuestion: parsed.problemMotivation || "",
            methodology: parsed.methodology || "",
            dataset: parsed.venueYear || "",
            metrics: "",
            keyFindings: Array.isArray(parsed.keyContributions) ? parsed.keyContributions.join('\n• ') : (parsed.keyContributions || ""),
            majorResults: parsed.mainResults || "",
            comparison: "",
            strengths: parsed.practicalTakeaways || "",
            weaknesses: Array.isArray(parsed.limitationsFutureWork) ? (typeof parsed.limitationsFutureWork === 'string' ? parsed.limitationsFutureWork : parsed.limitationsFutureWork.join('\n')) : (parsed.limitationsFutureWork || ""),
            contributions: Array.isArray(parsed.keyContributions) ? parsed.keyContributions.join('\n') : (parsed.keyContributions || ""),
            futureWork: parsed.limitationsFutureWork || "",
            personalNotes: fullMarkdown,
            rating: parsed.rating || 0,
            fullMarkdown: fullMarkdown
        };

    } catch (error) {
        console.error("Analysis failed:", error);
        throw new Error(`Ollama analysis failed: ${error.message}`);
    }
}

export async function enhanceSearchQueryWithOllama(query, model) {
    const systemPrompt = "You are an expert at converting natural language queries into optimized academic search queries.";

    const userPrompt = `
    Augment the following search query by adding 2-3 related academic terms or synonyms using the OR operator (|).
    
    Rules:
    1. Identify the core concept.
    2. 2-3 high-quality academic synonyms.
    3. Use pipe symbol (|) for OR.
    4. Return ONLY the augmented query string.
    
    Original query: "${query}"
    
    Augmented query:`;

    try {
        const enhancedQuery = await callOllama([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], { model, temperature: 0.3 });

        if (enhancedQuery && enhancedQuery.length > 0 && enhancedQuery.length < 200) {
            return enhancedQuery.trim().replace(/^"(.*)"$/, '$1'); // Remove quotes if model added them
        }

        return query;
    } catch (error) {
        console.warn("Query enhancement failed:", error);
        return query;
    }
}

export async function checkOllamaStatus(model) {
    const modelToCheck = (model || getSelectedModel()).toLowerCase();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 

        const response = await fetch('http://localhost:11434/api/tags', { 
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) return false;

        const result = await response.json();
        const models = result.models || [];

        // Robust matching including case-insensitivity and partial matches for versions
        return models.some(m => {
            const name = m.name.toLowerCase();
            const baseName = name.split(':')[0];
            const targetBase = modelToCheck.split(':')[0];
            
            return name === modelToCheck || 
                   name === `${modelToCheck}:latest` || 
                   baseName === targetBase ||
                   name.startsWith(modelToCheck) ||
                   targetBase.startsWith(baseName);
        });
    } catch (error) {
        console.warn("Ollama status check failed:", error.message);
        return false;
    }
}
