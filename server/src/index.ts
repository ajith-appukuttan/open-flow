import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflows.js';
import executionRoutes from './routes/executions.js';
import { ensureDataDirectory } from './services/storageService.js';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for execution data

// Ensure data directory exists
ensureDataDirectory();

// Routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflows', executionRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });

// Store connected clients
interface Client extends WebSocket {
  id?: string;
  type?: 'HOST' | 'REMOTE';
}

let hostClient: Client | null = null;
let remoteClient: Client | null = null;

wss.on('connection', (ws: Client) => {
  console.log('New WebSocket connection');

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'REGISTER':
          ws.type = data.role;
          console.log(`Client registered as ${data.role}`);

          if (data.role === 'HOST') {
            hostClient = ws;
            // Notify remote if it exists
            if (remoteClient && remoteClient.readyState === WebSocket.OPEN) {
              remoteClient.send(JSON.stringify({ type: 'HOST_CONNECTED' }));
            }
          } else if (data.role === 'REMOTE') {
            remoteClient = ws;
            // Notify host if it exists
            if (hostClient && hostClient.readyState === WebSocket.OPEN) {
              hostClient.send(JSON.stringify({ type: 'REMOTE_CONNECTED' }));
            }
          }
          break;

        case 'START_WORKFLOW':
          // Remote -> Host
          if (hostClient && hostClient.readyState === WebSocket.OPEN) {
            hostClient.send(JSON.stringify(data));
          }
          break;

        case 'WORKFLOW_STATUS':
          // Host -> Remote
          if (remoteClient && remoteClient.readyState === WebSocket.OPEN) {
            remoteClient.send(JSON.stringify(data));
          }
          break;

        case 'USER_INPUT_REQUEST':
          // Host -> Remote
          if (remoteClient && remoteClient.readyState === WebSocket.OPEN) {
            remoteClient.send(JSON.stringify(data));
          }
          break;

        case 'USER_INPUT_RESPONSE':
          // Remote -> Host
          if (hostClient && hostClient.readyState === WebSocket.OPEN) {
            hostClient.send(JSON.stringify(data));
          }
          break;

        case 'STOP_WORKFLOW':
          // Remote -> Host
          if (hostClient && hostClient.readyState === WebSocket.OPEN) {
            hostClient.send(JSON.stringify(data));
          }
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected', ws.type);
    if (ws === hostClient) {
      hostClient = null;
      if (remoteClient && remoteClient.readyState === WebSocket.OPEN) {
        remoteClient.send(JSON.stringify({ type: 'HOST_DISCONNECTED' }));
      }
    } else if (ws === remoteClient) {
      remoteClient = null;
      if (hostClient && hostClient.readyState === WebSocket.OPEN) {
        hostClient.send(JSON.stringify({ type: 'REMOTE_DISCONNECTED' }));
      }
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`🚀 Workflow Designer Server running on http://localhost:${PORT}`);
});
