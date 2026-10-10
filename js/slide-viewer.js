/**
 * ==============================================================================
 * Aurora Blog - 科技极简演示文稿播放器 (Slide Deck / PDF Presentation Player)
 * ==============================================================================
 * 设计美学：Linear / Raycast / Keynote 深色极简风格。
 * 基于 PDF.js 矢量光栅化内核，支持 Retina 2x 高清渲染、双模式全屏演示、
 * 热区翻页、键盘控制、自适应缩放与悬浮灵动控制岛。
 */

window.BlogSlideViewer = {
  instances: {},
  workerConfigured: false,

  initWorker: function() {
    if (this.workerConfigured) return;
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
      this.workerConfigured = true;
    }
  },

  mount: function(container, options) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return null;

    this.initWorker();
    var id = 'slide-deck-' + Math.random().toString(36).slice(2, 9);
    var viewer = new SlidePlayer(container, options, id);
    this.instances[id] = viewer;
    viewer.load();
    return viewer;
  },

  destroyAll: function() {
    var self = this;
    Object.keys(this.instances).forEach(function(id) {
      var viewer = self.instances[id];
      if (viewer && typeof viewer.destroy === 'function') viewer.destroy();
      delete self.instances[id];
    });
  }
};

function SlidePlayer(container, options, id) {
  this.container = container;
  this.options = options || {};
  this.url = options.url || '';
  this.title = options.title || 'Presentation';
  this.id = id;

  this.pdfDoc = null;
  this.loadingTask = null;
  this.pageNum = 1;
  this.pageRendering = false;
  this.pageNumPending = null;
  this.scale = 1.0;
  this.baseViewport = null;
  this.fitMode = 'auto'; // 'auto', 'width', 'custom'
  this.isFullscreen = false;
  this.destroyed = false;
  this.hideControlsTimer = null;

  this.elements = {};
  this.boundKeyHandler = this.handleKeyDown.bind(this);
  this.boundFullscreenChange = this.handleFullscreenChange.bind(this);
  this.boundResizeHandler = null;
}

