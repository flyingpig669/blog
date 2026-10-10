/**
 * 生成社交分享卡片图 og-image.png (1200x630)。
 *
 * 用法：npm run build:og
 *
 * 为什么需要它：本站是 Hash 路由单页应用，所有路由共享同一个物理 URL，因此无法为
 * 每篇文章生成独立分享图 —— 只能有一张静态站点卡。缺了 og:image，任何分享（微信、
 * Twitter、Slack）都会退化成无图或纯文字卡片。
 *
 * 实现选择：用无头 Chrome 渲染 HTML 再截图，而不是绘图库。原因是卡片要复用站点的
 * 设计令牌（颜色、字体、字距），用 HTML/CSS 写一遍就等于复用，不需要在 JS 里把
 * 版式再手工实现一次；同时避免引入 Pillow / ImageMagick 这类系统级依赖。
 *
 * 文案取自 blog.config.js 的 site 字段（唯一来源），改配置后重跑本脚本即可。
 * 这个脚本只在本地/开发时运行，产物 og-image.png 会随仓库提交（CI 只做拷贝）。
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'og-image.png');

// 与浏览器回归脚本使用同一个 Chrome，避免额外下载一份 Chromium。
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const puppeteer = require('/Users/ccc/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core');

// 复用 sync_posts.py 读取配置的方式：路由声明表必须先于 blog.config.js 进入同一个
// vm 上下文，否则 window.BlogRoutes 不存在，配置会直接抛错。
function loadSite() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['js/lib/routes.js', 'blog.config.js']) {
    const full = path.join(ROOT, file);
    vm.runInContext(fs.readFileSync(full, 'utf8'), context, { filename: full, timeout: 1000 });
  }
  return context.window.BlogConfig.site;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

function cardHtml(site) {
  const host = String(site.url || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  /* 设计令牌与 css/main.css 的 :root 保持一致，改主题时两边一起改。 */
  :root {
    --bg-page: #0A0A0B;
    --bg-surface: #111113;
    --text-primary: #EDEDED;
    --text-secondary: #8B8B8E;
    --text-muted: #5A5A5E;
    --accent-primary: #3B82F6;
    --divider: rgba(255, 255, 255, 0.08);
    --font-sans: 'Inter', system-ui, -apple-system, 'PingFang SC', sans-serif;
    --font-mono: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    background: var(--bg-page);
    color: var(--text-primary);
    font-family: var(--font-sans);
    position: relative;
  }
  /* 左上角一抹极淡的蓝色辉光，让纯黑底不至于死板。 */
  .glow {
    position: absolute; top: -320px; left: -260px; width: 900px; height: 900px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.20) 0%, rgba(59, 130, 246, 0) 62%);
  }
  /* 极细网格，呼应站点的 1px 细线语言。 */
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(to right, var(--divider) 1px, transparent 1px),
      linear-gradient(to bottom, var(--divider) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: linear-gradient(to bottom right, rgba(0,0,0,0.5), transparent 70%);
  }
  .frame { position: relative; height: 100%; padding: 84px 96px 0; display: flex; flex-direction: column; }

  .brand { display: flex; align-items: center; gap: 14px; }
  .mark { width: 34px; height: 34px; flex: none; }
  .brand-text {
    font-family: var(--font-mono); font-size: 21px; letter-spacing: 0.10em;
    color: var(--text-secondary); text-transform: lowercase;
  }

  h1 {
    margin-top: 62px; font-size: 92px; font-weight: 700; letter-spacing: -0.035em;
    line-height: 1.04;
  }
  .tagline {
    margin-top: 26px; font-size: 27px; line-height: 1.5; font-weight: 400;
    color: var(--text-secondary); max-width: 880px;
  }

  .meta {
    margin-top: auto; margin-bottom: 84px;
    padding-top: 26px; border-top: 1px solid var(--divider);
    display: flex; align-items: center; justify-content: space-between;
    font-family: var(--font-mono); font-size: 19px; color: var(--text-muted);
  }
  .meta .accent { color: var(--accent-primary); }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="grid"></div>
  <div class="frame">
    <div class="brand">
      <svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#161618"/>
        <path d="M39 10 22 54" stroke="#3B82F6" stroke-width="7" stroke-linecap="round"/>
      </svg>
      <span class="brand-text">${escapeHtml(site.brand || 'aurora.notes')}</span>
    </div>
    <h1>${escapeHtml(site.title || 'Aurora Notes')}</h1>
    <p class="tagline">${escapeHtml(site.tagline || '')}</p>
    <div class="meta">
      <span>${escapeHtml(host)}</span>
      <span class="accent">#/archive</span>
    </div>
  </div>
</body>
</html>`;
}

(async () => {
  const site = loadSite();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    // 字体走 Google Fonts 的 @import；断网时 Chrome 会退回系统字体，卡片依旧成型。
    await page.setContent(cardHtml(site), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.screenshot({ path: OUT, type: 'png' });
    const { size } = fs.statSync(OUT);
    console.log(`✅ 已生成 ${path.relative(ROOT, OUT)} (1200x630, ${(size / 1024).toFixed(1)} KB)`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('生成 og-image.png 失败:', error.message);
  process.exit(1);
});
