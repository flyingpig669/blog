window.BlogSampleData = {
  "author": {
    "name": "极光客 (Alex Chen)",
    "title": "全栈架构师 · 开源爱好者 · 终身学习者",
    "bio": "专注于现代前端、云原生后端与大模型应用落地。崇尚极简主义与心流开发，用代码记录思考与创造。",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    "location": "杭州 / 远程游民",
    "email": "flyingpig06@outlook.com",
    "github": "https://github.com/flyingpig669",
    "twitter": "https://twitter.com",
    "postsCount": 5,
    "likesCount": 384,
    "wordsCount": 16800,
    "daysLive": 365
  },
  "categories": [
    {
      "id": "ai",
      "name": "人工智能",
      "desc": "LLM、Agent、RAG 向量检索与算法工程",
      "color": "from-purple-500 to-indigo-600",
      "icon": "sparkles"
    },
    {
      "id": "frontend",
      "name": "前端技术",
      "desc": "现代 Web 框架、响应式渲染与工程化实践",
      "color": "from-blue-500 to-cyan-500",
      "icon": "code"
    },
    {
      "id": "backend",
      "name": "后端架构",
      "desc": "分布式系统、高可用架构与微服务实战",
      "color": "from-emerald-500 to-teal-600",
      "icon": "terminal"
    },
    {
      "id": "design",
      "name": "设计美学",
      "desc": "设计系统、排版律动、微交互与体验设计",
      "color": "from-pink-500 to-rose-500",
      "icon": "layers"
    },
    {
      "id": "life",
      "name": "思考随笔",
      "desc": "数字游民、心流思考、认知升级与阅读记录",
      "color": "from-amber-500 to-orange-500",
      "icon": "book-open"
    }
  ],
  "posts": [
    {
      "id": "post-1",
      "slug": "frontend-architecture-evolution",
      "title": "深度解析现代前端架构演进：从虚拟 DOM 到细粒度响应性与服务端组件",
      "category": "frontend",
      "categoryName": "前端技术",
      "coverGradient": "from-blue-600 to-cyan-500",
      "date": "2026-09-28",
      "readTime": "7 分钟",
      "words": 3400,
      "views": 1420,
      "likes": 96,
      "pinned": true,
      "excerpt": "从早期的模板引擎、虚拟 DOM Diff 到以 Signals 为代表的细粒度响应式更新，再到 React Server Components 的服务端演化，深入拆解现代前端框架底层原理与设计权衡。",
      "tags": [
        "React",
        "Vue",
        "Signals",
        "前端架构",
        "RSC"
      ],
      "content": "## 前言：前端框架的十年探索\n\n过去十年中，前端开发范式经历了几次巨大的代际更迭。我们从手写 DOM 操作的时代，跨越到了基于数据驱动声明式视图的虚拟 DOM 时代，而今又迈向了**细粒度响应性（Fine-grained Reactivity）**与**服务端组件（Server Components）**并存的新纪元。\n\n::: tip 架构思考\n框架的本质是抽象。虚拟 DOM 并非为了“比原生 DOM 更快”，而是通过提供统一的声明式抽象，降低大规模应用的维护复杂度。\n:::\n\n---\n\n## 虚拟 DOM 的得与失\n\n在经典 React 模式中，每次状态变化都会触发自顶向下的组件树重渲染：\n\n$$\n\\text{UI} = f(\\text{state})\n$$\n\n其核心机制包括：\n1. **生成 VNode 树**：执行 render 函数产生内存中的虚拟节点。\n2. **Reconciliation (协调与 Diff)**：将新旧 VNode 树进行递归比对，找出变更点。\n3. **Commit 阶段**：批量执行最小化的 DOM 更新。\n\n```javascript\n// 经典 React 状态重渲染示例\nfunction Counter() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div className=\"card\">\n      <p>当前计数值: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>递增</button>\n    </div>\n  );\n}\n```\n\n然而，随着应用规模膨胀，虚拟 DOM 的内存分配开销和遍历比对成本逐渐成为性能瓶颈，尤其在复杂列表或频繁高频交互场景下。\n\n---\n\n## 细粒度响应性：Signals 的崛起\n\n与虚拟 DOM 的整树 Diff 不同，以 SolidJS、Preact Signals 以及 Vue 3 为代表的响应式系统采用了**依赖追踪与靶向更新**。\n\n```typescript\nimport { signal, effect } from '@preact/signals-core';\n\nconst count = signal(0);\nconst double = signal(() => count.value * 2);\n\neffect(() => {\n  console.log(\"Count:\", count.value, \"Double:\", double.value);\n});\n\ncount.value += 1;\n```\n\n### 性能模型对比\n\n| 特性维度 | 传统虚拟 DOM 模式 | 细粒度 Signals 模式 |\n| :--- | :--- | :--- |\n| **更新颗粒度** | 组件级 (Component-level) | 节点属性级 (DOM-node-level) |\n| **内存开销** | 每次需分配新 VNode 对象 | 长期保存响应式订阅拓扑图 |\n| **初始化开销** | 较轻量 | 依赖收集稍耗时 |\n| **高频更新性能** | 易产生卡顿，需 useMemo 优化 | 极高吞吐量，天然局部更新 |\n\n---\n\n## React Server Components (RSC) 与全栈混合渲染\n\n现代前端的另一大前沿是 RSC：\n1. **零客户端体积（Zero-Bundle-Size）**：复杂的大型依赖仅在服务端运行，不随 JS bundle 下发到浏览器。\n2. **直连数据源**：组件可直接在服务端安全调用数据库，无需额外的 BFF API 胶水层。\n3. **流式传输（Streaming）**：首屏就绪内容即时下发，缩短首屏交互时间（TTI）。\n\n::: note 总结与展望\n技术演进并不是非此即彼的取代关系，而是多维度的融合。理解不同框架方案背后的约束与取舍，才是架构选型中最有价值的能力。\n:::"
    },
    {
      "id": "post-2",
      "slug": "llm-rag-production-guide",
      "title": "大语言模型微调与 RAG 检索增强实战：从原理到生产落地",
      "category": "ai",
      "categoryName": "人工智能",
      "coverGradient": "from-purple-600 to-indigo-600",
      "date": "2026-09-24",
      "readTime": "9 分钟",
      "words": 4200,
      "views": 2150,
      "likes": 148,
      "pinned": true,
      "excerpt": "详细剖析企业级 RAG 检索增强生成的完整落地链路，涵盖语义分块、Embedding 向量化、混合检索、重排（Rerank）与上下文压缩，并附上核心注意力机制与相似度数学公式推导。",
      "tags": [
        "LLM",
        "RAG",
        "向量检索",
        "KaTeX",
        "Python"
      ],
      "content": "## 为什么需要 RAG？\n\n大语言模型（LLM）虽然拥有庞大的通用世界知识，但在垂直业务落地时常常面临三大致命痛点：幻觉问题、私有知识黑盒与时效性滞后。\n\n**RAG（Retrieval-Augmented Generation）**通过动态检索相关知识并注入上下文，赋予了模型实时、精准且可溯源的专业回答能力。\n\n---\n\n## 核心数学原理推导\n\n### 1. 自注意力机制（Self-Attention）\n\n$$\n\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V\n$$\n\n其中，缩放因子 $$\\sqrt{d_k}$$ 防止点积数值过大导致 Softmax 梯度饱和。\n\n### 2. 向量相似度度量（余弦相似度）\n\n$$\n\\text{CosineSimilarity}(\\vec{u}, \\vec{v}) = \\frac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\|_2 \\|\\vec{v}\\|_2} = \\frac{\\sum_{i=1}^n u_i v_i}{\\sqrt{\\sum_{i=1}^n u_i^2} \\sqrt{\\sum_{i=1}^n v_i^2}}\n$$\n\n### 3. 微调优化目标（交叉熵损失）\n\n$$\n\\mathcal{L}_{\\text{SFT}} = - \\frac{1}{N} \\sum_{t=1}^N \\log P(y_t \\mid y_{<t}, x)\n$$\n\n---\n\n## Python 核心检索代码实现\n\n```python\nimport numpy as np\n\nclass HybridRAGRetriever:\n    def __init__(self, embed_dim: int = 1536):\n        self.docs = []\n        self.vectors = np.zeros((0, embed_dim))\n        \n    def retrieve(self, query_vec: np.ndarray, top_k: int = 5):\n        norm_q = query_vec / (np.linalg.norm(query_vec) + 1e-9)\n        norm_d = self.vectors / (np.linalg.norm(self.vectors, axis=1, keepdims=True) + 1e-9)\n        scores = np.dot(norm_d, norm_q)\n        top_indices = np.argsort(scores)[::-1][:top_k]\n        return [(self.docs[i], float(scores[i])) for i in top_indices]\n```\n\n::: tip 生产实践建议\n对于工业级复杂查询，推荐使用 **Dense 向量检索 + BM25 稀疏索引** 的混合检索，并通过 Reranker 进一步精排。\n:::"
    },
    {
      "id": "post-3",
      "slug": "distributed-consensus-raft-guide",
      "title": "构建高可用分布式系统：从 Paxos、Raft 共识机制到故障自愈",
      "category": "backend",
      "categoryName": "后端架构",
      "coverGradient": "from-emerald-600 to-teal-500",
      "date": "2026-09-18",
      "readTime": "8 分钟",
      "words": 3600,
      "views": 1890,
      "likes": 112,
      "pinned": false,
      "excerpt": "分布式环境下的网络分区、节点崩溃与乱序消息是系统工程的永恒挑战。本文深入剖析 Raft 算法的 Leader 选举、日志复制机制与安全性不变量，探讨高可用架构落地。",
      "tags": [
        "分布式",
        "Raft",
        "高可用",
        "Go",
        "系统设计"
      ],
      "content": "## 引言：分布式共识为什么困难？\n\n在单机系统中，状态更新由内存锁或操作系统原语保证唯一性。然而在跨机房、多节点的分布式拓扑中，我们必须面对 FLP 不可能性定理与 CAP 权衡。\n\n---\n\n## Raft 的三位一体状态机\n\n1. **Leader 选举（Leader Election）**：当心跳超时时竞选新 Leader。\n2. **日志复制（Log Replication）**：多数派确认后 Commit。\n3. **安全性约束（Safety）**：确保已 Commit 的日志不丢失。\n\n::: note 核心不变量\n若日志条目在任期 $$T$$ 中被某个 Leader 提交，则该条目在未来任意更高任期 $$T' > T$$ 的 Leader 日志中必然存在且位置不变。\n:::\n\n```go\npackage main\nimport \"fmt\"\ntype NodeRole int\nconst (\n    Follower NodeRole = iota\n    Candidate\n    Leader\n)\nfunc main() {\n    fmt.Println(\"Raft consensus node initialized.\")\n}\n```"
    },
    {
      "id": "post-4",
      "slug": "ui-design-system-philosophy",
      "title": "极简主义 UI 设计系统：色彩规范、排版律动与组件微交互",
      "category": "design",
      "categoryName": "设计美学",
      "coverGradient": "from-pink-600 to-rose-500",
      "date": "2026-09-12",
      "readTime": "6 分钟",
      "words": 2800,
      "views": 1650,
      "likes": 88,
      "pinned": false,
      "excerpt": "好的设计往往是无形的。探讨如何建立一套清晰自洽的设计系统，从 60-30-10 色彩法则、8pt 间距网格系统，到弹性动效参数的精细调校。",
      "tags": [
        "UI设计",
        "设计系统",
        "Tailwind",
        "排版美学",
        "CSS"
      ],
      "content": "## 秩序感源自克制\n\n极简主义不是简单的“留白”，而是建立在严谨数学与视觉层级之上的自洽秩序。\n\n::: tip 经典设计法则\n“Less, but better.” —— Dieter Rams 优秀的十项设计原则之一。\n:::\n\n---\n\n## 1. 色彩配比：60-30-10 法则\n- **60% 基础主基调**：纯白或深邃灰蓝画布\n- **30% 结构副色**：卡片表面与边界描边\n- **10% 交互强调色**：按钮与状态徽章\n\n## 2. 8pt 网格与排版节奏\n将所有 padding 与 margin 约束在 8px 的整数倍，带来极具秩序的美感。"
    },
    {
      "id": "post-5",
      "slug": "digital-nomad-one-year-reflection",
      "title": "数字游民纪行：在山川湖海之间写代码的生活与思考",
      "category": "life",
      "categoryName": "思考随笔",
      "coverGradient": "from-amber-500 to-orange-500",
      "date": "2026-08-30",
      "readTime": "5 分钟",
      "words": 2400,
      "views": 2840,
      "likes": 196,
      "pinned": false,
      "excerpt": "过去一年里，我带着一台 MacBook 和极简行李走过了十几个城市与山野。关于效率、孤独感、心流体验以及对工作与自由本质的重构思考。",
      "tags": [
        "数字游民",
        "远程办公",
        "自我管理",
        "生活随笔"
      ],
      "content": "## 出发：打破既定轨道的尝试\n\n一年前的秋天，我退掉了城市的公寓租约，将所有日常物品精简至两个行李箱。\n\n---\n\n## 游牧工匠的装备法则\n- **核心生产力**：MacBook Pro 14 + 100W 氮化镓充电头\n- **听觉结界**：主动降噪耳机\n- **一本实体手账**：用钢笔梳理架构灵感\n\n::: note 生活法则\n拥有更少的物理物品，大脑才能留出更多宝贵的认知带宽给真正重要的事情。\n:::\n\n内心的安宁与专注，才是真正的居所。"
    },
    {
      "id": "post-md-sample-commit",
      "slug": "sample-commit",
      "title": "本地提交 Markdown 文章示例：自动化同步机制",
      "category": "backend",
      "categoryName": "后端架构",
      "coverGradient": "from-pink-600 to-rose-500",
      "date": "2026-10-06",
      "readTime": "1 分钟",
      "words": 540,
      "views": 1,
      "likes": 0,
      "pinned": false,
      "excerpt": "概述  这是一篇通过本地 Markdown 文件手动提交（Commit）至博客系统的示例文章。  你可以在 outputs/blog/posts/ 目录中随时添加任意 .md 格式的文档，系统支持以下两种方式引入：  1. Web 界面拖拽与导入：在博客顶部的“写文章”页面中，...",
      "tags": [
        "Markdown",
        "自动化",
        "脚本工具"
      ],
      "content": "## 概述\n\n这是一篇通过本地 Markdown 文件手动提交（Commit）至博客系统的示例文章。\n\n你可以在 outputs/blog/posts/ 目录中随时添加任意 .md 格式的文档，系统支持以下两种方式引入：\n\n1. **Web 界面拖拽与导入**：在博客顶部的“写文章”页面中，直接将本地 .md 文件拖拽至编辑区，或者点击“导入 MD 文档”按钮一键载入。\n2. **终端脚本一键同步**：直接将 Markdown 文件保存在 outputs/blog/posts/ 目录下，运行 python3 sync_posts.py 即可全自动同步至全站索引。\n\n::: tip 格式说明\n支持标准的 YAML Frontmatter 元信息头部（包含 title, date, category, tags），若无 Frontmatter，系统将自动从一级标题（# Title）与正文中提取元信息。\n:::\n\n### 代码语法与公式示例\n\n```python\ndef hello_blog():\n    print(\"Welcome to Aurora Blog with automated markdown commit!\")\n```\n\n$$\nE = mc^2\n$$"
    }
  ],
  "comments": {
    "post-1": [
      {
        "id": "c-101",
        "author": "DevLover",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        "date": "2026-09-29 10:25",
        "content": "写得非常透彻！特别是对比 Signals 和 VDOM 内存开销那部分。",
        "likes": 12
      },
      {
        "id": "c-102",
        "author": "Sarah Wu",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        "date": "2026-09-29 14:18",
        "content": "期待博主下一篇关于 RSC 生产落地调优的分享！",
        "likes": 5
      }
    ],
    "post-2": [
      {
        "id": "c-201",
        "author": "AI_Explorer",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
        "date": "2026-09-25 09:42",
        "content": "公式推导和 Python 实现非常清晰！我们在工业文档 RAG 中也采用了混合召回方案，召回率提升显著。",
        "likes": 24
      }
    ]
  }
};
