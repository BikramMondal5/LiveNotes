'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Grid Pattern Component
const GridPattern = ({ size = 80 }: { size?: number }) => {
    return (
        <svg className="absolute inset-0 w-full h-full">
            <defs>
                <pattern
                    id="grid-pattern-livenotes"
                    width={size}
                    height={size}
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d={`M ${size} 0 L 0 0 0 ${size}`}
                        fill="none"
                        stroke="rgba(46, 255, 133, 0.08)"
                        strokeWidth="1"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern-livenotes)" />
        </svg>
    );
};

// Neon Glow Component
const NeonGlow = ({ className = '' }: { className?: string }) => {
    return (
        <motion.div
            className={`absolute rounded-full blur-[120px] ${className}`}
            animate={{
                scale: [1, 1.1, 1],
                opacity: [0.08, 0.15, 0.08],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
};

// Main Component
const LiveNotesHero = () => {
    const router = useRouter();
    const [roomInput, setRoomInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleJoinRoom = () => {
        if (!roomInput.trim()) {
            const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomInput(randomId);
            console.log('Generated room ID:', randomId);
            router.push(`/room/${randomId}`);
        } else {
            console.log('Joining room:', roomInput);
            router.push(`/room/${roomInput}`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleJoinRoom();
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#09090B]">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-100">
                <GridPattern size={80} />
            </div>

            {/* Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#09090B]/60" />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#09090B]/40" />

            {/* Neon Glows */}
            <NeonGlow className="top-[5%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#2EFF85]" />
            <NeonGlow className="top-[20%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#2EFF85]" />

            {/* Navbar */}
            <nav className="relative z-20 w-full px-6 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="LiveNotes Logo" className="w-10 h-10 object-cover rounded-full" />
                        <span className="text-xl font-bold text-white">LiveNotes</span>
                    </div>

                    <div className="flex items-center gap-8">
                        <a
                            href="#"
                            className="text-sm text-[#A1A1AA] hover:text-[#2EFF85] transition-colors"
                        >
                            About
                        </a>
                        <a
                            href="https://github.com/BikramMondal5"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#A1A1AA] hover:text-[#2EFF85] transition-colors flex items-center gap-2"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-88px)] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="max-w-4xl mx-auto text-center space-y-8"
                >
                    {/* Heading */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight tracking-tight">
                            Start Writing.{' '}
                            <span className="text-[#2EFF85] relative inline-block">
                                Share Instantly.
                                <div className="absolute -inset-4 bg-[#2EFF85] opacity-20 blur-3xl -z-10" />
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
                            Create a room and collaborate in real-time with your friends.
                        </p>
                    </div>

                    {/* Input + Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative max-w-2xl mx-auto"
                    >
                        <div className="relative">
                            {/* Glow behind input */}
                            <div
                                className={`absolute -inset-2 bg-[#2EFF85] opacity-0 blur-2xl transition-opacity duration-300 ${isFocused ? 'opacity-20' : ''
                                    }`}
                            />

                            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#111111] rounded-3xl sm:rounded-full p-2 border border-[#2EFF85]/20 transition-all duration-300 hover:border-[#2EFF85]/40">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={roomInput}
                                    onChange={(e) => setRoomInput(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter your name or room code..."
                                    className="w-full sm:flex-1 bg-transparent text-white placeholder:text-[#A1A1AA] px-4 sm:px-6 py-3 sm:py-4 outline-none text-base md:text-lg font-['Times_New_Roman',Times,serif]"
                                />
                                <motion.button
                                    onClick={handleJoinRoom}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto relative px-6 sm:px-8 py-3 sm:py-4 bg-[#2EFF85] text-[#09090B] font-semibold rounded-2xl sm:rounded-full text-base md:text-lg overflow-hidden group"
                                >
                                    <span className="relative z-10">Join Room</span>
                                    <div className="absolute inset-0 bg-[#2EFF85] opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: '100%' }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Helper Text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex items-center justify-center gap-3 text-xs md:text-sm text-[#A1A1AA]"
                    >
                        <span>No sign-up required</span>
                        <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
                        <span>Free forever</span>
                        <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
                        <span>End-to-end encrypted</span>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default LiveNotesHero;