'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { getCachedStars, fetchAndStoreStars } from '@/lib/githubStars';

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
    const [githubStars, setGithubStars] = useState<number | null>(() => getCachedStars());
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Fetch GitHub stars ONLY when the root `/` page is visited or refreshed
    useEffect(() => {
        let isMounted = true;
        fetchAndStoreStars().then((count) => {
            if (isMounted && typeof count === 'number') {
                setGithubStars(count);
            }
        });
        return () => {
            isMounted = false;
        };
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
                        {/* Star on GitHub Split Badge */}
                        <a
                            href="https://github.com/BikramMondal5/LiveNotes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center h-8 rounded-[8px] bg-[#1C1C1C] hover:bg-[#242424] border border-white/10 hover:border-white/20 text-xs font-medium text-zinc-300 hover:text-white transition-all duration-200 overflow-hidden group shadow-sm shrink-0"
                            title="Star LiveNotes on GitHub"
                        >
                            {/* Left Div: GitHub Icon + Text */}
                            <div className="flex items-center gap-1.5 px-2.5 h-full border-r border-white/10 group-hover:border-white/20 transition-colors">
                                <svg className="w-3.5 h-3.5 fill-current text-zinc-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                                </svg>
                                <span className="truncate">Star on GitHub</span>
                            </div>
                            {/* Right Div: Yellow Star + Live Count */}
                            <div className="flex items-center gap-1 px-2.5 h-full bg-[#161618]/60 group-hover:bg-[#1a1a1d] transition-colors text-zinc-300 font-semibold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{githubStars !== null ? githubStars : "2"}</span>
                            </div>
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