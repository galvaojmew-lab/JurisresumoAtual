import { getTechnicalPrompt, GEMINI_PROMPT_SIMPLIFIED } from '../constants';

// This is a browser-based app, so we expect GoogleGenAI to be available on the window object
// from the CDN script in index.html.
declare global {
    interface Window {
        GoogleGenAI: any;
    }
}

// Function to get the Gemini AI client instance, checking for API key at runtime.
function getAiClient() {
    if (!process.env.API_KEY) {
        // Throw a specific error that the UI can catch and interpret.
        throw new Error("API_KEY_MISSING");
    }
    return new window.GoogleGenAI({ apiKey: process.env.API_KEY });
}


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
    const ai = getAiClient();
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
        // Re-throw specific errors or a generic one. The UI will handle the user message.
        if (error instanceof Error) {
            if (error.message === "API_KEY_MISSING") {
                throw error; // Re-throw the specific error
            }
            if (error.message.includes('API key not valid') || error.message.includes('400')) {
                 throw new Error('A chave de API parece ser inválida ou não ter as permissões necessárias.');
            }
        }
        throw new Error('Falha na comunicação com a API Gemini.');
    }
}
