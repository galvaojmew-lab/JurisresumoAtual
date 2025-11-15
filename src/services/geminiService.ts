import { GoogleGenAI } from "@google/genai";
import { getTechnicalPrompt, GEMINI_PROMPT_SIMPLIFIED } from '../../constants';

interface GenerationOptions {
    generateTechnical: boolean;
    generateSimplified: boolean;
    size: 'short' | 'medium' | 'long';
}

interface Summaries {
    technical?: string;
    simplified?: string;
}

let ai: GoogleGenAI;

function getAiInstance(): GoogleGenAI {
    // Implemented as a singleton to avoid re-creating the instance on every call.
    if (ai) {
        return ai;
    }
    // API key is taken from environment variables as per guidelines.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error('A chave da API do Google não está configurada. Por favor, configure a variável de ambiente API_KEY.');
    }
    // Initialize with a named parameter as per guidelines.
    ai = new GoogleGenAI({ apiKey });
    return ai;
}

async function callGemini(prompt: string, text: string): Promise<string> {
    try {
        const gemini = getAiInstance();
        const fullPrompt = `${prompt}\n\n${text}`;
        
        // Use generateContent and a recommended model.
        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        // Extract text directly from the response.text property.
        return response.text;
    } catch (error: any) {
        console.error("Erro na API Gemini:", error);
        if (error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
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
