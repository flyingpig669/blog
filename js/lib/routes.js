/**
 * ==============================================================================
 * 路由声明表 (Declarative Route Table) —— 全站路由与导航的唯一来源
 * ==============================================================================
 * 新增一个模块，只在下面的表里追加一行。其余四处会自动跟上：
 *
 *   1. window.BlogRoutes    由表派生 (name -> path)，全站链接与 URL 匹配都读它
 *   2. BlogConfig.nav       由表派生 (label / group / target)，导航栏与移动端抽屉读它
 *   3. 视图分派             router.js#dispatchNavItem 按 view 字段选择渲染器
 *   4. 一致性校验           scripts/validate-content.js 在构建期跑 validate()
 *
 * 在此之前，同一个模块的事实被拆在四个地方：配置里的路由字典、配置里的 nav 数组、
 * router 里的分派 if 链、app 里的链接生成函数。加一个页面要改四处，而且没有任何
 * 机制保证这四处对得上（AGENTS.md 第 7.6 节的互查清单只能靠人读）。本表把它们
 * 收敛成一行，并把第 6 节的命名硬约束变成构建期报错。
 *
 * ------------------------------------------------------------------------------
 * 字段说明
 * ------------------------------------------------------------------------------
 *   name    必填  模块标识。同时是 BlogRoutes 的键、导航项的 DOM id、校验引用名。
 *   path    必填  模块规范地址。全小写、kebab-case、不含动词；集合型用复数。
 *   view    必填  用哪个渲染器，见下方 VIEW_VALUES 白名单。
 *   shell   必填  版心：'shell'(720px) 或 'shell-detail'(1000px)。全站只有两档，
 *                 且只有文章详情页可以用宽的那档（第 4 节版心几何约束）。
 *   kind    必填  模块形态，决定命名与层级约束：
 *                   'page'       单页展示型，禁止二级路由
 *                   'collection' 集合型，必须声明 detail 二级路由，路径用复数
 *                   'prefix'     仅作路径前缀，不渲染独立页面，必须声明 alias
 *   nav     必填  导航元信息。显式写 null 表示「有意不放入导航」。
 *                   label  导航栏显示文字
 *                   group  归入某个下拉组；同组条目按表内顺序折进同一个下拉菜单
 *                   target 显式目标，支持 "dir:" / "file:" 前缀；省略则用 path
 *   detail  可选  二级路由声明（kind 为 collection 时必填），供校验与文档使用。
 *   alias   可选  命中后收敛到的模块 name。也是「不是孤岛页」的机器可读依据：
 *                 router 靠它把 /posts 原地改写为 /archive。
 *   page    可选  view 为 'page' 且未给 file 目标时，兜底渲染的文档名。
 *   note    可选  给人看的说明，不参与校验。
 *
 * ------------------------------------------------------------------------------
 * 怎么加一个新模块（例如 Notes）
 * ------------------------------------------------------------------------------
 *   { name: 'notes', path: '/notes', view: 'dynamic', shell: 'shell', kind: 'page',
 *     target: 'dir:posts/notes', nav: { label: 'Notes' } },
 *
 * 一行即可：URL、导航项、渲染器分派、构建期校验全部就位。视图用 'dynamic' 表示
 * 交给通用动态栏目渲染器（按 category/tag 过滤、卡片集合、或渲染一份 Markdown）。
 * 若需要全新版式，才去 app.js 写渲染器并把 view 指向它，同时同步 VIEW_VALUES。
 * ==============================================================================
 */