SlidePlayer.prototype.buildDOM = function() {
  var self = this;
  this.container.innerHTML = '';
  this.container.className = 'slide-deck-player-wrapper select-none my-8';

  var root = document.createElement('div');
  root.className = 'slide-player-root bg-[#0A0A0B] border border-white/[0.08] rounded-xl overflow-hidden relative flex flex-col transition-all';
  root.id = this.id;

  // 1. 顶部专业工具栏 (Header Toolbar)
  var header = document.createElement('div');
  header.className = 'slide-player-header flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#111113] border-b border-white/[0.06] text-[13px]';

  // 左侧：徽章 + 演示标题
  var leftGroup = document.createElement('div');
  leftGroup.className = 'flex items-center gap-2.5 min-w-0 pr-2';
  leftGroup.innerHTML = '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#3B82F6]/15 text-[#3B82F6] shrink-0 uppercase tracking-wider">SLIDE DECK</span>' +
    '<span class="text-[#EDEDED] font-sans font-medium text-[13px] truncate">' + self.escapeHtml(self.title) + '</span>';

  // 中间：分页指示器与前后导航
  var centerGroup = document.createElement('div');
  centerGroup.className = 'flex items-center gap-1.5 shrink-0 bg-[#161618] border border-white/[0.08] rounded-lg px-1.5 py-0.5';

  var prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'slide-tool-btn text-[#8B8B8E] hover:text-[#EDEDED] p-1 rounded transition-colors cursor-pointer';
  prevBtn.title = 'Previous Slide (← / Space)';
  prevBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  prevBtn.onclick = function(e) { e.stopPropagation(); self.onPrevPage(); };

  var pageDisplay = document.createElement('div');
  pageDisplay.className = 'flex items-center gap-1 text-[12px] font-mono px-1';
  pageDisplay.innerHTML = '<span class="curr-page text-[#EDEDED] font-semibold">01</span><span class="text-[#5A5A5E]">/</span><span class="total-page text-[#8B8B8E]">--</span>';

  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'slide-tool-btn text-[#8B8B8E] hover:text-[#EDEDED] p-1 rounded transition-colors cursor-pointer';
  nextBtn.title = 'Next Slide (→ / Enter)';
  nextBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  nextBtn.onclick = function(e) { e.stopPropagation(); self.onNextPage(); };

  centerGroup.appendChild(prevBtn);
  centerGroup.appendChild(pageDisplay);
  centerGroup.appendChild(nextBtn);

  // 右侧：缩放控制、真全屏演播、下载与外跳
  var rightGroup = document.createElement('div');
  rightGroup.className = 'flex items-center gap-1 shrink-0';

  // 缩放组。早期版本用 `hidden md:inline-flex` 把这两个按钮限制在桌面端，
  // 结果是移动端完全无法缩放 —— 而窄屏恰恰是最需要缩放的场景，故改为始终可见。
  var zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.className = 'slide-tool-btn text-[#8B8B8E] hover:text-[#EDEDED] p-1.5 rounded transition-colors cursor-pointer inline-flex';
  zoomOutBtn.title = 'Zoom Out (-)';
  zoomOutBtn.setAttribute('aria-label', '缩小');
  zoomOutBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
  zoomOutBtn.onclick = function(e) { e.stopPropagation(); self.zoom(-0.15); };

  var zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.className = 'slide-tool-btn text-[#8B8B8E] hover:text-[#EDEDED] p-1.5 rounded transition-colors cursor-pointer inline-flex';
  zoomInBtn.title = 'Zoom In (+)';
  zoomInBtn.setAttribute('aria-label', '放大');
  zoomInBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>';
  zoomInBtn.onclick = function(e) { e.stopPropagation(); self.zoom(0.15); };

  // 全屏演示按钮 (Presentation Mode)
  var fsBtn = document.createElement('button');
  fsBtn.type = 'button';
  fsBtn.className = 'slide-action-btn flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161618] hover:bg-white/[0.06] text-[#EDEDED] hover:text-[#3B82F6] border border-white/[0.08] text-[11px] font-mono transition-all cursor-pointer';
  fsBtn.title = 'Enter Presentation Mode (F)';
  fsBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg><span>Present</span>';
  fsBtn.onclick = function(e) { e.stopPropagation(); self.toggleFullscreen(); };

  // 下载 PDF 按钮
  var dlBtn = document.createElement('a');
  dlBtn.href = self.url;
  dlBtn.download = '';
  dlBtn.className = 'slide-tool-btn text-[#8B8B8E] hover:text-[#EDEDED] p-1.5 rounded transition-colors inline-flex items-center';
  dlBtn.title = 'Download PDF File';
  dlBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';

  // 新标签页打开
  var popBtn = document.createElement('a');
  popBtn.href = self.url;
  popBtn.target = '_blank';
  popBtn.rel = 'noopener noreferrer';
  popBtn.className = 'slide-tool-btn text-[#8B8B8E] hover:text-[#EDEDED] p-1.5 rounded transition-colors hidden sm:inline-flex items-center';
  popBtn.title = 'Open in New Tab';
  popBtn.innerHTML = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';

  rightGroup.appendChild(zoomOutBtn);
  rightGroup.appendChild(zoomInBtn);
  rightGroup.appendChild(fsBtn);
  rightGroup.appendChild(dlBtn);
  rightGroup.appendChild(popBtn);

  header.appendChild(leftGroup);
  header.appendChild(centerGroup);
  header.appendChild(rightGroup);

  // 2. 核心演示舞台 (Stage Viewport)
  var stage = document.createElement('div');
  stage.className = 'slide-stage relative w-full flex items-center justify-center bg-[#0A0A0B] overflow-hidden min-h-[360px] sm:min-h-[440px] md:min-h-[480px]';

  // 左右热区 (Hotspots - 点击左侧上一页，点击右侧下一页)
  var leftHotspot = document.createElement('div');
  leftHotspot.className = 'slide-hotspot slide-hotspot-left absolute inset-y-0 left-0 w-[25%] sm:w-[20%] z-20 cursor-pointer flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity';
  leftHotspot.innerHTML = '<div class="w-8 h-8 rounded-full bg-[#111113]/80 backdrop-blur-md border border-white/[0.12] text-[#EDEDED] flex items-center justify-center text-[16px] shadow-lg">‹</div>';
  leftHotspot.onclick = function(e) { e.stopPropagation(); self.onPrevPage(); };

  var rightHotspot = document.createElement('div');
  rightHotspot.className = 'slide-hotspot slide-hotspot-right absolute inset-y-0 right-0 w-[25%] sm:w-[20%] z-20 cursor-pointer flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity';
  rightHotspot.innerHTML = '<div class="w-8 h-8 rounded-full bg-[#111113]/80 backdrop-blur-md border border-white/[0.12] text-[#EDEDED] flex items-center justify-center text-[16px] shadow-lg">›</div>';
  rightHotspot.onclick = function(e) { e.stopPropagation(); self.onNextPage(); };

  // 画布容器
  var canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'slide-canvas-wrapper relative flex items-center justify-center py-4 px-2 max-w-full max-h-full transition-transform';

  var canvas = document.createElement('canvas');
  canvas.className = 'slide-canvas rounded-lg shadow-2xl transition-opacity duration-150';
  canvasWrapper.appendChild(canvas);

  // 点击画布即进入全屏演示 —— 幻灯片是被内嵌在正文里的，读者看两页就会想放大，
  // 找不到 Present 按钮时这里是最自然的入口。左右热区各自 stopPropagation，
  // 因此不会与翻页冲突；全屏状态下不再响应，避免误点退出演示。
  canvasWrapper.classList.add('cursor-zoom-in');
  canvasWrapper.title = '点击进入全屏演示';
  canvasWrapper.onclick = function() {
    if (self.isFullscreen) return;
    self.enterFullscreen();
  };

  // 悬停提示（纯视觉引导，pointer-events-none 保证不抢画布的点击）
  var expandHint = document.createElement('div');
  expandHint.className = 'slide-expand-hint';
  expandHint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg><span>点击展开全屏演示</span>';

  // 加载中指示器 (Loader / Skeleton)
  var loader = document.createElement('div');
  loader.className = 'slide-loader absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm z-30 transition-opacity';
  loader.innerHTML = '<div class="w-6 h-6 border-2 border-white/[0.15] border-t-[#3B82F6] rounded-full animate-spin"></div>' +
    '<span class="text-[12px] font-mono text-[#8B8B8E] mt-3">Loading presentation...</span>';

  stage.appendChild(leftHotspot);
  stage.appendChild(canvasWrapper);
  stage.appendChild(rightHotspot);
  stage.appendChild(expandHint);
  stage.appendChild(loader);

  // 3. 底部进度条 (Progress Track)
  var progressTrack = document.createElement('div');
  progressTrack.className = 'slide-progress-track w-full h-[2px] bg-white/[0.06] relative overflow-hidden';
  var progressFill = document.createElement('div');
  progressFill.className = 'slide-progress-fill h-full bg-[#3B82F6] transition-all duration-200';
  progressFill.style.width = '0%';
  progressTrack.appendChild(progressFill);

  // 4. 全屏模式灵动控制岛 (Fullscreen Floating Island)
  var fsIsland = document.createElement('div');
  fsIsland.className = 'slide-fs-island fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111113]/90 backdrop-blur-xl border border-white/[0.16] shadow-2xl transition-all duration-300 opacity-0 pointer-events-none';
  fsIsland.innerHTML = '<button type="button" class="fs-prev-btn text-[#8B8B8E] hover:text-white p-1.5 rounded-full hover:bg-white/[0.08] cursor-pointer"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>' +
    '<div class="flex items-center gap-1 font-mono text-[12px] px-2 text-[#EDEDED]"><span class="fs-curr font-semibold">01</span><span class="text-[#5A5A5E]">/</span><span class="fs-total text-[#8B8B8E]">--</span></div>' +
    '<button type="button" class="fs-next-btn text-[#8B8B8E] hover:text-white p-1.5 rounded-full hover:bg-white/[0.08] cursor-pointer"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>' +
    '<div class="w-[1px] h-3.5 bg-white/[0.12] mx-1"></div>' +
    '<button type="button" class="fs-exit-btn flex items-center gap-1 text-[11px] font-mono text-[#8B8B8E] hover:text-white px-2 py-1 rounded-full hover:bg-white/[0.08] cursor-pointer"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span>Exit (ESC)</span></button>';

  fsIsland.querySelector('.fs-prev-btn').onclick = function(e) { e.stopPropagation(); self.onPrevPage(); };
  fsIsland.querySelector('.fs-next-btn').onclick = function(e) { e.stopPropagation(); self.onNextPage(); };
  fsIsland.querySelector('.fs-exit-btn').onclick = function(e) { e.stopPropagation(); self.exitFullscreen(); };

  root.appendChild(header);
  root.appendChild(stage);
  root.appendChild(progressTrack);
  root.appendChild(fsIsland);

  this.container.appendChild(root);

  // 绑定内部引用
  this.elements = {
    root: root,
    canvas: canvas,
    stage: stage,
    loader: loader,
    currPageText: pageDisplay.querySelector('.curr-page'),
    totalPageText: pageDisplay.querySelector('.total-page'),
    fsCurrPage: fsIsland.querySelector('.fs-curr'),
    fsTotalPage: fsIsland.querySelector('.fs-total'),
    progressFill: progressFill,
    fsIsland: fsIsland
  };

  // 全屏状态下鼠标活动监测 (自动淡出控制栏)
  root.addEventListener('mousemove', function() {
    if (!self.isFullscreen) return;
    self.showFullscreenIsland();
  });

  // 全局键盘监听与全屏事件监听
  window.addEventListener('keydown', this.boundKeyHandler);
  document.addEventListener('fullscreenchange', this.boundFullscreenChange);
  document.addEventListener('webkitfullscreenchange', this.boundFullscreenChange);

  // 窗口自适应重排
  var resizeTimer;
  this.boundResizeHandler = function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (self.pdfDoc && !self.pageRendering) {
        self.renderPage(self.pageNum);
      }
    }, 150);
  };
  window.addEventListener('resize', this.boundResizeHandler);
};

