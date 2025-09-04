
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure the API key is available, otherwise throw an error.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a prompt to the Gemini model and returns the response text.
 * @param prompt The prompt string to send to the model.
 * @returns A promise that resolves to the model's text response.
 */
export const runPrompt = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Defaulting to general-purpose config.
                // For lower latency, one might add: thinkingConfig: { thinkingBudget: 0 }
                temperature: 0.7,
                topP: 1,
                topK: 1,
            }
        });

        // Use the direct .text accessor for the response
        const text = response.text;
        if (text) {
            return text;
        } else {
             // Handle cases where response is empty or blocked
            const blockReason = response.candidates?.[0]?.finishReason;
            const safetyRatings = response.candidates?.[0]?.safetyRatings;
            let reason = `Response was empty or blocked. Reason: ${blockReason || 'Unknown'}.`;
            if (safetyRatings) {
                reason += ` Safety Ratings: ${JSON.stringify(safetyRatings)}`;
            }
            throw new Error(reason);
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
};
