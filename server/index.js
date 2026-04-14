import { createServer } from 'http';
import { Server } from 'socket.io';

const port = process.env.PORT || 3001;

// Simple HTTP server to satisfy health checks
const httpServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LiveNotes Real-time WebSocket Server is running.');
});

// Initialize Socket.io with CORS to allow connections from anywhere
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allows Vercel or localhost frontend to connect
        methods: ['GET', 'POST']
    }
});

// Simple in-memory storage for notes per room
const roomNotes = {};
const roomShapes = {};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);

        // Send current note state if exists
        if (roomNotes[roomId]) {
            socket.emit('update-notes', roomNotes[roomId]);
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

    socket.on('edit-notes', ({ roomId, notes }) => {
        // Update in-memory storage
        roomNotes[roomId] = notes;

        // Broadcast to everyone else in the room
        socket.to(roomId).emit('update-notes', notes);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`> Websocket Server running on port ${port}`);
});
