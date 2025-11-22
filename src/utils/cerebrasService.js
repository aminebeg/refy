/**
 * Analyze PDF text using Cerebras API (matching working Python implementation)
 * @param {string} text - The text extracted from the PDF
 * @param {string} apiKey - The user's Cerebras API key
 * @returns {Promise<Object>} The analyzed data in JSON format
 */
export async function analyzePaperWithCerebras(text, apiKey) {
    if (!apiKey) {
        throw new Error("API Key is required");
    }

    const systemPrompt = "You are a precise sentiment and translation annotator for academic papers. Analyze the paper and return structured JSON data.";

    const userPrompt = `
    You are an expert academic reviewer. Analyze the following academic paper text and extract the key technical details.
    
    Return the result ONLY as a valid JSON object with the following keys:
    - summary: A concise summary of the paper (max 150 words).
    - researchQuestion: The main problem or research question being addressed.
    - methodology: The methods, algorithms, or approaches used.
    - keyFindings: The main results, discoveries, or conclusions.
    - strengths: The strong points of the paper.
    - weaknesses: The limitations or weak points.
    - contributions: How this paper advances the field.
    - futureWork: Suggested future research directions mentioned in the paper.
    - rating: An integer rating from 1 to 5 based on the quality and impact of the paper.

    If a field cannot be found, return an empty string for it. Do not include any markdown formatting (like \`\`\`json) in the response, just the raw JSON string.

    Paper Text:
    ${text.substring(0, 30000)}
    `;

    // Models to try (based on your Python code)
    const modelsToTry = [
        "llama-3.3-70b",
        "llama3.1-70b",
        "llama3.1-8b"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to call Cerebras model: ${modelName}`);

            const response = await fetch(
                "https://api.cerebras.ai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            {
                                role: "system",
                                content: systemPrompt
                            },
                            {
                                role: "user",
                                content: userPrompt
                            }
                        ],
                        temperature: 0.6,
                        top_p: 0.95,
                        max_tokens: 4096,
                        stream: false
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // If model not available, try next
                if (response.status === 404 || response.status === 400) {
                    console.warn(`Model ${modelName} not available. Trying next...`);
                    lastError = new Error(`Model ${modelName} not available`);
                    continue;
                }

                // If 401 (invalid key), stop immediately
                if (response.status === 401) {
                    throw new Error(`API Key Invalid: ${errorData.error?.message || "Check your Cerebras API key in Settings"}`);
                }

                throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Success with Cerebras model: ${modelName}`);

            const responseText = data.choices?.[0]?.message?.content;

            if (!responseText) {
                throw new Error("Empty response from Cerebras");
            }

            // Extract JSON object using regex to be robust against markdown or extra text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON object found in Cerebras response");
            }

            const cleanText = jsonMatch[0];
            return JSON.parse(cleanText);

        } catch (error) {
            console.error(`❌ Error with Cerebras model ${modelName}:`, error.message);
            lastError = error;

            // If it's an API key error, stop trying other models
            if (error.message.includes("API Key Invalid")) {
                throw error;
            }
        }
    }

    // All models failed
    throw new Error(`Failed to analyze paper with any Cerebras model. Last error: ${lastError?.message}`);
}

/**
 * Enhance a search query using Cerebras AI
 * @param {string} apiKey - The user's Cerebras API key
 * @param {string} query - The original search query
 * @returns {Promise<string>} The enhanced query
 */
export async function enhanceSearchQuery(apiKey, query) {
    if (!apiKey) {
        return query; // Return original if no API key
    }

    const systemPrompt = "You are an expert at converting natural language queries into optimized academic search queries.";

    const userPrompt = `
    Convert the following search query into a better, more academic search query that will return better results from an academic paper database.
    
    Rules:
    1. Keep it concise (max 10 words)
    2. Use academic terminology when appropriate
    3. Remove filler words like "I want to find", "papers about", etc.
    4. Focus on key concepts and technical terms
    5. If the query is already good, return it unchanged
    6. Return ONLY the enhanced query text, nothing else
    
    Original query: "${query}"
    
    Enhanced query:`;

    const modelsToTry = ["llama-3.3-70b", "llama3.1-70b", "llama3.1-8b"];

    for (const modelName of modelsToTry) {
        try {
            const response = await fetch(
                "https://api.cerebras.ai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        temperature: 0.3,
                        max_tokens: 100,
                        stream: false
                    })
                }
            );

            if (!response.ok) {
                if (response.status === 404 || response.status === 400) {
                    continue; // Try next model
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const enhancedQuery = data.choices?.[0]?.message?.content?.trim();

            if (enhancedQuery && enhancedQuery.length > 0 && enhancedQuery.length < 200) {
                return enhancedQuery;
            }

            return query; // Return original if response is invalid

        } catch (error) {
            console.warn(`Query enhancement failed with ${modelName}:`, error);
            continue;
        }
    }

    return query; // Return original if all models fail
}
