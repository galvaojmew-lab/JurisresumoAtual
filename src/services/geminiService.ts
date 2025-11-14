// This service now uses the Groq API.
const API_KEY = process.env.VITE_API_KEY;

interface GenerationOptions {
    generateTechnical: boolean;
    generateSimplified: boolean;
    size: 'short' | 'medium' | 'long';
}

interface Summaries {
    technical?: string;
    simplified?: string;
}

// Helper function to call Groq API
async function callGroq(text: string, type: 'technical' | 'simplified', size: 'short' | 'medium' | 'long'): Promise<string> {
    if (!API_KEY || !API_KEY.startsWith('gsk_')) {
        throw new Error('Configure VITE_API_KEY com uma chave válida do Groq (iniciando com gsk_) no seu ambiente.');
    }
    
    const maxWordsTechnical = {
        short: 500,
        medium: 1000,
        long: 1500,
    };
    
    const maxPalavras = type === 'technical'
        ? maxWordsTechnical[size]
        : 800;

    const prompt = type === 'technical' 
    ? `Resuma em até ${maxPalavras} palavras, em português jurídico formal:
1. **Número do Processo**
2. **Partes** (Autor, Réu, Advogados)
3. **Objeto da Ação**
4. **Pedido Principal**
5. **Fatos Relevantes** (cronologia em 5-8 pontos)
6. **Decisão Mais Recente**
7. **Status Atual**
8. **Riscos e Próximos Passos**

Texto do processo:
"""${text.substring(0, 100000)}"""`

    : `Explique em linguagem simples, até ${maxPalavras} palavras:
1. O que está acontecendo?
2. Quem está processando quem e por quê?
3. O que o autor quer?
4. O que já rolou no processo?
5. O que o juiz decidiu por último?
6. O processo está ganho, perdido ou em andamento?
7. O que vai acontecer agora?

Texto:
"""${text.substring(0, 100000)}"""`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4000,
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Erro Groq: ${response.status} - ${err}`);
        throw new Error(`Erro na API Groq: ${response.status}. Verifique sua chave e o status do serviço.`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
         throw new Error('A API Groq retornou uma resposta inesperada ou vazia.');
    }
    return data.choices[0].message.content;
}

export async function generateSummaries(text: string, options: GenerationOptions): Promise<Summaries> {
    if (!options.generateTechnical && !options.generateSimplified) {
        return {};
    }

    try {
        const promises: Promise<string | undefined>[] = [];

        if (options.generateTechnical) {
            promises.push(callGroq(text, 'technical', options.size));
        } else {
            promises.push(Promise.resolve(undefined));
        }

        if (options.generateSimplified) {
            promises.push(callGroq(text, 'simplified', options.size));
        } else {
            promises.push(Promise.resolve(undefined));
        }
        
        const [technical, simplified] = await Promise.all(promises);

        return { technical, simplified };

    } catch (error) {
        console.error('Error generating summaries with Groq:', error);
        // Re-throw the error so the UI can catch it.
        // The error message from callGroq is already user-friendly.
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Ocorreu um erro desconhecido ao se comunicar com a API Groq.');
    }
}
