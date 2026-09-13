import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const API_URLS: Record<string, string> = {
    gemini: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    nova: "https://gen.pollinations.ai/v1/chat/completions",
    mistral: "https://gen.pollinations.ai/v1/chat/completions",
    deepseek: "https://gen.pollinations.ai/v1/chat/completions",
    gpt54: "https://gen.pollinations.ai/v1/chat/completions",
    'grok-4.6': "https://gen.pollinations.ai/v1/chat/completions",
    grok: "https://gen.pollinations.ai/v1/chat/completions",
    muse: "https://gen.pollinations.ai/v1/chat/completions",
    'muse-glimmer': "https://gen.pollinations.ai/v1/chat/completions",
    cohere: "https://gen.pollinations.ai/v1/chat/completions"
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
        // Group 1: POLLINATIONS_API_KEY (DeepSeek-V4.1-Flash, Cohere Command A+)
        case 'deepseek':
        case 'cohere':
            return process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_KEY2 || process.env.POLLINATIONS_API_KEY3 || '';
        // Group 2: POLLINATIONS_API_KEY2 (Nova 2 Lite, Mistral Large 3)
        case 'nova':
        case 'mistral':
            return process.env.POLLINATIONS_API_KEY2 || process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_KEY3 || '';
        // Group 3: POLLINATIONS_API_KEY3 (GPT-5.4, Muse Glimmer 30B, Grok 4.6)
        case 'gpt54':
        case 'gpt4o':
        case 'muse':
        case 'muse-glimmer':
        case 'grok-4.6':
        case 'grok':
            return process.env.POLLINATIONS_API_KEY3 || process.env.POLLINATIONS_API_KEY2 || process.env.POLLINATIONS_API_KEY || '';
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
            const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
            let response = await fetch(API_URLS.groq, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: groqModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...allMessages.map((m: ChatMessage) => ({
                            role: m.sender === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }))
                    ]
                })
            });

            // Fallback if the configured model is unavailable
            if (response.status === 404 && groqModel !== 'groq/compound-mini') {
                response = await fetch(API_URLS.groq, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'groq/compound-mini',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...allMessages.map((m: ChatMessage) => ({
                                role: m.sender === 'user' ? 'user' : 'assistant',
                                content: m.content
                            }))
                        ]
                    })
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || 'Unknown'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Groq.';

        } else if (provider === 'gpt54' || provider === 'gpt4o') {
            const response = await fetch(API_URLS.gpt54 || "https://gen.pollinations.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "openai/gpt-5.4",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GPT-5.4 API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from GPT-5.4.';

        } else if (provider === 'nova') {
            const response = await fetch(API_URLS.nova, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "amazon/nova-2-lite-v1",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Nova 2 Lite API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Nova 2 Lite.';

        } else if (provider === 'mistral') {
            const response = await fetch(API_URLS.mistral, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "mistralai/mistral-large-3",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Mistral Large 3 API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Mistral Large 3.';

        } else if (provider === 'deepseek') {
            const response = await fetch(API_URLS.deepseek, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-v4.1-flash",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`DeepSeek API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Deepseek-v4.1-flash.';

        } else if (provider === 'grok-4.6' || provider === 'grok') {
            const response = await fetch(API_URLS['grok-4.6'] || API_URLS.grok, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "x-ai/grok-4.6",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Grok 4.6 API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Grok 4.6.';

        } else if (provider === 'muse' || provider === 'muse-glimmer') {
            const response = await fetch(API_URLS.muse || API_URLS['muse-glimmer'], {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "meta/muse-glimmer-30b",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Muse Glimmer API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Muse Glimmer 30b.';

        } else if (provider === 'cohere') {
            const response = await fetch(API_URLS.cohere, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "cohere/command-a-plus",
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Cohere Command A+ API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            aiResponseContent = data.choices?.[0]?.message?.content || 'No response from Cohere Command A+.';

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
