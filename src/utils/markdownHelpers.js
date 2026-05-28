export function applyMarkdownFormat(value, selectionStart, selectionEnd, format) {
  const selectedText = value.slice(selectionStart, selectionEnd) || 'nội dung';

  switch (format) {
    case 'bold':
      return wrapText(value, selectionStart, selectionEnd, `**${selectedText}**`);
    case 'italic':
      return wrapText(value, selectionStart, selectionEnd, `*${selectedText}*`);
    case 'h1':
      return replaceLinePrefix(value, selectionStart, selectionEnd, '# ');
    case 'h2':
      return replaceLinePrefix(value, selectionStart, selectionEnd, '## ');
    case 'ul':
      return replaceLinePrefix(value, selectionStart, selectionEnd, '- ');
    case 'ol':
      return replaceLinePrefix(value, selectionStart, selectionEnd, '1. ');
    default:
      return value;
  }
}

export function cleanMarkdownContent(markdown) {
  return String(markdown ?? '')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```$/i, '')
    .replace(/^Tuyệt vời!?[^\n]*(?:\n+|$)/i, '')
    .replace(/^Dưới đây là[^\n]*(?:\n+|$)/i, '')
    .replace(/^[-–—\s]*Dưới đây là[^\n]*(?:\n+|$)/i, '')
    .trim();
}

export function toPreviewText(markdown) {
  return cleanMarkdownContent(markdown)
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(value, start, end, replacement) {
  return `${value.slice(0, start)}${replacement}${value.slice(end)}`;
}

function replaceLinePrefix(value, start, end, prefix) {
  const before = value.slice(0, start);
  const selected = value.slice(start, end) || 'nội dung';
  const lines = selected
    .split(/\r?\n/)
    .map(line => (line.trim() ? `${prefix}${line}` : line));
  return `${before}${lines.join('\n')}${value.slice(end)}`;
}
