// Keep position per history entry, not per URL: repeated visits are independent.
window.BlogScrollState = {
  init: function() {
    history.scrollRestoration = 'manual';
    var scheduled = false;
    window.addEventListener('scroll', function() {
      if (scheduled) return;
      scheduled = true;
      var url = location.href;
      var y = window.scrollY;
      requestAnimationFrame(function() {
        scheduled = false;
        if (location.href !== url) return;
        history.replaceState(Object.assign({}, history.state, { auroraScroll: y }), '', url);
      });
    }, { passive: true });
  },
  restore: function(isCurrent) {
    var y = history.state && history.state.auroraScroll;
    if (typeof y !== 'number') return;
    if (new URLSearchParams(location.hash.split('?')[1] || '').has('heading')) return;
    requestAnimationFrame(function() {
      if (isCurrent()) window.scrollTo({ top: y, behavior: 'instant' });
    });
  }
};
