const MAX_CANVAS_PIXELS = 16_000_000;

export function pdfLayout({ pageWidth, pageHeight, width, height, fullscreen = false, zoom = 1, pixelRatio = 1 }) {
  if (!(pageWidth > 0 && pageHeight > 0)) throw new Error('Invalid PDF page size');
  const fitWidth = Math.max(1, width) / pageWidth;
  const fit = fullscreen ? Math.min(fitWidth, Math.max(1, height) / pageHeight) : fitWidth;
  const scale = fit * Math.max(0.4, Math.min(3, zoom));
  const renderedWidth = pageWidth * scale, renderedHeight = pageHeight * scale;
  const density = Math.min(Math.max(1, pixelRatio), 2, Math.sqrt(MAX_CANVAS_PIXELS / (renderedWidth * renderedHeight)));
  return { scale, width: renderedWidth, height: renderedHeight, density };
}

export function previewFileName(url) {
  const name = String(url || '').split(/[?#]/)[0].split('/').pop();
  try { return decodeURIComponent(name); } catch { return name; }
}
