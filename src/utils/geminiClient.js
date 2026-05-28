import axios from 'axios';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 45000;
const RATE_LIMIT_KEY = 'ai-blog-gemini-rate-limit';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const FREE_TIER_REQUEST_LIMIT = 20;

const getGeminiEndpoint = model =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const buildPrompt = topic => `
Bạn là một content writer chuyên nghiệp viết blog tiếng Việt tự nhiên, dễ đọc và có chiều sâu.

Viết một bài blog hoàn chỉnh về chủ đề: "${topic}".

Chỉ trả về nội dung Markdown thuần. Không giải thích, không hội thoại, không dùng code fence, không ghi chú meta, không nhắc tới AI.

Phong cách cần giống bài mẫu:
- Mở thẳng bằng tiêu đề bài viết, không viết câu dẫn kiểu "Tuyệt vời..." hoặc "Dưới đây là...".
- Giọng văn thân thiện, giàu thông tin, có cảm xúc vừa phải, phù hợp blog phổ thông.
- Mỗi đoạn 2-4 câu, câu văn rõ ràng, không lan man.
- Có ví dụ cụ thể, gần gũi, dễ hình dung.
- Có các mục lớn rõ ràng, mỗi mục triển khai bằng nhiều đoạn văn.
- Có một vài dòng in đậm ở đầu ý để nhấn mạnh, ví dụ: **Khả năng thích nghi:** ...
- Không cần checklist máy móc nếu chủ đề không phù hợp.

Cấu trúc bắt buộc:

# [Tiêu đề hấp dẫn, viết hoa chữ cái đầu tự nhiên]

Viết mở bài 1-2 đoạn, dẫn người đọc vào chủ đề.

## [Mục lớn 1: giới thiệu/bối cảnh]
Viết 2-3 đoạn.

## [Mục lớn 2: các điểm nổi bật hoặc phân loại]
Viết 2-4 đoạn, có thể dùng các dòng in đậm để liệt kê ý.

## [Mục lớn 3: phân tích sâu]
Viết 2-4 đoạn, có ví dụ cụ thể.

## [Mục lớn 4: vai trò/lợi ích/tác động]
Viết 2-3 đoạn.

## [Mục lớn 5: thách thức/lưu ý nếu có]
Viết 2-3 đoạn.

## [Mục lớn 6: lời kết]
Kết bài 2 đoạn, để lại cảm giác trọn vẹn.

Yêu cầu độ dài:
- Khoảng 900-1400 từ.
- Ít nhất 5 heading Markdown.
- Có ít nhất 5 dòng in đậm dạng **Tên ý:** nội dung.
- Không trả về bài quá ngắn.
`.trim();

