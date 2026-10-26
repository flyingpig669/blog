// Content timestamps use Beijing time (UTC+08:00), independent of the reader's timezone.
export function contentTimestamp(value) {
  const match = /^(\d{4}-\d{2}-\d{2})(?:[ T]((?:[01]\d|2[0-3]):[0-5]\d))?$/.exec(String(value || ''));
  if (!match) return null;
  const timestamp = Date.parse(`${match[1]}T${match[2] || '00:00'}:00+08:00`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function updatedText(value) {
  return String(value || '').replace('T', ' ');
}

export function updatedDateTime(value) {
  const text = updatedText(value);
  return text.length === 16 ? text.replace(' ', 'T') + ':00+08:00' : text;
}

export function homeTimestamp(post) {
  const published = contentTimestamp(post.date) ?? 0;
  const updated = contentTimestamp(post.updated);
  return post.kind === 'book' ? Math.max(published, updated ?? published) : updated ?? published;
}
