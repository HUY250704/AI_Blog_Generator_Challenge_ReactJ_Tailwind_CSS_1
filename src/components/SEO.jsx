import { useEffect } from 'react';

const DEFAULT_SITE_NAME = 'AI Blog Generator';

const setMetaTag = (selector, attribute, value) => {
  const tag = document.head.querySelector(selector);
  tag?.setAttribute(attribute, value);
};

const SEO = ({ title, description, path = '/', keywords = [] }) => {
  useEffect(() => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = new URL(normalizedPath, window.location.origin).toString();
    const pageTitle = title.includes(DEFAULT_SITE_NAME) ? title : `${title} | ${DEFAULT_SITE_NAME}`;

    document.title = pageTitle;

    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[name="keywords"]', 'content', keywords.join(', '));
    setMetaTag('link[rel="canonical"]', 'href', canonicalUrl);
    setMetaTag('meta[property="og:title"]', 'content', pageTitle);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[name="twitter:title"]', 'content', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
  }, [description, keywords, path, title]);

  return null;
};

export default SEO;
