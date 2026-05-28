import { Clock, Copy, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

const EditorWorkspace = ({
  topic,
  content,
  status,
  error,
  warning,
  rateLimit,
  onTopicChange,
  onGenerate
}) => {
  const isLoading = status === 'loading';
  const hasContent = content.trim().length > 0;
  const retrySeconds = Math.max(0, Math.ceil((rateLimit?.retryAfterMs || 0) / 1000));
  const isRateLimited = retrySeconds > 0;
  const canGenerate = !isLoading && !isRateLimited && topic.trim().length > 0;

  const handleTopicEnter = event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!canGenerate) return;
    onGenerate();
  };

  const handleCopy = async () => {
    if (!hasContent) return;

    try {
      await navigator.clipboard.writeText(content);
      toast.success('Đã sao chép nội dung.');
    } catch {
      toast.error('Không thể sao chép nội dung.');
    }
  };

  const handleDownload = () => {
    if (!hasContent) return;

    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${topic.trim() || 'blog-content'}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file Markdown.');
    } catch {
      toast.error('Không thể tải xuống file.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1560px] px-4 pb-10 pt-[62px]">
      <h1 className="text-[32px] font-bold leading-tight text-black dark:text-white">Blog Editor</h1>

      <section className="mt-[30px] rounded-[16px] border border-slate-200 bg-white px-[30px] py-[34px] shadow-md shadow-black/10 dark:border-slate-800 dark:bg-black">
        <h2 className="text-[24px] font-bold leading-tight text-black dark:text-white">Chủ đề Blog</h2>

        <div className="mt-[31px] flex items-center gap-[10px]">
          <input
            value={topic}
            onChange={event => onTopicChange(event.target.value)}
            onKeyDown={handleTopicEnter}
            placeholder="Nhập chủ đề blog của bạn (ví dụ: Lợi ích của thiền định)"
            className="h-[45px] min-w-0 flex-1 rounded-[10px] border border-slate-200 bg-white px-[20px] text-[14px] text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 dark:border-slate-700 dark:bg-black dark:text-white dark:placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="inline-flex h-[45px] min-w-[151px] items-center justify-center rounded-[10px] border border-slate-300 bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
          >
            {isLoading ? 'Đang tạo...' : isRateLimited ? `${retrySeconds}s` : 'Tạo Nội Dung'}
          </button>
        </div>

        <p className="mt-[23px] text-[14px] text-slate-500 dark:text-slate-300">AI sẽ tạo ra nội dung blog dựa trên chủ đề bạn nhập</p>
        {isRateLimited && (
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
            <Clock className="h-4 w-4 shrink-0" />
            Gemini đang giới hạn lượt gọi. Có thể thử lại sau {retrySeconds} giây.
          </p>
        )}
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {warning && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{warning}</p>}
      </section>

      <section className="mt-[30px] rounded-[16px] border border-slate-200 bg-white px-[30px] py-[30px] shadow-md shadow-black/10 dark:border-slate-800 dark:bg-black">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-bold leading-tight text-black dark:text-white">Xem trước & Xuất</h2>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!hasContent}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 text-[13px] font-semibold text-black shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-black dark:text-white"
            >
              <Copy className="h-5 w-5" />
              Sao chép
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!hasContent}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-slate-300 bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
            >
              <Download className="h-5 w-5" />
              Tải xuống
            </button>
          </div>
        </div>

        <div className="mt-[30px] border-t border-slate-200 pt-[42px] dark:border-slate-800">
          {hasContent ? (
            <article className="prose max-h-[430px] max-w-none overflow-y-auto bg-white prose-headings:text-black prose-p:text-slate-800 prose-li:text-slate-800 dark:bg-black dark:prose-headings:text-white dark:prose-p:text-slate-200 dark:prose-li:text-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          ) : (
            <div className="flex min-h-[128px] items-start justify-center text-[16px] text-slate-500 dark:text-slate-300">
              Chưa có nội dung để hiển thị.
            </div>
          )}
        </div>
      </section>
    </section>
  );
};

export default EditorWorkspace;
