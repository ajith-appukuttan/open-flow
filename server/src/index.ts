import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflows.js';
import executionRoutes from './routes/executions.js';
import { ensureDataDirectory } from './services/storageService.js';

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

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Workflow Designer Server running on http://localhost:${PORT}`);
});
