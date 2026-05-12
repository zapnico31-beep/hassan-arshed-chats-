import express from "express";
import path from "path";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // In-memory message store for the demo
  let messages: any[] = [
    {
      id: "1",
      role: "assistant",
      content: "Assalam-o-Alaikum! Me Hussain Chishti apki khidmat me hazir ho. Hassan aur Arshed, batayein main aapki kya madad kar sakta hoon?",
      senderName: "Hussain Chishti",
      timestamp: Date.now()
    }
  ];

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    // Send current messages to the newly connected client
    socket.emit("init_messages", messages);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/messages", (req, res) => {
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const message = {
      ...req.body,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now()
    };
    messages.push(message);
    // Keep only last 100 messages to prevent memory bloat
    if (messages.length > 100) messages = messages.slice(-100);
    
    // Broadcast the new message to all connected clients
    io.emit("new_message", message);
    
    res.status(201).json(message);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
