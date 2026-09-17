import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i;

const ALLOWED_TAGS = [
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'b',
  'i',
  'a',
  'span',
  'div',
];

const ALLOWED_ATTR = ['href', 'target', 'rel'];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToHtml(text: string): string {
  return escapeHtml(text).replace(/\r\n|\r|\n/g, '<br />');
}

export function formatJobDescription(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return '';

  const raw = HTML_TAG_PATTERN.test(trimmed) ? trimmed : plainTextToHtml(trimmed);

  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target', 'rel'],
  });
}
