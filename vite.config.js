import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleGenerateContentRequest, readJsonBody, sendJson } from './api-handler.js';

dotenv.config();

function createGenerateContentApiPlugin() {
  return {
    name: 'generate-content-api',
    configureServer(server) {
      server.middlewares.use('/api/generate-content', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { success: false, message: 'Method not allowed.' });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const result = await handleGenerateContentRequest(body, process.env.GEMINI_API_KEY);
          sendJson(res, result.statusCode, result.body);
        } catch (error) {
          if (error?.statusCode === 400) {
            sendJson(res, 400, { success: false, message: 'Body JSON không hợp lệ.' });
            return;
          }

          sendJson(res, 500, { success: false, message: 'Lỗi server nội bộ.' });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), createGenerateContentApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
