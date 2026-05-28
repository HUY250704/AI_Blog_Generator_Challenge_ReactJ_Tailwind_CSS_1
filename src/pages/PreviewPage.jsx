import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import SEO from '../components/SEO.jsx';
import { Button, buttonVariants } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { cn } from '../lib/utils.js';
import { toMarkdownFileName } from '../utils/markdownHelpers.js';

const PreviewPage = () => {
  const navigate = useNavigate();
  const topic = localStorage.getItem('ai-blog-topic') || '';
  const content = localStorage.getItem('ai-blog-content') || '';
  const hasContent = content.trim().length > 0;

  const handleDownload = () => {
    if (!hasContent) return;

    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = toMarkdownFileName(topic);
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file Markdown.');
    } catch {
      toast.error('Không thể tải xuống file.');
    }
  };

  return (
    <section className="space-y-5">
      <SEO
        title="Preview | AI Blog Generator"
        description="Preview the final generated blog article with polished markdown rendering."
        path="/preview"
        keywords={['blog preview', 'markdown article preview', 'AI generated blog']}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight text-black dark:text-white">Preview bài viết</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{topic || 'Chưa có chủ đề'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/editor')}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại sửa
          </Button>
          <Button type="button" onClick={handleDownload} disabled={!hasContent}>
            <Download className="h-4 w-4" />
            Tải xuống
          </Button>
        </div>
      </div>

      {hasContent ? (
        <Card className="rounded-xl">
          <CardContent className="p-5 sm:p-8">
            <article className="prose mx-auto max-w-3xl prose-headings:text-slate-950 prose-p:leading-7 prose-p:text-slate-800 prose-li:text-slate-800 prose-a:text-slate-950 dark:prose-headings:text-white dark:prose-p:text-slate-200 dark:prose-li:text-slate-200 dark:prose-a:text-white">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl">
          <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
            <FileText className="h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Chưa có nội dung preview</h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">Hãy tạo hoặc nhập nội dung trong editor trước, sau đó quay lại trang preview.</p>
            <Link to="/editor" className={cn(buttonVariants(), 'mt-5')}>
              Mở Editor
            </Link>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default PreviewPage;
