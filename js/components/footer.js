window.BlogFooter = {
  render: function(site) {
    var copyright = document.getElementById('footer-copyright');
    if (copyright) copyright.textContent = site.footerText || '';
    var contact = document.getElementById('footer-contact');
    var emailLink = document.getElementById('footer-email');
    var email = String(site.footerEmail || '').trim();
    if (contact) contact.hidden = !email;
    if (emailLink) {
      emailLink.textContent = email;
      emailLink.href = 'mailto:' + email;
    }
  }
};