SlidePlayer.prototype.load = function() {
  var self = this;
  this.buildDOM();

  if (!window.pdfjsLib) {
    self.renderFallback();
    return;
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';

  var loadingTask = window.pdfjsLib.getDocument({
    url: self.url,
    cMapUrl: 'vendor/pdfjs/cmaps/',
    cMapPacked: true
  });
  this.loadingTask = loadingTask;

  loadingTask.promise.then(function(doc) {
    if (self.destroyed) {
      if (doc && typeof doc.destroy === 'function') doc.destroy();
      return;
    }
    self.pdfDoc = doc;
    var total = doc.numPages;
    var totalStr = total < 10 ? '0' + total : '' + total;
    if (self.elements.totalPageText) self.elements.totalPageText.textContent = totalStr;
    if (self.elements.fsTotalPage) self.elements.fsTotalPage.textContent = totalStr;

    self.renderPage(self.pageNum);
  }).catch(function(err) {
    if (self.destroyed) return;
    console.error('PDF Load Error:', err);
    self.renderFallback();
  });
};

SlidePlayer.prototype.renderPage = function(num) {
  var self = this;
  if (this.destroyed || !this.pdfDoc) return;
  this.pageRendering = true;

  if (this.elements.loader) {
    this.elements.loader.classList.remove('hidden');
    this.elements.loader.style.opacity = '1';
  }

  this.pdfDoc.getPage(num).then(function(page) {
    var canvas = self.elements.canvas;
    var stage = self.elements.stage;
    if (!canvas || !stage) return;

    var ctx = canvas.getContext('2d');
    var unscaledViewport = page.getViewport({ scale: 1.0 });
    self.baseViewport = unscaledViewport;

    // 自适应舞台宽度与高度
    var stageWidth = stage.clientWidth || 800;
    var stageHeight = stage.clientHeight || 500;

    var calcScale;
    if (self.isFullscreen) {
      // 全屏模式下自适应窗口宽高最大化居中 (留出安全边距)
      var maxW = window.innerWidth * 0.95;
      var maxH = window.innerHeight * 0.92;
      calcScale = Math.min(maxW / unscaledViewport.width, maxH / unscaledViewport.height);
    } else {
      // 常态模式下根据版心容器宽度自适应
      var availableWidth = Math.min(stageWidth - 32, 960);
      calcScale = (availableWidth / unscaledViewport.width) * self.scale;
    }

    // Retina / HiDPI 超清渲染 (2x 光栅化抗锯齿保证公式与代码文字极度锐利)
    var pixelRatio = window.devicePixelRatio || 1;
    var renderScale = calcScale * Math.max(2, pixelRatio);
    var renderViewport = page.getViewport({ scale: renderScale });
    var cssViewport = page.getViewport({ scale: calcScale });

    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    canvas.style.width = Math.round(cssViewport.width) + 'px';
    canvas.style.height = Math.round(cssViewport.height) + 'px';

    var renderContext = {
      canvasContext: ctx,
      viewport: renderViewport
    };

    var renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      self.pageRendering = false;
      if (self.elements.loader) {
        self.elements.loader.style.opacity = '0';
        setTimeout(function() {
          if (!self.pageRendering && self.elements.loader) {
            self.elements.loader.classList.add('hidden');
          }
        }, 150);
      }

      // 更新页码与进度条
      var currStr = num < 10 ? '0' + num : '' + num;
      if (self.elements.currPageText) self.elements.currPageText.textContent = currStr;
      if (self.elements.fsCurrPage) self.elements.fsCurrPage.textContent = currStr;

      var total = self.pdfDoc.numPages || 1;
      var percent = Math.min(100, Math.round((num / total) * 100));
      if (self.elements.progressFill) {
        self.elements.progressFill.style.width = percent + '%';
      }

      // 若有排队中的翻页请求
      if (self.pageNumPending !== null) {
        var p = self.pageNumPending;
        self.pageNumPending = null;
        self.renderPage(p);
      }
    });
  }).catch(function(err) {
    self.pageRendering = false;
    console.error('Page Render Error:', err);
  });
};

