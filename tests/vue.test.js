const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createSSRApp } = require("vue");
const { renderToString } = require("@vue/server-renderer");
let server, store;
test.before(async () => {
  global.document = {
    documentElement: { dataset: {}, classList: { toggle() {} } },
    title: "",
    querySelector() {
      return null;
    },
  };
  global.getComputedStyle = () => ({ getPropertyValue: () => '#0A0A0B' });
  global.history = { state: null };
  const { createServer } = await import("vite");
  const vue = (await import("@vitejs/plugin-vue")).default;
  server = await createServer({
    configFile: false,
    plugins: [vue()],
    server: { middlewareMode: true, hmr: false },
    optimizeDeps: { noDiscovery: true },
  });
  ({store} = await server.ssrLoadModule('/src/lib/store.js'));
  store.init(JSON.parse(fs.readFileSync(require('../scripts/generated-path').resourcePath('data/index.json'), 'utf8')));
});
test.after(async () => {
  await server?.close();
  delete global.window;
  delete global.document;
  delete global.history;
  delete global.getComputedStyle;
});
async function render(name, props) {
  const component = (
    await server.ssrLoadModule("/src/components/" + name + ".vue")
  ).default;
  return renderToString(createSSRApp(component, props));
}
test("Series chapters highlight only the current article on desktop and mobile", async () => {
  const chapters = [{slug:"first",title:"First",order:1}, {slug:"second",title:"Second",order:2}];
  for (const compact of [true, false]) {
    for (const currentSlug of ["first", "second"]) {
      const html = await render("SeriesChapters", {chapters,currentSlug,compact});
      const links = [...html.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
      const active = links.filter(link => link.includes('aria-current="page"'));
      assert.equal(active.length,1);
      assert.ok(active[0].includes(`#/posts/${currentSlug}`));
      assert.ok(active[0].includes("text-accent"));
      assert.ok(!active[0].includes("text-secondary"));
      assert.ok(links.filter(link => !link.includes('aria-current="page"')).every(link => link.includes("text-secondary") && !link.includes("text-accent")));
    }
  }
});
test("Vue footer preserves EMAIL link, centering and absence of the divider", async () => {
  const html = await render("Footer");
  assert.match(html, /mailto:ccc0000006@gmail.com/);
  assert.match(html, />EMAIL<\/a>/);
  assert.match(html, /justify-center/);
  assert.doesNotMatch(html, /border-t/);
});
test("Vue navigation promotes the active book module without duplicating its entry", async () => {
  const html = await render("Navbar", { active: "books", routeKey: "/books" });
  assert.match(
    html,
    /href="#\/books" class="(?:nav-link active|active nav-link)" aria-current="page"/,
  );
  assert.match(html, /href="#\/columns" class="nav-dropdown-item"/);
  assert.match(html, /展开 Books 更多链接/);
});
test("Vue post items escape metadata and preserve encoded Chinese links", async () => {
  const html = await render("PostItem", {
    post: {
      slug: "量子作业",
      title: "<script>bad</script>",
      tags: ["中文"],
      date: "2026-10-12",
      updated: "2026-10-26",
      readTime: 3,
    },
  });
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /#\/posts\/%E9%87%8F/);
  assert.match(html, /#\/tags\/%E4%B8%AD/);
  assert.match(html, /class="updated-at font-mono"/);
  assert.match(html, /<time datetime="2026-10-26">2026-10-26<\/time>/);
});
test("Vue home book entries use book directories instead of chapter links", async () => {
  const html = await render("PostItem", {
    post: {
      kind: "book",
      slug: "book:git",
      title: "Git",
      chapterCount: 18,
      collection: { id: "git", posts: [{ type: "books" }] },
      date: "2026-10-12",
      tags: [],
    },
  });
  assert.match(html, /#\/books\/git/);
  assert.match(html, /18 CHAPTERS/);
});
test("Vue PDF and Office previews render idle buttons without fetching documents", async () => {
  const original = global.fetch;
  let fetches = 0;
  global.fetch = () => {
    fetches++;
    throw new Error("must not fetch during initial render");
  };
  try {
    const html = await render("PdfPreview", {
      url: "data/office/preview.pdf",
      title: "讲义.docx",
      source: "attachments/讲义.docx",
      format: "Word",
    });
    assert.match(html, /预览 Word/);
    assert.match(html, /文档预览/);
    assert.match(html, /下载原文件/);
    assert.doesNotMatch(html, /<iframe|<canvas|pdfjs/);
    assert.equal(fetches, 0);
  } finally {
    global.fetch = original;
  }
});
test("Vue expandable panels start hidden and omit empty controls", async () => {
  const expandable = await render("ExpandableEntry", {
    title: "Chapters",
    expandable: true,
  });
  assert.match(expandable, /aria-expanded="false"/);
  assert.match(expandable, /<div[^>]* hidden/);
  const staticTitle = await render("ExpandableEntry", {
    title: "Plain",
    expandable: false,
  });
  assert.doesNotMatch(staticTitle, /entry-chevron|<button/);
});
test("Vue publication metadata preserves explicit self authors and safe identifiers", async () => {
  const module = await server.ssrLoadModule("/src/lib/publications.js");
  assert.deepEqual(
    module
      .normalizeAuthors(["**CCC**", "A. Author*", "Other"], ["CCC"])
      .map((author) => author.self),
    [true, true, false],
  );
  const links = module.publicationLinks({
    links: { doi: "10.1234/test", code: "javascript:alert(1)" },
  });
  assert.deepEqual(links, [
    { kind: "doi", href: "https://doi.org/10.1234/test" },
  ]);
});
test("Vue Router derives all routes and redirects old addresses with replace semantics", async () => {
  const { createVueRouter } = await server.ssrLoadModule("/src/lib/router.js");
  const { createMemoryHistory } = await server.ssrLoadModule("vue-router");
  const router = createVueRouter(createMemoryHistory(), false);
  await router.push("/posts");
  assert.equal(router.currentRoute.value.path, "/archive");
  await router.push("/blog/books");
  assert.equal(router.currentRoute.value.path, "/books");
  await router.push("/post/hello-world");
  assert.equal(router.currentRoute.value.path, "/posts/hello-world");
  await router.push("/columns/book/chapter");
  assert.equal(router.currentRoute.value.path, "/posts/chapter");
  await router.push("/search?q=git");
  assert.equal(router.currentRoute.value.name, "not-found");
});
test("Vue tag selection is derived from the URL including encoded Chinese params", async () => {
  const { selectedTags, tagsPath } = await server.ssrLoadModule(
    "/src/lib/content.js",
  );
  const original = store.getAllTags;
  store.getAllTags = () => [{ name: "中文" }, { name: "Git" }];
  try {
    assert.deepEqual(
      selectedTags({ params: { tags: ["中文"] }, query: { tag: "git" } }),
      ["Git", "中文"],
    );
    assert.equal(tagsPath(["中文", "Git"]), "/tags/git/%E4%B8%AD%E6%96%87");
  } finally {
    store.getAllTags = original;
  }
});

test("Home continue reading respects hidden articles even when they were read most recently", async () => {
  const { reading } = await server.ssrLoadModule('/src/lib/reading.js');
  const { createVueRouter } = await server.ssrLoadModule('/src/lib/router.js');
  const { createMemoryHistory } = await server.ssrLoadModule('vue-router');
  const component = (await server.ssrLoadModule('/src/views/HomeView.vue')).default;
  const previousPosts=store.posts, previousEntries=reading.entries;
  try {
    store.posts=[{slug:'hidden',title:'Hidden article',home:false,date:'2026-10-17',tags:[]}, {slug:'visible',title:'Visible article',date:'2026-10-17',tags:[]}];
    reading.entries={hidden:{top:100,progress:0.5,visitedAt:2},visible:{top:50,progress:0.2,visitedAt:1}};
    const router=createVueRouter(createMemoryHistory(),false);
    await router.push('/');
    const html=await renderToString(createSSRApp(component).use(router));
    assert.ok(html.includes('visible?resume=1'));
    assert.ok(!html.includes('Hidden article'));
    assert.ok(!html.includes('hidden?resume=1'));
  } finally { store.posts=previousPosts; reading.entries=previousEntries; }
});
test("Vue scroll restoration waits for document loading and rejects stale navigation", async () => {
  const { scrollPosition } = await server.ssrLoadModule("/src/lib/scroll.js");
  const { reading } = await server.ssrLoadModule('/src/lib/reading.js');
  const previousEntry=reading.entries['hello-world'];
  const original = store.loadDocument;
  let loaded = false;
  store.loadDocument = async (document) => {
    loaded = true;
    return document;
  };
  global.requestAnimationFrame = (callback) => callback();
  try {
    const route = {
      meta: { view: "post" },
      params: { slug: "hello-world" },
      query: {},
    };
    assert.deepEqual(await scrollPosition(route, { top: 600 }, () => true), {
      top: 600,
    });
    assert.ok(loaded);
    reading.entries['hello-world']={top:120,progress:0.2,visitedAt:1};
    const resume={...route,query:{resume:'1'}};
    assert.deepEqual(await scrollPosition(resume,null,()=>true),{top:120});
    assert.deepEqual(await scrollPosition(resume,{top:600},()=>true),{top:600});
    assert.equal(await scrollPosition(route, { top: 600 }, () => false), false);
  } finally {
    store.loadDocument = original;
    if(previousEntry) reading.entries['hello-world']=previousEntry;
    else delete reading.entries['hello-world'];
    delete global.requestAnimationFrame;
  }
});
