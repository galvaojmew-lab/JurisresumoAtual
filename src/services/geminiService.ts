// src/services/geminiService.ts

// ATENÇÃO: Use variáveis de ambiente em produção!
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface GenerationOptions {
    generateTechnical: boolean;
    generateSimplified: boolean;
    size: 'short' | 'medium' | 'long';
}

interface Summaries {
    technical?: string;
    simplified?: string;
}

// Helper: chama a API do Google Gemini
async function callGemini(text: string, type: 'technical' | 'simplified', size: 'short' | 'medium' | 'long'): Promise<string> {
    if (!API_KEY) {
        throw new Error('Configure VITE_GEMINI_API_KEY no arquivo .env');
    }

    const maxTokens = {
        short: 600,
        medium: 1200,
        long: 1800,
    };

    const tokenLimit = type === 'technical' ? maxTokens[size] : 1000;

    const prompt = type === 'technical'
        ? `Resuma o processo judicial em português jurídico formal, em até ${tokenLimit} tokens:
1. **Número do Processo**
2. **Partes** (Autor, Réu, Advogados)
3. **Objeto da Ação**
4. **Pedido Principal**
5. **Fatos Relevantes** (cronologia em 5-8 pontos)
6. **Decisão Mais Recente**
7. **Status Atual**
8. **Riscos e Próximos Passos**

Texto do processo:
"""${text.substring(0, 30000)}"""`

        : `Explique o processo em linguagem simples, até ${tokenLimit} tokens:
1. O que está acontecendo?
2. Quem está processando quem e por quê?
3. O que o autor quer?
4. O que já rolou no processo?
5. O que o juiz decidiu por último?
6. O processo está ganho, perdido ou em andamento?
7. O que vai acontecer agora?

Texto:
"""${text.substring(0, 30000)}"""`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: tokenLimit,
                },
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_ONLY_HIGH'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_ONLY_HIGH'
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_ONLY_HIGH'
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_ONLY_HIGH'
                    }
                ]
            })
        }
    );

    if (!response.ok) {
        const err = await response.text();
        console.error(`Erro Gemini: ${response.status} - ${err}`);
        throw new Error(`Erro na API Gemini: ${response.status}. Verifique sua chave e o status do serviço.`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
        throw new Error('A API Gemini retornou uma resposta vazia ou inválida.');
    }

    return data.candidates[0].content.parts[0].text.trim();
}

// Função pública
export async function generateSummaries(text: string, options: GenerationOptions): Promise<Summaries> {
    if (!options.generateTechnical && !options.generateSimplified) {
        return {};
    }

    try {
        const promises: Promise<string | undefined>[] = [];

        if (options.generateTechnical) {
            promises.push(callGemini(text, 'technical', options.size));
        } else {
            promises.push(Promise.resolve(undefined));
        }

        if (options.generateSimplified) {
            promises.push(callGemini(text, 'simplified', options.size));
        } else {
            promises.push(Promise.resolve(undefined));
        }

        const [technical, simplified] = await Promise.all(promises);

        return { technical, simplified };

    } catch (error) {
        console.error('Erro ao gerar resumos com Gemini:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Ocorreu um erro desconhecido ao se comunicar com a API Gemini.');
    }
}