SlidePlayer.prototype.queueRenderPage = function(num) {
  if (this.pageRendering) {
    this.pageNumPending = num;
  } else {
    this.renderPage(num);
  }
};

SlidePlayer.prototype.onPrevPage = function() {
  if (this.pageNum <= 1) return;
  this.pageNum--;
  this.queueRenderPage(this.pageNum);
};

SlidePlayer.prototype.onNextPage = function() {
  if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages) return;
  this.pageNum++;
  this.queueRenderPage(this.pageNum);
};

SlidePlayer.prototype.zoom = function(delta) {
  var nextScale = Math.max(0.6, Math.min(2.5, this.scale + delta));
  if (Math.abs(nextScale - this.scale) > 0.01) {
    this.scale = nextScale;
    this.queueRenderPage(this.pageNum);
  }
};

SlidePlayer.prototype.toggleFullscreen = function() {
  if (this.isFullscreen) {
    this.exitFullscreen();
  } else {
    this.enterFullscreen();
  }
};

SlidePlayer.prototype.enterFullscreen = function() {
  var root = this.elements.root;
  if (!root) return;

  var rfs = root.requestFullscreen || root.webkitRequestFullscreen || root.mozRequestFullScreen || root.msRequestFullscreen;
  if (rfs) {
    rfs.call(root).catch(function() {
      // 浏览器权限限制时降级为剧场覆盖模式
      root.classList.add('theater-presentation-mode');
    });
  } else {
    root.classList.add('theater-presentation-mode');
  }

  this.isFullscreen = true;
  root.classList.add('is-presentation-active');
  this.showFullscreenIsland();
  this.queueRenderPage(this.pageNum);
};

