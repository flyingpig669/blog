import { createRouter, createWebHashHistory } from "vue-router";
import { registry, navItems, navController, pathFor } from "./content";
import HomeView from "../views/HomeView.vue";
import ArchiveView from "../views/ArchiveView.vue";
import TagsView from "../views/TagsView.vue";
import CollectionView from "../views/CollectionView.vue";
import DocumentView from "../views/DocumentView.vue";
import DynamicView from "../views/DynamicView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import { scrollPosition } from "./scroll";

const views = {
  home: HomeView,
  archive: ArchiveView,
  tags: TagsView,
  columns: CollectionView,
  page: DocumentView,
  post: DocumentView,
  dynamic: DynamicView,
};
const routes = registry.table().flatMap((def) => {
  const meta = {
    view: def.view,
    module: def.name,
    shell: def.shell,
    page: def.page,
  };
  if (def.kind === "prefix")
    return [
      { path: def.path, redirect: registry.get(def.alias).path },
      {
        path: def.path + "/:slug",
        name: def.name,
        component: views[def.view],
        meta,
      },
    ];
  const item = navItems().find((item) => item.id === def.name);
  const target = navController.parseTarget(item || {});
  const component =
    target.mode === "file"
      ? DocumentView
      : target.mode === "dir"
        ? DynamicView
        : views[def.view];
  const entry = { path: def.path, name: def.name, component, meta };
  if (def.kind !== "collection") return [entry];
  const detail = def.view === "tags" ? def.path + "/:tags+" : def.detail;
  return [
    entry,
    {
      path: detail,
      name: def.name + "-detail",
      component: views[def.view],
      meta,
    },
  ];
});
routes.push({
  path: "/:pathMatch(.*)*",
  name: "not-found",
  component: NotFoundView,
  meta: {},
});
export function createVueRouter(
  history = createWebHashHistory(),
  scroll = true,
) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: scroll
      ? (to, from, saved) =>
          scrollPosition(
            to,
            saved,
            () => router.currentRoute.value.fullPath === to.fullPath,
          )
      : undefined,
  });
  router.beforeEach((to) => {
    let path = to.path;
    if (path === "/blog" || path === "/blog/") path = pathFor("home");
    else if (path.startsWith("/blog/")) path = path.slice(5);
    if (path.startsWith("/post/")) path = pathFor("posts") + path.slice(5);
    if (path === "/archives") path = pathFor("archive");
    if (path === "/categories" || path.startsWith("/categories/"))
      path = pathFor("tags") + path.slice(11);
    if (
      path.startsWith(pathFor("columns") + "/") &&
      path.slice(pathFor("columns").length + 1).split("/").length > 1
    )
      path =
        pathFor("posts") +
        "/" +
        path
          .slice(pathFor("columns").length + 1)
          .split("/")
          .slice(1)
          .join("/");
    if (path !== to.path) return { path, query: to.query, replace: true };
  });
  return router;
}
