window.BlogFooter = {
  render: function(site) {
    var copyright = document.getElementById('footer-copyright');
    if (copyright) copyright.textContent = site.footerText || '';
  }
};