SlidePlayer.prototype.exitFullscreen = function() {
  var root = this.elements.root;
  var efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (efs) efs.call(document);
  }
  if (root) {
    root.classList.remove('theater-presentation-mode');
    root.classList.remove('is-presentation-active');
  }
  this.isFullscreen = false;
  if (this.elements.fsIsland) {
    this.elements.fsIsland.classList.remove('opacity-100', 'pointer-events-auto');
    this.elements.fsIsland.classList.add('opacity-0', 'pointer-events-none');
  }
  this.queueRenderPage(this.pageNum);
};

SlidePlayer.prototype.handleFullscreenChange = function() {
  var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!isFs && this.isFullscreen) {
    this.exitFullscreen();
  }
};

SlidePlayer.prototype.showFullscreenIsland = function() {
  var island = this.elements.fsIsland;
  if (!island || !this.isFullscreen) return;

  island.classList.remove('opacity-0', 'pointer-events-none');
  island.classList.add('opacity-100', 'pointer-events-auto');

  clearTimeout(this.hideControlsTimer);
  var self = this;
  this.hideControlsTimer = setTimeout(function() {
    if (self.isFullscreen && island) {
      island.classList.remove('opacity-100', 'pointer-events-auto');
      island.classList.add('opacity-0', 'pointer-events-none');
    }
  }, 2500);
};

