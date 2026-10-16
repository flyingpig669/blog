import './lib/routes';
import '../blog.config.js';
import './lib/html';
import './lib/store';
import './lib/navigation';
import './lib/callout-icons';
import './lib/markdown';
import './lib/katex-loader';
import './lib/post-navigation';
import DOMPurify from 'dompurify';
window.DOMPurify = DOMPurify;

function failed(error) {
  const root = document.getElementById("app");
  root.textContent = "Unable to start CCC de Notes. Please rebuild the site.";
  root.setAttribute("role", "alert");
  console.error(error);
}
const required = [
  "BlogConfig",
  "BlogStore",
  "BlogPostsData",
  "BlogHtml",
  "BlogRouteRegistry",
  "BlogMarkdown",
  "DOMPurify",
];
if (required.some((name) => !window[name]))
  failed(new Error("Core content scripts could not load."));
else import("./bootstrap").then((module) => module.bootstrap()).catch(failed);
