import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

let wss;

const initializeWebSocket = (server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('--- New WebSocket connection ---');
    console.log('Request URL:', req.url);
    // Extract token from query string
    const url = new URL(req.url, 'ws://localhost');
    const token = url.searchParams.get('token');
    console.log('Extracted token from query:', token);
    if (!token) {
      console.error('No token provided in WebSocket connection. Closing.');
      ws.close();
      return;
    }
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.user = decoded;
      ws.isAlive = true;
      console.log('WebSocket token verified. Decoded user:', decoded);

      // Handle ping-pong to keep connection alive
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle client messages
      ws.on('message', (message) => {
        console.log('Received:', message);
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('Client disconnected');
      });

    } catch (error) {
      console.error('WebSocket auth error:', error);
      ws.close();
    }
  });

  // Set up ping interval to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
};

// Function to send notification to specific user
const notifyUser = (userEmail, data) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.user?.email === userEmail && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

export {
  initializeWebSocket,
  notifyUser
};
