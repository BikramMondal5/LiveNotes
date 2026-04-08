"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const [notes, setNotes] = useState("");
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to WebSockets
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
        <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center">
            <header className="w-full max-w-4xl p-4 border-b border-zinc-800 flex justify-between items-center">
                <h1 className="text-xl font-bold text-[#2EFF85]">LiveNotes</h1>
                <div className="px-3 py-1 bg-zinc-800 rounded text-sm text-zinc-300">
                    Room Code: {roomId}
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl p-6">
                <textarea
                    value={notes}
                    onChange={handleChange}
                    placeholder="Start typing your notes here..."
                    className="w-full h-full min-h-[60vh] bg-transparent border-0 outline-none text-lg resize-none placeholder:text-zinc-600 focus:ring-0 leading-relaxed"
                />
            </main>
        </div>
    );
}
