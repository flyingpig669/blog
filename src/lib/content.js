// Markdown compilation and collection queries are shared with the content validator.
export const store = window.BlogStore;
export const config = window.BlogConfig;
export const registry = window.BlogRouteRegistry;
export const features = config.features || {};
export const pathFor = (name, value) => store.routePath(name, value);
export const hrefFor = (name, value) => "#" + pathFor(name, value);
export const postHref = (post) =>
  hrefFor("posts", typeof post === "string" ? post : post.slug);
export const columnHref = (column) =>
  hrefFor(registry.collectionFor(column).name, column.id);
export const tagHref = (tag) => hrefFor("tags", store.tagSlug(tag));
export const safeUrl = (value) =>
  window.BlogHtml.safeUrl(String(value || "").replace(/ /g, "%20"));
export const lines = (value) =>
  Array.isArray(value) ? value.join("\n") : String(value || "");
export const wordCount = (value) =>
  value >= 1000 ? Math.round(value / 100) / 10 + "k 字词" : value + " 字词";
export const pad = (value) => String(value).padStart(2, "0");
export const navController = Object.assign({}, window.BlogRouter, {
  getRoutes: () => config.routes || window.BlogRoutes,
});
export const navItems = () => navController.getFlattenedNav();
export const docForRoute = (route) => {
  if (route.meta.view === "post") return store.getDoc(route.params.slug).data;
  const item = navItems().find((item) => item.id === route.meta.module);
  const target = navController.parseTarget(item || {});
  return store.getDoc(
    target.mode === "file" ? target.value : route.meta.page || "",
  ).data;
};
export function activeModule(route) {
  if (route.meta.view !== "post") return route.meta.module || "";
  const doc = docForRoute(route);
  const column = doc?.column && store.getColumnById(doc.column);
  return column ? registry.collectionFor(column).name : "";
}
export function selectedTags(route) {
  const segments = route.params.tags || [];
  const values = [...(Array.isArray(segments) ? segments : [segments])];
  const query = route.query.tag;
  if (query) values.push(...(Array.isArray(query) ? query : [query]));
  const all = store.getAllTags();
  return [
    ...new Set(
      values
        .map(
          (value) =>
            all.find((tag) => store.tagSlug(tag.name) === store.tagSlug(value))
              ?.name,
        )
        .filter(Boolean),
    ),
  ].sort();
}
export function tagsPath(names) {
  return (
    pathFor("tags") +
    (names.length
      ? "/" +
        [...names]
          .sort()
          .map((name) => encodeURIComponent(store.tagSlug(name)))
          .join("/")
      : "")
  );
}
export function setTitle(title) {
  const site = config.site;
  document.title =
    title && title !== site.title ? `${title} · ${site.title}` : site.title;
  for (const selector of [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]) {
    document.querySelector(selector)?.setAttribute("content", document.title);
  }
}
