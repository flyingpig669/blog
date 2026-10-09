# AGENTS.md - UI Design System & Development Conventions

本项目（Aurora Notes）采用参考 Linear、Vercel 与 Raycast 的深色极简科技风设计系统。为保证全站视觉语言、交互质感和代码风格的高度一致，所有在此仓库执行任务的 Agent 必须严格遵守以下约束规范。

---

## 1. 核心设计哲学 (Design Philosophy)

1. **冷静、克制、严谨**：界面依托充裕留白与 1px 极细微边框建立视觉秩序，杜绝高饱和度色块、浮夸渐变或刺眼彩色弥散阴影。
2. **纯粹深色阶**：严格使用预设的三个灰黑底色层级，禁止引入任何未经定义的外部第三方灰色（如 Tailwind 默认的 gray-800/900、slate 系列等）。
3. **内容优先**：一切动效与容器装饰服务于文字排版、数学推导与代码呈现，微动效控制在 150ms ~ 180ms ease-out，禁止大幅度弹跳或刺眼光晕。
4. **模块化优先**：所有 UI、样式、逻辑必须拆分为独立可复用模块，禁止页面级重复实现，确保单点修改全局生效。

---

## 2. 严格设计令牌字典 (Design Tokens)

Agent 编写 HTML、Tailwind 类名或原生 CSS 时，必须严格遵循以下色值与设计令牌映射：

| 令牌名称 | CSS 变量 | Tailwind / Hex | 适用场景 |
| :--- | :--- | :--- | :--- |
| **页面底色** | `--bg-page` | `#0A0A0B` / `bg-[#0A0A0B]` | 全局页面背景、双栏外层背景 |
| **卡片/表面底色** | `--bg-surface` | `#111113` / `bg-[#111113]` | 卡片容器、弹窗、下拉菜单、Focus Card |
| **代码/内嵌底色** | `--bg-code` | `#161618` / `bg-[#161618]` | 代码块容器、KaTeX 公式块、快捷键 `<kbd>` |
| **一级主文本** | `--text-primary` | `#EDEDED` / `text-[#EDEDED]` | 页面主标题、文章标题、正文主要文字（高对比软白） |
| **二级次要文本** | `--text-secondary` | `#8B8B8E` / `text-[#8B8B8E]` | 副标题、段落描述、文章摘要、次级导航 |
| **三级弱文本** | `--text-muted` | `#5A5A5E` / `text-[#5A5A5E]` | 日期、阅读时间、计数器、占位符、小分割点 |
| **主强调色** | `--accent-primary` | `#3B82F6` / `text-[#3B82F6]` | 链接、选中指示器、主要按钮底色、Hover 强调色 |
| **次强调色** | `--accent-secondary` | `#22D3EE` / `text-[#22D3EE]` | 代码高亮关键字、特定科技元信息 |
| **极细边框** | `--border-subtle` | `rgba(255,255,255,0.08)` / `border-white/[0.08]` | 所有卡片常态边框、输入框边框 |
| **悬浮边框** | `--border-hover` | `rgba(255,255,255,0.16)` / `hover:border-white/[0.16]` | 卡片 Hover、按钮 Hover 时的边框强化 |
| **结构分割线** | `--divider` | `rgba(255,255,255,0.06)` / `border-white/[0.06]` | 标题底部分割线、列表项分割线、页脚顶部分割线 |

---

## 3. 字体与排版层级约束 (Typography & Monospace Rules)

全站字体严格区分为两套体系，不得混淆：

1. **无衬线主字体 (`--font-sans` / `font-sans`)**：
   - 规则：用于主标题、副标题、文章正文、导航链接、常规描述。
   - 字体栈：`'Inter', system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`。
