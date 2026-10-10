---
# 状态标签与个人座右铭
status: "Physics, Math & Computer Science"
quote: "Turning complexity into clean order through rigorous logic, mathematics, and craft."
bio: "热爱理论物理与计算机科学的交叉前沿。致力于从高维希尔伯特空间、哈密顿量演化与微观统计力学的物理视角，理解并构建现代大规模计算架构与复杂分布式系统。坚持极简主义与深度心流开发，崇尚用严谨的数学推导与干净的代码建立秩序。"

# 论著与学术产出 (Publications) - 按年份倒序自动分组，卡片可点击展开摘要与 PDF 预览
# 字段：title / slug / authors / venue / year / citations / links{pdf,doi,arxiv,code,...} / abstract
#   authors 数组里与 blog.config.js 的 author.name 同名的作者会自动加粗（也可用 "**姓名**" 显式标注）
#   links 的值若是裸标识会自动补全：doi -> https://doi.org/…，arxiv -> https://arxiv.org/abs/…
#   links 的值若是 URL，则会作为链接直接显示。
# publications:
  # - title: "Quantum State Vector Simulation at Scale: Tensor-Network Decomposition for Variational Circuits"
  #   slug: "quantum-state-vector-simulation"
  #   authors: ["CCC", "L. Wang", "Y. Zhao"]
  #   venue: "Physical Review A"
  #   year: 2026
  #   citations: 12
  #   links:
  #     pdf: "attachments/slides/quantum-computing-slides.pdf"
  #     doi: "10.1103/PhysRevA.113.012345"
  #     arxiv: "2601.00001"
  #     code: "https://github.com/flyingpig669/blog"
  #   abstract: "我们提出一种面向变分量子算法的高吞吐量子态矢量仿真架构：以张量网络对高维复希尔伯特空间做分块压缩，并用无锁分片内存布局消除仿真内核里的同步开销。在 32 量子比特规模下相较通用仿真器取得约 4.7 倍吞吐提升，且内存占用随纠缠熵增长而非随维度指数增长。"
  # - title: "Consensus Under Adversarial Partitions: A Failure-Mode Taxonomy for Raft and Paxos"
  #   slug: "consensus-adversarial-partitions"
  #   authors: ["CCC", "M. Ito", "R. Nakamura"]
  #   venue: "ACM SOSP"
  #   year: 2026
  #   citations: 5
  #   links:
  #     doi: "10.1145/3600006.3613145"
  #     arxiv: "2603.04177"
  #     code: "https://github.com/flyingpig669/blog"
  #   abstract: "系统整理了 Raft 与 Paxos 在对抗性网络分区下的失效模式，给出一个覆盖 11 类故障的分类模型，并证明其中 3 类无法在仅依赖多数派选举的既有实现中被检测。"
  # - title: "Locality-Aware Lock-Free Queues for NUMA Architectures"
  #   slug: "locality-aware-lock-free-queues"
  #   authors: "CCC, H. Berg, S. Ali"
  #   venue: "IEEE IPDPS"
  #   year: 2025
  #   links:
  #     pdf: "attachments/slides/quantum-computing-slides.pdf"
  #     doi: "10.1109/IPDPS49936.2025.00091"
  #   abstract: "针对 NUMA 架构下跨节点缓存行争用导致的吞吐塌陷，设计并实现了按内存局部性分片的无锁队列，在 4 路 NUMA 机器上把跨节点流量降低了 78%。"

# 经历与时间线 (Timeline & Milestones) - 记录在哪个时间段做了一些事情
# 条目可选 detail（展开后的补充说明）与 links（关联资源筹码），两者皆空时不显示展开箭头
#   links 的 key 决定筹码类型：paper / post / note / slides / code / doi / tag / link ...
#   其中 paper 的值写 publications 里的 slug 或标题，点击会滚动到对应论著卡片并自动展开；
#   同一类资源可挂多个，写成数组即可：paper: ["slug-a", "slug-b"]
timeline:
  - period: "2024 – PRESENT"
    title: "量子线路的卷积特性"
    desc: "探索量子线路的卷积特性以及在图片分类任务中的应用。"
    detail: "在量子态矢量演化的数学框架下，研究了量子线路的卷积特性，并尝试将其应用于图像分类任务中。通过对量子态的高维复希尔伯特空间进行分析，验证了一种新的量子卷积方法，并在模拟实验中验证了其有效性。"
    # links:
    #   paper: ["quantum-state-vector-simulation", "consensus-adversarial-partitions"]
    #   code: "https://github.com/flyingpig669/blog"
  # - period: "2022 – 2024"
  #   title: "核心系统研发与基础设施优化"
  #   desc: "主导云原生后端基础设施重构，优化微服务拓扑与多级缓存一致性；搭建端到端高可用监控体系。"
  #   detail: "重构的核心是把跨服务的一致性约束显式化：把隐式依赖改成显式的版本协商，再用可观测性指标反向约束拓扑演进。"
  #   links:
  #     paper: "locality-aware-lock-free-queues"
  # - period: "2020 – 2022"
  #   title: "现代 Web 架构与工程化探索"
  #   desc: "深入探索现代前端响应式渲染引擎演进（Virtual DOM Diff、Signals 与 Server Components）；活跃于开源社区。"

# 核心关注领域 (Focus Areas)
focusAreas:
  - title: "量子信息与量子计算"
    desc: "量子计算，量子信息在机器学习以及密码学中的应用。"
    detail: "探索量子计算的基础理论与应用，研究量子信息在机器学习和密码学中的潜力。通过模拟和实验验证量子算法的性能，并分析其在实际问题中的可行性。"
    links:
      paper: "consensus-adversarial-partitions"
  - title: "数学与理论物理同构"
    desc: "复线性代数、高维希尔伯特空间、信息熵与统计热力学。"
    detail: "核心假设是：自注意力的软最大化与统计力学的配分函数之间存在结构同构，而注意力权的数值稳定性问题可以在这一视角下被重新表述。"
  - title: "现代化工程美学"
    desc: "精细化 Design Tokens、极简暗色交互与极致留白秩序。"

# 社交渠道与个人主页 (Contacts) - 纯文字极简展示，支持在此任意扩展任意平台与主页
social:
  - name: "GitHub"
    url: "https://github.com/flyingpig669"
  - name: "Email"
    url: "mailto:flyingpig06@outlook.com"
---
