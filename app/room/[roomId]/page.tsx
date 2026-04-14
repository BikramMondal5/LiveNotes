"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Plus, Wand2, MousePointer2, Square, Circle, ArrowUpRight, Slash, PenLine, Type, Image as ImageIcon, Frame, HelpingHand, Settings, ChevronDown, MoreHorizontal, Sparkles, Search, Home, Briefcase, FileText, ChevronRight, Rocket, Share, X, Copy, Check, Scan } from "lucide-react";
import DotGrid from "../../components/DotGrid";
import DrawingCanvas from "../../components/DrawingCanvas";
import AskAlloy from "../../components/AskAlloy";
import { ConfettiButton } from "@/components/ui/confetti";
import type { DrawingTool } from "../../components/DrawingCanvas";

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const [notes, setNotes] = useState("");
    const socketRef = useRef<Socket | null>(null);
    const [activeTool, setActiveTool] = useState("rect");
    const [viewMode, setViewMode] = useState("canvas"); // document | both | canvas
    const [isAlloyOpen, setIsAlloyOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [pdfFile, setPdfFile] = useState<string | null>(null);
    const [activeDocView, setActiveDocView] = useState<"home" | "preview">("home");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Screenshot feature states
    const [isScreenshotMode, setIsScreenshotMode] = useState(false);
    const [isPdfToolsOpen, setIsPdfToolsOpen] = useState(false);
    const [screenshotRect, setScreenshotRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [screenshotStart, setScreenshotStart] = useState<{ x: number, y: number } | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [screenshotQuery, setScreenshotQuery] = useState("");
    const [externalQuery, setExternalQuery] = useState<{ text: string, image?: string, timestamp: number } | null>(null);
    const [fullScreenCanvas, setFullScreenCanvas] = useState<HTMLCanvasElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            const url = URL.createObjectURL(file);
            setPdfFile(url);
            setActiveDocView("preview");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            const url = URL.createObjectURL(file);
            setPdfFile(url);
            setActiveDocView("preview");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

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

    const startScreenCapture = async () => {
        setIsPdfToolsOpen(false);
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: "browser" } as any
            });

            const video = document.createElement("video");
            video.srcObject = stream;

            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(resolve);
                };
            });

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
            }

            stream.getTracks().forEach(track => track.stop());

            setFullScreenCanvas(canvas);
            setIsScreenshotMode(true);
        } catch (err) {
            console.error("Screen capture failed:", err);
            setIsScreenshotMode(false);
            setFullScreenCanvas(null);
        }
    };

    const handleScreenshotStart = (e: React.MouseEvent) => {
        setScreenshotStart({ x: e.clientX, y: e.clientY });
        setScreenshotRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
    };

    const handleScreenshotMove = (e: React.MouseEvent) => {
        if (!screenshotStart) return;
        const w = e.clientX - screenshotStart.x;
        const h = e.clientY - screenshotStart.y;
        setScreenshotRect({ x: screenshotStart.x, y: screenshotStart.y, w, h });
    };

    const handleScreenshotEnd = async () => {
        if (!screenshotRect || (screenshotRect.w === 0 && screenshotRect.h === 0)) {
            setIsScreenshotMode(false);
            setScreenshotRect(null);
            setScreenshotStart(null);
            setFullScreenCanvas(null);
            return;
        }

        // Hide overlay just before capture
        setIsScreenshotMode(false);

        try {
            if (fullScreenCanvas) {
                const scaleX = fullScreenCanvas.width / window.innerWidth;
                const scaleY = fullScreenCanvas.height / window.innerHeight;

                const x = Math.min(screenshotRect.x, screenshotRect.x + screenshotRect.w) * scaleX;
                const y = Math.min(screenshotRect.y, screenshotRect.y + screenshotRect.h) * scaleY;
                const w = Math.max(10, Math.abs(screenshotRect.w)) * scaleX;
                const h = Math.max(10, Math.abs(screenshotRect.h)) * scaleY;

                const croppedCanvas = document.createElement("canvas");
                croppedCanvas.width = w;
                croppedCanvas.height = h;
                const ctx = croppedCanvas.getContext("2d");

                if (ctx) {
                    ctx.drawImage(fullScreenCanvas, x, y, w, h, 0, 0, w, h);
                    setScreenshotPreview(croppedCanvas.toDataURL("image/png"));
                }
            }
        } catch (err) {
            console.error("Screenshot capture failed:", err);
        }

        setScreenshotRect(null);
        setScreenshotStart(null);
        setFullScreenCanvas(null);
    };

    const handleAskElloyScreenshot = () => {
        if (screenshotPreview && screenshotQuery.trim()) {
            setExternalQuery({
                text: screenshotQuery,
                image: screenshotPreview,
                timestamp: Date.now()
            });
            setScreenshotPreview(null);
            setScreenshotQuery("");
            setIsAlloyOpen(true);
        }
    };

    // Close screenshot mode on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isScreenshotMode) {
                setIsScreenshotMode(false);
                setScreenshotRect(null);
                setScreenshotStart(null);
                setFullScreenCanvas(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isScreenshotMode]);

    return (
        <div className="h-screen w-full bg-[#121212] flex flex-col overflow-hidden font-sans text-zinc-300">
            {/* Top Navigation */}
            <header className="flex h-14 w-full items-center justify-between border-b border-white/5 bg-linear-to-b from-[#111111] to-[#09090B] px-4 shrink-0">
                <div className="flex items-center gap-4 min-w-50">
                    <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-sm bg-red-500 transform -skew-x-12 translate-x-1" />
                        <div className="w-4 h-4 rounded-sm bg-blue-500 transform -skew-x-12" />
                    </div>
                    <span className="text-sm font-medium text-white">Untitled File</span>
                </div>

                <div className="flex items-center bg-zinc-900/50 rounded-md p-1 border border-white/5">
                    <button
                        onClick={() => setViewMode("document")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'document' ? 'bg-[#2EFF85]/10 text-[#2EFF85]' : 'text-zinc-400 hover:text-[#2EFF85]'}`}
                    >
                        Document
                    </button>
                    <button
                        onClick={() => setViewMode("both")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'both' ? 'bg-[#2EFF85]/10 text-[#2EFF85]' : 'text-zinc-400 hover:text-[#2EFF85]'}`}
                    >
                        Text
                    </button>
                    <button
                        onClick={() => setViewMode("canvas")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'canvas' ? 'bg-[#2EFF85]/10 text-[#2EFF85]' : 'text-zinc-400 hover:text-[#2EFF85]'}`}
                    >
                        Canvas
                    </button>
                </div>

                <div className="flex items-center gap-4 min-w-50 justify-end">
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-400 font-medium">
                        Ctrl + Shift + K
                    </div>
                    <button onClick={() => setIsAlloyOpen(true)} className="flex items-center gap-1.5 bg-[#2EFF85] hover:bg-[#25dd72] text-[#0A0A0A] px-2.5 py-1.5 rounded text-xs font-medium transition-colors">
                        <Sparkles className="w-3.5 h-3.5" />
                        Ask Elloy
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
                {viewMode !== 'document' && (
                    <div className="absolute left-4 top-4 flex flex-col gap-2 z-30 w-11">
                        {/* Top block */}
                        <div className="flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-sm">
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors group relative">
                                <Plus className="w-4 h-4" />
                            </button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors group relative">
                                <Wand2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tools block */}
                        <div className="flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-sm">
                            <ToolButton icon={MousePointer2} label="V" active={activeTool === 'pointer'} onClick={() => setActiveTool('pointer')} />
                            <ToolButton icon={Square} label="R" active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} />
                            <ToolButton icon={Circle} label="O" active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} />
                            <ToolButton icon={ArrowUpRight} label="A" active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} />
                            <ToolButton icon={Slash} label="L" active={activeTool === 'line'} onClick={() => setActiveTool('line')} className="rotate-90" />
                            <ToolButton icon={PenLine} label="D" active={activeTool === 'pencil'} onClick={() => setActiveTool('pencil')} />
                            <ToolButton icon={Type} label="T" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                            <ToolButton icon={ImageIcon} label="I" active={activeTool === 'image'} onClick={() => {
                                setActiveTool('image');
                                const fileInput = document.getElementById('canvas-image-upload');
                                if (fileInput) fileInput.click();
                            }} />
                        </div>

                        {/* Bottom block */}
                        <div className="flex flex-col gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-xl backdrop-blur-sm">
                            <ToolButton icon={Share} label="Share" active={isShareModalOpen} onClick={() => setIsShareModalOpen(true)} />
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div className="flex-1 w-full h-full relative overflow-hidden z-5">
                    {/* Drawing Canvas - visible when canvas mode */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'document' ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-10'}`}>
                        <DrawingCanvas
                            activeTool={activeTool as DrawingTool}
                            socket={socketRef.current || undefined}
                            roomId={roomId}
                        />
                    </div>

                    {/* Document PDF Viewer */}
                    {viewMode === 'document' && (
                        <div className="absolute inset-0 z-10 w-full h-full flex flex-row overflow-hidden bg-[#09090B]">
                            {/* Sidebar */}
                            <div className="hidden md:flex flex-col w-[260px] h-full border-r border-zinc-800/50 bg-[#09090B] shrink-0">
                                {/* Header / Search */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-[#2EFF85]/20 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-[#2EFF85]" />
                                            </div>
                                            <span className="font-semibold text-zinc-200">Ask Elloy PDF</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="px-3 pb-4 space-y-1 border-b border-zinc-800/50">
                                    <button onClick={() => setActiveDocView("home")} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${activeDocView === 'home' ? 'bg-zinc-800/50 text-[#2EFF85]' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-[#2EFF85]'}`}>
                                        <div className="flex items-center gap-3">
                                            <Home className={`w-4 h-4 ${activeDocView === 'home' ? 'text-[#2EFF85]' : 'text-zinc-400 group-hover:text-[#2EFF85]'}`} />
                                            <span className="text-sm font-medium">Home</span>
                                        </div>
                                    </button>
                                    <div className="space-y-1">
                                        <button onClick={() => setIsPdfToolsOpen(!isPdfToolsOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${isPdfToolsOpen ? 'bg-zinc-800/50 text-[#2EFF85]' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-[#2EFF85]'}`}>
                                            <div className="flex items-center gap-3">
                                                <Briefcase className={`w-4 h-4 ${isPdfToolsOpen ? 'text-[#2EFF85]' : 'text-zinc-400 group-hover:text-[#2EFF85]'}`} />
                                                <span className="text-sm font-medium">PDF tools</span>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isPdfToolsOpen ? 'text-[#2EFF85] rotate-180' : 'text-zinc-600 group-hover:text-[#2EFF85]'}`} />
                                        </button>

                                        {isPdfToolsOpen && (
                                            <div className="pl-9 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                <button
                                                    onClick={startScreenCapture}
                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-zinc-400 hover:bg-zinc-800/50 hover:text-[#2EFF85]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Scan className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Screenshot & Ask Elloy</span>
                                                    </div>
                                                </button>
                                                {/* More PDF tools can go here */}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent */}
                                <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
                                    <h4 className="text-xs font-semibold text-zinc-500 px-3 mb-3">Recent</h4>
                                    <div className="space-y-1">
                                        {/* File Item 1 */}
                                        <div className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#2EFF85]/5 border border-[#2EFF85]/10 cursor-pointer">
                                            <FileText className="w-5 h-5 text-[#2EFF85] shrink-0 mt-0.5" />
                                            <div className="flex flex-col text-left overflow-hidden min-w-0">
                                                <span className="text-sm text-zinc-200 truncate font-medium">...Assignments of All Mod...</span>
                                                <div className="flex items-center justify-between mt-1 text-xs text-zinc-500">
                                                    <span className="truncate">10.07 MB</span>
                                                    <span className="ml-2 shrink-0">06/02/2025</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* File Item 2 */}
                                        <div className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/30 cursor-pointer transition-colors group border border-transparent">
                                            <FileText className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                            <div className="flex flex-col text-left overflow-hidden min-w-0 w-full">
                                                <span className="text-sm text-zinc-400 group-hover:text-zinc-200 truncate font-medium">(Example) Attention Is All...</span>
                                                <div className="flex items-center justify-between mt-1 text-xs text-zinc-600">
                                                    <span className="truncate">2.2 MB</span>
                                                    <span className="ml-2 shrink-0">01/07/2023</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Promo */}
                                <div className="p-4 border-t border-zinc-800/50 bg-[#09090B]">
                                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-center relative overflow-hidden">
                                        <Rocket className="w-8 h-8 text-[#2EFF85] mx-auto mb-2 drop-shadow-[0_0_8px_rgba(46,255,133,0.5)]" />
                                        <h5 className="text-sm font-semibold text-white mb-3 relative z-10">Chat PDFs with GPT-4o</h5>
                                        <button className="w-full bg-[#2EFF85]/10 text-[#2EFF85] hover:bg-[#2EFF85]/20 text-xs font-medium py-2 rounded-lg transition-colors border border-[#2EFF85]/20">
                                            Start Free Trial
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Iframe Content / Upload UI */}
                            <div
                                className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative z-10"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {activeDocView === 'home' || !pdfFile ? (
                                    <div className="flex-1 flex items-center justify-center p-8 bg-[#09090B]">
                                        <div
                                            className="flex flex-col items-center justify-center w-full h-full max-w-2xl max-h-[600px] border-2 border-dashed border-zinc-700 hover:border-[#2EFF85] rounded-3xl bg-[#111111]/50 transition-colors cursor-pointer group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-[#2EFF85]/20 group-hover:text-[#2EFF85] transition-colors">
                                                <Plus className="w-8 h-8 text-zinc-400 group-hover:text-[#2EFF85]" />
                                            </div>
                                            <h3 className="text-xl font-medium text-white mb-2">Upload Document</h3>
                                            <p className="text-zinc-500 text-sm">Drag and drop your PDF here, or click to browse</p>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-linear-to-b from-[#111111] to-[#09090B] shrink-0">
                                            <span className="text-sm font-medium text-white">Document Preview</span>
                                            <button
                                                onClick={() => { setPdfFile(null); setActiveDocView("home"); }}
                                                className="text-xs px-3 py-1 rounded bg-[#111111] hover:bg-[#2EFF85]/10 text-zinc-400 hover:text-[#2EFF85] transition-colors border border-white/5 hover:border-[#2EFF85]/20"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <iframe
                                            src={pdfFile}
                                            className="w-full h-full border-0 bg-[#09090B]"
                                            title="PDF Preview"
                                        />
                                    </>
                                )}
                            </div>

                            {/* Ask Elloy Right Sidebar */}
                            <div className="hidden lg:flex flex-col h-full shrink-0 z-20">
                                <AskAlloy isOpen={true} onOpenChange={() => { }} showFloatingButton={false} inline={true} externalQuery={externalQuery} />
                            </div>
                        </div>
                    )}

                    {/* The textarea overlaid invisibly or if viewMode includes document */}
                    {viewMode !== 'document' && (
                        <textarea
                            value={notes}
                            onChange={handleChange}
                            className={`absolute inset-0 w-full h-full pt-12 px-20 pb-20 bg-transparent border-0 outline-none resize-none placeholder:text-zinc-600/50 leading-relaxed text-[#2EFF85] tracking-wide ${viewMode === 'canvas' ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-20'} transition-opacity duration-300`}
                            placeholder="Type to add notes, or use the canvas tools..."
                            style={{ caretColor: '#2EFF85' }}
                        />
                    )}
                </div>

                {/* Right Top Zoom Control */}
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors z-30 px-2 py-1 rounded hover:bg-zinc-800">
                    100% <ChevronDown className="w-3 h-3 ml-0.5" />
                </div>

                {/* Bottom Right Help */}
                <div className="absolute bottom-6 right-6 z-30">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 backdrop-blur-sm transition-all shadow-lg">
                        <span className="font-semibold text-sm">?</span>
                    </button>
                </div>

            </div>

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#18181A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                                <Share className="w-5 h-5 text-[#2EFF85]" />
                                Share with Friends
                            </h2>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                                Anyone with this link will be able to join this room and collaborate with you in real-time.
                            </p>

                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
                                <div className="flex-1 px-3 py-1.5 text-sm text-zinc-300 truncate font-mono select-all">
                                    {(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") + "/room/" + roomId}
                                </div>
                                <ConfettiButton
                                    options={{ particleCount: 250, spread: 120, colors: ['#2EFF85', '#FFFFFF', '#10B981'] }}
                                    onClick={() => {
                                        const url = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") + "/room/" + roomId;
                                        navigator.clipboard.writeText(url);
                                        setIsCopied(true);
                                        setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isCopied
                                        ? "bg-[#2EFF85]/20 text-[#2EFF85] border border-[#2EFF85]/30"
                                        : "bg-white/10 text-white hover:bg-white/15 border border-transparent"
                                        }`}
                                >
                                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {isCopied ? "Copied!" : "Copy"}
                                </ConfettiButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Assistant Sidebar */}
            <AskAlloy isOpen={isAlloyOpen} onOpenChange={setIsAlloyOpen} showFloatingButton={false} externalQuery={externalQuery} />

            {/* Screenshot Mode Overlay */}
            {isScreenshotMode && (
                <div
                    className="fixed inset-0 z-[200] cursor-crosshair bg-black/40 screenshot-overlay select-none"
                    onMouseDown={handleScreenshotStart}
                    onMouseMove={handleScreenshotMove}
                    onMouseUp={handleScreenshotEnd}
                >
                    {screenshotStart && screenshotRect && (
                        <div
                            className="absolute border-2 border-[#2EFF85] bg-[#2EFF85]/10 pointer-events-none"
                            style={{
                                left: Math.min(screenshotRect.x, screenshotRect.x + screenshotRect.w),
                                top: Math.min(screenshotRect.y, screenshotRect.y + screenshotRect.h),
                                width: Math.abs(screenshotRect.w),
                                height: Math.abs(screenshotRect.h),
                            }}
                        />
                    )}
                </div>
            )}

            {/* Screenshot Preview Modal */}
            {screenshotPreview && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#18181A] border border-[#2EFF85]/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                                <Scan className="w-5 h-5 text-[#2EFF85]" />
                                Ask Elloy about Screenshot
                            </h2>
                            <button
                                onClick={() => setScreenshotPreview(null)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/50 max-h-[300px] flex items-center justify-center p-2">
                                <img src={screenshotPreview} alt="Screenshot preview" className="max-h-[280px] object-contain rounded" />
                            </div>
                            <textarea
                                value={screenshotQuery}
                                onChange={e => setScreenshotQuery(e.target.value)}
                                placeholder="Ask something about this screenshot..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-200 focus:outline-none focus:border-[#2EFF85]/50 transition-colors placeholder:text-zinc-600 resize-none min-h-[100px] shadow-inner"
                            />
                            <div className="flex justify-end gap-3 mt-2">
                                <button
                                    onClick={() => setScreenshotPreview(null)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAskElloyScreenshot}
                                    disabled={!screenshotQuery.trim()}
                                    className="flex items-center gap-2 bg-[#2EFF85] hover:bg-[#25dd72] text-[#0A0A0A] px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(46,255,133,0.3)] hover:shadow-[0_0_20px_rgba(46,255,133,0.4)]"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Ask Elloy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
        </button>
    );
}
