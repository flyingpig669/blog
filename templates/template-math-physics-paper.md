---
title: "量子态演化与希尔伯特空间映射推导"
date: "2026-10-10"
category: "physics"
tags: ["physics", "quantum", "mathematics"]
excerpt: "严格遵循 KaTeX 兼容公理的高维复空间算符推导与密度矩阵演化笔记。"
tocLevels: [2, 3]
---

# 量子态演化与希尔伯特空间映射推导

本模板专门演示高密度数学与理论物理排版。Codex desktop 环境已禁用单美元符号，全站统一遵循双美元符号渲染公理。

## 狄拉克符号与态矢量表示

任意纯态量子态在复希尔伯特空间 $$\mathcal{H}$$ 中展开为标准正交基底矢量的线性叠加：

$$
\left| \psi \right\rangle = \sum_{k=0}^{2^n - 1} c_k \left| k \right\rangle, \quad c_k \in \mathbb{C}, \quad \sum_{k} |c_k|^2 = 1
$$

内积与外积算符采用转义圆括号或双美元符号书写：

$$
\left\langle \phi \mid \psi \right\rangle = \sum_{k} a_k^* b_k, \quad \hat{\rho} = \left| \psi \right\rangle \left\langle \psi \right|
$$

## 薛定谔演化方程与幺正变换

封闭量子系统的定态与含时演化受厄米算符哈密顿量控制：

$$
i \hbar \frac{d}{dt} \left| \psi(t) \right\rangle = \hat{H} \left| \psi(t) \right\rangle
$$

其解可表达为时间演化算符作用形式：

$$
\left| \psi(t) \right\rangle = \hat{U}(t) \left| \psi(0) \right\rangle = \exp\left(-\frac{i}{\hbar} \hat{H} t\right) \left| \psi(0) \right\rangle
$$

## 多行联立推导 (aligned 环境)

在独立的 `$$` 块内嵌套 `aligned` 环境进行等号对齐：

$$
\begin{aligned}
\text{Tr}(\hat{\rho}^2) &= \sum_{k} \lambda_k^2 \\
&\le \left( \sum_{k} \lambda_k \right)^2 \\
&= 1
\end{aligned}
$$

当且仅当系统处于纯态时等号成立。
