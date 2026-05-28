import { useEffect } from 'react';
import { toast } from 'sonner';
import EditorWorkspace from '../components/EditorWorkspace.jsx';
import SEO from '../components/SEO.jsx';
import { useBlogGenerator } from '../hooks/useBlogGenerator.js';
import { saveHistoryItem } from '../utils/historyStorage.js';

const EditorPage = () => {
  const {
    topic,
    generatedTopic,
    content,
    status,
    error,
    warning,
    rateLimit,
    setTopic,
    setContent,
    generateContent
  } = useBlogGenerator();

  useEffect(() => {
    if (status === 'success' && content.trim()) {
      saveHistoryItem(generatedTopic.trim(), content.trim());
    }
  }, [status, generatedTopic, content]);

  useEffect(() => {
    if (status === 'success') {
      toast.success('Đã tạo nội dung blog thành công.');
      return;
    }

    if (status === 'error' && error) {
      toast.error(error);
    }
  }, [status, error]);

  useEffect(() => {
    const storedTopic = localStorage.getItem('ai-blog-topic');
    const storedContent = localStorage.getItem('ai-blog-content');

    if (storedTopic) {
      setTopic(storedTopic);
    }

    if (storedContent) {
      setContent(storedContent);
    }
  }, [setTopic, setContent]);

  return (
    <>
      <SEO
        title="Editor | AI Blog Generator"
        description="Draft, generate, edit, and preview AI-assisted blog content in a focused markdown writing workspace."
        path="/editor"
        keywords={['AI blog editor', 'markdown preview', 'AI writing assistant', 'blog draft generator']}
      />
      <EditorWorkspace
        topic={topic}
        content={content}
        status={status}
        error={error}
        warning={warning}
        rateLimit={rateLimit}
        onTopicChange={setTopic}
        onContentChange={setContent}
        onGenerate={generateContent}
      />
    </>
  );
};

export default EditorPage;
