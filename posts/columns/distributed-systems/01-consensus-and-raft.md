---
title: "分布式共识工程（一）：Paxos、Raft 机制与集群容灾"
date: 2026-09-18
category: backend
column: distributed-systems
order: 1
tags: [分布式, Raft, 高可用, Go, 系统设计]
pinned: false
coverGradient: "from-emerald-600 to-teal-500"
excerpt: "分布式环境下的网络分区、节点崩溃与乱序消息是系统工程的永恒挑战。本文深入剖析 Raft 算法的 Leader 选举、日志复制机制与安全性不变量，探讨高可用架构落地。"
---

## 引言：分布式共识为什么困难？

在单机系统中，状态更新由内存锁或操作系统原语保证唯一性。然而在跨机房、多节点的分布式拓扑中，我们必须面对 FLP 不可能性定理与 CAP 权衡。

---

## Raft 的三位一体状态机

1. **Leader 选举（Leader Election）**：当心跳超时时竞选新 Leader。
2. **日志复制（Log Replication）**：多数派确认后 Commit。
3. **安全性约束（Safety）**：确保已 Commit 的日志不丢失。

::: note 核心不变量
若日志条目在任期 $$T$$ 中被某个 Leader 提交，则该条目在未来任意更高任期 $$T' > T$$ 的 Leader 日志中必然存在且位置不变。
:::

```go
package main
import "fmt"
type NodeRole int
const (
    Follower NodeRole = iota
    Candidate
    Leader
)
func main() {
    fmt.Println("Raft consensus node initialized.")
}
```
