'use client';

import React, { useState } from 'react';
import { X, Send, Search, Brain, Code } from 'lucide-react';

interface ChatAssistantProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatAssistant({ isOpen, onClose }: ChatAssistantProps) {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [activeTab, setActiveTab] = useState<'think' | 'search' | 'code'>('think');

    const examplePrompts = [
        {
            title: 'How do you fine-tune an audio model with Unsloth?',
            icon: '🎵'
        },
        {
            title: 'Solve the integral of x sin(x), and verify it',
            icon: '∫'
        },
        {
            title: 'Create a live weather dashboard in HTML, using no API key. Show me the code',
            icon: '🌦'
        },
        {
            title: 'Draw an SVG of a cute sloth',
            icon: '🦥'
        },
        {
            title: 'what are the top 10 highest gossiping movies of 2026 so far.',
            icon: '🎬'
        }
    ];

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMessage: { role: 'user' | 'assistant'; content: string } = { role: 'user', content: inputValue };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');

        // Simulate assistant response (in real app, would call API)
        setTimeout(() => {
            const assistantMessage: { role: 'user' | 'assistant'; content: string } = {
                role: 'assistant',
                content: 'This is a placeholder response. Connect to your AI model here.'
            };
            setMessages([...newMessages, assistantMessage]);
        }, 500);
    };

    const handleExampleClick = (prompt: string) => {
        setInputValue(prompt);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex bg-black/40">
            {/* Backdrop */}
            <div className="flex-1" onClick={onClose} />

            {/* Right Sidebar */}
            <div className="w-96 bg-[#1A1A1A] border-l border-zinc-800 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Chat with Elloy</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Your AI code and content assistant</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        // Empty state with example prompts
                        <div>
                            <div className="text-center mb-6">
                                <div className="text-4xl mb-3">🤖</div>
                                <h3 className="text-sm font-medium text-white mb-1">Chat with your model</h3>
                                <p className="text-xs text-zinc-400">Run code snippets, solve problems, and generate content with AI</p>
                            </div>

                            <div className="space-y-2">
                                {examplePrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleExampleClick(prompt.title)}
                                        className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800 hover:border-zinc-700 group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg shrink-0">{prompt.icon}</span>
                                            <p className="text-xs text-zinc-300 group-hover:text-white line-clamp-2">{prompt.title}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Messages
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.role === 'user'
                                            ? 'bg-[#2EFF85] text-[#0A0A0A]'
                                            : 'bg-zinc-800 text-zinc-100'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-zinc-800 p-4 space-y-3">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('think')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'think'
                                    ? 'bg-[#2EFF85] text-[#0A0A0A]'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                        >
                            <Brain className="w-3.5 h-3.5" />
                            Think
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'search'
                                    ? 'bg-[#2EFF85] text-[#0A0A0A]'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                        >
                            <Search className="w-3.5 h-3.5" />
                            Search
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'code'
                                    ? 'bg-[#2EFF85] text-[#0A0A0A]'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                        >
                            <Code className="w-3.5 h-3.5" />
                            Code
                        </button>
                    </div>

                    {/* Input Field */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask anything..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#2EFF85] transition-colors"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            className="p-2 rounded bg-[#2EFF85] text-[#0A0A0A] hover:bg-[#25dd72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
