
import { getTechnicalPrompt, GEMINI_PROMPT_SIMPLIFIED } from '../constants';

// The GoogleGenAI class is loaded from a CDN script in index.html and attached to the window object.
declare global {
    interface Window {
        GoogleGenAI: any;
    }
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

let ai: any;

function getAiInstance() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error('A chave da API do Google não está configurada. Por favor, configure a variável de ambiente API_KEY.');
    }
    // Use the apiKey to create a new instance every time to ensure it's fresh,
    // although for this app structure, a singleton would also work.
    ai = new window.GoogleGenAI({ apiKey });
    return ai;
}

async function callGemini(prompt: string, text: string): Promise<string> {
    try {
        const ai = getAiInstance();
        const fullPrompt = `${prompt}\n\n${text}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        return response.text;
    } catch (error: any) {
        console.error("Erro na API Gemini:", error);
        if (error.message && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
            throw new Error('Chave de API do Google inválida. Verifique suas configurações.');
        }
        throw new Error('Falha ao gerar resumo com a API do Google Gemini.');
    }
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
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Ocorreu um erro desconhecido ao se comunicar com a API do Google.');
    }
}
