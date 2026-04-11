'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// API configuration - Get keys dynamically from env vars
const getApiKey = (provider: string) => {
    if (typeof window !== 'undefined') {
        switch (provider) {
            case 'gemini': return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
            case 'groq': return process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
            case 'anthropic': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'openai': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'deepseek': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'nova': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'mistral': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'perplexity': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'qwen': return process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY || '';
            case 'gpt4o': return process.env.NEXT_PUBLIC_GITHUB_TOKEN || '';
            case 'grok': return process.env.NEXT_PUBLIC_GITHUB_TOKEN || '';
            default: return '';
        }
    }
    return '';
};

// Map each provider strictly to their API endpoint
const API_URLS: Record<string, string> = {
    gemini: "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    anthropic: "https://gen.pollinations.ai/v1/chat/completions",
    openai: "https://gen.pollinations.ai/v1/chat/completions",
    deepseek: "https://gen.pollinations.ai/v1/chat/completions",
    nova: "https://gen.pollinations.ai/v1/chat/completions",
    mistral: "https://gen.pollinations.ai/v1/chat/completions",
    perplexity: "https://gen.pollinations.ai/v1/chat/completions",
    qwen: "https://gen.pollinations.ai/v1/chat/completions",
    gpt4o: "https://models.inference.ai.azure.com/chat/completions",
    grok: "https://models.inference.ai.azure.com/chat/completions"
};

