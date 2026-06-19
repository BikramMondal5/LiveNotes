"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState<string | null>(null);
    const errorMessage =
        authError === "OAuthCallback"
            ? "Google sign-in could not finish. Check the Google OAuth callback URL and Vercel auth environment variables."
            : authError
                ? "Sign-up failed. Please try again."
                : "";

    useEffect(() => {
        setAuthError(new URLSearchParams(window.location.search).get("error"));
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // This triggers the credentials provider. In a real app,
        // you would first create the user in the database via a custom API endpoint,
        // then sign them in. For now, we reuse the credentials signIn.
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            console.error(result.error);
        } else {
            const lastRoom = localStorage.getItem("lastRoom") || "/";
            router.push(lastRoom);
        }
    };

    const handleOAuthLogin = (provider: "google" | "github") => {
        const lastRoom = localStorage.getItem("lastRoom") || "/";
        signIn(provider, { callbackUrl: lastRoom });
    };

    return (
        <div className="min-h-screen w-full bg-[#161618] flex items-center justify-center text-zinc-300 font-sans px-4 relative overflow-hidden">
            {/* Ambient background effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2EFF85]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-sm bg-[#161618] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-12 h-12 bg-[#2EFF85]/10 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="text-[#2EFF85] w-6 h-6 ml-1" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
                    <p className="text-sm text-zinc-400 mt-2">Join Ask Elloy and start collaborating</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    {errorMessage ? (
                        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {errorMessage}
                        </p>
                    ) : null}

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#2EFF85] hover:bg-[#28e075] text-[#161618] font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2 flex justify-center items-center gap-2"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <hr className="flex-1 border-white/10" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Or sign up with</span>
                    <hr className="flex-1 border-white/10" />
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleOAuthLogin('google')}
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
                        type="button"
                        onClick={() => handleOAuthLogin('github')}
                        className="w-full bg-[#0a0a0a] hover:bg-[#111] border border-white/10 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-3"
                    >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                        </svg>
                        GitHub
                    </button>
                </div>

                <p className="text-center text-sm text-zinc-500 mt-6">
                    Already have an account? <Link href="/login" className="text-[#2EFF85] hover:text-[#28e075] transition-colors font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
