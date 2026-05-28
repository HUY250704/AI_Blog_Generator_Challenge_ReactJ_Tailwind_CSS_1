import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

const featureCards = [
  {
    title: 'AI-Powered',
    description: 'Generate blog outlines and content suggestions using advanced AI'
  },
  {
    title: 'Rich Editor',
    description: 'Full-featured text editor with formatting tools and live preview'
  },
  {
    title: 'Export Ready',
    description: 'Export your finished articles in multiple formats'
  }
];

const LandingPage = () => {
  const handleStartWriting = () => {
    localStorage.setItem('ai-blog-started', 'true');
  };

  return (
    <section className="mx-auto flex w-full max-w-[1100px] flex-col items-center px-4 pb-12 pt-[64px] text-center">
      <SEO
        title="AI Blog Generator | Create Blog Posts Faster"
        description="Turn ideas into structured blog posts with AI-generated outlines, writing support, markdown preview, and export-ready content."
        path="/"
        keywords={['AI blog generator', 'blog writing tool', 'content generator', 'markdown editor']}
      />
      <h1 className="text-[32px] font-bold leading-tight text-black dark:text-white">
        AI Blog Generator
      </h1>
      <p className="mt-3 max-w-[720px] text-[16px] leading-[1.45] text-slate-950 dark:text-slate-100">
        Transform your ideas into compelling blog posts with AI assistance.
        <br />
        Generate outlines, write content, and export beautiful articles.
      </p>

      <div className="mt-[44px] grid w-full gap-[15px] md:grid-cols-3">
        {featureCards.map(card => (
          <article
            key={card.title}
            className="flex min-h-[162px] flex-col items-center justify-center rounded-[14px] border border-slate-300 bg-white px-8 py-7 shadow-sm dark:border-slate-700 dark:bg-black"
          >
            <h2 className="text-[24px] font-bold leading-tight text-black dark:text-white">{card.title}</h2>
            <p className="mt-3 text-[14px] leading-[1.7] text-slate-950 dark:text-slate-200">{card.description}</p>
          </article>
        ))}
      </div>

      <Link
        to="/editor"
        onClick={handleStartWriting}
        className="mt-10 inline-flex h-[46px] items-center justify-center rounded-[14px] border border-slate-300 bg-white px-7 text-[16px] font-semibold text-black transition hover:bg-slate-100 dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
      >
        Start Writing
      </Link>
    </section>
  );
};

export default LandingPage;
