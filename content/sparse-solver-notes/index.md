---
title: 稀疏矩阵求解器的工程笔记
date: 2026-05-28
readTime: 6 分钟
categories: [高性能计算, 数值方法]
series: 科学计算工程
seriesOrder: 1
tags: [高性能计算, 线性代数, 工程]
cover: attachments/cover.png
excerpt: 从离散 PDE 到大规模仿真，稀疏线性系统的性能往往决定整个实验能不能跑得动。
---

很多物理仿真最后都会落到线性系统 \(Ax=b\)。矩阵很大、很稀疏，真正的瓶颈常常不是公式，而是存储格式、缓存局部性和预条件器。

$$
A \in \mathbb{R}^{n\times n},\qquad \operatorname{nnz}(A) \ll n^2
$$

```python
for k in range(max_iter):
    r = b - A @ x
    z = M_inv @ r
    alpha = (r @ z) / (p @ (A @ p))
    x = x + alpha * p
```

## 实现比符号更具体

同一个迭代公式，在不同数据布局下可能有完全不同的吞吐。把数学对象落到内存和硬件上，是计算研究里很有意思的一步。
