---
title: "在这里填写数学或物理笔记标题"
tags: ["数学", "物理"]
excerpt: "说明推导的目标、假设与主要结论。"
tocLevels: [2, 3]
---

<!-- 使用：复制到 posts/my-derivation.md，替换正文中的推导。
     行内用 \( ... \) 或同行 $$...$$，不使用单美元符号。
     块公式的 $$ 独占一行，并在整个公式块前后留空行。
     狄拉克符号使用 \left| ... \right\rangle，不用 \ket 或 \bra。 -->

## 问题与符号约定

在复希尔伯特空间 \(\mathcal{H}\) 中，设态矢量已归一化：

$$
\left| \psi \right\rangle = \sum_k c_k \left| k \right\rangle,
\qquad \sum_k |c_k|^2 = 1
$$

## 推导过程

多行等式使用 `aligned`，不要使用 `align`：

$$
\begin{aligned}
\hat{\rho} &= \left| \psi \right\rangle \left\langle \psi \right| \\
\operatorname{Tr}(\hat{\rho}) &= 1
\end{aligned}
$$

## 结论与适用范围

解释结论依赖哪些假设，以及如何检查极限情形。

::: note 检查步骤
核对量纲、符号定义与归一化条件。
:::
