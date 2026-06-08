---
title: 仿真实验日志应该记录什么
date: 2026-04-30
readTime: 5 分钟
category: 研究日志
series: 研究写作系统
seriesOrder: 2
tags: [研究日志, 工程, 可复现]
cover: attachments/cover.png
excerpt: 参数、随机种子、环境和失败结果都值得记录，因为复现实验时最缺的往往就是这些细节。
---

一个仿真实验不应该只留下最终图像。真正有用的日志会记录模型假设、参数表、数据来源、版本号，以及失败的中间尝试。

```yaml
experiment: poisson_2d
mesh: 512x512
solver: conjugate-gradient
seed: 20260608
tolerance: 1.0e-8
```

这些信息看起来琐碎，但当你两个月后想复现一张图时，它们会变成最可靠的路标。
