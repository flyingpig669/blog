window.BlogNavbar = {
  render: function(services) {
    var config = services.config || {};
    var site = config.site || {};
    var nav = config.nav || [];
    var features = config.features || {};
    var self = services;
    var itemHref = function(it) { return self.navItemHref(it); };

    // 1. 设置网页标题（同时刷新 og:title / og:url / canonical）
    if (site.title) {
      services.setDocumentTitle(site.title);
    }
    var descriptionEl = document.querySelector('meta[name="description"]');
    if (descriptionEl && site.description) {
      descriptionEl.setAttribute('content', site.description);
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
      nav.forEach(function(item) {
        var group = null;
        if (Array.isArray(item)) {
          if (item.length === 0) return;
          group = { head: item[0], folded: item.slice(1) };
        } else if (item && (item.items || item.children)) {
          group = { head: item, folded: (item.items || item.children || []) };
        }

        // 普通导航项
        if (!group) {
          var href = itemHref(item);
          var isExternal = href.indexOf('http') === 0;
          navHtml += '<a href="' + services.escapeHtml(href) + '" data-nav-link="' + services.escapeHtml(item.id) + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="nav-link">' + services.escapeHtml(item.label) + '</a>';
          return;
        }

        var headHref = itemHref(group.head);
        var headExt = headHref.indexOf('http') === 0;

        // 折叠项为空时退化为普通链接
        if (group.folded.length === 0) {
          navHtml += '<a href="' + services.escapeHtml(headHref) + '" data-nav-link="' + services.escapeHtml(group.head.id) + '" ' + (headExt ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="nav-link">' + services.escapeHtml(group.head.label) + '</a>';
          return;
        }

        navHtml += '<div class="nav-dropdown" data-nav-group="' + services.escapeHtml(group.head.id) + '">';
        navHtml += '  <a href="' + services.escapeHtml(headHref) + '" data-nav-link="' + services.escapeHtml(group.head.id) + '" ' + (headExt ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="nav-link">' + services.escapeHtml(group.head.label) + '</a>';
        navHtml += '  <button type="button" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false" aria-label="展开 ' + services.escapeHtml(group.head.label) + ' 更多链接">';
        navHtml += '    <svg class="nav-dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        navHtml += '  </button>';
        navHtml += '  <div class="nav-dropdown-panel">';
        navHtml += '    <div class="nav-dropdown-menu" role="menu" aria-label="' + services.escapeHtml(group.head.label) + ' 子菜单">';
        group.folded.forEach(function(sub) {
          var subHref = itemHref(sub);
          var subExt = subHref.indexOf('http') === 0;
          navHtml += '      <a role="menuitem" href="' + services.escapeHtml(subHref) + '" data-nav-link="' + services.escapeHtml(sub.id) + '" ' + (subExt ? 'target="_blank" rel="noopener noreferrer"' : '') + ' class="nav-dropdown-item">' + services.escapeHtml(sub.label) + '</a>';
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
      nav.forEach(function(item) {
        var group = null;
        if (Array.isArray(item)) {
          if (item.length === 0) return;
          group = { head: item[0], folded: item.slice(1) };
        } else if (item && (item.items || item.children)) {
          group = { head: item, folded: (item.items || item.children || []) };
        }

        if (!group) {
          var href = itemHref(item);
          var isExternal = href.indexOf('http') === 0;
          drawerHtml += '<a href="' + services.escapeHtml(href) + '" data-nav-link="' + services.escapeHtml(item.id) + '" ' + (isExternal ? 'target="_blank" rel="noopener noreferrer"' : '') + ' data-mobile-nav class="mobile-nav-link block px-4 py-3 text-[15px] text-secondary hover:text-primary transition-colors">' + services.escapeHtml(item.label) + '</a>';
          return;
        }

        var headHref = itemHref(group.head);
        var headExt = headHref.indexOf('http') === 0;
        drawerHtml += '<a href="' + services.escapeHtml(headHref) + '" data-nav-link="' + services.escapeHtml(group.head.id) + '" ' + (headExt ? 'target="_blank" rel="noopener noreferrer"' : '') + ' data-mobile-nav class="mobile-nav-link block px-4 py-3 text-[15px] text-secondary hover:text-primary transition-colors">' + services.escapeHtml(group.head.label) + '</a>';
        if (group.folded.length > 0) {
          drawerHtml += '<div class="pl-3.5 space-y-1 border-l border-divider my-1 mb-2">';
          group.folded.forEach(function(sub) {
            var subHref = itemHref(sub);
            var subExt = subHref.indexOf('http') === 0;
            drawerHtml += '  <a href="' + services.escapeHtml(subHref) + '" data-nav-link="' + services.escapeHtml(sub.id) + '" ' + (subExt ? 'target="_blank" rel="noopener noreferrer"' : '') + ' data-mobile-nav class="mobile-nav-link block px-4 py-2 text-[14px] text-secondary hover:text-primary transition-colors">' + services.escapeHtml(sub.label) + '</a>';
          });
          drawerHtml += '</div>';
        }
      });
      mobileDrawerEl.innerHTML = drawerHtml;
    }

  },


};
