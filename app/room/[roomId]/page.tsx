"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Plus, Wand2, MousePointer2, Square, Circle, ArrowUpRight, Slash, PenLine, Type, Image as ImageIcon, Frame, HelpingHand, Settings, ChevronDown, MoreHorizontal, Sparkles } from "lucide-react";
import DotGrid from "../../components/DotGrid";

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const [notes, setNotes] = useState("");
    const socketRef = useRef<Socket | null>(null);
    const [activeTool, setActiveTool] = useState("square");
    const [viewMode, setViewMode] = useState("canvas"); // document | both | canvas

    useEffect(() => {
        const socket = io();
        socketRef.current = socket;
        socket.emit("join-room", roomId);
        socket.on("update-notes", (newNotes: string) => {
            setNotes(newNotes);
        });
        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNotes(value);
        if (socketRef.current) {
            socketRef.current.emit("edit-notes", { roomId, notes: value });
        }
    };

    return (
        <div className="h-screen w-full bg-[#121212] flex flex-col overflow-hidden font-sans text-zinc-300">
            {/* Top Navigation */}
            <header className="flex h-14 w-full items-center justify-between border-b border-zinc-800/50 bg-[#1A1A1A] px-4 shrink-0">
                <div className="flex items-center gap-4 min-w-50">
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-sm bg-red-500 transform -skew-x-12 translate-x-1" />
                        <div className="w-4 h-4 rounded-sm bg-blue-500 transform -skew-x-12" />
                    </div>
                    <span className="text-sm font-medium text-zinc-100">Untitled File</span>
                </div>

                <div className="flex items-center bg-zinc-900 rounded-md p-1 border border-zinc-800">
                    <button
                        onClick={() => setViewMode("document")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'document' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Document
                    </button>
                    <button
                        onClick={() => setViewMode("both")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'both' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Both
                    </button>
                    <button
                        onClick={() => setViewMode("canvas")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'canvas' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Canvas
                    </button>
                </div>

                <div className="flex items-center gap-4 min-w-50 justify-end">
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-400 font-medium">
                        Ctrl K
                    </div>
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Sign in
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                        <Sparkles className="w-4 h-4" />
                        AI Chat
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex overflow-hidden bg-[#121212]">
                {/* Dot Grid Background */}
                <div className="absolute inset-0 z-0">
                    <DotGrid
                        dotSize={4}
                        gap={20}
                        baseColor="#3F3F46"
                        activeColor="#10B981"
                        proximity={100}
                        speedTrigger={50}
                        shockRadius={200}
                        shockStrength={4}
                    />
                </div>

                {/* Left Toolbar */}
                <div className="absolute left-4 top-4 flex flex-col gap-2 z-10 w-11">
                    {/* Top block */}
                    <div className="flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-sm">
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors group relative">
                            <Plus className="w-4 h-4" />
                            <span className="absolute right-1 bottom-1 text-[8px] text-zinc-600 group-hover:text-zinc-400">/</span>
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors group relative">
                            <Wand2 className="w-4 h-4" />
                            <span className="absolute right-1 bottom-0.5 text-[7px] text-zinc-600 group-hover:text-zinc-400 tracking-tighter">CTRL J</span>
                        </button>
                    </div>

                    {/* Tools block */}
                    <div className="flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-sm">
                        <ToolButton icon={MousePointer2} label="V" active={activeTool === 'pointer'} onClick={() => setActiveTool('pointer')} />
                        <ToolButton icon={Square} label="R" active={activeTool === 'square'} onClick={() => setActiveTool('square')} />
                        <ToolButton icon={Circle} label="O" active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} />
                        <ToolButton icon={ArrowUpRight} label="A" active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} />
                        <ToolButton icon={Slash} label="L" active={activeTool === 'line'} onClick={() => setActiveTool('line')} className="rotate-90" />
                        <ToolButton icon={PenLine} label="D" active={activeTool === 'draw'} onClick={() => setActiveTool('draw')} />
                        <ToolButton icon={Type} label="T" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                        <ToolButton icon={ImageIcon} label="I" active={activeTool === 'image'} onClick={() => setActiveTool('image')} />
                    </div>

                    {/* Bottom block */}
                    <div className="flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-sm">
                        <ToolButton icon={Frame} label="F" active={activeTool === 'frame'} onClick={() => setActiveTool('frame')} />
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 w-full h-full relative overflow-hidden z-5">
                    {/* The textarea overlaid invisibly or if viewMode includes document */}
                    <textarea
                        value={notes}
                        onChange={handleChange}
                        className={`absolute inset-0 w-full h-full p-20 bg-transparent border-0 outline-none resize-none placeholder:text-zinc-600/50 leading-relaxed text-zinc-400 tracking-wide z-0 ${viewMode === 'canvas' ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}
                        placeholder="Type to add notes, or use the canvas tools..."
                    />
                </div>

                {/* Right Top Zoom Control */}
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors z-10 px-2 py-1 rounded hover:bg-zinc-800">
                    100% <ChevronDown className="w-3 h-3 ml-0.5" />
                </div>

                {/* Bottom Right Help */}
                <div className="absolute bottom-6 right-6 z-10">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 backdrop-blur-sm transition-all shadow-lg">
                        <span className="font-semibold text-sm">?</span>
                    </button>
                </div>

            </div>
        </div>
    );
}

// Sub-component for Toolbar Buttons
function ToolButton({ icon: Icon, label, active, onClick, className = "" }: { icon: any, label: string, active: boolean, onClick: () => void, className?: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors group relative ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300'}`}
        >
            <Icon className={`w-4 h-4 ${className}`} />
            <span className="absolute right-1 bottom-1 text-[8px] font-medium opacity-50 text-zinc-500 group-hover:opacity-100">{label}</span>
        </button>
    );
}
