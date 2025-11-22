/**
 * Analyze PDF text using Gemini API (via REST - matching working Python implementation)
 * @param {string} text - The text extracted from the PDF
 * @param {string} apiKey - The user's Gemini API key
 * @returns {Promise<Object>} The analyzed data in JSON format
 */
export async function analyzePaperWithGemini(text, apiKey) {
    if (!apiKey) {
        throw new Error("API Key is required");
    }

    const prompt = `
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

    // Models to try (based on your working Python code - prioritizing 2.5-flash)
    const modelsToTry = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to call Gemini model: ${modelName}`);

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            role: "user",
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.6,
                            topP: 0.95,
                            maxOutputTokens: 4096
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // If 404, try next model
                if (response.status === 404) {
                    console.warn(`Model ${modelName} not found (404). Trying next...`);
                    lastError = new Error(`Model ${modelName} not found`);
                    continue;
                }

                // If 400 (invalid key), stop immediately
                if (response.status === 400) {
                    throw new Error(`API Key Invalid: ${errorData.error?.message || "Check your API key in Settings"}`);
                }

                // Other errors
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Success with model: ${modelName}`);

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!responseText) {
                throw new Error("Empty response from Gemini");
            }

            // Extract JSON object using regex to be robust against markdown or extra text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON object found in Gemini response");
            }

            const cleanText = jsonMatch[0];
            return JSON.parse(cleanText);

        } catch (error) {
            console.error(`❌ Error with model ${modelName}:`, error.message);
            lastError = error;

            // If it's an API key error, stop trying other models
            if (error.message.includes("API Key Invalid")) {
                throw error;
            }
        }
    }

    // All models failed
    throw new Error(`Failed to analyze paper with any model. Last error: ${lastError?.message}`);
}
