import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerRoutes } from '../server/routes';
import express from 'express';

const app = express();

// Register all routes
registerRoutes(app);

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};