2. **等宽数据字体 (`--font-mono` / `font-mono`)**：
   - 规则：必须强制用于所有「数字、日期、标签、代码、快捷键、系统标识、技术元数据」。
   - 字体栈：`'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`。
   - 适用元素：
     - 站点 Logo：`/` (蓝色等宽) + `aurora.notes`
     - 日期与阅读时间：`2026-10-09 · 5 min read`
     - 系列编号：`SERIES 01`、`PART 02`、`YEAR 2026`
     - 标签胶囊：`#physics`、`#algorithms`
     - 快捷键徽标：`<kbd class="font-mono text-[10px]">⌘K</kbd>`
     - 代码块与数学公式变量

---

## 4. 容器版心与几何布局约束 (Layout Geometry)

严禁在任何页面引入自定义的随意外层宽度（如 `max-w-4xl`、`max-w-screen-xl` 等）：

1. **标准单栏页面 (Home, Columns, Archive, Tags, About, Projects 及动态栏目)**：
   - 外层版心宽度：严格为 `max-w-[720px] mx-auto px-4 sm:px-6`。
   - 垂直留白：顶部 `pt-16 md:pt-20`（首页可增至 `pt-20 md:pt-24`），底部 `pb-20`。
2. **文章详情双栏阅读页面 (Post View)**：
   - 双栏总容器：`max-w-[1000px] mx-auto px-4 sm:px-6`。
   - 左侧正文列：`flex-1 max-w-[680px] min-w-0`。
   - 右侧常驻悬浮目录 (Outline)：宽度约 220px 级固定侧边栏，桌面端悬浮滚动联动，移动端隐藏并降级为浮动操作圆钮。
3. **顶部导航栏 (Navbar)**：
   - 高度固定 56px (`h-14`)，采用全宽占据页面方式 (`w-full px-4 sm:px-6 md:px-8 lg:px-12`)，支持缩放与自适应断点（`md:` 768px 折叠抽屉）。
   - 左侧为 Logo（等宽 `shrink-0`）与主导航项（`hidden md:flex gap-4 lg:gap-6 whitespace-nowrap overflow-x-auto no-scrollbar`），两组保持充裕间距（`gap-6 lg:gap-8`），物理杜绝重叠粘连。
   - 右侧为搜索快捷按钮（`Search ⌘K`）、写作快捷键（`Write`）与移动端抽屉开关（`md:hidden`），统一 `shrink-0`。
   - 毛玻璃背景：`bg-[#0A0A0B]/72 backdrop-blur-md border-b border-white/[0.06]`。
4. **页脚 (Footer)**：
   - 顶部间距：`mt-24`，上边框 `border-t border-white/[0.06]`，垂直内边距 `py-10`。
   - 版心对齐：`max-w-[720px] mx-auto px-4 sm:px-6`。
   - 极简原则：页脚仅展示单行版权信息（如 `© 2026 Alex Chen · All rights reserved.`），严禁在页脚添加社交媒体图标或多列链接群。
5. **快捷搜索弹窗 (Cmd+K Modal)**：
   - 宽度严格限制为 `max-w-[560px]`，背景色 `#111113`，边框 `border-white/[0.12]`，圆角 `rounded-xl`。

---

## 5. 核心组件开发标准 (Component Patterns)

任何 Agent 新增视图或修改组件时，必须复用以下标准结构：

### 5.1 二级页面头部标准 (Page Header)
所有列表或独立页面的头部统一采用以下结构与间距：
```html
<header class="mb-10 pb-6 border-b border-white/[0.06]">
  <h1 class="text-[32px] sm:text-[36px] font-bold text-[#EDEDED] tracking-[-0.02em] leading-[1.15] mb-2 font-sans">
    页面主标题
  </h1>
  <p class="text-[16px] text-[#8B8B8E] leading-relaxed max-w-[620px]">
    页面副标题与简介说明文字。
  </p>
</header>
```

