---
title: "大模型系统化实战（二）：RAG 检索增强与向量召回生产指南"
date: 2026-09-24
category: ai
column: llm-in-action
order: 2
tags: [LLM, RAG, 向量检索, KaTeX, Python]
pinned: true
coverGradient: "from-purple-600 to-indigo-600"
excerpt: "详细剖析企业级 RAG 检索增强生成的完整落地链路，涵盖语义分块、Embedding 向量化、混合检索、重排（Rerank）与上下文压缩，并附上核心注意力机制与相似度数学公式推导。"
---

## 为什么需要 RAG？

大语言模型（LLM）虽然拥有庞大的通用世界知识，但在垂直业务落地时常常面临三大致命痛点：幻觉问题、私有知识黑盒与时效性滞后。

**RAG（Retrieval-Augmented Generation）**通过动态检索相关知识并注入上下文，赋予了模型实时、精准且可溯源的专业回答能力。

---

## 核心数学原理推导

### 1. 自注意力机制（Self-Attention）

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$

其中，缩放因子 $$\sqrt{d_k}$$ 防止点积数值过大导致 Softmax 梯度饱和。

### 2. 向量相似度度量（余弦相似度）

$$
\text{CosineSimilarity}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2} = \frac{\sum_{i=1}^n u_i v_i}{\sqrt{\sum_{i=1}^n u_i^2} \sqrt{\sum_{i=1}^n v_i^2}}
$$

### 3. 微调优化目标（交叉熵损失）

$$
\mathcal{L}_{\text{SFT}} = - \frac{1}{N} \sum_{t=1}^N \log P(y_t \mid y_{<t}, x)
$$

---

## Python 核心检索代码实现

```python
import numpy as np

class HybridRAGRetriever:
    def __init__(self, embed_dim: int = 1536):
        self.docs = []
        self.vectors = np.zeros((0, embed_dim))
        
    def retrieve(self, query_vec: np.ndarray, top_k: int = 5):
        norm_q = query_vec / (np.linalg.norm(query_vec) + 1e-9)
        norm_d = self.vectors / (np.linalg.norm(self.vectors, axis=1, keepdims=True) + 1e-9)
        scores = np.dot(norm_d, norm_q)
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(self.docs[i], float(scores[i])) for i in top_indices]
```

::: tip 生产实践建议
对于工业级复杂查询，推荐使用 **Dense 向量检索 + BM25 稀疏索引** 的混合检索，并通过 Reranker 进一步精排。
:::
