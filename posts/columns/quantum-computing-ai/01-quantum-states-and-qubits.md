---
title: "量子态叠加与希尔伯特空间：狄拉克符号、Bloch 球面与幺正变换"
date: "2026-10-07"
category: "quantum-ai"
column: "quantum-computing-ai"
order: 1
pinned: true
tags: ["量子物理", "希尔伯特空间", "狄拉克符号", "量子计算"]
---

在经典计算机中，信息以确定性的二进制比特（Bit）作为基元，每个比特在任意物理时刻非 $$0$$ 即 $$1$$。然而，在微观物理尺度下，量子力学为我们展开了一个由复向量空间统治的全新世界。

本讲将从现代数学物理视角出发，建立量子计算的核心数学公理体系，探讨态矢量、Bloch 球面几何、幺正演化算符与量子纠缠的本质。

---

## 1. 希尔伯特空间与量子态叠加原理

在量子力学哥本哈根诠释下，孤立量子系统的纯态由某个复内积空间——**希尔伯特空间（Hilbert Space）**中的单位射线来描述。对于单个两能级系统（量子比特 Qubit），其状态空间对应于二维复希尔伯特空间：

$$
mathcal{H}_2 cong mathbb{C}^2
$$

采用狄拉克（Dirac）符号，我们选取一组标准计算正交基：

$$
left| 0 ightangle = egin{pmatrix} 1 \ 0 end{pmatrix}, quad left| 1 ightangle = egin{pmatrix} 0 \ 1 end{pmatrix}
$$

:::note 态叠加原理公理
任意单量子比特的物理状态都可以表示为计算基态的线性叠加：
$$
left| psi ightangle = alpha left| 0 ightangle + eta left| 1 ightangle, quad alpha, eta in mathbb{C}
$$
其中，复概率幅满足正交归一化完备性条件：
$$
leftlangle psi middle| psi ightangle = |alpha|^2 + |eta|^2 = 1
$$
:::

根据玻恩定则（Born's Rule），当我们以计算基对状态 $$\left| \psi \right\rangle$$ 进行强投影测量时：
- 系统以几率 $$P(0) = |alpha|^2$$ 坍缩到基态 $$\left| 0 \right\rangle$$；
- 系统以几率 $$P(1) = |eta|^2$$ 坍缩到基态 $$\left| 1 \right\rangle$$。

---

## 2. Bloch 球面的几何参数化

由于全局相位因子对可观测量（期望值）不产生任何物理干涉效应，即状态 $$\left| \psi \right\rangle$$ 与 $$e^{igamma} \left| \psi \right\rangle$$ 在物理上不可区分。我们可以消去一个多余的自由度，将态矢量参数化为两球坐标角：

$$
left| psi ightangle = cosrac{	heta}{2} left| 0 ightangle + e^{iphi} sinrac{	heta}{2} left| 1 ightangle
$$

其中天顶角 $$\theta \in [0, \pi]$$，方位角 $$\phi \in [0, 2\pi)$$。

这在三维实空间中定义了一个半径为 1 的球面，即著名的 **Bloch 球面（Bloch Sphere）**：
- 北极点 ($$\theta = 0$$) 对应基态 $$\left| 0 \right\rangle$$；
- 南极点 ($$\theta = \pi$$) 对应基态 $$\left| 1 \right\rangle$$；
- 赤道平面 ($$\theta = \pi/2$$) 对应各种具有不同相位角的等几率最大叠加态。

Bloch 矢量的实空间笛卡尔坐标可以写为：

$$
egin{aligned}
x &= sin	heta cosphi \
y &= sin	heta sinphi \
z &= cos	heta
end{aligned}
$$

这一几何图像让量子态的演化直观化为单位球面上的连续三维旋转。

---

## 3. 幺正演化算符与基本量子门

量子力学第二公理指出：封闭量子系统在时空中的演化由幺正变换（Unitary Transformation）所支配。根据时间依赖的薛定谔方程：

$$
ihbar rac{partial}{partial t}left| psi(t) ightangle = H(t) left| psi(t) ightangle
$$

其解可表达为演化算符 $$\left| \psi(t) \right\rangle = U(t) \left| \psi(0) \right\rangle$$。算符 $$U$$ 必须满足幺正性：

$$
U^dagger U = U U^dagger = I
$$

幺正性保证了态矢量的内积保持不变，进而确保了测量几率守恒：$$\left\langle \psi(t) \middle| \psi(t) \right\rangle = 1$$。

### 3.1 泡利矩阵（Pauli Matrices）

泡利矩阵是描述自旋 1/2 系统和量子门运算的基石：

$$
sigma_x = X = egin{pmatrix} 0 & 1 \ 1 & 0 end{pmatrix}, quad
sigma_y = Y = egin{pmatrix} 0 & -i \ i & 0 end{pmatrix}, quad
sigma_z = Z = egin{pmatrix} 1 & 0 \ 0 & -1 end{pmatrix}
$$

- **Pauli-X 门**：相当于量子非门（NOT），实现基态翻转：$$X\left| 0 \right\rangle = \left| 1 \right\rangle$$, $$X\left| 1 \right\rangle = \left| 0 \right\rangle$$；
- **Pauli-Z 门**：相位翻转门：$$Z\left| 0 \right\rangle = \left| 0 \right\rangle$$, $$Z\left| 1 \right\rangle = -\left| 1 \right\rangle$$。

