---
title: "01 导引：系统架构与公理体系"
date: "2026-10-10"
column: "distributed-systems"         # 专栏唯一标识（用于分类聚合与 URL 路由）
columnName: "分布式系统与高可用架构"   # 专栏对外展示的中文全名
order: 1                             # 章节顺序序号（自动编排 PART 01）
tags: ["systems", "distributed", "consensus"]
excerpt: "本章节作为专栏序章，概述分布式一致性算法演进史与核心公理定理。"
tocLevels: [2, 3]                    # 大纲目录追踪层级
---

# 01 导引：系统架构与公理体系

欢迎阅读《分布式系统与高可用架构》专栏第一章。属于专栏的文档具有以下内置特性：

1. **专栏内聚导航**：文章底部的「上一章 / 下一章」卡片严格在该专栏内按 `order` 顺序流转，不与外部独立博客混淆。
2. **系列章节全景侧边栏**：右侧边栏与移动端抽屉会自动展示该专栏的全部章节列表，当前章节自动高亮。
3. **面包屑层级**：顶部自动呈现 `Writing / 分布式系统与高可用架构 / Part 01` 导航路径。

## CAP 定理与 PACELC 模型

在不可靠网络环境下，系统只能在一致性（Consistency）、可用性（Availability）和分区容错性（Partition tolerance）之间做权衡。

$$
\text{Availability} \iff \forall r \in \text{Requests}, \quad \Pr[\text{Response}(r) \neq \bot] = 1
$$

### 核心权衡维度

- **CP 架构**：强一致性优先，网络分区时牺牲部分节点可用性（如 Raft / Paxos 复制状态机）。
- **AP 架构**：高可用性优先，网络分区时接受临时陈旧读，通过最终一致性合并（如 Dynamo / Gossip）。

## 复制状态机核心循环

状态机保证所有健康副本按照完全相同的顺序执行状态转换：

```python
class StateMachine:
    def __init__(self):
        self.state = 0
        self.commit_index = 0

    def apply_log(self, command: str, term: int):
        # 严格单调递增应用已提交日志项
        self.commit_index += 1
        self.state += 1
        return self.state
```

## 本章小结

在下一章节中，我们将深入推导 Raft 选举安全公理与日志追加 RPC 的详细流转。
