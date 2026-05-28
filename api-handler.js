import { generateBlogContent } from './generate-content.js';

export async function handleGenerateContentRequest(body, apiKey) {
  try {
    const result = await generateBlogContent(body?.topic, apiKey);
    return result;
  } catch {
    return {
      statusCode: 500,
      body: {
        success: false,
        message: 'Lỗi server nội bộ.'
      }
    };
  }
}

export async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8').trim();

  if (!bodyText) {
    return {};
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    const error = new Error('Invalid JSON body.');
    error.statusCode = 400;
    throw error;
  }
}

export function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
