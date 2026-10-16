// KaTeX 按需加载器 (Lazy loader for the KaTeX math renderer)
//
// 背景：KaTeX 是全站最重的一份 vendor 资源（katex.min.js 约 273KB / gzip 约 75KB，
// 另加约 24KB 的 katex.min.css），但只有少数文档真正用到数学公式 —— 首页、
// About、Tags、Archive、Columns 一次都用不到。此前 index.html 无条件引入，
// 等于让所有读者为个别文章付费。
//
// 策略：正文到手之后再决定。**只在检测到公式时**才注入 CSS 与 JS，并等脚本
// 就绪后再交给 markdown.js 渲染。与 PDF.js 的懒加载（app.js#ensureSlideViewer）
// 是同一套思路：重资源按需加载，加载失败也不阻塞页面。
//
// 两条约定：
//   1) ensure() 永不 reject。加载失败时照常 resolve(false)，由 markdown.js 走
//      「KaTeX 缺失」的降级分支（公式退化成等宽文本），保证页面一定渲染得出来。
//   2) 检测规则必须与 markdown.js 的公式提取范围一致，否则会出现「以为没有公式
//      所以没加载、结果公式退化」的静默故障。markdown.js 只识别 \(...\) 与
//      $$...$$，单美元符号是普通文本（不是公式），这里同样不把它算作公式。
window.BlogKatex = {
  // 命中任意一种即认为需要 KaTeX：行内 \(...\)、独立成块的 $$...$$、同行 $$...$$。
  // 刻意与 markdown.js 的提取规则保持一致，不多不少。
  MATH_HINT: /\\\((?:.|\n)+?\\\)|\$\$(?:.|\n)+?\$\$/,

  _promise: null,

  // 判断一段正文是否含公式。空内容直接返回 false，避免为此加载 75KB。
  needsMath: function (text) {
    if (!text) return false;
    return this.MATH_HINT.test(String(text));
  },

  // 需要时加载 KaTeX；返回 Promise<boolean>（是否可用）。并发调用共用一次加载。
  ensure: function (text) {
    if (!this.needsMath(text)) return Promise.resolve(false);
    if (window.katex) return Promise.resolve(true);
    if (!this._promise) this._promise = this._load();
    return this._promise;
  },

  // 注入样式与脚本。必须等样式加载完再引脚本：否则渲染时样式可能还没生效，
  // 公式会先以裸文本闪一下（FOUC），正是我们修 KaTeX 加载方式时想避免的。
  _load: function () {
    var self = this;
    return new Promise(function (resolve) {
      var injectScript = function () {
        var script = document.createElement('script');
        script.src = 'vendor/katex/katex.min.js';
        script.onload = function () { resolve(!!window.katex); };
        script.onerror = function () {
          self._promise = null; // 允许下一次再试，别把失败结果缓存住
          resolve(false);
        };
        document.head.appendChild(script);
      };

      var cssEl = document.createElement('link');
      cssEl.rel = 'stylesheet';
      cssEl.href = 'vendor/katex/katex.min.css';
      // 样式加载失败也要继续：公式最多样式不对，不能把整页渲染卡住。
      cssEl.onload = injectScript;
      cssEl.onerror = injectScript;
      document.head.appendChild(cssEl);
    });
  }
};