### 3.2 Hadamard 门：制造量子相干性

Hadamard 门 $$H$$ 是量子计算中最重要的门之一，它将确定的基态映射为等权重的相干叠加态：

$$
H = rac{1}{sqrt{2}} egin{pmatrix} 1 & 1 \ 1 & -1 end{pmatrix}
$$

作用在计算基态上的效果：

$$
egin{aligned}
Hleft| 0 ightangle &= rac{left| 0 ightangle + left| 1 ightangle}{sqrt{2}} = left| + ightangle \
Hleft| 1 ightangle &= rac{left| 0 ightangle - left| 1 ightangle}{sqrt{2}} = left| - ightangle
end{aligned}
$$

---

## 4. 复合系统与量子纠缠（Entanglement）

当两个量子比特组成复合系统时，其状态空间为各自希尔伯特空间的张量积（Tensor Product）：

$$
mathcal{H} = mathcal{H}_A otimes mathcal{H}_B cong mathbb{C}^4
$$

其计算基为 4 个四维列向量：$$\left| 00 \right\rangle, \left| 01 \right\rangle, \left| 10 \right\rangle, \left| 11 \right\rangle$$。

:::tip 什么是量子纠缠？
若复合系统的量子态 $$\left| \Psi_{AB} \right\rangle$$ **无法**分解为两个子系统状态的张量直积态：
$$
left| Psi_{AB} ightangle 
eq left| psi_A ightangle otimes left| psi_B ightangle
$$
则称该复合态处于**量子纠缠（Quantum Entanglement）**。
:::

### 4.1 贝尔态（Bell States / EPR 对）

利用一个 Hadamard 门与一个受控非门（CNOT），我们可以从 $$\left| 00 \right\rangle$$ 构造出最大纠缠态——第一贝尔态：

$$
left| Phi^+ ightangle = rac{left| 00 ightangle + left| 11 ightangle}{sqrt{2}}
$$

对其中任意一个粒子进行局部测量，另一个粒子将在超距空间上即时确定其状态，爱因斯坦曾称之为“幽灵般的超距作用（Spooky action at a distance）”。

### 4.2 量子不可克隆定理（No-Cloning Theorem）

在经典计算中，数据复制（如寄存器拷贝）是最平凡的操作。然而，基于量子力学态演化的线性公理，物理学家 Wootters、Zurek 与 Dieks 在 1982 年严格证明了：

**定理**：不存在任何物理幺正算符 $$U$$，能无条件复制任意未知量子态 $$\left| \psi \right\rangle$$。

假设存在此类算符，使得对于任意未知态 $$\left| \psi \right\rangle$$ 和 $$\left| phi \right\rangle$$：
$$
egin{aligned}
U(left| psi ightangle otimes left| 0 ightangle) &= left| psi ightangle otimes left| psi ightangle \
U(left| phi ightangle otimes left| 0 ightangle) &= left| phi ightangle otimes left| phi ightangle
end{aligned}
$$
由于幺正算符保持内积，计算两式的内积：
$$
leftlangle psi middle| phi ightangle = (leftlangle psi middle| phi ightangle)^2
$$
这要求 $$\left\langle \psi \middle| \phi \right\rangle$$ 只能为 0 或 1。这意味着只有正交态才可能被复制，通用的未知量子态克隆在物理法则上被彻底封死。这一特性成为了量子密码学（QKD）坚不可摧的安全基石。

---

## 5. 计算机仿真实战：用 Python 构建量子态演化

下面我们基于 Python 与线性代数库，构建一个轻量级态矢量仿真器，模拟 Hadamard 叠加与 Bell 态演化：

```python
import numpy as np

# 1. 定义基态与量子门
ket0 = np.array([[1], [0]], dtype=complex)
ket1 = np.array([[0], [1]], dtype=complex)

I = np.eye(2, dtype=complex)
X = np.array([[0, 1], [1, 0]], dtype=complex)
Z = np.array([[1, 0], [0, -1]], dtype=complex)
H = (1 / np.sqrt(2)) * np.array([[1, 1], [1, -1]], dtype=complex)

# CNOT 门 (两量子比特，控制位与受控位)
CNOT = np.array([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 1, 0]
], dtype=complex)

# 2. 构造单比特叠加态 |+>
psi_plus = H @ ket0
print("态矢量 |+>:")
print(np.round(psi_plus, 4))

# 3. 构造两比特初态 |00> = |0> ⊗ |0>
psi_00 = np.kron(ket0, ket0)

# 4. 作用 (H ⊗ I)，使第一个比特处于叠加态
psi_step1 = np.kron(H, I) @ psi_00

# 5. 作用 CNOT 门，生成最大纠缠贝尔态 |Φ+>
bell_state = CNOT @ psi_step1

print("\n生成的贝尔态 |Φ+>:")
print(np.round(bell_state, 4))

# 6. 计算各基态的投影测量几率
probs = np.abs(bell_state.flatten()) ** 2
print("\n投影到 (|00>, |01>, |10>, |11>) 的测量概率分布:")
print([f"{p:.2f}" for p in probs])
```

---

## 6. 小结与下一篇预告

通过严格的希尔伯特空间数学框架，我们厘清了量子态叠加与纠缠的本质。在下一篇中，我们将进入现代量子机器学习（QML）的核心腹地——探讨**变分量子线路（VQC）**、参数化哈密顿量，以及突破传统自动微分限制的 **Parameter-Shift 求导法则**。
