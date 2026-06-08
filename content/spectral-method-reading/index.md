---
title: 谱方法阅读札记
date: 2026-05-16
readTime: 4 分钟
category: 数学札记
series: PDE 数值方法
seriesOrder: 1
tags: [数学, PDE, 谱方法]
cover: attachments/cover.png
excerpt: 谱方法的吸引力在于它把光滑性转化为收敛速度，也把边界条件处理变成细致的数学工程。
---

当解足够光滑时，谱方法可以用相对少的自由度得到很高精度。它的核心直觉，是把函数投影到一组全局基函数上。

$$
u_N(x)=\sum_{k=0}^{N} \hat u_k \phi_k(x)
$$

这种表达非常优雅，但数值实现里仍然要小心 aliasing、边界条件和矩阵条件数。漂亮的理论到了代码里，总会有一点摩擦。
