import { useEffect, useMemo, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Copy, Download, Eye, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import SEO from '../components/SEO.jsx';
import { cleanMarkdownContent, toMarkdownFileName, toPreviewText } from '../utils/markdownHelpers.js';

const HISTORY_KEY = 'ai-blog-history';

const getHistoryItems = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    setItems(getHistoryItems());
  }, []);

  const cards = useMemo(
    () =>
      items.map(item => ({
        ...item,
        content: cleanMarkdownContent(item.content),
        preview: toPreviewText(item.content).slice(0, 260)
      })),
    [items]
  );

  const handleCopy = async () => {
    if (!previewItem?.content) return;

    try {
      await navigator.clipboard.writeText(previewItem.content);
      toast.success('Đã sao chép nội dung.');
    } catch {
      toast.error('Không thể sao chép nội dung.');
    }
  };

  const handleDownload = () => {
    if (!previewItem?.content) return;

    try {
      const blob = new Blob([previewItem.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = toMarkdownFileName(previewItem.topic);
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file Markdown.');
    } catch {
      toast.error('Không thể tải xuống file.');
    }
  };

  const confirmDelete = () => {
    if (!deleteItem) return;

    const nextItems = items.filter(item => item.id !== deleteItem.id);
    setItems(nextItems);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextItems));
    setDeleteItem(null);
    toast.success('Đã xóa bài viết.');
  };

  return (
    <section className="mx-auto w-full max-w-[1480px] px-4 py-12">
      <SEO
        title="History | AI Blog Generator"
        description="Review, reopen, and manage previously generated AI blog drafts from your local writing history."
        path="/history"
        keywords={['blog history', 'AI blog drafts', 'content archive', 'writing history']}
      />

      <h1 className="text-[28px] font-bold leading-tight text-black dark:text-white">Hi, here is your history</h1>

      {cards.length === 0 ? (
        <div className="flex min-h-[58vh] items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="h-56 w-56">
              <DotLottieReact src="/animation/Not Found (1) (1).lottie" loop autoplay />
            </div>
            <p className="mt-2 text-[26px] font-semibold leading-tight text-slate-700 dark:text-slate-200">No history found</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cards.map(item => (
            <article
              key={item.id}
              className="rounded-[12px] border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-black"
            >
              <h2 className="text-[21px] font-bold uppercase leading-tight text-black dark:text-white">{item.topic}</h2>
              <p className="mt-4 line-clamp-3 text-[14px] leading-[1.45] text-black dark:text-slate-100">
                {item.preview}
                {toPreviewText(item.content).length > 260 ? '...' : ''}
              </p>

              <div className="mt-4 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="inline-flex h-10 w-11 items-center justify-center rounded-[9px] border border-slate-300 bg-white text-black transition hover:bg-slate-100 dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
                  aria-label="Xem bài viết"
                  title="Xem bài viết"
                >
                  <Eye className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteItem(item)}
                  className="inline-flex h-10 w-11 items-center justify-center rounded-[9px] bg-red-700 text-white transition hover:bg-red-600"
                  aria-label="Xóa bài viết"
                  title="Xóa bài viết"
                >
                  <Trash2 className="h-[18px] w-[18px]" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-20">
          <div className="relative max-h-[82vh] w-full max-w-[960px] overflow-y-auto rounded-[10px] bg-white p-[30px] shadow-2xl dark:bg-black">
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Đóng preview"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between gap-4 pr-10">
              <h2 className="text-[24px] font-bold leading-tight text-black dark:text-white">Xem trước & Xuất</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-slate-50 dark:border-slate-700 dark:bg-black dark:text-white"
                >
                  <Copy className="h-5 w-5" />
                  Sao chép
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-slate-300 bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-slate-100 dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
                >
                  <Download className="h-5 w-5" />
                  Tải xuống
                </button>
              </div>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-9 dark:border-slate-800">
              <article className="prose max-w-none prose-headings:text-black prose-p:text-black prose-p:leading-8 prose-li:text-black dark:prose-headings:text-white dark:prose-p:text-slate-100 dark:prose-li:text-slate-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewItem.content}</ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="relative w-full max-w-[530px] rounded-[12px] bg-white p-[30px] text-center shadow-2xl dark:bg-black">
            <button
              type="button"
              onClick={() => setDeleteItem(null)}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Đóng xác nhận"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto h-[210px] w-[210px]">
              <DotLottieReact src="/animation/Taking out the trash (1).lottie" loop autoplay />
            </div>

            <h2 className="mt-2 text-[24px] font-bold text-black dark:text-white">Confirm Delete</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="h-[45px] rounded-[8px] border border-slate-200 bg-white text-[15px] font-semibold text-black shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-black dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-[45px] rounded-[8px] bg-red-600 text-[15px] font-semibold text-white transition hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistoryPage;
