window.BlogNavbar = {
  render: function(services) {
    var config = services.config || {};
    var site = config.site || {};
    var nav = window.BlogRouteRegistry.navGroups(config.nav);
    var features = config.features || {};
    var self = services;
    var linkHtml = function(item, className, extraAttributes) {
      var href = self.navItemHref(item);
      var external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + services.escapeHtml(href) + '" data-nav-link="' + services.escapeHtml(item.id) + '" class="' + className + '"' + external + (extraAttributes || '') + '>' + services.escapeHtml(item.label) + '</a>';
    };

    // 1. 设置网页标题（同时刷新 og:title / og:url / canonical）
    if (site.title) {
      services.setDocumentTitle(site.title);
    }
    var descriptionEl = document.querySelector('meta[name="description"]');
    if (descriptionEl && site.description) {
      descriptionEl.setAttribute('content', site.description);
    }
    // 分享卡片的描述与页面描述同源。静态 HTML 里三处 description 是逐字相同的文本，
    // 这里一并刷新，避免只更新 meta description 而让 og / twitter 停在旧文案上。
    if (site.description) {
      ['meta[property="og:description"]', 'meta[name="twitter:description"]'].forEach(function(selector) {
        var el = document.querySelector(selector);
        if (el) el.setAttribute('content', site.description);
      });
    }

    // 2. 顶部 Brand 标识
    var brandLinkEl = document.getElementById('brand-link');
    var brandLogoEl = brandLinkEl ? brandLinkEl.querySelector('span:last-child') : null;
    if (brandLogoEl && site.brand) {
      brandLogoEl.textContent = site.brand;
    }
    if (brandLinkEl) brandLinkEl.href = services.routeHref('home');

    var searchActionEl = document.getElementById('search-action');
    if (searchActionEl && features.searchModal === false) {
      searchActionEl.classList.add('hidden');
    }

    // 3. 桌面端导航菜单 (支持单项与数组语法: 数组展示首项，其余折叠为下拉菜单)
    var desktopNavEl = document.querySelector('header nav');
    if (desktopNavEl && nav.length > 0) {
      var navHtml = '';
      nav.forEach(function(group) {
        var headLink = linkHtml(group.head, 'nav-link');
        if (group.folded.length === 0) {
          navHtml += headLink;
          return;
        }

        navHtml += '<div class="nav-dropdown" data-nav-group="' + services.escapeHtml(group.head.id) + '">';
        navHtml += headLink;
        navHtml += '  <button type="button" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false" aria-label="展开 ' + services.escapeHtml(group.head.label) + ' 更多链接">';
        navHtml += '    <svg class="nav-dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        navHtml += '  </button>';
        navHtml += '  <div class="nav-dropdown-panel">';
        navHtml += '    <div class="nav-dropdown-menu" role="menu" aria-label="' + services.escapeHtml(group.head.label) + ' 子菜单">';
        group.folded.forEach(function(sub) {
          navHtml += linkHtml(sub, 'nav-dropdown-item', ' role="menuitem"');
        });
        navHtml += '    </div>';
        navHtml += '  </div>';
        navHtml += '</div>';
      });
      desktopNavEl.innerHTML = navHtml;
    }

    // 4. 移动端抽屉菜单 (数组折叠项以缩进子列表展示)
    var mobileDrawerEl = document.getElementById('mobile-drawer');
    if (mobileDrawerEl && nav.length > 0) {
      var drawerHtml = '';
      var mobileLinkClass = 'mobile-nav-link block px-4 text-secondary hover:text-primary transition-colors';
      nav.forEach(function(group) {
        drawerHtml += linkHtml(group.head, mobileLinkClass + ' py-3 text-[15px]', ' data-mobile-nav');
        if (group.folded.length > 0) {
          drawerHtml += '<div class="pl-3.5 space-y-1 border-l border-divider my-1 mb-2">';
          group.folded.forEach(function(sub) {
            drawerHtml += linkHtml(sub, mobileLinkClass + ' py-2 text-[14px]', ' data-mobile-nav');
          });
          drawerHtml += '</div>';
        }
      });
      mobileDrawerEl.innerHTML = drawerHtml;
    }

  },
};
