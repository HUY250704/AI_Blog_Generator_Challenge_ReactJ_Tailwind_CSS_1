import { useState } from 'react';

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

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: cleanedTopic })
      });

      const data = await response.json();

      if (!response.ok || !data?.content) {
        setStatus('error');
        setError(data?.message || 'Không thể tạo nội dung từ API.');
        setWarning(undefined);
        return;
      }

      setContent(data.content);
      setGeneratedTopic(cleanedTopic);
      localStorage.setItem('ai-blog-topic', cleanedTopic);
      localStorage.setItem('ai-blog-content', data.content);
      setStatus('success');
      setError(undefined);
      setWarning(data.warning || (data.fallback ? data.message || 'Đã dùng nội dung mock do API không khả dụng.' : undefined));
    } catch {
      setStatus('error');
      setError('Lỗi mạng khi gọi API. Vui lòng thử lại.');
      setWarning(undefined);
    }
  };

  return {
    topic,
    generatedTopic,
    content,
    status,
    error,
    warning,
    setTopic,
    setContent,
    generateContent,
    reset
  };
}
