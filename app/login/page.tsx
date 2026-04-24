"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Github } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock auth logic for now
        localStorage.setItem("isLoggedIn", "true");

        // Redirect back to the room the user came from, or home
        const lastRoom = localStorage.getItem("lastRoom") || "/";
        router.push(lastRoom);
    };

    return (
        <div className="min-h-screen w-full bg-[#161618] flex items-center justify-center text-zinc-300 font-sans px-4 relative overflow-hidden">
            {/* Ambient background effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2EFF85]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-sm bg-[#161618] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-12 h-12 bg-[#2EFF85]/10 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="text-[#2EFF85] w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
                    <p className="text-sm text-zinc-400 mt-2">Sign in to Ask Elloy and collaborate</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#2EFF85] hover:bg-[#28e075] text-[#161618] font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
                    >
                        Sign In
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <hr className="flex-1 border-white/10" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Or continue with</span>
                    <hr className="flex-1 border-white/10" />
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleLogin}
                        className="w-full bg-[#0a0a0a] hover:bg-[#111] border border-white/10 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        onClick={handleLogin}
                        className="w-full bg-[#0a0a0a] hover:bg-[#111] border border-white/10 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-3"
                    >
                        <Github className="w-5 h-5 text-white" />
                        GitHub
                    </button>
                </div>

                <p className="text-center text-sm text-zinc-500 mt-6">
                    Don't have an account? <Link href="/signup" className="text-[#2EFF85] hover:text-[#28e075] transition-colors font-medium">Sign up</Link>
                </p>
            </div>
        </div>
    );
}