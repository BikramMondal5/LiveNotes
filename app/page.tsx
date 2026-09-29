'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Star, Copy, Check } from 'lucide-react';
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
    const { data: session } = useSession();
    const [roomInput, setRoomInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [githubStars, setGithubStars] = useState<number | null>(null);
    const [pkgManager, setPkgManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun' | 'curl'>('npm');
    const [isSnippetCopied, setIsSnippetCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const packageManagers = [
        {
            id: 'npm' as const,
            name: 'npm',
            command: 'npm install -g livenotes',
            display: (
                <>
                    <span className="text-[#2EFF85] font-semibold">npm</span>{' '}
                    <span className="text-[#00E5FF]">install</span>{' '}
                    <span className="text-[#00E5FF]">-g</span>{' '}
                    <span className="text-[#00E5FF]">livenotes</span>
                </>
            ),
            icon: (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.13h13.74v13.74h-3.435V8.565h-3.435v10.305H5.13z" />
                </svg>
            ),
        },
        {
            id: 'pnpm' as const,
            name: 'pnpm',
            command: 'pnpm add -g livenotes',
            display: (
                <>
                    <span className="text-[#2EFF85] font-semibold">pnpm</span>{' '}
                    <span className="text-[#00E5FF]">add</span>{' '}
                    <span className="text-[#00E5FF]">-g</span>{' '}
                    <span className="text-[#00E5FF]">livenotes</span>
                </>
            ),
            icon: (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M0 0h7.5v7.5H0zm8.25 0h7.5v7.5h-7.5zm8.25 0H24v7.5h-7.5zM8.25 8.25h7.5v7.5h-7.5zm8.25 0H24v7.5h-7.5zM8.25 16.5h7.5V24h-7.5zm8.25 0H24V24h-7.5zM0 16.5h7.5V24H0z" />
                </svg>
            ),
        },
        {
            id: 'yarn' as const,
            name: 'yarn',
            command: 'yarn global add livenotes',
            display: (
                <>
                    <span className="text-[#2EFF85] font-semibold">yarn</span>{' '}
                    <span className="text-[#00E5FF]">global</span>{' '}
                    <span className="text-[#00E5FF]">add</span>{' '}
                    <span className="text-[#00E5FF]">livenotes</span>
                </>
            ),
            icon: (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.986 2.378c-.753-.448-1.706-.448-2.46 0L1.758 7.575C1.004 8.022.54 8.825.54 9.721v10.395c0 .895.464 1.698 1.218 2.146l8.768 5.197c.754.447 1.707.447 2.46 0l8.768-5.197c.754-.448 1.218-1.251 1.218-2.146V9.721c0-.896-.464-1.699-1.218-2.146z" />
                </svg>
            ),
        },
        {
            id: 'bun' as const,
            name: 'bun',
            command: 'bun add -g livenotes',
            display: (
                <>
                    <span className="text-[#2EFF85] font-semibold">bun</span>{' '}
                    <span className="text-[#00E5FF]">add</span>{' '}
                    <span className="text-[#00E5FF]">-g</span>{' '}
                    <span className="text-[#00E5FF]">livenotes</span>
                </>
            ),
            icon: (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93c-.96.09-1.92.09-2.88 0-.58-.06-.99-.54-.96-1.12.03-.58.53-.99 1.11-.96.9.05 1.79.05 2.69 0 .58-.03 1.08.38 1.11.96.03.58-.38 1.06-.96 1.12zM8.5 11c-.83 0-1.5-.67-1.5-1.5S7.67 8 8.5 8s1.5.67 1.5 1.5S9.33 11 8.5 11zm7 0c-.83 0-1.5-.67-1.5-1.5S14.67 8 15.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
            ),
        },
        {
            id: 'curl' as const,
            name: 'curl',
            command: 'curl -fsSL https://livenotes.app/install.sh | bash',
            display: (
                <>
                    <span className="text-[#2EFF85] font-semibold">curl</span>{' '}
                    <span className="text-[#00E5FF]">-fsSL</span>{' '}
                    <span className="text-[#00E5FF]">https://livenotes.app/install.sh</span>{' '}
                    <span className="text-zinc-400">|</span>{' '}
                    <span className="text-[#2EFF85]">bash</span>
                </>
            ),
            icon: (
                <span className="font-mono font-bold text-[11px] leading-none">&gt;_</span>
            ),
        },
    ];

    const currentPm = packageManagers.find((p) => p.id === pkgManager) || packageManagers[0];

    const handleCopySnippet = () => {
        navigator.clipboard.writeText("Comming Soon, Stay Tuned!");
        setIsSnippetCopied(true);
        setTimeout(() => setIsSnippetCopied(false), 2000);
    };

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Fetch GitHub stars ONLY when the root `/` page is visited or refreshed
    useEffect(() => {
        let isMounted = true;
        const cached = getCachedStars();
        if (cached !== null) {
            setGithubStars(cached);
        }
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
            router.push(`/${randomId}`);
        } else {
            console.log('Joining room:', roomInput);
            router.push(`/${roomInput}`);
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

                    <div className="flex items-center gap-3 sm:gap-8">
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
                            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 h-full border-r border-white/10 group-hover:border-white/20 transition-colors">
                                <svg className="w-3.5 h-3.5 fill-current text-zinc-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                                </svg>
                                <span className="hidden sm:inline truncate">Star on GitHub</span>
                            </div>
                            {/* Right Div: Yellow Star + Live Count */}
                            <div className="flex items-center gap-1 px-2 sm:px-2.5 h-full bg-[#161618]/60 group-hover:bg-[#1a1a1d] transition-colors text-zinc-300 font-semibold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span suppressHydrationWarning>{githubStars !== null ? githubStars : "2"}</span>
                            </div>
                        </a>

                        {session?.user && (
                            session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    className="w-8 h-8 rounded-full object-cover border border-white/10 ring-1 ring-white/5"
                                    title={session.user.name || session.user.email || "Logged in"}
                                />
                            ) : (
                                <div
                                    className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-white"
                                    title={session.user.name || session.user.email || "Logged in"}
                                >
                                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                            )
                        )}
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
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-none flex flex-col gap-1 sm:gap-2 items-center">
                            <span>Start Writing.</span>
                            <span className="text-[#2EFF85] relative inline-block">
                                Share Instantly.
                                <div className="absolute -inset-4 bg-[#2EFF85] opacity-20 blur-3xl -z-10" />
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
                            Share notes in real-time with your friends.<br></br>
                            Create a room with a name or join an existing room.
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

                    {/* CLI Install Snippet Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.35 }}
                        className="w-full max-w-2xl mx-auto -mt-5 sm:-mt-6"
                    >
                        <div className="rounded-2xl bg-[#111113]/90 border border-white/10 p-3 sm:p-4 text-left shadow-2xl backdrop-blur-md">
                            {/* Package Manager Tabs */}
                            <div className="bg-[#18181B] border border-white/5 rounded-xl p-1 inline-flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar">
                                {packageManagers.map((pm) => (
                                    <button
                                        key={pm.id}
                                        onClick={() => setPkgManager(pm.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${pkgManager === pm.id
                                            ? 'bg-[#27272A] text-white shadow-sm'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                            }`}
                                    >
                                        {pm.icon}
                                        <span>{pm.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Subtle divider */}
                            <div className="border-b border-white/5 my-3" />

                            {/* Command snippet + Copy button */}
                            <div className="bg-[#0A0A0C] border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
                                <code className="font-mono text-xs sm:text-sm whitespace-nowrap select-all">
                                    {currentPm.display}
                                </code>
                                <button
                                    onClick={handleCopySnippet}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-95 ml-2 cursor-pointer"
                                    title="Copy command"
                                >
                                    {isSnippetCopied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-[#2EFF85]" />
                                            <span className="text-[#2EFF85]">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom-left GitHub Creator Link */}
            <a
                href="https://github.com/BikramMondal5"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-5 left-5 z-30 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161618]/80 hover:bg-[#202024] border border-white/10 hover:border-[#2EFF85]/30 text-xs font-medium text-zinc-400 hover:text-white backdrop-blur-md transition-all duration-200 shadow-lg group"
                title="Bikram Mondal on GitHub"
            >
                <svg className="w-3.5 h-3.5 fill-current text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                </svg>
                <span>@BikramMondal5</span>
            </a>
        </div>
    );
};

export default LiveNotesHero;