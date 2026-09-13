'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const MODEL_CATEGORIES = [
    {
        category: "Fast Models",
        models: [
            { name: "Gemini 3.6 Flash", icon: "https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png", provider: "gemini" },
            { name: "Groq: GPT-OSS-120b", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHVsO5kFrri_uqZdlB6mACC2bdyyy6D0bYag&s", provider: "groq" },
        ]
    },
    {
        category: "Reasoning + Fast Models",
        models: [
            { name: "DeepSeek-V4.1-Flash", icon: "https://img.icons8.com/color/512/deepseek.png", provider: "deepseek" },
            { name: "Nova 2 Lite", icon: "https://images.seeklogo.com/logo-png/31/1/amazon-web-services-aws-logo-png_seeklogo-319188.png", provider: "nova" },
            { name: "Mistral Large 3", icon: "https://cdn.rayonlabs.ai/chutes/logos/mistral.webp", provider: "mistral" },
        ]
    },
    {
        category: "Advanced Models",
        models: [
            { name: "GPT-5.4", icon: "https://static.vecteezy.com/system/resources/previews/022/227/364/non_2x/openai-chatgpt-logo-icon-free-png.png", provider: "gpt54" },
            { name: "Grok 4.6", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2jp_76g7jO8SNGczRg1HUW8qa_vHiVaUBJQ&s", provider: "grok-4.6" },
            { name: "Muse Glimmer 30B", icon: "https://static.dezeen.com/uploads/2021/11/meta-facebook-rebranding-name-news_dezeen_2364_col_sq.jpg", provider: "muse" },
            { name: "Cohere Command A+", icon: "https://avatars.githubusercontent.com/u/54850923?s=280&v=4", provider: "cohere" },
        ]
    }
];

const AVAILABLE_MODELS = MODEL_CATEGORIES.flatMap(cat => cat.models);


interface Message {
    id: string;
    content: string;
    image?: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AskAlloyProps {
    defaultOpen?: boolean;
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    showFloatingButton?: boolean;
    inline?: boolean;
    stagedImage?: string | null;
    onClearStagedImage?: () => void;
}

const AskAlloy: React.FC<AskAlloyProps> = ({ defaultOpen = false, isOpen: controlledIsOpen, onOpenChange, showFloatingButton = true, inline = false, stagedImage, onClearStagedImage }) => {
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
    const [selectedModel, setSelectedModel] = useState("Gemini 3.6 Flash");
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    const initialTextRef = useRef('');

    const toggleListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in your browser. Please use Google Chrome or Microsoft Edge.");
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            initialTextRef.current = inputValue;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                let spokenText = '';
                for (let i = 0; i < event.results.length; i++) {
                    spokenText += event.results[i][0].transcript;
                }
                if (spokenText) {
                    const prefix = initialTextRef.current ? `${initialTextRef.current.trim()} ` : '';
                    setInputValue(prefix + spokenText);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    alert("Microphone permission was denied. Please allow microphone access in your browser settings to use voice input.");
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Microphone or speech recognition error:", err);
            setIsListening(false);
        }
    };

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setInputValue(prev => prev ? `${prev}\n[Attached PDF: ${file.name}]` : `[Attached PDF: ${file.name}]`);
        e.target.value = '';
    };
    const suggestionChips = [
        {
            title: "Generate Ideas",
            description: "Brainstorm concepts and creative solutions"
        },
        {
            title: "Refine Content",
            description: "Improve writing style and clarity"
        },
        {
            title: "Explain Clearly",
            description: "Break down complex topics simply"
        },
        {
            title: "Summarize Notes",
            description: "Extract key points from long texts"
        }
    ];

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(!isOpen);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'; // Reset to calculate true height
            const scrollHeight = inputRef.current.scrollHeight;
            const maxHeight = 160; // Max height before scrolling

            inputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
            inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    }, [inputValue]);

    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const redirectToLogin = () => {
        localStorage.setItem("lastRoom", pathname || "/");
        router.push("/login");
    };

    const handleOpen = () => {
        if (status === "unauthenticated") {
            redirectToLogin();
            return;
        }

        if (status === "loading") {
            return;
        }

        setIsOpen(true);
    };

    const handleSend = async (overrideText?: string, overrideImage?: string) => {
        // Authenticate before allowing send via real NextAuth session
        if (status === "unauthenticated") {
            redirectToLogin();
            return;
        }

        if (status === "loading" || !session) {
            return;
        }

        const textToSend = overrideText !== undefined ? overrideText : inputValue;
        const imageToSend = overrideImage || stagedImage || undefined;
        if (!textToSend.trim() && !imageToSend) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: textToSend,
            image: imageToSend,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        if (overrideText === undefined) {
            setInputValue('');
            if (stagedImage && onClearStagedImage) {
                onClearStagedImage();
            }
        }
        setIsTyping(true);

        try {
            const currentModel = AVAILABLE_MODELS.find(m => m.name === selectedModel);
            const provider = currentModel?.provider || 'gemini';

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    selectedModel,
                    messages,
                    userMessage,
                    systemPrompt: process.env.NEXT_PUBLIC_SYSTEM_PROMPT || "You are a helpful, friendly, and concise AI assistant for a notes and ideas app."
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    redirectToLogin();
                    return;
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown'}`);
            }

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.content || 'No response from model.',
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: unknown) {
            console.error('Error fetching model response:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: error instanceof Error ? error.message : 'Sorry, there was an error processing your request. Please try again.',
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
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

        .grid-bg {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

            {!isOpen && showFloatingButton && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 z-50 px-6 py-6 rounded-full bg-[#00C753] hover:bg-[#00a344] text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                    style={{
                        animation: 'glow 2s ease-in-out infinite'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-white" />
                        Ask Elloy
                    </div>
                </button>
            )}

            {(isOpen || inline) && (
                <>
                    {!inline && (
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                            onClick={() => setIsOpen(false)}
                            style={{ animation: 'fadeIn 0.3s ease-out' }}
                        />
                    )}

                    <div
                        className={inline ? "flex flex-col w-95 xl:w-120 h-full border-l border-zinc-800/50 bg-[#121214] shrink-0 z-20" : "fixed top-0 right-0 h-full w-full md:w-[40%] lg:w-[35%] bg-[#121214] z-50 shadow-2xl border-l border-white/10"}
                        style={{
                            animation: !inline ? (isOpen ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in') : 'none',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#121214] shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-2 border-[#00C753] p-0.5 flex items-center justify-center overflow-hidden">
                                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00C753] rounded-full border-2 border-[#121214]" />
                                    </div>
                                    <div>
                                        <h2 className={inline ? "text-base font-bold text-white leading-tight" : "text-xl font-bold text-white"}>Ask Elloy</h2>
                                        <p className={inline ? "text-[10px] text-gray-400" : "text-sm text-gray-400"}>Your intelligent assistant for notes, ideas, and collaboration</p>
                                    </div>
                                </div>
                                {!inline && (
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors p-2"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                <div ref={scrollRef} className="flex flex-col">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full min-h-100 text-center space-y-6 px-4 my-auto">
                                            <div className="flex items-center justify-center">
                                                <div className="w-32 h-32 bg-[#00C753] rounded-full flex items-center justify-center shadow-xl">
                                                    <img src="/Elloy-logo.png" alt="Elloy" className="w-28 h-28 object-contain" />
                                                </div>
                                            </div>
                                            <div className="space-y-2 max-w-sm mx-auto">
                                                <h3 className="text-2xl font-bold text-white tracking-tight">Ask anything about your notes or ideas</h3>
                                                <p className="text-gray-400 text-sm leading-relaxed">Get instant help, generate ideas, or understand content faster</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message, index) => {
                                                const previousMessage = messages[index - 1];
                                                const groupedWithPrevious = previousMessage?.sender === message.sender;

                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${index === 0 ? 'mt-0' : groupedWithPrevious ? 'mt-1.5' : 'mt-3'}`}
                                                        style={{
                                                            animation: `fadeIn 0.3s ease-out ${Math.min(index, 4) * 0.06}s both`
                                                        }}
                                                    >
                                                        <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] mb-[8px] ${message.sender === 'user' ? 'items-end self-end' : 'items-start self-start'}`}>
                                                            {message.image && (
                                                                <div
                                                                    className={`group relative transition-all duration-300 hover:scale-[1.02] w-fit max-w-full rounded-[12px] overflow-hidden ${message.sender === 'user' ? 'shadow-[0_12px_36px_rgba(46,255,133,0.25)]' : 'shadow-[0_8px_30px_rgba(0,0,0,0.5)]'}`}
                                                                >
                                                                    <img src={message.image} alt="User attachment" className="block max-w-full max-h-[280px] object-contain rounded-[12px] m-0 p-0" />
                                                                </div>
                                                            )}
                                                            {message.content && (
                                                                <div
                                                                    className={`px-[14px] py-[10px] transition-all duration-300 w-fit max-w-full ${message.image ? 'mt-[8px]' : ''} ${message.sender === 'user'
                                                                        ? 'rounded-[20px] rounded-tr-[4px] bg-[#2EFF85] text-[#09090B]'
                                                                        : 'rounded-[20px] rounded-tl-[4px] bg-[#202024] text-[#F4F4F5] border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                                                                        }`}
                                                                    style={{ animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                                                                >
                                                                    {message.sender === 'ai' ? (
                                                                        <div className="text-[14px] leading-[1.5] prose prose-invert prose-p:leading-[1.5] prose-p:my-1 max-w-none wrap-break-word font-medium text-zinc-100">
                                                                            <ReactMarkdown>
                                                                                {message.content}
                                                                            </ReactMarkdown>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[14px] leading-[1.5] whitespace-pre-wrap wrap-break-word font-medium">{message.content}</p>
                                                                    )}
                                                                    <div className="mt-[4px] flex justify-end">
                                                                        <span className={`text-[11px] opacity-60 ${message.sender === 'user' ? 'text-[#09090B]' : 'text-zinc-400'}`}>
                                                                            {formatTime(message.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isTyping && (
                                                <div className="flex justify-start mt-3" style={{ animation: 'fadeIn 0.25s ease-out both' }}>
                                                    <div className="bg-[#202024] border border-white/10 rounded-[20px] rounded-tl-[4px] px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                                                        <div className="flex gap-1.5">
                                                            <div
                                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                                style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
                                                            />
                                                            <div
                                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                                style={{ animation: 'pulse 1.4s ease-in-out 0.2s infinite' }}
                                                            />
                                                            <div
                                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
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

                            <div className="p-3.5 border-t border-white/10 bg-[#121214]">
                                <div className="relative mb-2">
                                    {/* Model Selection Dropdown Popup Wrapper */}
                                    <AnimatePresence>
                                        {showModels && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute bottom-10 left-1 z-50 w-60 bg-[#202024] border border-white/10 rounded-[16px] shadow-2xl overflow-hidden shadow-black/80"
                                            >
                                                <div className="max-h-56 overflow-y-auto w-full py-1.5 no-scrollbar">
                                                    {MODEL_CATEGORIES.map(category => (
                                                        <div key={category.category} className="mb-2 px-1.5">
                                                            {/* Category Label */}
                                                            <div className="flex items-center gap-2 mb-1 pl-2">
                                                                <span className="text-[10px] font-semibold text-[#2EFF85]/70 uppercase tracking-wider">
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
                                                                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-2.5 
                                                                    ${selectedModel === model.name ? 'bg-[#2EFF85]/15 text-[#2EFF85] font-semibold' : 'text-zinc-200 hover:bg-white/10 hover:text-white'}`}
                                                                >
                                                                    <div className="w-5 h-5 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-white/10">
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

                                <div className="flex flex-col justify-between bg-[#202024] rounded-2xl border border-[#2EFF85]/30 focus-within:border-[#2EFF85]/70 focus-within:shadow-[0_0_8px_rgba(46,255,133,0.15)] p-2.5 transition-all duration-300 relative">
                                    {stagedImage && (
                                        <div className="relative mb-2 shrink-0 self-start">
                                            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 p-1 flex items-center justify-center max-w-44">
                                                <img src={stagedImage} alt="Staged attachment" className="rounded-lg object-contain max-h-24" />
                                            </div>
                                            <button
                                                onClick={onClearStagedImage}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-[#202024]"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="Ask me anything..."
                                        className="w-full bg-transparent border-0 text-zinc-100 placeholder:text-zinc-400 focus:outline-none text-sm px-1.5 pt-0.5 pb-0 min-h-5 resize-none leading-relaxed no-scrollbar"
                                        style={{ overflowY: 'hidden', maxHeight: '120px' }}
                                    />

                                    <div className="flex items-center justify-between w-full mt-1.5">
                                        {/* Model Selector Button */}
                                        <button
                                            onClick={() => setShowModels(!showModels)}
                                            title="Select Model"
                                            className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 h-8 rounded-full border transition-colors shrink-0
                                                ${showModels ? 'bg-[#2B2B30] border-[#2EFF85]/60 text-[#2EFF85]' : 'bg-[#2B2B30] border-white/10 text-zinc-200 hover:border-[#2EFF85]/40 hover:text-white'}`}
                                        >
                                            {(() => {
                                                const currentModelObj = AVAILABLE_MODELS.find(m => m.name === selectedModel);
                                                return currentModelObj ? (
                                                    <div className="w-5.5 h-5.5 rounded-full overflow-hidden shrink-0 border border-white/20">
                                                        <img src={currentModelObj.icon} alt={selectedModel} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : null;
                                            })()}
                                            <span className="text-[11px] font-semibold whitespace-nowrap">{selectedModel}</span>
                                            <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => pdfInputRef.current?.click()}
                                                className="hover:opacity-80 transition-opacity p-0.5"
                                                title="Upload PDF Document"
                                            >
                                                <img src="/pdfs-icons.png" alt="PDF Document" className="w-[26px] h-[26px] object-contain" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={pdfInputRef}
                                                onChange={handlePdfUpload}
                                                accept="application/pdf"
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={toggleListening}
                                                className={`transition-all p-1 rounded-full ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-zinc-300 hover:text-white'}`}
                                                title={isListening ? "Listening... Click to stop" : "Voice Input"}
                                            >
                                                <Mic className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={status === "loading" || (!inputValue.trim() && !stagedImage)}
                                                className="bg-[#2B2B30] hover:bg-[#2EFF85] hover:text-[#161618] text-zinc-200 border border-white/10 rounded-lg w-8 h-8 p-0 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
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
