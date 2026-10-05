// Cleans and validates the SEO settings sent from Admin > SEO before they are saved.
// Throws an Error with a readable message when something is invalid (the route returns it as a 400).

export const SEO_PAGES = ['home', 'menu', 'about', 'gallery', 'reservations'];

const MAX = { title: 120, description: 320, keywords: 600 };
const MAX_KEYWORDS = 30;

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const normalizeKeywords = (value) => {
  const list = String(value || '')
    .split(/[,\n]/)
    .map((word) => word.trim())
    .filter(Boolean);
  const unique = [...new Set(list.map((word) => word.toLowerCase()))].map(
    (lower) => list.find((word) => word.toLowerCase() === lower)
  );
  return unique.slice(0, MAX_KEYWORDS).join(', ').slice(0, MAX.keywords);
};

// Accepts '' or a full http(s) URL; returns the origin only (no path, no trailing slash).
const siteUrl = (value) => {
  const raw = text(value, 200);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.origin;
  } catch {
    throw new Error('Website URL must be a full address like https://www.yourcafe.com');
  }
};

// Accepts '' or a full http(s) image URL.
const imageUrl = (value) => {
  const raw = text(value, 500);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.href;
  } catch {
    throw new Error('Share image must be a full link starting with https://');
  }
};

const handle = (value) => {
  const raw = text(value, 40).replace(/^@/, '');
  if (!raw) return '';
  if (!/^[A-Za-z0-9_]{1,15}$/.test(raw)) throw new Error('X (Twitter) handle can only use letters, numbers and underscores.');
  return raw;
};

// Admin may paste the whole <meta ... content="CODE"> tag; keep only the code.
const verificationCode = (value, label) => {
  let raw = text(value, 400);
  const fromTag = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  if (fromTag) raw = fromTag[1].trim();
  if (!raw) return '';
  if (!/^[A-Za-z0-9_-]{10,120}$/.test(raw)) throw new Error(`${label} verification code looks invalid.`);
  return raw;
};

export const sanitizeSeo = (input = {}) => {
  const pages = {};
  for (const page of SEO_PAGES) {
    const source = input.pages?.[page] || {};
    pages[page] = {
      title: text(source.title, MAX.title),
      description: text(source.description, MAX.description),
      keywords: normalizeKeywords(source.keywords)
    };
  }

  return {
    allowIndexing: input.allowIndexing !== false,
    siteUrl: siteUrl(input.siteUrl),
    defaultOgImage: imageUrl(input.defaultOgImage),
    twitterHandle: handle(input.twitterHandle),
    googleVerification: verificationCode(input.googleVerification, 'Google'),
    bingVerification: verificationCode(input.bingVerification, 'Bing'),
    pages
  };
};
