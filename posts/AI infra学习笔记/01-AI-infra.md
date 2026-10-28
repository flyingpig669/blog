---
title: "编程语言基础"
date: "2026-10-28"
tags: ["programming", "language", "基础","linux","Python","C","C++"]
column: "AI infra学习笔记"
columnSlug: "ai-infra-learning-notes"
columnName: "AI infra学习笔记"
columnDesc: "学习AI基础设施的基础知识。"
order: 1
excerpt: "编程语言基础学习过程中遇见的一些问题的记录。"
---

## Problem

### 1.进程，线程，协程什么区别
- 程序（Program）就是一组告诉计算机应该做什么的指令。程序本身是是静态的。
- 进程（Process）是程序的一次执行过程，在现代操作系统中，进程作为系统资源管理和隔离的主要边界，由操作系统管理调度。
- 线程（Thread）是进程的一个实体，是CPU调度和分派的基本单位，是比进程更小的能独立运行的基本单位，由操作系统管理调度。一个进程可以包含多个线程，它们共享进程的资源，但每个线程有自己的执行路径和栈空间。
- 协程（Coroutine）是一种用户态的轻量级线程，它可以在一个线程中实现多任务的切换和调度。协程通常由用户态的运行时或事件循环调度，切换点和调度策略由程序的执行机制决定，而不是由操作系统直接把协程当作独立的线程来调度。

### spwan,fork,join,wait,notify,notifyAll的区别
