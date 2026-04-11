'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Sparkles } from 'lucide-react';

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestionChips = [
        'Generate code',
        'Fix a bug',
        'Explain a concept',
        'Design UI'
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

        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "I'm here to help! This is a demo response. In a real implementation, I would process your request and provide helpful assistance.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChipClick = (chip: string) => {
        setInputValue(chip);
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
                        <Sparkles className="w-5 h-5" />
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
                                            <Sparkles className="w-6 h-6 text-white" />
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
                                                    <Sparkles className="w-12 h-12 text-green-500" />
                                                </div>
                                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-semibold text-white">What can I help you with today?</h3>
                                                <p className="text-gray-400 text-sm">Choose a suggestion or ask anything</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 justify-center max-w-md">
                                                {suggestionChips.map((chip, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleChipClick(chip)}
                                                        className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 hover:bg-green-500/20 hover:border-green-500/50 hover:text-green-400 cursor-pointer transition-all duration-300 rounded-full text-sm"
                                                    >
                                                        {chip}
                                                    </button>
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
                                <div className="flex items-center gap-2 bg-white/5 rounded-2xl border border-white/10 p-2 focus-within:border-green-500/50 transition-colors">
                                    <button className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex-shrink-0 p-2">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask anything..."
                                        className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus:outline-none text-sm"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim()}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full w-10 h-10 p-0 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
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