SlidePlayer.prototype.handleKeyDown = function(e) {
  // 仅在当前播放器处于全屏或者处于可见视口交互状态时响应
  if (!this.pdfDoc) return;
  var root = this.elements.root;
  if (!root) return;

  var isHoveredOrFs = this.isFullscreen || root.matches(':hover');
  if (!isHoveredOrFs) return;

  // 翻页操作快捷键 (ArrowRight / ArrowLeft / Space / PageUp / PageDown)
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
    e.preventDefault();
    this.onNextPage();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey) || e.key === 'Backspace') {
    e.preventDefault();
    this.onPrevPage();
  } else if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    this.toggleFullscreen();
  } else if (e.key === 'Escape' && this.isFullscreen) {
    e.preventDefault();
    this.exitFullscreen();
  } else if (e.key === 'Home') {
    e.preventDefault();
    this.pageNum = 1;
    this.queueRenderPage(1);
  } else if (e.key === 'End') {
    e.preventDefault();
    this.pageNum = this.pdfDoc.numPages;
    this.queueRenderPage(this.pageNum);
  }
};

SlidePlayer.prototype.destroy = function() {
  this.destroyed = true;
  clearTimeout(this.hideControlsTimer);
  window.removeEventListener('keydown', this.boundKeyHandler);
  document.removeEventListener('fullscreenchange', this.boundFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', this.boundFullscreenChange);
  if (this.boundResizeHandler) window.removeEventListener('resize', this.boundResizeHandler);

  if (this.loadingTask && typeof this.loadingTask.destroy === 'function') {
    try { this.loadingTask.destroy(); } catch (e) {}
  } else if (this.pdfDoc && typeof this.pdfDoc.destroy === 'function') {
    try { this.pdfDoc.destroy(); } catch (e) {}
  }

  this.loadingTask = null;
  this.pdfDoc = null;
  this.elements = {};
};

SlidePlayer.prototype.renderFallback = function() {
  // 优雅降级方案 (若 PDF.js 未就绪或发生解析异常)
  var self = this;
  this.container.innerHTML = '<div class="p-6 rounded-xl bg-[#111113] border border-white/[0.08] text-center">' +
    '<h3 class="text-[15px] font-semibold text-[#EDEDED] mb-2">' + self.escapeHtml(self.title) + '</h3>' +
    '<p class="text-[13px] text-[#8B8B8E] mb-4">This article includes an academic presentation slide deck.</p>' +
    '<div class="flex items-center justify-center gap-3">' +
      '<a href="' + self.url + '" target="_blank" rel="noopener noreferrer" class="linear-btn linear-btn-primary">↗ Open Full Screen</a>' +
      '<a href="' + self.url + '" download class="linear-btn">↓ Download PDF</a>' +
    '</div>' +
  '</div>';
};

SlidePlayer.prototype.escapeHtml = function(str) {
  return (str || '').replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
};
