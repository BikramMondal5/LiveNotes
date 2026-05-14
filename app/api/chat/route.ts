import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { authOptions } from '@/lib/auth';

const API_URLS: Record<string, string> = {
    gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    nova: "https://gen.pollinations.ai/v1/chat/completions",
    mistral: "https://gen.pollinations.ai/v1/chat/completions",
    gpt4o: "https://models.inference.ai.azure.com/chat/completions",
    grok: "https://models.inference.ai.azure.com/chat/completions"
};

interface ChatMessage {
    content: string;
    image?: string;
    sender: 'user' | 'ai';
}

type GeminiPart = {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
};

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : "Sorry, there was an error processing your request. Please try again.";
};

const getApiKey = (provider: string) => {
    switch (provider) {
        case 'gemini': return process.env.GEMINI_API_KEY || '';
        case 'groq': return process.env.GROQ_API_KEY || '';
        case 'nova': return process.env.POLLINATIONS_API_KEY || '';
        case 'mistral': return process.env.POLLINATIONS_API_KEY || '';
        case 'gpt4o': return process.env.GITHUB_TOKEN || '';
        case 'grok': return process.env.GITHUB_TOKEN || '';
        default: return '';
    }
};

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Login required to use Ask Elloy." }, { status: 401 });
        }

        const body = await req.json();
        const { provider, messages, userMessage, selectedModel } = body;

        const API_KEY = getApiKey(provider);

        if (!API_KEY) {
            return NextResponse.json({ error: `API key not configured for ${provider}` }, { status: 400 });
        }

        const systemPrompt = process.env.SYSTEM_PROMPT || "You are a helpful, friendly, and concise AI assistant for a notes and ideas app.";

        const allMessages = messages.concat([userMessage]);

        let aiResponseContent = "";

        if (provider === 'gemini') {
            const response = await fetch(`${API_URLS.gemini}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents: allMessages.map((m: ChatMessage) => {
                        const parts: GeminiPart[] = [{ text: m.content }];
                        if (m.image) {
                            const [meta, base64Data] = m.image.split(',');
                            const mimeType = meta.split(':')[1].split(';')[0];
                            parts.push({ inlineData: { mimeType, data: base64Data } });
                        }
                        return {
                            role: m.sender === 'user' ? 'user' : 'model',
                            parts
                        };
                    })
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown'}`);
            }

            const data = await response.json();
            aiResponseContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

        } else if (provider === 'groq') {
            const response = await fetch(API_URLS.groq, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...allMessages.map((m: ChatMessage) => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API Error: ${response.status}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Groq.';

        } else if (provider === 'gpt4o') {
            const client = ModelClient(
                "https://models.github.ai/inference",
                new AzureKeyCredential(API_KEY)
            );

            const response = await client.path("/chat/completions").post({
                body: {
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...allMessages.map((m: ChatMessage) => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    ],
                    temperature: 1.0,
                    top_p: 1.0,
                    max_tokens: 1000,
                    model: "openai/gpt-4o"
                }
            });

            if (isUnexpected(response)) {
                throw new Error(`GPT-4o API Error: ${response.body?.error?.message || 'Unknown'}`);
            }

            aiResponseContent = response.body.choices[0].message.content || 'No response from GPT-4o.';

        } else if (provider === 'nova') {
            const response = await fetch(API_URLS.nova, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "nova-fast",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...allMessages.map((m: ChatMessage) => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Nova API Error: ${response.status}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Amazon Nova Micro.';

        } else if (provider === 'mistral') {
            const response = await fetch(API_URLS.mistral, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "mistral",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...allMessages.map((m: ChatMessage) => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Mistral API Error: ${response.status}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Mistral.';

        } else if (provider === 'grok') {
            const client = ModelClient(
                "https://models.github.ai/inference",
                new AzureKeyCredential(API_KEY)
            );

            const response = await client.path("/chat/completions").post({
                body: {
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...allMessages.map((m: ChatMessage) => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    ],
                    temperature: 1.0,
                    top_p: 1.0,
                    model: "xai/grok-3"
                }
            });

            if (isUnexpected(response)) {
                throw new Error(`Grok 3 API Error: ${response.body?.error?.message || 'Unknown error'}`);
            }

            aiResponseContent = response.body.choices[0].message.content || 'No response from Grok 3.';

        } else {
            // Mock delay simulation for other unconfigured models
            await new Promise(resolve => setTimeout(resolve, 1500));
            aiResponseContent = `Hello! You messaged me using ${selectedModel} (Provider: ${provider})`;
        }

        return NextResponse.json({ content: aiResponseContent });

    } catch (error: unknown) {
        console.error("Error in API route:", error);
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        );
    }
}
