---
title: "独立路线图与白皮书模板"
type: "post"              # 结构化独立页：支持 status/quote/bio/timeline/focusAreas/social 等区块，可被导航 target:file: 绑定为独立页
excerpt: "本页面展示独立高级单页 (Page Mode) 的完整排版特性：时间线、关注领域与富文本规范。"
tocLevels: [2, 3]

# 经历与时间线 (Timeline & Milestones) - 记录在哪个时间段做了一些事情
timeline:
  - period: "2026 – FUTURE"
    title: "前沿量子计算与分布式引擎开源"
    desc: "发布高性能量子态矢量仿真器核心，推进变分量子算法工程落地。"
  - period: "2024 – 2026"
    title: "Aurora Notes 极简科技知识库构建"
    desc: "设计并研发遵循 Linear / Raycast 规范的深色极简博客系统，深度优化学术数学公式与演示文稿放映。"
  - period: "2022 – 2024"
    title: "系统底层架构与并发模型探索"
    desc: "深耕分布式共识协议、无锁队列与内存局部性高吞吐优化。"

# 核心关注领域 (Focus Areas)
focusAreas:
  - title: "分布式系统与高可用架构"
    desc: "深入一致性共识算法与高可用基础设施拓扑。"
  - title: "量子计算与理论物理"
    desc: "高维复希尔伯特空间演化、量子门分解与变分量子算法。"
---

本白皮书是采用 **独立单页模式 (Page Mode)** 排版的示例，不仅支持完整的经历时间线导轨（Timeline Track）、关注领域与项目卡片，还支持完整的 KaTeX 数学公式与 Prism 代码高亮。

## 独立单页模式核心特点

当 FrontMatter 中指定 `type: "page"`（或 `layout: "page"`）时：

- **去除流水账痕迹**：头部不展示发布日期、阅读用时、文章字数等博客流水账徽章。
- **纯净版心阅读**：文章底部不展示上一篇/下一篇博客翻页卡片，保持页面独立完整。
- **内置原生高级组件**：支持原生渲染经历时间线（Timeline & Milestones）、关注领域（Focus Areas）与项目卡片。
- **支持完整功能**：依然享有 KaTeX 数学公式渲染、Prism 代码高亮、TOC 目录追踪与图片缩放。

## 知识共享许可协议

本站所有原创研究笔记与系统设计图纸，除特别注明外，均遵循 **CC BY-NC-SA 4.0** 国际知识共享许可协议。

## 引用规范示例

在学术论文、学位报告或技术文档中引用本站内容时，建议采用如下 BibTeX 格式：

```bibtex
@online{aurora_notes_2026,
  author = {CCC},
  title = {Aurora Notes: Computing Fundamentals and Systems Architecture},
  year = {2026},
  url = {https://github.com/flyingpig669/blog}
}
```
