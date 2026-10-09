---
title: "量子态矢量模拟引擎设计"
date: "2026-10-09"
category: "physics"
tags: ["quantum", "systems", "test"]
slide: "attachments/slides/quantum-computing-slides.pdf"
excerpt: "基于高维复希尔伯特空间演化的轻量级量子计算仿真核心架构，附带演讲幻灯片展示。"
---

# 量子态矢量模拟引擎设计

本项目是一个基于 Python/NumPy 构建的高性能量子态矢量演化仿真器，支持参数化变分量子电路（VQC）与 Bloch 球面状态投影。

## 幻灯片演示 (Slide Presentation)

以下是该项目的学术汇报 PPT 演示幻灯片：

::: slide attachments/slides/quantum-computing-slides.pdf 量子计算与态矢量演化汇报 PPT 演示
:::

## 态矢量数学表示

任意单量子比特纯态可以表示为二维复希尔伯特空间中的单位向量：

$$
\left| \psi \right\rangle = \alpha \left| 0 \right\rangle + \beta \left| 1 \right\rangle, \quad |\alpha|^2 + |\beta|^2 = 1
$$
