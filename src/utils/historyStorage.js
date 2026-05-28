import { cleanMarkdownContent } from './markdownHelpers.js';

const HISTORY_KEY = 'ai-blog-history';
const MAX_HISTORY_ITEMS = 20;

export function getHistoryItems() {
  const raw = localStorage.getItem(HISTORY_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHistoryItem);
  } catch {
    return [];
  }
}

export function saveHistoryItem(topic, content) {
  const items = getHistoryItems();
  const normalizedTopic = topic.trim();
  const normalizedContent = cleanMarkdownContent(content);

  if (!normalizedTopic || !normalizedContent) {
    return items;
  }

  const latestItem = items[0];
  if (latestItem && latestItem.topic === normalizedTopic && latestItem.content === normalizedContent) {
    return items;
  }

  const newItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    topic: normalizedTopic,
    content: normalizedContent,
    createdAt: new Date().toISOString()
  };

  const nextItems = [newItem, ...items].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextItems));
  return nextItems;
}

export function clearHistoryItems() {
  localStorage.removeItem(HISTORY_KEY);
}

function isHistoryItem(item) {
  return Boolean(
    item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.topic === 'string' &&
      typeof item.content === 'string' &&
      typeof item.createdAt === 'string'
  );
}
