export function fileKind(url) {
  const extension=String(url).split(/[?#]/)[0].split('.').pop().toLowerCase();
  return ({pdf:'PDF',ppt:'PPT',pptx:'PPT',doc:'Word',docx:'Word',png:'图片',jpg:'图片',jpeg:'图片',webp:'图片',svg:'图片',mp3:'音频',mp4:'视频',zip:'ZIP'})[extension] || extension.toUpperCase();
}
export function fileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes<0) return '外部文件';
  if (bytes<1024) return bytes+' B';
  if (bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1024/1024).toFixed(1)+' MB';
}
