exports.loadServices = async () => ({
  ...await import('../src/lib/store.js'),
  ...await import('../src/lib/html.js'),
  ...await import('../src/lib/navigation.js'),
  ...await import('../src/config/blog.config.js'),
  ...await import('../src/config/routes.js'),
});
