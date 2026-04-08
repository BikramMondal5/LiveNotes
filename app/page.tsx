'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Zap } from 'lucide-react';

import { useRouter } from 'next/navigation';

const LiveNotesHero = () => {
    const router = useRouter();
    const [roomInput, setRoomInput] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsLoaded(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleJoinRoom = () => {
        const roomId = roomInput.trim() || `room-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Joining room:', roomId);
        router.push(`/room/${roomId}`);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleJoinRoom();
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#09090B]">
            {/* Ambient Aura Effects */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Top center glow behind heading */}
                <div
                    className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[120px] animate-pulse"
                    style={{
                        background: 'radial-gradient(circle, #2EFF85 0%, transparent 70%)',
                        animationDuration: '8s',
                    }}
                />

                {/* Bottom glow near input area */}
                <div
                    className="absolute left-1/2 top-2/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[100px]"
                    style={{
                        background: 'radial-gradient(circle, #2EFF85 0%, transparent 70%)',
                        animation: 'float 10s ease-in-out infinite',
                    }}
                />

                {/* Subtle noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
                    }}
                />

                {/* Vignette effect */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(9, 9, 11, 0.8) 100%)',
                    }}
                />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2EFF85]/10 border border-[#2EFF85]/20">
                        <Zap className="h-5 w-5 text-[#2EFF85]" fill="#2EFF85" />
                    </div>
                    <span className="text-xl font-bold text-white">LiveNotes</span>
                </div>

                <div className="flex items-center gap-8">
                    <a
                        href="#about"
                        className="text-sm text-[#A1A1AA] transition-colors duration-300 hover:text-[#2EFF85]"
                    >
                        About
                    </a>
                    <a
                        href="#github"
                        className="flex items-center gap-2 text-sm text-[#A1A1AA] transition-colors duration-300 hover:text-[#2EFF85]"
                    >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span className="hidden sm:inline">GitHub</span>
                    </a>
                </div>
            </nav>

            {/* Hero Content */}
            <div
                className={`relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
            >
                <div className="w-full max-w-2xl text-center">
                    {/* Heading */}
                    <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
                        Start Writing.{' '}
                        <span
                            className="relative inline-block text-[#2EFF85]"
                            style={{
                                textShadow: '0 0 40px rgba(46, 255, 133, 0.3)',
                            }}
                        >
                            Share Instantly.
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="mb-12 text-lg text-[#A1A1AA] md:text-xl">
                        Create a room and collaborate in real-time with your friends.
                    </p>

                    {/* Input + Button */}
                    <div className="mx-auto mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="Enter your name or room code..."
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="h-14 w-full rounded-full border-[#27272A] bg-[#111111] px-6 text-base text-white placeholder:text-[#52525B] transition-all duration-300 focus:border-[#2EFF85] focus:shadow-[0_0_20px_rgba(46,255,133,0.2)] focus:ring-2 focus:ring-[#2EFF85]/20"
                            />
                        </div>

                        <Button
                            onClick={handleJoinRoom}
                            className="h-14 rounded-full bg-[#2EFF85] px-8 text-base font-semibold text-[#09090B] shadow-[0_0_30px_rgba(46,255,133,0.3)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#2EFF85] hover:shadow-[0_0_40px_rgba(46,255,133,0.5)]"
                        >
                            Join Room
                        </Button>
                    </div>

                    {/* Helper Text */}
                    <p className="text-sm text-[#71717A]">
                        No sign-up required • Free forever • End-to-end encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LiveNotesHero;
