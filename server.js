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

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);

            // Send current note state if exists
            if (roomNotes[roomId]) {
                socket.emit("update-notes", roomNotes[roomId]);
            }
        });

        socket.on("edit-notes", ({ roomId, notes }) => {
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
