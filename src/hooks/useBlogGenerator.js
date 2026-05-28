import { useEffect, useState } from 'react';
import { generateBlogContent, getGeminiRateLimitSnapshot } from '../utils/geminiClient.js';

const initialState = {
  topic: '',
  content: '',
  status: 'idle',
  error: undefined,
  warning: undefined
};

export function useBlogGenerator() {
  const [topic, setTopic] = useState(initialState.topic);
  const [generatedTopic, setGeneratedTopic] = useState('');
  const [content, setContent] = useState(initialState.content);
  const [status, setStatus] = useState(initialState.status);
  const [error, setError] = useState(initialState.error);
  const [warning, setWarning] = useState(initialState.warning);
  const [rateLimit, setRateLimit] = useState(() => getGeminiRateLimitSnapshot());

  useEffect(() => {
    if (!rateLimit.isLimited) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRateLimit(getGeminiRateLimitSnapshot());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [rateLimit.isLimited]);

  const reset = () => {
    setTopic('');
    setGeneratedTopic('');
    setContent('');
    setStatus('idle');
    setError(undefined);
    setWarning(undefined);
    localStorage.removeItem('ai-blog-topic');
    localStorage.removeItem('ai-blog-content');
  };

  const generateContent = async () => {
    const cleanedTopic = topic.trim();
    if (!cleanedTopic) {
      setError('Vui lòng nhập chủ đề trước khi tạo nội dung.');
      setStatus('error');
      setWarning(undefined);
      return;
    }

    setStatus('loading');
    setError(undefined);
    setWarning(undefined);
    setRateLimit(getGeminiRateLimitSnapshot());

    try {
      const data = await generateBlogContent(cleanedTopic);

      setContent(data.content);
      setGeneratedTopic(cleanedTopic);
      localStorage.setItem('ai-blog-topic', cleanedTopic);
      localStorage.setItem('ai-blog-content', data.content);
      setStatus('success');
      setError(undefined);
      setWarning(data.warning);
      setRateLimit(getGeminiRateLimitSnapshot());
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Lỗi mạng khi gọi API. Vui lòng thử lại.');
      setWarning(undefined);
      setRateLimit(getGeminiRateLimitSnapshot());
    }
  };

  return {
    topic,
    generatedTopic,
    content,
    status,
    error,
    warning,
    rateLimit,
    setTopic,
    setContent,
    generateContent,
    reset
  };
}
