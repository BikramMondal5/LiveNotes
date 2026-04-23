import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // allow Vercel frontend to connect
            methods: ["GET", "POST"]
        }
    });

    // Simple in-memory storage for notes per room
    const roomNotes = {};
    const roomShapes = {};
    const roomTimers = {};
    const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    function ensureRoomTimer(roomId) {
        if (!roomId) return;

        // If a room hasn't been initialized with a timer, set one for 24 hrs
        if (!roomTimers[roomId]) {
            roomTimers[roomId] = setTimeout(() => {
                // Delete room data
                delete roomNotes[roomId];
                delete roomShapes[roomId];
                delete roomTimers[roomId];

                // Broadcast the clearance so everyone still connected sees an empty room immediately
                io.to(roomId).emit("update-notes", "");
                io.to(roomId).emit("canvas-data", []);
                console.log(`[Auto-Cleanup] Cleared data for room: ${roomId} after 24 hours`);
            }, ROOM_EXPIRY_MS);
            console.log(`[Timer set] Room ${roomId} will be cleared in 24 hours.`);
        }
    }

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);

            ensureRoomTimer(roomId);

            // Send current note state if exists
            if (roomNotes[roomId]) {
                socket.emit("update-notes", roomNotes[roomId]);
            }
        });

        socket.on("get-canvas", (roomId) => {
            ensureRoomTimer(roomId);
            if (roomShapes[roomId]) {
                socket.emit("canvas-data", roomShapes[roomId]);
            }
        });

        socket.on("draw", (data) => {
            const roomId = data.roomId;
            ensureRoomTimer(roomId);

            if (!roomShapes[roomId]) {
                roomShapes[roomId] = [];
            }

            // Find existing shape by ID and update it, to avoid duplications on server state
            const shapeIndex = roomShapes[roomId].findIndex((shape) => shape.id === data.element.id);

            if (shapeIndex > -1) {
                roomShapes[roomId][shapeIndex] = data.element;
            } else {
                roomShapes[roomId].push(data.element);
            }

            socket.to(roomId).emit("draw", data);
        });

        socket.on("delete-shape", ({ roomId, id }) => {
            ensureRoomTimer(roomId);
            if (roomShapes[roomId]) {
                roomShapes[roomId] = roomShapes[roomId].filter(shape => shape.id !== id);
            }
            socket.to(roomId).emit("delete-shape", id);
        });

        socket.on("edit-notes", ({ roomId, notes }) => {
            ensureRoomTimer(roomId);
            roomNotes[roomId] = notes;
            // Broadcast to everyone else in the room
            socket.to(roomId).emit("update-notes", notes);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