### 5.2 卡片容器标准 (Linear Surface Card)
- 基础样式：`bg-[#111113] border border-white/[0.08] rounded-xl`（或引用 `.linear-card`）。
- 动效与过渡：`transition: border-color 180ms ease-out, transform 180ms ease-out;`
- Hover 状态：`hover:border-white/[0.16] hover:-translate-y-[2px]`。
- 严禁项：严禁纯白背景，严禁彩色浓重发光阴影，严禁直角无圆角（统一 12px / `rounded-xl`）。

### 5.3 标签胶囊标准 (Tag Pill)
标签采用空心微边框风格，禁止使用彩色或实心色块：
- 结构：`<a href="#/" class="tag-pill">#tagName</a>`
- 内联 Tailwind 等价：
  `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-mono text-[#8B8B8E] border border-white/[0.08] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all`

### 5.4 文章列表条目标准 (Post Item)
列表内博文项采用无缝分割线与悬浮微平移：
- 容器：`divide-y divide-white/[0.06]`。
- 单项类：`.post-item`（内边距 `py-6`，Hover `translate-x-[2px]`）。
- 内部顺序：
  1. 日期与元信息：`text-[12px] font-mono text-[#5A5A5E] mb-2`
  2. 文章标题：`text-[18px] font-semibold text-[#EDEDED] hover:text-[#3B82F6] leading-snug mb-2`
  3. 文章摘要：`text-[14px] text-[#8B8B8E] line-clamp-2 leading-relaxed mb-3.5`
  4. 标签行：空心 `tag-pill` 组合。

### 5.5 按钮标准 (Buttons)
- **次要/常规按钮**：`px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[#111113] border border-white/[0.08] hover:border-white/[0.16] text-[#EDEDED] transition-all`
- **主要强调按钮**：`px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all`

### 5.6 经历时间线标准 (Timeline Track)
- 左侧贯通轴线：`border-l border-white/[0.08]`，内间距 `pl-6`。
- 节点圆点：9px 直径，历史节点为弱色 `#5A5A5E`，当前最新节点为 `#3B82F6` 并带微弱外发光。
- 外圈遮罩：`box-shadow: 0 0 0 4px #0A0A0B`（以页面底色作为安全遮罩）。

---

## 6. 严禁事项清单 (Strict Prohibitions)

Agent 进行前端编写时，以下行为一律判定为违规：

1. **严禁引入杂色**：严禁使用未经定义的 Tailwind 色值（如 `bg-gray-800`、`bg-zinc-900`、`text-slate-300` 等），必须收敛在 `#0A0A0B`、`#111113`、`#161618` 与三级文本令牌内。
2. **严禁破坏版心几何**：单栏统一 `max-w-[720px]`，双栏统一 `max-w-[1000px]`，严禁随意铺满屏幕。
3. **严禁使用实心彩色标签**：标签必须是微边框空心胶囊，禁止出现 `bg-blue-500 text-white`、`bg-purple-600` 等实心高饱和标签。
4. **严禁在全局页脚添加社交链接**：社交媒体卡片仅在 About 页面专栏展示，全站页脚严禁新增社交图标、友情链接或复杂布局。
5. **严禁混淆无衬线与等宽字体**：所有日期、数字、代码、徽标、键位、前缀编号必须严格使用 `font-mono`。
6. **严禁夸张阴影与大面积高亮渐变**：背景微妙网格不透明度不可超过 3%（`rgba(255,255,255,0.02)`），卡片禁止彩色发光阴影。
7. **严禁页面级重复实现**：共用 UI 必须在全局层定义一次，禁止在单页内复制或重写。

---

## 7. 数学公式与物理公式排版 (Math & Physics Formatting)

为适配 Codex desktop 的 KaTeX 渲染机制（禁用单美元符号内联）：

1. **行内公式**：严禁使用单个美元符号（`$...$`），必须统一使用双美元符号（如 `$$E = mc^2$$`）或 LaTeX 圆括号转义（`\( ... \)`）。
2. **独立块级公式**：使用独立的双美元符号块，前后必须保留空行：
   $$
   H \left| \psi \right\rangle = E \left| \psi \right\rangle
   $$
