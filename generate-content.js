const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 45000;

function getGeminiEndpoint(model = DEFAULT_GEMINI_MODEL) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function buildPrompt(topic) {
  return `
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
}

function countWords(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasRequiredMarkdownStructure(text) {
  const markdown = String(text ?? '');

  const hasH1 = /^#\s.+/m.test(markdown);
  const headingCount = (markdown.match(/^#{1,3}\s.+/gm) || []).length;
  const paragraphCount = markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(block => block && !/^#{1,6}\s/.test(block)).length;

  return hasH1 && headingCount >= 4 && paragraphCount >= 5;
}

function isContentQualified(text) {
  return countWords(text) >= 350 && hasRequiredMarkdownStructure(text);
}

function cleanGeneratedContent(text) {
  return String(text ?? '')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```$/i, '')
    .replace(/^Tuyệt vời!?[^\n]*(?:\n+|$)/i, '')
    .replace(/^Dưới đây là[^\n]*(?:\n+|$)/i, '')
    .trim();
}

function extractGeneratedText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;

  if (Array.isArray(parts)) {
    const text = parts
      .map(part => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();

    if (text) return text;
  }

  return '';
}

function extractApiError(payload) {
  if (typeof payload?.error?.message === 'string' && payload.error.message.trim()) {
    return payload.error.message.trim();
  }

  return 'Không thể tạo nội dung từ Gemini API.';
}

async function readResponseJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini trả về dữ liệu không phải JSON.');
  }
}

function getCandidateModels(preferredModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL) {
  return [
    preferredModel,
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest'
  ].filter((candidateModel, index, models) => candidateModel && models.indexOf(candidateModel) === index);
}

function isRetryableGeminiError(error) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    error?.name === 'AbortError' ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily') ||
    message.includes('unavailable') ||
    message.includes('try again later')
  );
}

async function requestSingleGeminiContent(topic, apiKey, model) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const endpoint = `${getGeminiEndpoint(model)}?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
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
      })
    });

    const payload = await readResponseJson(response);

    if (!response.ok) {
      throw new Error(extractApiError(payload));
    }

    const content = cleanGeneratedContent(extractGeneratedText(payload));

    if (!content) {
      throw new Error('Gemini không trả về nội dung hợp lệ.');
    }

    return content;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Model ${model} phản hồi quá lâu.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGeminiContent(topic, apiKey, model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL) {
  const models = getCandidateModels(model);
  let lastError;

  for (const candidateModel of models) {
    try {
      return await requestSingleGeminiContent(topic, apiKey, candidateModel);
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error)) {
        break;
      }
    }
  }

  throw lastError || new Error('Không thể tạo nội dung từ Gemini API.');
}

function generateMockContent(topic) {
  return `
# ${topic}: Hướng dẫn chi tiết từ A-Z

${topic} đang là chủ đề được rất nhiều người quan tâm vì tính ứng dụng thực tế trong cuộc sống và công việc. Tuy nhiên, không phải ai cũng hiểu rõ bản chất cũng như cách áp dụng hiệu quả.

Trong bài viết này, bạn sẽ hiểu rõ hơn về ${topic}, các sai lầm phổ biến và checklist hành động để bắt đầu.

- Tránh sai lầm phổ biến
- Tiết kiệm thời gian

## 2. Lợi ích khi áp dụng

1. Tăng hiệu quả
2. Có định hướng rõ ràng
3. Giảm rủi ro sai sót

## 3. Những điều cần lưu ý

Việc hiểu rõ nền tảng là rất quan trọng để tránh thực hiện sai hướng.

### Kinh nghiệm thực tế

Nhiều người thất bại do không có kế hoạch cụ thể.

## 4. Ưu và nhược điểm

### Ưu điểm

- Dễ tiếp cận
- Có giá trị thực tế

### Nhược điểm

- Cần thời gian
- Cần kiên trì

## Sai lầm thường gặp

- Thiếu kế hoạch
- Mong kết quả quá nhanh
- Không duy trì đều đặn

## Checklist hành động

- Xác định mục tiêu
- Lập kế hoạch
- Theo dõi tiến độ
- Điều chỉnh khi cần

## Kết luận

${topic} sẽ hiệu quả hơn nếu bạn áp dụng đúng phương pháp và kiên trì thực hiện.

Hãy thử áp dụng ngay hôm nay và chia sẻ trải nghiệm của bạn!
`.trim();
}

async function generateBlogContent(rawTopic, apiKey) {
  const topic = String(rawTopic ?? '').trim();

  if (!topic) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: 'Chủ đề không được để trống.'
      }
    };
  }

  if (!apiKey) {
    return {
      statusCode: 200,
      body: {
        success: true,
        fallback: true,
        message: 'Thiếu GEMINI_API_KEY, hệ thống đang dùng mock content.',
        content: generateMockContent(topic)
      }
    };
  }

  try {
    const content = await requestGeminiContent(topic, apiKey);

    return {
      statusCode: 200,
      body: {
        success: true,
        fallback: false,
        warning: isContentQualified(content) ? undefined : 'Gemini đã trả nội dung thật nhưng bài hơi ngắn. Bạn có thể bấm tạo lại nếu muốn bài dài hơn.',
        content
      }
    };
  } catch (error) {
    return {
      statusCode: 200,
      body: {
        success: true,
        fallback: true,
        message: error instanceof Error ? error.message : 'Lỗi Gemini API, hệ thống đang dùng mock content.',
        content: generateMockContent(topic)
      }
    };
  }
}

export {
  generateMockContent,
  generateBlogContent
};
