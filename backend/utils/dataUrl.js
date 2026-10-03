// Images uploaded from the admin panel are stored as data URLs (data:image/png;base64,...).
// These helpers let the API serve them as normal cacheable images instead of huge JSON strings.
const DATA_URL = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s;

export const isDataUrl = (value) => typeof value === 'string' && DATA_URL.test(value);

export const sendDataUrlImage = (res, value) => {
  const match = typeof value === 'string' ? value.match(DATA_URL) : null;
  if (!match) return res.status(404).end();
  res.set('Content-Type', match[1]);
  res.set('Cache-Control', 'public, max-age=31536000, immutable'); // URL changes (?v=) when image changes
  return res.send(Buffer.from(match[2], 'base64'));
};

// Returns what the website should use as <img src>: a normal URL stays as is,
// an uploaded image becomes a short link to the image endpoint.
export const imageSrc = (stored, endpoint, updatedAt) => {
  if (!stored) return '';
  if (isDataUrl(stored)) return `${endpoint}?v=${new Date(updatedAt).getTime()}`;
  return stored;
};