(function () {
  'use strict';

  // 视图白名单：每一项都对应 app.js 里的一个渲染器。
  //   home / columns / archive / tags  列表与首页类渲染器
  //   post                             文章详情（宽版心，唯一例外）
  //   page                             结构化独立页（type: post 的 Markdown）
  //   dynamic                          通用动态栏目渲染器（零代码新增模块走这里）
  window.BlogRouteViewValues = ['home', 'columns', 'archive', 'tags', 'post', 'page', 'dynamic'];

  window.BlogRouteTable = [
    {
      name: 'home', path: '/', view: 'home', shell: 'shell', kind: 'page',
      nav: { label: 'Home' },
      note: '首页，使用根路径。'
    },
    {
      name: 'columns', path: '/columns', view: 'columns', shell: 'shell', kind: 'collection',
      detail: '/columns/:columnSlug',
      nav: { label: 'Columns' },
      note: '专栏列表；二级为该专栏下的文章列表。'
    },
    {
      name: 'archive', path: '/archive', view: 'archive', shell: 'shell', kind: 'page',
      nav: { label: 'Archive' },
      note: '归档时间线，也是文章总览的唯一正式路由（/posts 收敛到这里）。'
    },
    {
      name: 'tags', path: '/tags', view: 'tags', shell: 'shell', kind: 'collection',
      detail: '/tags/:tag',
      nav: { label: 'Tags' },
      note: '标签索引；二级为单标签或多标签交集筛选，额外兼容 ?tag= 查询参数。'
    },
    {
      name: 'posts', path: '/posts', view: 'post', shell: 'shell-detail', kind: 'prefix',
      alias: 'archive',
      nav: null,
      note: '不是页面，只是文章详情的路径前缀。裸命 /posts 由 alias 收敛到 /archive，' +
            '避免同一内容存在两个 URL；/posts/:slug 才是真正的详情路由。'
    },
    {
      name: 'about', path: '/about', view: 'page', shell: 'shell', kind: 'page',
      page: 'about.md',
      nav: { label: 'About', group: 'about', target: 'file:about.md' },
      note: '单页展示型，内容来自 about.md。'
    },
    {
      name: 'roadmap', path: '/roadmap', view: 'page', shell: 'shell', kind: 'page',
      page: 'posts/roadmap.md',
      nav: { label: 'Roadmap', group: 'about', target: 'file:posts/roadmap.md' },
      note: '归入主导航的 About 折叠组。'
    }
  ];

  window.BlogRouteRegistry = {
    // 以函数取值而非缓存常量，方便测试替换 window.BlogRouteTable 后立即生效。
    table: function () {
      return window.BlogRouteTable || [];
    },

    get: function (name) {
      var found = null;
      this.table().forEach(function (def) {
        if (!found && def.name === name) found = def;
      });
      return found;
    },

    byPath: function (path) {
      var found = null;
      this.table().forEach(function (def) {
        if (!found && def.path === path) found = def;
      });
      return found;
    },

    // alias 目标的完整定义；目标缺失时返回 null（校验会另行报错）。
    aliasOf: function (name) {
      var def = this.get(name);
      return def && def.alias ? this.get(def.alias) : null;
    },

    // 派生路由字典：name -> path。router.js / store.js / app.js 读的就是它。
    paths: function () {
      var map = {};
      this.table().forEach(function (def) {
        map[def.name] = def.path;
      });
      return map;
    },

    // 从表派生主导航数组，产出结构与 router.js#getFlattenedNav 期望的完全一致：
    // 普通项是对象，同组的项聚成一个数组（首项常显，其余折叠进下拉菜单）。
    buildNav: function () {
      var items = [];
      var groups = {};
      this.table().forEach(function (def) {
        if (!def.nav) return;
        var item = { id: def.name, label: def.nav.label || def.name };
        item.target = def.nav.target || def.path;
        if (!def.nav.group) { items.push(item); return; }
        if (!groups[def.nav.group]) { groups[def.nav.group] = []; items.push(groups[def.nav.group]); }
        groups[def.nav.group].push(item);
      });
      return items;
    },

    // 表内自洽校验。返回问题描述数组，空数组表示通过。
    // 只做纯数据检查（命名、层级、形态、导航声明、alias 指向）；
    // 依赖磁盘与运行时数据的检查（文件是否存在、导航项是否命中路由）留在
    // scripts/validate-content.js，那里能同时拿到 store 与 router。
    validate: function () {
      var issues = [];
      var self = this;
      var table = this.table();
      var views = window.BlogRouteViewValues || [];
      var validName = /^[a-z][a-z0-9]*$/;
      var validPath = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
      // 动作语义必须由页面功能或交互承担，不能占路由段（AGENTS.md 6.2 第 3 条）。
      var verbs = ['get', 'create', 'update', 'delete', 'search', 'list', 'show', 'edit', 'new', 'add', 'remove', 'fetch', 'find', 'save', 'submit'];
      var seenName = {};
      var seenPath = {};

      table.forEach(function (def, index) {
        var where = 'Route[' + index + '] ' + (def && def.name ? def.name : '(缺失 name)');
        var push = function (msg) { issues.push(where + ': ' + msg); };
        if (!def || typeof def !== 'object') { issues.push('Route[' + index + ']: 不是对象'); return; }

        // 1. 标识与命名格式
        if (typeof def.name !== 'string' || !validName.test(def.name)) push('name 必须是全小写字母数字，且以字母开头');
        else if (seenName[def.name]) push('name 与 Route[' + seenName[def.name] + '] 重复');
        else seenName[def.name] = index;

        if (def.path !== '/' && (typeof def.path !== 'string' || !validPath.test(def.path))) {
          push('path 非法：只允许 / 或全小写 kebab-case 路径段（禁止大写、下划线、末尾斜杠）');
        } else if (seenPath[def.path] !== undefined) {
          push('path ' + def.path + ' 与 ' + seenPath[def.path] + ' 重复');
        } else {
          seenPath[def.path] = def.name;
        }

        var segments = String(def.path || '').split('/').filter(Boolean);
        segments.forEach(function (seg) {
          if (verbs.indexOf(seg) !== -1 || /^(?:get|create|update|delete|add|remove|fetch|save)-/.test(seg)) {
            push('path 段 "' + seg + '" 是动词：动作语义应由页面功能承担，不占路由');
          }
        });

        // 2. 渲染器与版心
        if (views.indexOf(def.view) === -1) push('view 必须是以下之一：' + views.join(' / '));
        if (['shell', 'shell-detail'].indexOf(def.shell) === -1) push("shell 必须是 'shell' 或 'shell-detail'");
        if (def.shell === 'shell-detail' && def.view !== 'post') {
          push("只有文章详情（view: 'post'）可以用 shell-detail；其余页面必须用 shell");
        }

        // 3. 模块形态与路由层级
        if (['page', 'collection', 'prefix'].indexOf(def.kind) === -1) push("kind 必须是 'page' / 'collection' / 'prefix'");
        if (def.kind === 'collection') {
          if (!def.detail) push('集合型模块必须声明 detail 二级路由（模块集合 -> 模块详情）');
          if (!/s$/.test(segments[segments.length - 1] || '')) push('集合型模块的路径应当用复数名词');
        } else if (def.kind === 'page' && def.detail) {
          push('单页展示型模块不应声明 detail 二级路由');
        } else if (def.kind === 'prefix' && !def.alias) {
          push('prefix 型模块必须声明 alias：它不是页面，必须收敛到某个真实模块');
        }
        if (def.detail && def.path !== '/' && String(def.detail).indexOf(def.path + '/:') !== 0) {
          push('detail 必须以 "' + def.path + '/:" 开头');
        }

        // 4. 导航声明（必须显式，避免「忘了加入口」变成静默的孤岛页）
        if (def.nav === undefined) push('必须显式声明 nav；无入口请写 nav: null');
        if (def.nav && !def.nav.label) push('nav.label 不能为空');
        if (def.nav === null && def.kind !== 'prefix' && !def.alias) {
          push('既无导航入口也无 alias，会成为孤岛页');
        }

        // 5. alias 指向
        if (def.alias && !self.get(def.alias)) push('alias 指向的模块 "' + def.alias + '" 不存在');
        if (def.alias && def.alias === def.name) push('alias 不能指向自己（会造成无限收敛）');
      });

      return issues;
    }
  };

  // 派生并冻结路由字典。之后全站读 window.BlogRoutes 拿到的就是表里的 path。
  // 冻结是为了让「改路由」只能通过改表完成，杜绝运行时偷偷塞一个键。
  window.BlogRoutes = Object.freeze(window.BlogRouteRegistry.paths());
}());
