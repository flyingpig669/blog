---
title: "大模型系统化实战（一）：Prompt 提示词工程与上下文控制"
date: "2026-09-20"
category: "ai"
column: "llm-in-action"
order: 1
tags: [LLM, Prompt, 结构化输出]
---

## 导语：从随意对话到工程化 Prompt

大语言模型落地应用的第一步，是建立确定性、高复现率的提示工程规范。本文拆解 Few-shot 样本增强、思维链（Chain of Thought）与 JSON 模式强制约束。

::: tip 核心原则
将 LLM 视为不可靠的自然语言计算单元，通过严格的模式约束与结构化边界消除不确定性。
:::

### 思维链与模式约束
- **Few-shot Prompting**：提供正反例边界。
- **CoT 思维链**：引导模型输出推理中间步骤。
- **结构化输出**：使用 Pydantic 约束 JSON Schema。
