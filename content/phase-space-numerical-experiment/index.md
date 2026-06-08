---
title: 从相空间看一个数值实验
date: 2026-06-08
readTime: 7 分钟
category: 计算物理
series: 结构保持算法
seriesOrder: 1
tags: [计算物理, 数值方法, Hamiltonian,test]
cover: attachments/cover.png
excerpt: 用辛积分保持 Hamiltonian 系统的几何结构，比单纯追求局部误差更接近物理问题本身。
---

计算物理里，数值方法不只是把方程离散化。对 Hamiltonian 系统来说，算法是否保留相空间结构，会直接影响长时间模拟的可信度。

$$
\dot q = \frac{\partial H}{\partial p},\qquad \dot p = -\frac{\partial H}{\partial q}
$$

如果我们只看短时间误差，普通 Runge-Kutta 可能表现很好；但在长时间轨道上，能量漂移和辛结构破坏会逐渐变成真正的问题。

![相空间轨道示意图](attachments/cover.png)

> 对物理系统而言，一个好算法应该尊重方程背后的结构。
