import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleGenerateContentRequest } from './api-handler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 4173;

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/generate-content', async (req, res) => {
  const result = await handleGenerateContentRequest(req.body, process.env.GEMINI_API_KEY);
  return res.status(result.statusCode).json(result.body);
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ success: false, message: 'Body JSON không hợp lệ.' });
  }

  return next(error);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
});
