"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, set, remove, onValue, get } from "firebase/database";
import { Plus, Wand2, MousePointer2, Square, Circle, ArrowUpRight, Slash, PenLine, Type, Image as ImageIcon, Frame, HelpingHand, Settings, ChevronDown, MoreHorizontal, Sparkles, Search, Home, Briefcase, FileText, ChevronRight, Rocket, Share, X, Copy, Check, Scan, Presentation, UserCheck, FileSearch, Receipt, Star, Menu } from "lucide-react";
import DotGrid from "../components/DotGrid";
import DrawingCanvas from "../components/DrawingCanvas";
import AskAlloy from "../components/AskAlloy";
import { ConfettiButton } from "@/components/ui/confetti";
import type { DrawingTool } from "../components/DrawingCanvas";
import { getCachedStars } from "@/lib/githubStars";

export interface RoomDocument {
    id: string;
    name: string;
    size: string;
    date: string;
    url?: string;
    isChunked?: boolean;
    chunkCount?: number;
}

const CHUNK_SIZE = 500 * 1024; // 500 KB per chunk (RTDB limit is 10MB per string)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB max PDF size

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const [notes, setNotes] = useState("");
    const [activeTool, setActiveTool] = useState("rect");
    const [viewMode, setViewMode] = useState<"document" | "text" | "canvas">("text"); // Default to Text tab
    const [isAlloyOpen, setIsAlloyOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [pdfFile, setPdfFile] = useState<string | null>(null);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [isDocLoading, setIsDocLoading] = useState(false);
    const [isMobileDocSidebarOpen, setIsMobileDocSidebarOpen] = useState(false);
    const [activeDocView, setActiveDocView] = useState<"home" | "preview">("home");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialDocLoadedRef = useRef(false);
    const docCacheRef = useRef<Map<string, string>>(new Map());
    const [recentFiles, setRecentFiles] = useState<RoomDocument[]>([]);
    const [githubStars, setGithubStars] = useState<number | null>(null);

    // Read cached GitHub stars (fetched only from the root `/` page)
    useEffect(() => {
        setGithubStars(getCachedStars());
    }, []);

    // Screenshot feature states
    const [isScreenshotMode, setIsScreenshotMode] = useState(false);
    const [isPdfToolsOpen, setIsPdfToolsOpen] = useState(false);
    const [screenshotRect, setScreenshotRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [screenshotStart, setScreenshotStart] = useState<{ x: number, y: number } | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [fullScreenCanvas, setFullScreenCanvas] = useState<HTMLCanvasElement | null>(null);

    const handleLocalUpload = (file: File) => {
        if (!file) return;

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            alert("Please upload a valid PDF document.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit for realtime collaboration. Please choose a smaller PDF.`);
            return;
        }

        setIsDocLoading(true);

        const reader = new FileReader();
        reader.onerror = () => {
            setIsDocLoading(false);
            alert("Failed to read the PDF file. Please try again.");
        };

        reader.onload = async (e) => {
            try {
                const dataUrl = e.target?.result as string;
                if (!dataUrl) {
                    setIsDocLoading(false);
                    return;
                }

                const docId = Date.now().toString();
                const size = (file.size / (1024 * 1024)).toFixed(2) + " MB";
                const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

                // Cache immediately in memory for instant local preview
                docCacheRef.current.set(docId, dataUrl);
                setActiveDocId(docId);
                setPdfFile(dataUrl);
                setActiveDocView("preview");
                setViewMode("document");

                const isChunked = dataUrl.length > CHUNK_SIZE;
                const totalChunks = isChunked ? Math.ceil(dataUrl.length / CHUNK_SIZE) : 1;

                const docMeta: RoomDocument = {
                    id: docId,
                    name: file.name,
                    size,
                    date: dateStr,
                    isChunked,
                    chunkCount: totalChunks,
                    ...(isChunked ? {} : { url: dataUrl })
                };

                setRecentFiles(prev => {
                    const filtered = prev.filter(f => f.name !== file.name);
                    return [docMeta, ...filtered];
                });

                if (db && roomId) {
                    if (isChunked) {
                        // Store chunks separately under rooms/${roomId}/chunks/${docId}
                        const chunkPromises: Promise<any>[] = [];
                        for (let i = 0; i < totalChunks; i++) {
                            const chunkData = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                            const chunkRef = ref(db, `rooms/${roomId}/chunks/${docId}/${i}`);
                            chunkPromises.push(set(chunkRef, chunkData));
                        }
                        await Promise.all(chunkPromises);
                    }

                    // Save active document metadata (no huge base64 in document node if chunked)
                    const docRef = ref(db, `rooms/${roomId}/document`);
                    await set(docRef, docMeta);

                    // Save document in history list (metadata only)
                    const itemRef = ref(db, `rooms/${roomId}/documents/${docId}`);
                    await set(itemRef, docMeta);
                }
            } catch (err) {
                console.error("Firebase upload document error:", err);
                alert("Could not sync the document to the room. It will remain visible locally.");
            } finally {
                setIsDocLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSelectRecentFile = async (file: RoomDocument) => {
        setActiveDocId(file.id);
        setActiveDocView("preview");
        setIsMobileDocSidebarOpen(false);

        if (file.url && !file.isChunked) {
            setPdfFile(file.url);
        } else if (docCacheRef.current.has(file.id)) {
            setPdfFile(docCacheRef.current.get(file.id)!);
        } else if (file.isChunked && db && roomId) {
            setIsDocLoading(true);
            try {
                const chunkSnap = await get(ref(db, `rooms/${roomId}/chunks/${file.id}`));
                if (chunkSnap.exists()) {
                    const chunksObj = chunkSnap.val();
                    const sortedChunks = Object.keys(chunksObj)
                        .sort((a, b) => Number(a) - Number(b))
                        .map(k => chunksObj[k]);
                    const fullDataUrl = sortedChunks.join("");
                    docCacheRef.current.set(file.id, fullDataUrl);
                    setPdfFile(fullDataUrl);
                }
            } catch (err) {
                console.error("Firebase load document chunks error:", err);
            } finally {
                setIsDocLoading(false);
            }
        }

        if (db && roomId) {
            const docRef = ref(db, `rooms/${roomId}/document`);
            const docMeta: RoomDocument = {
                id: file.id,
                name: file.name,
                size: file.size,
                date: file.date,
                isChunked: file.isChunked,
                chunkCount: file.chunkCount,
                ...(file.url ? { url: file.url } : {})
            };
            try {
                await set(docRef, docMeta);
            } catch (err) {
                console.error("Firebase update document error:", err);
            }
        }
    };

    const handleDeleteRecentFile = async (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        if (db && roomId) {
            try {
                await remove(ref(db, `rooms/${roomId}/documents/${fileId}`));
                await remove(ref(db, `rooms/${roomId}/chunks/${fileId}`));
            } catch (err) {
                console.error("Firebase delete document error:", err);
            }
        }
        if (activeDocId === fileId) {
            setPdfFile(null);
            setActiveDocId(null);
            setActiveDocView("home");
            if (db && roomId) {
                try {
                    await remove(ref(db, `rooms/${roomId}/document`));
                } catch (err) {
                    console.error(err);
                }
            }
        }
        docCacheRef.current.delete(fileId);
        setRecentFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleLocalUpload(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleLocalUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // 1. Firebase Realtime Database Listeners for Notes, Document, and Room Documents List
    useEffect(() => {
        if (!roomId || !db) return;
        const database = db; // capture for async callbacks (TS narrowing)

        // Reset state immediately so data from previous rooms never leaks
        setNotes("");
        setPdfFile(null);
        setActiveDocId(null);
        setActiveDocView("home");
        setRecentFiles([]);
        initialDocLoadedRef.current = false;

        const notesRef = ref(database, `rooms/${roomId}/notes`);
        const unsubNotes = onValue(notesRef, (snapshot) => {
            const val = snapshot.val();
            if (typeof val === "string") {
                setNotes(prev => (prev !== val ? val : prev));
            } else if (val === null) {
                setNotes("");
            }
        });

        const docRef = ref(database, `rooms/${roomId}/document`);
        const unsubDoc = onValue(docRef, async (snapshot) => {
            const doc = snapshot.val() as RoomDocument | null;
            if (doc && doc.id) {
                setActiveDocId(doc.id);
                if (doc.url && !doc.isChunked) {
                    docCacheRef.current.set(doc.id, doc.url);
                    setPdfFile(doc.url);
                    setActiveDocView("preview");
                } else if (doc.isChunked) {
                    if (docCacheRef.current.has(doc.id)) {
                        setPdfFile(docCacheRef.current.get(doc.id)!);
                        setActiveDocView("preview");
                    } else {
                        setIsDocLoading(true);
                        try {
                            const chunkSnap = await get(ref(database, `rooms/${roomId}/chunks/${doc.id}`));
                            if (chunkSnap.exists()) {
                                const chunksObj = chunkSnap.val();
                                const sortedChunks = Object.keys(chunksObj)
                                    .sort((a, b) => Number(a) - Number(b))
                                    .map(k => chunksObj[k]);
                                const fullDataUrl = sortedChunks.join("");
                                docCacheRef.current.set(doc.id, fullDataUrl);
                                setPdfFile(fullDataUrl);
                                setActiveDocView("preview");
                            }
                        } catch (err) {
                            console.error("Failed to load chunked document:", err);
                        } finally {
                            setIsDocLoading(false);
                        }
                    }
                }
                if (initialDocLoadedRef.current) {
                    setViewMode("document");
                }
            } else {
                setPdfFile(null);
                setActiveDocId(null);
                setActiveDocView("home");
            }
            initialDocLoadedRef.current = true;
        });

        const docsRef = ref(database, `rooms/${roomId}/documents`);
        const unsubDocs = onValue(docsRef, (snapshot) => {
            const docs = snapshot.val();
            if (docs && typeof docs === "object") {
                const list = Object.values(docs) as RoomDocument[];
                list.sort((a, b) => Number(b.id) - Number(a.id));
                setRecentFiles(list);
            } else {
                setRecentFiles([]);
            }
        });

        return () => {
            unsubNotes();
            unsubDoc();
            unsubDocs();
        };
    }, [roomId]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNotes(value);

        const database = db;
        if (database && roomId) {
            if (notesTimeoutRef.current) {
                clearTimeout(notesTimeoutRef.current);
            }
            notesTimeoutRef.current = setTimeout(() => {
                const notesRef = ref(database, `rooms/${roomId}/notes`);
                set(notesRef, value).catch(err => console.error("Firebase edit notes error:", err));
            }, 150);
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
                    setIsAlloyOpen(true);
                }
            }
        } catch (err) {
            console.error("Screenshot capture failed:", err);
        }

        setScreenshotRect(null);
        setScreenshotStart(null);
        setFullScreenCanvas(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isScreenshotMode) {
                    setIsScreenshotMode(false);
                    setScreenshotRect(null);
                    setScreenshotStart(null);
                    setFullScreenCanvas(null);
                }
                if (isPdfToolsOpen) {
                    setIsPdfToolsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isScreenshotMode, isPdfToolsOpen]);

    // Reusable PDF Sidebar component for desktop and mobile drawer
    const PdfSidebarContent = () => (
        <div className="flex flex-col h-full bg-[#161618]">
            {/* Header / Search */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <img src="/pdfs.png" alt="PDF Logo" className="w-6 h-6 object-contain" />
                        <span className="font-semibold text-zinc-200">Ask Elloy PDF</span>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsMobileDocSidebarOpen(false)}
                        className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
                <button
                    onClick={() => {
                        setActiveDocView("home");
                        setIsMobileDocSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${activeDocView === 'home' ? 'bg-zinc-800/50 text-[#2EFF85]' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-[#2EFF85]'}`}
                >
                    <div className="flex items-center gap-3">
                        <Home className={`w-4 h-4 ${activeDocView === 'home' ? 'text-[#2EFF85]' : 'text-zinc-400 group-hover:text-[#2EFF85]'}`} />
                        <span className="text-sm font-medium">Home</span>
                    </div>
                </button>
                <div className="space-y-1 relative">
                    <button onClick={() => setIsPdfToolsOpen(!isPdfToolsOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${isPdfToolsOpen ? 'bg-zinc-800/50 text-[#2EFF85]' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-[#2EFF85]'}`}>
                        <div className="flex items-center gap-3">
                            <Briefcase className={`w-4 h-4 ${isPdfToolsOpen ? 'text-[#2EFF85]' : 'text-zinc-400 group-hover:text-[#2EFF85]'}`} />
                            <span className="text-sm font-medium">PDF tools</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isPdfToolsOpen ? 'text-[#2EFF85] rotate-90' : 'text-zinc-600 group-hover:text-[#2EFF85]'}`} />
                    </button>

                    {isPdfToolsOpen && (
                        <>
                            {/* Click outside backdrop */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsPdfToolsOpen(false)} />

                            {/* Floating Modal */}
                            <div
                                className="absolute left-0 md:left-[calc(100%+12px)] top-10 md:top-0 z-50 w-[260px] md:w-[280px] p-3 flex flex-col gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out"
                                style={{
                                    backgroundColor: '#0F1115',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px'
                                }}
                            >
                                <div className="px-2 pb-2 mb-1 border-b border-white/5">
                                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Quick Actions</span>
                                </div>

                                <div className="flex flex-col gap-1 max-h-[360px] overflow-y-auto no-scrollbar">
                                    <button
                                        onClick={() => {
                                            setIsMobileDocSidebarOpen(false);
                                            startScreenCapture();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-zinc-300 font-medium text-sm transition-all hover:bg-[#2EFF85]/10 hover:text-[#2EFF85] active:scale-95 group"
                                    >
                                        <Scan className="w-4 h-4 text-zinc-400 group-hover:text-[#2EFF85] transition-colors" />
                                        Screenshot & Ask Elloy
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Recent */}
            <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
                <h4 className="text-xs font-semibold text-zinc-500 px-3 mb-3">Recent</h4>
                <div className="space-y-1">
                    {recentFiles.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-zinc-600">
                            No recent files. Upload a PDF to get started.
                        </div>
                    ) : (
                        recentFiles.map((file) => (
                            <div
                                key={file.id}
                                onClick={() => handleSelectRecentFile(file)}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group border ${activeDocId === file.id ? 'bg-[#2EFF85]/5 border-[#2EFF85]/10' : 'hover:bg-zinc-800/30 border-transparent'}`}
                            >
                                <div className="flex items-start gap-3 overflow-hidden min-w-0 flex-1">
                                    <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${activeDocId === file.id ? 'text-[#2EFF85]' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                                    <div className="flex flex-col text-left overflow-hidden min-w-0 w-full">
                                        <span className={`text-sm truncate font-medium ${activeDocId === file.id ? 'text-zinc-200' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                            {file.name}
                                        </span>
                                        <div className="flex items-center justify-between mt-1 text-xs text-zinc-600">
                                            <span className="truncate">{file.size}</span>
                                            <span className="ml-2 shrink-0">{file.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteRecentFile(e, file.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                                    title="Delete from this room"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Promo */}
            <div className="p-4 border-t border-zinc-800/50 bg-[#161618]">
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-center relative overflow-hidden">
                    <Rocket className="w-8 h-8 text-[#2EFF85] mx-auto mb-2 drop-shadow-[0_0_8px_rgba(46,255,133,0.5)]" />
                    <h5 className="text-sm font-semibold text-white mb-3 relative z-10">Chat PDFs with GPT-4o</h5>
                    <button className="w-full bg-[#2EFF85]/10 text-[#2EFF85] hover:bg-[#2EFF85]/20 text-xs font-medium py-2 rounded-lg transition-colors border border-[#2EFF85]/20">
                        Completely free
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full bg-[#161618] flex flex-col overflow-hidden font-sans text-zinc-300">
            {/* Top Navigation */}
            <header className="flex flex-col sm:flex-row min-h-14 py-2 sm:py-0 w-full items-center justify-between border-b border-white/5 bg-[#161618] px-4 shrink-0 gap-2 sm:gap-0">
                <div className="flex w-full sm:w-auto justify-between sm:justify-start items-center sm:gap-4 sm:min-w-50">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="LiveNotes Logo" className="w-9 h-9 object-cover rounded-full" />
                    </div>

                    <div className="flex items-center bg-[#1C1C1C] rounded-[8px] pl-3 h-8 max-w-[65%] sm:max-w-none">
                        <span className="text-xs text-zinc-300 truncate max-w-[110px] sm:max-w-[150px]">/{roomId}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(notes);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className={`ml-2 sm:ml-3 shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 h-full rounded-[8px] text-xs font-medium transition-all duration-200 ${isCopied
                                ? "bg-[#2EFF85]/20 text-[#2EFF85]"
                                : "bg-[#262626] hover:bg-[#333333] text-zinc-300"
                                }`}
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{isCopied ? "Copied Text!" : "Copy Text"}</span>
                        </button>
                    </div>

                    {/* Mobile Ask Elloy Quick Button */}
                    <button
                        onClick={() => setIsAlloyOpen(!isAlloyOpen)}
                        className="sm:hidden flex items-center gap-1 bg-[#2EFF85] hover:bg-[#25dd72] text-[#161618] px-2.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Elloy</span>
                    </button>
                </div>

                <div className="flex items-center bg-zinc-900/50 rounded-md p-1 border border-white/5 order-3 sm:order-2 w-full sm:w-auto justify-center">
                    <button
                        onClick={() => setViewMode("document")}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'document' ? 'bg-[#2EFF85]/10 text-[#2EFF85]' : 'text-zinc-400 hover:text-[#2EFF85]'}`}
                    >
                        Document
                    </button>
                    <button
                        onClick={() => setViewMode("text")}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'text' ? 'bg-[#2EFF85]/10 text-[#2EFF85]' : 'text-zinc-400 hover:text-[#2EFF85]'}`}
                    >
                        Text
                    </button>
                    <button
                        onClick={() => setViewMode("canvas")}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${viewMode === 'canvas' ? 'bg-[#2EFF85]/10 text-[#2EFF85]' : 'text-zinc-400 hover:text-[#2EFF85]'}`}
                    >
                        Canvas
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-3 sm:min-w-50 justify-end order-2 sm:order-3">
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
                            <span suppressHydrationWarning>{githubStars !== null ? githubStars : "2"}</span>
                        </div>
                    </a>

                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-400 font-medium">
                        Ctrl + Shift + K
                    </div>
                    <button onClick={() => setIsAlloyOpen(!isAlloyOpen)} className="flex items-center gap-1.5 bg-[#2EFF85] hover:bg-[#25dd72] text-[#161618] px-2.5 py-1.5 rounded text-xs font-medium transition-colors">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ask Elloy</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative flex overflow-hidden bg-[#161618]">
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

                {/* Left Desktop Toolbar - only visible in canvas mode */}
                {viewMode === 'canvas' && (
                    <div className="hidden sm:flex absolute left-4 top-4 flex-col gap-2 z-30 w-11">
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

                {/* Mobile Floating Bottom Canvas Toolbar */}
                {viewMode === 'canvas' && (
                    <div className="flex sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex-row gap-1 bg-zinc-900/95 border border-zinc-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md z-30 max-w-[95vw] overflow-x-auto no-scrollbar">
                        <ToolButton icon={MousePointer2} label="V" active={activeTool === 'pointer'} onClick={() => setActiveTool('pointer')} />
                        <ToolButton icon={Square} label="R" active={activeTool === 'rect'} onClick={() => setActiveTool('rect')} />
                        <ToolButton icon={Circle} label="O" active={activeTool === 'circle'} onClick={() => setActiveTool('circle')} />
                        <ToolButton icon={ArrowUpRight} label="A" active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} />
                        <ToolButton icon={Slash} label="L" active={activeTool === 'line'} onClick={() => setActiveTool('line')} className="rotate-90" />
                        <ToolButton icon={PenLine} label="D" active={activeTool === 'pencil'} onClick={() => setActiveTool('pencil')} />
                        <ToolButton icon={Type} label="T" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                        <ToolButton icon={Share} label="Share" active={isShareModalOpen} onClick={() => setIsShareModalOpen(true)} />
                    </div>
                )}

                {/* Canvas Area */}
                <div className="flex-1 w-full h-full relative overflow-hidden z-5">
                    {/* Drawing Canvas - visible ONLY when canvas mode */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'canvas' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
                        <DrawingCanvas
                            key={roomId}
                            activeTool={activeTool as DrawingTool}
                            roomId={roomId}
                        />
                    </div>

                    {/* Document PDF Viewer */}
                    {viewMode === 'document' && (
                        <div className="absolute inset-0 z-10 w-full h-full flex flex-row overflow-hidden bg-[#161618]">
                            {/* Desktop Sidebar */}
                            <div className="hidden md:flex flex-col w-[260px] h-full border-r border-zinc-800/50 bg-[#161618] shrink-0">
                                <PdfSidebarContent />
                            </div>

                            {/* Mobile Sidebar Slide-over Drawer */}
                            {isMobileDocSidebarOpen && (
                                <div className="fixed inset-0 z-50 md:hidden flex">
                                    <div
                                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                                        onClick={() => setIsMobileDocSidebarOpen(false)}
                                    />
                                    <div className="relative w-[280px] max-w-[80vw] h-full bg-[#161618] border-r border-zinc-800 z-10 shadow-2xl">
                                        <PdfSidebarContent />
                                    </div>
                                </div>
                            )}

                            {/* Main Iframe Content / Upload UI */}
                            <div
                                className="flex-1 flex flex-col min-w-0 bg-[#161618] relative z-10"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {activeDocView === 'home' || !pdfFile ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-[#161618]">
                                        {/* Mobile Button to Open Document History */}
                                        <div className="md:hidden w-full flex justify-between items-center mb-4 max-w-lg">
                                            <button
                                                onClick={() => setIsMobileDocSidebarOpen(true)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-300"
                                            >
                                                <Menu className="w-4 h-4" />
                                                <span>Recent PDFs ({recentFiles.length})</span>
                                            </button>
                                        </div>

                                        <div
                                            className="flex flex-col items-center justify-center w-full h-full max-w-2xl max-h-[600px] border-2 border-dashed border-zinc-700 hover:border-[#2EFF85] rounded-2xl sm:rounded-3xl bg-[#161618]/50 p-6 transition-colors cursor-pointer group text-center"
                                            onClick={() => !isDocLoading && fileInputRef.current?.click()}
                                        >
                                            {isDocLoading ? (
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-9 h-9 border-2 border-[#2EFF85] border-t-transparent rounded-full animate-spin" />
                                                    <h3 className="text-base sm:text-lg font-medium text-white">Syncing Document...</h3>
                                                    <p className="text-zinc-400 text-xs">Uploading and splitting PDF chunks for realtime room sync</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#2EFF85]/20 group-hover:text-[#2EFF85] transition-colors">
                                                        <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 group-hover:text-[#2EFF85]" />
                                                    </div>
                                                    <h3 className="text-lg sm:text-xl font-medium text-white mb-2">Upload Document</h3>
                                                    <p className="text-zinc-500 text-xs sm:text-sm">Drag and drop your PDF here, or click to browse</p>
                                                    <p className="text-zinc-600 text-[11px] sm:text-xs mt-1">Supports PDF files up to 25 MB</p>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={handleFileChange}
                                                disabled={isDocLoading}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/5 bg-[#161618] shrink-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setIsMobileDocSidebarOpen(true)}
                                                    className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                                                    title="Open PDF history"
                                                >
                                                    <Menu className="w-4 h-4" />
                                                </button>
                                                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[160px] sm:max-w-xs">
                                                    Document Preview
                                                </span>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    setPdfFile(null);
                                                    setActiveDocId(null);
                                                    setActiveDocView("home");
                                                    if (db && roomId) {
                                                        try {
                                                            await remove(ref(db, `rooms/${roomId}/document`));
                                                        } catch (err) {
                                                            console.error("Firebase remove document error:", err);
                                                        }
                                                    }
                                                }}
                                                className="text-xs px-2.5 sm:px-3 py-1 rounded bg-[#161618] hover:bg-[#2EFF85]/10 text-zinc-400 hover:text-[#2EFF85] transition-colors border border-white/5 hover:border-[#2EFF85]/20"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        {isDocLoading ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#161618]">
                                                <div className="w-8 h-8 border-2 border-[#2EFF85] border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs font-mono text-zinc-400">Loading document...</span>
                                            </div>
                                        ) : (
                                            <iframe
                                                src={pdfFile}
                                                className="w-full h-full border-0 bg-[#161618]"
                                                title="PDF Preview"
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* The textarea - visible when in text mode */}
                    {viewMode !== 'document' && (
                        <textarea
                            value={notes}
                            onChange={handleChange}
                            className={`absolute inset-0 w-full h-full pt-6 sm:pt-8 pl-4 sm:pl-10 pr-4 sm:pr-12 pb-16 bg-transparent border-0 outline-none resize-none placeholder:text-zinc-600/50 leading-relaxed text-[#2EFF85] tracking-wide ${viewMode === 'text' ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'} transition-opacity duration-300`}
                            placeholder="Type to add notes, share in real time with your friends..."
                            style={{ caretColor: '#2EFF85' }}
                        />
                    )}

                    {/* Right Top Zoom Control */}
                    {viewMode === 'canvas' && (
                        <div className="hidden sm:flex absolute top-4 right-4 items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors z-30 px-2 py-1 rounded hover:bg-zinc-800">
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                        </div>
                    )}

                    {/* Bottom Right Help */}
                    <div className="hidden sm:block absolute bottom-6 right-6 z-30">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 backdrop-blur-sm transition-all shadow-lg">
                            <span className="font-semibold text-sm">?</span>
                        </button>
                    </div>
                </div>

                {/* THE UNIFIED ASK ELLOY CHAT SYSTEM */}
                {/* Desktop: Collapsible inline sidebar */}
                <div className={`hidden md:block h-full shrink-0 transition-all duration-300 ease-in-out ${isAlloyOpen ? 'w-[380px] xl:w-[480px] border-l border-zinc-800/50 bg-[#161618]' : 'w-0 overflow-hidden'}`}>
                    <AskAlloy
                        isOpen={isAlloyOpen}
                        onOpenChange={setIsAlloyOpen}
                        showFloatingButton={false}
                        inline={true}
                        stagedImage={screenshotPreview}
                        onClearStagedImage={() => setScreenshotPreview(null)}
                    />
                </div>

            </div>

            {/* Mobile Floating Popup Chat Modal for Ask Elloy */}
            {isAlloyOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    {/* Subtle backdrop to dismiss when clicking outside */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
                        onClick={() => setIsAlloyOpen(false)}
                    />
                    {/* Floating Popup Card Modal */}
                    <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 w-[calc(100vw-2rem)] max-w-[390px] h-[520px] max-h-[72vh] rounded-[24px] border border-white/10 bg-[#121214] shadow-[0_16px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 z-50">
                        <AskAlloy
                            isOpen={true}
                            onOpenChange={setIsAlloyOpen}
                            showFloatingButton={false}
                            inline={true}
                            stagedImage={screenshotPreview}
                            onClearStagedImage={() => setScreenshotPreview(null)}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Floating AI Bubble Button in Circular Div */}
            <button
                onClick={() => setIsAlloyOpen(!isAlloyOpen)}
                className="fixed bottom-5 right-5 md:hidden z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#05D668] hover:bg-[#04bd5c] shadow-xl flex items-center justify-center p-1 overflow-hidden active:scale-95 transition-all duration-200"
                title={isAlloyOpen ? "Close Ask Elloy" : "Ask Elloy"}
                aria-label={isAlloyOpen ? "Close Ask Elloy AI Assistant" : "Open Ask Elloy AI Assistant"}
            >
                {isAlloyOpen ? (
                    <X className="w-6 h-6 text-[#161618]" />
                ) : (
                    <img
                        src="/Elloy-logo.png"
                        alt="Ask Elloy"
                        className="w-full h-full object-contain"
                    />
                )}
            </button>

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#18181A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5">
                            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
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
                        <div className="p-4 sm:p-5">
                            <p className="text-xs sm:text-sm text-zinc-400 mb-4 leading-relaxed">
                                Anyone with this link will be able to join this room and collaborate with you in real-time.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/40 border border-white/10 p-2 sm:p-1.5 rounded-xl">
                                <div className="flex-1 px-3 py-1.5 text-xs sm:text-sm text-zinc-300 truncate font-mono select-all">
                                    {(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") + "/" + roomId}
                                </div>
                                <ConfettiButton
                                    options={{ particleCount: 250, spread: 120, colors: ['#2EFF85', '#FFFFFF', '#10B981'] }}
                                    onClick={() => {
                                        const url = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") + "/" + roomId;
                                        navigator.clipboard.writeText(url);
                                        setIsCopied(true);
                                        setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                    className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${isCopied
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

            {/* Screenshot Mode Overlay */}
            {isScreenshotMode && (
                <div
                    className="fixed inset-0 z-200 cursor-crosshair bg-black/60 screenshot-overlay select-none"
                    onMouseDown={handleScreenshotStart}
                    onMouseMove={handleScreenshotMove}
                    onMouseUp={handleScreenshotEnd}
                >
                    {screenshotStart && screenshotRect && (
                        <div
                            className="absolute border border-dashed border-[#2EFF85] bg-[#2EFF85]/8 pointer-events-none"
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