const countWords = text =>
  String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const hasRequiredMarkdownStructure = text => {
  const markdown = String(text ?? '');
  const hasH1 = /^#\s.+/m.test(markdown);
  const headingCount = (markdown.match(/^#{1,3}\s.+/gm) || []).length;
  const paragraphCount = markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(block => block && !/^#{1,6}\s/.test(block)).length;

  return hasH1 && headingCount >= 4 && paragraphCount >= 5;
};

const isContentQualified = text => countWords(text) >= 350 && hasRequiredMarkdownStructure(text);

const cleanGeneratedContent = text =>
  String(text ?? '')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```$/i, '')
    .replace(/^Tuyệt vời!?[^\n]*(?:\n+|$)/i, '')
    .replace(/^Dưới đây là[^\n]*(?:\n+|$)/i, '')
    .trim();

const extractGeneratedText = payload => {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map(part => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
};

const extractApiError = error => {
  const apiMessage = error?.response?.data?.error?.message;

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage.trim();
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Gemini API phản hồi quá lâu. Vui lòng thử lại.';
  }

  return 'Không thể tạo nội dung từ Gemini API.';
};

export class GeminiRateLimitError extends Error {
  constructor(message, retryAfterMs) {
    super(message);
    this.name = 'GeminiRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

const readRateLimitState = () => {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) {
      return { requests: [], cooldownUntil: 0 };
    }

    const parsed = JSON.parse(raw);
    return {
      requests: Array.isArray(parsed.requests) ? parsed.requests.filter(Number.isFinite) : [],
      cooldownUntil: Number.isFinite(parsed.cooldownUntil) ? parsed.cooldownUntil : 0
    };
  } catch {
    return { requests: [], cooldownUntil: 0 };
  }
};

const writeRateLimitState = state => {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
  } catch {
    // Rate-limit tracking is helpful UI state, not required for generation.
  }
};

const pruneRecentRequests = (requests, now = Date.now()) =>
  requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

const formatRetryMessage = retryAfterMs => {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `Gemini đang tạm giới hạn quota. Vui lòng thử lại sau ${seconds} giây.`;
};

const assertGeminiRateLimit = () => {
  const now = Date.now();
  const state = readRateLimitState();
  const requests = pruneRecentRequests(state.requests, now);
  const retryAfterMs = Math.max(state.cooldownUntil - now, 0);

  if (retryAfterMs > 0) {
    writeRateLimitState({ requests, cooldownUntil: state.cooldownUntil });
    throw new GeminiRateLimitError(formatRetryMessage(retryAfterMs), retryAfterMs);
  }

  if (requests.length >= FREE_TIER_REQUEST_LIMIT) {
    const nextAllowedAt = requests[0] + RATE_LIMIT_WINDOW_MS;
    const localRetryAfterMs = Math.max(nextAllowedAt - now, 1000);
    writeRateLimitState({ requests, cooldownUntil: nextAllowedAt });
    throw new GeminiRateLimitError(formatRetryMessage(localRetryAfterMs), localRetryAfterMs);
  }

  writeRateLimitState({ requests, cooldownUntil: 0 });
};

const recordGeminiRequest = () => {
  const now = Date.now();
  const state = readRateLimitState();
  const requests = [...pruneRecentRequests(state.requests, now), now];
  writeRateLimitState({ requests, cooldownUntil: Math.max(state.cooldownUntil || 0, 0) });
};

const extractRetryAfterMs = error => {
  const details = error?.response?.data?.error?.details;
  const retryInfo = Array.isArray(details)
    ? details.find(detail => typeof detail?.retryDelay === 'string')
    : undefined;
  const retryDelay = retryInfo?.retryDelay;
  const retryDelayMatch = retryDelay?.match(/^([\d.]+)s$/);

  if (retryDelayMatch) {
    return Math.ceil(Number(retryDelayMatch[1]) * 1000);
  }

  const message = extractApiError(error);
  const messageMatch = message.match(/retry in\s+([\d.]+)s/i);

  if (messageMatch) {
    return Math.ceil(Number(messageMatch[1]) * 1000);
  }

  return 60 * 1000;
};

const isQuotaError = error => {
  const message = extractApiError(error).toLowerCase();
  return error?.response?.status === 429 || message.includes('quota exceeded') || message.includes('rate limit');
};

const applyGeminiCooldown = error => {
  const retryAfterMs = extractRetryAfterMs(error);
  const now = Date.now();
  const state = readRateLimitState();
  const requests = pruneRecentRequests(state.requests, now);
  const cooldownUntil = now + retryAfterMs;
  writeRateLimitState({ requests, cooldownUntil });
  return new GeminiRateLimitError(formatRetryMessage(retryAfterMs), retryAfterMs);
};

export function getGeminiRateLimitSnapshot() {
  const now = Date.now();
  const state = readRateLimitState();
  const requests = pruneRecentRequests(state.requests, now);
  const requestWindowUntil =
    requests.length >= FREE_TIER_REQUEST_LIMIT ? requests[0] + RATE_LIMIT_WINDOW_MS : 0;
  const cooldownUntil = Math.max(state.cooldownUntil || 0, requestWindowUntil);
  const retryAfterMs = Math.max(cooldownUntil - now, 0);

  if (requests.length !== state.requests.length || (retryAfterMs === 0 && state.cooldownUntil)) {
    writeRateLimitState({ requests, cooldownUntil: retryAfterMs > 0 ? cooldownUntil : 0 });
  }

  return {
    limit: FREE_TIER_REQUEST_LIMIT,
    remaining: Math.max(FREE_TIER_REQUEST_LIMIT - requests.length, 0),
    retryAfterMs,
    isLimited: retryAfterMs > 0
  };
}

const getCandidateModels = preferredModel =>
  [
    preferredModel || import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest'
  ].filter((model, index, models) => model && models.indexOf(model) === index);

const isRetryableGeminiError = error => {
  if (isQuotaError(error)) {
    return false;
  }

  const message = extractApiError(error).toLowerCase();
  return (
    error?.code === 'ECONNABORTED' ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily') ||
    message.includes('unavailable') ||
    message.includes('try again later')
  );
};

const requestSingleGeminiContent = async (topic, apiKey, model) => {
  assertGeminiRateLimit();
  recordGeminiRequest();

  const response = await axios.post(
    getGeminiEndpoint(model),
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(topic) }]
        }
      ],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 8192
      }
    },
    {
      params: { key: apiKey },
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    }
  );

  const content = cleanGeneratedContent(extractGeneratedText(response.data));

  if (!content) {
    throw new Error('Gemini không trả về nội dung hợp lệ.');
  }

  return content;
};

const requestGeminiContent = async (topic, apiKey) => {
  const models = getCandidateModels();
  let lastError;

  for (const model of models) {
    try {
      return await requestSingleGeminiContent(topic, apiKey, model);
    } catch (error) {
      lastError = error;

      if (error instanceof GeminiRateLimitError) {
        throw error;
      }

      if (isQuotaError(error)) {
        throw applyGeminiCooldown(error);
      }

      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  throw new Error(extractApiError(lastError));
};

export async function generateBlogContent(topic) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Thiếu VITE_GEMINI_API_KEY trong file .env.');
  }

  const content = await requestGeminiContent(topic, apiKey);

  return {
    content,
    warning: isContentQualified(content)
      ? undefined
      : 'Gemini đã trả nội dung thật nhưng bài hơi ngắn. Bạn có thể bấm tạo lại nếu muốn bài dài hơn.'
  };
}
