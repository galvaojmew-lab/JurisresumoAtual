import { getTechnicalPrompt, GEMINI_PROMPT_SIMPLIFIED } from '../constants';

// This is a browser-based app, so we expect GoogleGenAI to be available on the window object
// from the CDN script in index.html.
declare global {
    interface Window {
        GoogleGenAI: any;
    }
}

// Ensure the API key is available. This will be handled by the execution environment.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new window.GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerationOptions {
    generateTechnical: boolean;
    generateSimplified: boolean;
    size: 'short' | 'medium' | 'long';
}

interface Summaries {
    technical?: string;
    simplified?: string;
}

async function callGemini(prompt: string, text: string): Promise<string> {
    const fullPrompt = `${prompt}\n\n${text}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
    });
    return response.text;
}

export async function generateSummaries(text: string, options: GenerationOptions): Promise<Summaries> {
    if (!options.generateTechnical && !options.generateSimplified) {
        return {};
    }

    try {
        const promises: Promise<string | undefined>[] = [];

        if (options.generateTechnical) {
            const technicalPrompt = getTechnicalPrompt(options.size);
            promises.push(callGemini(technicalPrompt, text));
        } else {
            promises.push(Promise.resolve(undefined));
        }

        if (options.generateSimplified) {
            promises.push(callGemini(GEMINI_PROMPT_SIMPLIFIED, text));
        } else {
            promises.push(Promise.resolve(undefined));
        }
        
        const [technical, simplified] = await Promise.all(promises);

        return { technical, simplified };

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Check for common API key errors and provide a more specific message
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
             throw new Error('Failed to generate summary. Please check if the API key is valid and has permissions.');
        }
        throw new Error('Failed to generate summary from Gemini API.');
    }
}