3. **KaTeX 语法兼容**：
   - 狄拉克符号使用 `\left| \psi \right\rangle` 和 `\left\langle \phi \right|`，不使用 `\ket{}` 或 `\bra{}`。
   - 多行公式对齐使用 `$$` 内部嵌套 `\begin{aligned} ... \end{aligned}`，不使用 `\begin{align}`。

---

## 8. 后台任务与子代理约束 (Background Tasks & Subagents)

涉及长时间运行、批量编译、博文同步等任务：

1. **单监控实例**：针对同一生命周期任务，最多仅调用一次 `spawn_agent` 派发监控任务，严禁频繁针对每个步骤、每个文件创建多个子代理。
2. **脚本集中执行**：遍历与编译等批处理逻辑统一收敛在单个 Python 或 Shell 脚本中执行（如 `sync_posts.py`）。
3. **禁止子代理嵌套**：监控子代理严禁再次派生次级子代理，直接通过本地工具检查状态，完成后返回精简指标。
4. **代理复用**：需要跟进或调整已有任务时，通过 `send_message` 或 `followup_task` 发送指令，避免重复新建。

---

## 9. 模块化架构约束 (Modular Architecture)

全项目必须模块化，确保「一处修改，全局生效」，禁止散落式硬编码。

1. **目录分层**：UI 拆分为 `components/`（原子组件）、`layouts/`（页面骨架）、`styles/`（全局样式与令牌）、`lib/`（逻辑与数据）。页面文件只做组装，不写重复 UI。
2. **单一职责**：一个组件只做一件事。Navbar、Footer、Button、Tag、Card、PostItem、SearchModal、Timeline 等均独立成文件，禁止合并成巨型组件。
3. **样式收敛**：共用样式集中定义在 `styles/global.css`（如 `.linear-card`、`.tag-pill`、`.post-item`、`.btn-primary`、`.kbd`），页面禁止重复写等价类名。
4. **令牌唯一**：颜色、字体、圆角、动效只能引用第 2 节设计令牌，禁止页面内写死近似值。
5. **配置集中**：导航项、社交链接、站点元信息等统一放在 `config/` 或 `data/`，禁止散落在各页面。
6. **复用优先**：新增页面前先查全局组件；有则引用，无则先在全局层新增，再在页面使用。
7. **禁止反向依赖**：全局组件不得依赖具体页面；页面只能依赖全局组件，不得反向耦合。

---

## 10. Agent UI 交付自检清单 (Pre-flight Checklist)

在修改或新增任何页面、组件或样式前，必须逐项核对：

- [ ] 版心容器是否严格为 `max-w-[720px]`（或详情页 `max-w-[1000px]`）并带有 `mx-auto px-4 sm:px-6`？
- [ ] 页面 Header 是否包含 `mb-10 pb-6 border-b border-white/[0.06]`？
- [ ] 卡片背景是否为 `#111113`，边框为 `border-white/[0.08]`，Hover 为 `hover:border-white/[0.16]`？
- [ ] 标签是否为等宽字体、带 `#` 前缀且为空心微边框胶囊？
- [ ] 所有时间戳、数字序号、系列前缀是否显式声明了 `font-mono`？
- [ ] 页面在移动端是否有合理的横向内边距（`px-4 sm:px-6`）？
- [ ] 全站页脚是否保持极简，未受冗余社交链接污染？
- [ ] 是否直接引用全局 Navbar / Footer / Card / Button / Tag / PostItem，而非单独实现？
- [ ] 是否存在可抽取但未抽取的重复 UI 样式？
- [ ] 是否在页面内重定义全局 CSS 变量或共用组件样式？
- [ ] 新增 UI 是否已优先上移到全局组件层？
- [ ] 配置项（导航、社交、站点信息）是否集中在 `config/` 或 `data/`，而非散落页面？
