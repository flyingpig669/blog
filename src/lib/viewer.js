let loading;
function script(url) {
  return new Promise((resolve, reject) => {
    const element = document.createElement("script");
    element.src = url;
    element.async = true;
    element.onload = resolve;
    element.onerror = () => {
      element.remove();
      reject(new Error("播放器加载失败"));
    };
    document.head.appendChild(element);
  });
}
export function ensureViewer() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!loading)
    loading = (async () => {
      if (!window.pdfjsLib) await script("vendor/pdfjs/pdf.min.js");
      return window.pdfjsLib;
    })().catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}
