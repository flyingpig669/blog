import { nextTick } from "vue";
import { store, docForRoute, features } from "./content";

// Restore after async document/math rendering; a loading skeleton is too short
// to accept a saved scroll position and would silently clamp it to zero.
export async function scrollPosition(to, saved, isCurrent) {
  try {
    if (to.meta.view === "post" || to.meta.view === "page") {
      const metadata = docForRoute(to);
      if (metadata) {
        const document = await store.loadDocument(metadata);
        if (features.mathKaTeX !== false)
          await window.BlogKatex?.ensure(document.content || "");
      }
    }
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (!isCurrent()) return false;
    if (to.query.heading)
      return { el: "#" + CSS.escape(String(to.query.heading)), top: 76 };
    return saved || { top: 0 };
  } catch {
    return false;
  }
}