const MODEL_CATEGORIES = [
    {
        category: "Reasoning Models",
        models: [
            { name: "Deepseek V3.2", icon: "https://img.icons8.com/color/512/deepseek.png", provider: "deepseek" },
            { name: "Perplexity Sonar", icon: "https://framerusercontent.com/images/gcMkPKyj2RX8EOEja8A1GWvCb7E.jpg?width=2000&height=2000", provider: "perplexity" },
            { name: "Qwen3.5 Plus", icon: "https://qwenlm.github.io/img/logo.png", provider: "qwen" },
        ]
    },
    {
        category: "Fast Models",
        models: [
            { name: "Groq", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHVsO5kFrri_uqZdlB6mACC2bdyyy6D0bYag&s", provider: "groq" },
            { name: "Amazon Nova Micro", icon: "https://d2908q01vomqb2.cloudfront.net/da4b9237bacccdf19c0760cab7aec4a8359010b0/2025/11/25/Nova-1.png", provider: "nova" },
        ]
    },
    {
        category: "General Chat",
        models: [
            { name: "Grok 3", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2jp_76g7jO8SNGczRg1HUW8qa_vHiVaUBJQ&s", provider: "grok" },
            { name: "OpenAI GPT-4o", icon: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png", provider: "gpt4o" },
        ]
    },
    {
        category: "Multi-step Tasks",
        models: [
            { name: "OpenAI GPT-5 Mini", icon: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png", provider: "openai" },
            { name: "Claude Haiku 4.5", icon: "https://woopt.modeltheme.com/wp-content/uploads/2025/07/04claude.png", provider: "anthropic" },
        ]
    },
    {
        category: "Lightweight Models",
        models: [
            { name: "gemini-2.5-flash", icon: "https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png", provider: "gemini" },
            { name: "Mistral Small 3.2 24B", icon: "https://cdn.rayonlabs.ai/chutes/logos/mistral.webp", provider: "mistral" },
        ]
    }
];

const AVAILABLE_MODELS = MODEL_CATEGORIES.flatMap(cat => cat.models);


interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AskAlloyProps {
    defaultOpen?: boolean;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    showFloatingButton?: boolean;
}

const AskAlloy: React.FC<AskAlloyProps> = ({ defaultOpen = false, isOpen: controlledIsOpen, onOpenChange, showFloatingButton = true }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

    const setIsOpen = (value: boolean) => {
        if (controlledIsOpen === undefined) {
            setInternalIsOpen(value);
        }
        onOpenChange?.(value);
    };
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showModels, setShowModels] = useState(false);
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestionChips = [
        {
            title: "Generate Code",
            description: "Write a React component with hooks"
        },
        {
            title: "Fix a Bug",
            description: "Debug and optimize my TypeScript code"
        },
        {
            title: "Explain Concepts",
            description: "Clarify how machine learning works"
        },
        {
            title: "Design UI",
            description: "Create a modern dashboard layout"
        }
    ];

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Get current model info
            const currentModel = AVAILABLE_MODELS.find(m => m.name === selectedModel);
            const provider = currentModel?.provider || 'gemini';
            const API_KEY = getApiKey(provider);

            if (!API_KEY) {
                throw new Error(`API key not configured for ${provider}`);
            }

            let aiResponseContent = "I'm here to help! Model: " + selectedModel;

            // For now, use demo response. In production, call actual API
            // TODO: Implement actual API calls based on provider

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: aiResponseContent,
                sender: 'ai',
                timestamp: new Date()
            };

            setTimeout(() => {
                setMessages(prev => [...prev, aiMessage]);
                setIsTyping(false);
            }, 1500);

        } catch (error) {
            console.error("Error fetching model response:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Sorry, there was an error processing your request. Please try again.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChipClick = (chip: { title: string; description: string }) => {
        setInputValue(chip.title);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(34, 197, 94, 0.2);
          }
        }

        .noise-bg {
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.03) 0%, transparent 50%);
        }

        .grid-bg {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

            {!isOpen && showFloatingButton && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 px-6 py-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                    style={{
                        animation: 'glow 2s ease-in-out infinite'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <img src="/Elloy-logo.png" alt="Elloy" className="w-5 h-5" />
                        Ask Alloy
                    </div>
                </button>
            )}

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                        onClick={() => setIsOpen(false)}
                        style={{ animation: 'fadeIn 0.3s ease-out' }}
                    />

                    <div
                        className="fixed top-0 right-0 h-full w-full md:w-[40%] lg:w-[35%] bg-gradient-to-b from-[#0a0a0a] to-[#0f172a] z-50 shadow-2xl border-l border-white/10 noise-bg"
                        style={{
                            animation: isOpen ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                            <img src="/Elloy-logo.png" alt="Elloy" className="w-6 h-6" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a] animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Ask Alloy</h2>
                                        <p className="text-sm text-gray-400">Your AI assistant for coding, ideas, and workflows</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors p-2"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div ref={scrollRef} className="space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6">
                                            <div className="relative">
                                                <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                                                    <img src="/Elloy-logo.png" alt="Elloy" className="w-12 h-12" />
                                                </div>
                                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-white">What can I help you with today?</h3>
                                                <p className="text-gray-400 text-sm">Choose a suggestion or ask anything</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                                                {suggestionChips.map((chip, index) => (
                                                    <motion.button
                                                        key={index}
                                                        onClick={() => handleChipClick(chip)}
                                                        whileHover={{ scale: 1.02, y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="group relative p-4 bg-white/5 border border-white/10 rounded-xl transition-all duration-300 hover:border-green-500/50 hover:bg-white/8 overflow-hidden"
                                                        style={{
                                                            animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                                                        }}
                                                    >
                                                        {/* Glow effect on hover */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

                                                        {/* Card content */}
                                                        <div className="relative z-10 text-left">
                                                            <h3 className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors duration-300 mb-1">
                                                                {chip.title}
                                                            </h3>
                                                            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 line-clamp-2">
                                                                {chip.description}
                                                            </p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message, index) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    style={{
                                                        animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                                                    }}
                                                >
                                                    <div
                                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === 'user'
                                                            ? 'bg-gray-800 text-white'
                                                            : 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 text-white border border-green-500/30'
                                                            }`}
                                                    >
                                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                                        <span className="text-xs text-gray-500 mt-1 block">
                                                            {formatTime(message.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {isTyping && (
                                                <div className="flex justify-start">
                                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-2xl px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <div
                                                                className="w-2 h-2 bg-green-500 rounded-full"
                                                                style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
                                                            />
                                                            <div
                                                                className="w-2 h-2 bg-green-500 rounded-full"
                                                                style={{ animation: 'pulse 1.4s ease-in-out 0.2s infinite' }}
                                                            />
                                                            <div
                                                                className="w-2 h-2 bg-green-500 rounded-full"
                                                                style={{ animation: 'pulse 1.4s ease-in-out 0.4s infinite' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-black/20">
                                <div className="relative mb-3">
                                    {/* Model Selection Dropdown Popup Wrapper */}
                                    <AnimatePresence>
                                        {showModels && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute bottom-12 left-2 z-50 w-64 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden shadow-black/50"
                                            >
                                                <div className="max-h-64 overflow-y-auto w-full py-2">
                                                    {MODEL_CATEGORIES.map(category => (
                                                        <div key={category.category} className="mb-3 px-2">
                                                            {/* Category Label */}
                                                            <div className="flex items-center gap-2 mb-1 pl-2">
                                                                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                                                                    {category.category}
                                                                </span>
                                                            </div>
                                                            {/* Iterate Through Models inside Category */}
                                                            {category.models.map(model => (
                                                                <button
                                                                    key={model.name}
                                                                    onClick={() => {
                                                                        setSelectedModel(model.name);
                                                                        setShowModels(false);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-3 
                                                                    ${selectedModel === model.name ? 'bg-purple-600/20 text-purple-300' : 'text-gray-200 hover:bg-[#2a2a2a]'}`}
                                                                >
                                                                    <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-white/10">
                                                                        <img src={model.icon} alt={model.name} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="truncate">{model.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/10 p-2 focus-within:border-green-500/50 transition-colors relative">
                                    {/* Model Selector Button */}
                                    <button
                                        onClick={() => setShowModels(!showModels)}
                                        title="Select Model"
                                        className={`flex items-center gap-2 pl-1 pr-3 py-0.5 rounded-full border transition-colors shrink-0
                                            ${showModels ? 'bg-[#2a2a2a] border-purple-500/60 text-purple-300' : 'bg-[#2a2a2a] border-[#444] text-gray-300 hover:border-purple-500/40 hover:text-gray-100'}`}
                                    >
                                        {(() => {
                                            const currentModelObj = AVAILABLE_MODELS.find(m => m.name === selectedModel);
                                            return currentModelObj ? (
                                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/20">
                                                    <img src={currentModelObj.icon} alt={selectedModel} className="w-full h-full object-cover" />
                                                </div>
                                            ) : null;
                                        })()}
                                        <span className="text-xs font-medium whitespace-nowrap">{selectedModel.split(' ')[0]}</span>
                                        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask anything..."
                                        className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus:outline-none text-sm py-2 px-2 h-12"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim()}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full w-10 h-10 p-0 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default AskAlloy;
