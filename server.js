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

        socket.on("get-canvas", (roomId) => {
            if (roomShapes[roomId]) {
                socket.emit("canvas-data", roomShapes[roomId]);
            }
        });

        socket.on("draw", (data) => {
            if (!roomShapes[data.roomId]) {
                roomShapes[data.roomId] = [];
            }

            // Find existing shape by ID and update it, to avoid duplications on server state
            const shapeIndex = roomShapes[data.roomId].findIndex((shape) => shape.id === data.element.id);

            if (shapeIndex > -1) {
                roomShapes[data.roomId][shapeIndex] = data.element;
            } else {
                roomShapes[data.roomId].push(data.element);
            }

            socket.to(data.roomId).emit("draw", data);
        });

        socket.on("delete-shape", ({ roomId, id }) => {
            if (roomShapes[roomId]) {
                roomShapes[roomId] = roomShapes[roomId].filter(shape => shape.id !== id);
            }
            socket.to(roomId).emit("delete-shape", id);
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
