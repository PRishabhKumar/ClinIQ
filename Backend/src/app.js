import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.js';
import { startHoldSweeper } from './jobs/holdSweeper.js';

const app = express();

app.use(cors());
app.use(express.json());

// Start Background Jobs
startHoldSweeper();

// Mount API routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
