---
title: "量子机器学习（QML）：变分量子线路（VQC）与参数化哈密顿量优化"
date: "2026-10-07"
category: "quantum-ai"
column: "quantum-computing-ai"
order: 2
pinned: false
tags: ["量子机器学习", "QML", "变分量子线路", "Parameter-Shift"]
---

在含噪声中等规模量子（NISQ, Noisy Intermediate-Scale Quantum）时代，由于容错量子纠错码所需物理比特数过高，通用的容错量子计算算法（如 Shor 算法、Grover 算法）仍处于实验攻关阶段。

在此背景下，融合了经典优化器与量子处理单元（QPU）的**量子经典混合计算（Hybrid Quantum-Classical Computing）**范式异军突起。其中最具工业落地潜力与理论深度的分支，便是**变分量子线路（Variational Quantum Circuit, VQC）**与**量子神经网络（Quantum Neural Networks, QNN）**。

---

## 1. VQC 的核心拓扑架构

一个标准的变分量子机器学习模型通常由三大核心环节串联而成：

1. **量子数据嵌入（Feature Map / Quantum State Preparation）**：将经典多维特征向量映射入高维复希尔伯特空间；
2. **参数化变分线路（Ansatz / Parameterized Quantum Circuit, PQC）**：具有可训练连续参数 $$\vec{\theta}$$ 的多体纠缠量子门阵列；
3. **哈密顿量测量与经典优化（Measurement & Classical Optimizer）**：计算物理可观测量算符的期望值，并经经典梯度下降反向调节参数。

整个计算图的数据流动展现为精巧的闭环：

$$
\left| 0^{\otimes n} \right\rangle \xrightarrow{U_{\Phi}(\mathbf{x})} \left| \Phi(\mathbf{x}) \right\rangle \xrightarrow{U(\vec{\theta})} \left| \psi(\vec{\theta}, \mathbf{x}) \right\rangle \xrightarrow{\langle H \rangle} \mathcal{L}(\vec{\theta}) \xrightarrow[\text{经典更新}]{\nabla_{\vec{\theta}}} \vec{\theta}'
$$

---

## 2. 量子高维嵌入与核技巧（Quantum Kernel Trick）

如何将经典实向量 $$\mathbf{x} \in \mathbb{R}^d$$ 编码为量子态？最经典的方案是**角度编码（Angle Embedding）**与**哈密顿量演化编码**。

以单比特泡利旋转门为例：

$$
R_y(x) = \exp\left(-i \frac{x}{2} \sigma_y\right) = \begin{pmatrix} \cos\frac{x}{2} & -\sin\frac{x}{2} \\ \sin\frac{x}{2} & \cos\frac{x}{2} \end{pmatrix}
$$

将 $$\left| 0^{\otimes n} \right\rangle$$ 经由特征映射算符 $$U_\Phi(\mathbf{x})$$ 演化后得到高维量子态矢量：

$$
\left| \Phi(\mathbf{x}) \right\rangle = U_\Phi(\mathbf{x}) \left| 0^{\otimes n} \right\rangle
$$

:::tip 量子核函数等价性
两个数据点 $$\mathbf{x}_i$$ 与 $$\mathbf{x}_j$$ 在希尔伯特空间中的内积保真度：
$$
k(\mathbf{x}_i, \mathbf{x}_j) = \left| \left\langle \Phi(\mathbf{x}_i) \middle| \Phi(\mathbf{x}_j) \right\rangle \right|^2
$$
直接构成了再生核希尔伯特空间（RKHS）上的有效正定核！这证明了变分量子神经网络在高维特征投影能力上原生超越了经典高斯核 SVM。
:::

---

## 3. 目标函数与哈密顿量期望值

在变分量子算法中，待求解问题的损失函数被编码为系统哈密顿量算符 $$H$$ 在输出态下的能量期望值：

$$
\mathcal{L}(\vec{\theta}) = \left\langle \psi(\vec{\theta}) \right| H \left| \psi(\vec{\theta}) \right\rangle
$$

其中目标哈密顿量 $$H$$ 通常表示为若干泡利算符张量积（Pauli String）的实系数线性组合：

$$
H = \sum_j c_j P_j, \quad P_j \in \{I, X, Y, Z\}^{\otimes n}
$$

系统输出态为：

$$
\left| \psi(\vec{\theta}) \right\rangle = U(\vec{\theta}) \left| \Phi(\mathbf{x}) \right\rangle = \left(\prod_{l=1}^L U_l(\theta_l) W_l\right) \left| \Phi(\mathbf{x}) \right\rangle
$$

这里 $$W_l$$ 为固定不含参的纠缠门（如 CNOT / CZ），而 $$U_l(\theta_l)$$ 为参数化单比特旋转门。

---

## 4. 量子求导突破：Parameter-Shift Rule

在经典深度学习中，反向传播（Backpropagation）依赖于保存每一层的前向激活张量并在计算图上反向链式求导。

然而，**在真实物理量子芯片上，直接反向传播彻底失效**：
- 依据量子测量公理，测量会导致波函数即时坍缩，不可逆转；
- 不可克隆定理禁止我们在前向传播时无损拷贝中间量子态。

物理学家 Mitarai 与 Schuld 等人推导出了革命性的**参数平移法则（Parameter-Shift Rule）**，实现了在真实物理硬件上精确计算解析梯度的壮举。

### 4.1 数学推导过程

考虑参数化量子旋转门具备如下生成元形式：

$$
U_k(\theta_k) = \exp\left(-i \frac{\theta_k}{2} G\right)
$$

其中 $$G$$ 为本征值仅为 $$\pm 1$$ 的埃尔米特算符（如任意泡利矩阵 $$X, Y, Z$$）。

利用欧拉展开式：

$$
U_k(\theta_k) = \cos\frac{\theta_k}{2} I - i \sin\frac{\theta_k}{2} G
$$

将期望值函数关于单个标量参数 $$\theta_k$$ 的依赖显式写出：

$$
E(\theta_k) = \left\langle \psi_0 \right| U_k^\dagger(\theta_k) M U_k(\theta_k) \left| \psi_0 \right\rangle
$$

展开并利用三角恒等式可严密证明，能量对参数 $$\theta_k$$ 的一阶偏导数满足如下闭式解：

$$
\begin{aligned}
\frac{\partial \mathcal{L}}{\partial \theta_k} &= \frac{\mathcal{L}\left(\theta_k + \frac{\pi}{2}\right) - \mathcal{L}\left(\theta_k - \frac{\pi}{2}\right)}{2}
\end{aligned}
$$

:::note 参数平移法则的优越性
注意：公式中的位移量是宏观的 $$\frac{\pi}{2}$$（90度旋转），**绝非**经典数值微积分中的微小差分 $$\epsilon \to 0$$！
这意味着我们在真实含噪声物理量子芯片上执行两次独立前向电路测量，即可得到无截断误差的真实**解析偏导数**，彻底规避了噪声扰动带来的数值不稳定性。
:::

---

## 5. 理论瓶颈：量子贫瘠高原（Barren Plateaus）

随着量子位数量的增加，VQC 面临着严重的梯度消失危机——**贫瘠高原现象（Barren Plateaus）**。

McClean 等人在 2018 年严格证明：当随机构造的参数化量子线路具有足够的表达能力（构成 Haar 随机酉群的 2-设计）时，对于大尺度多比特系统：

$$
\mathbb{E}\left[\frac{\partial \mathcal{L}}{\partial \theta_k}\right] = 0
$$

且梯度的方差随着量子比特数 $$n$$ 呈指数级衰减：

$$
\operatorname{Var}\left[\frac{\partial \mathcal{L}}{\partial \theta_k}\right] \in \mathcal{O}\left(\frac{1}{2^n}\right)
$$

这意味着如果盲目使用全局深层随机线路，当量子比特从 10 扩展到 50 时，梯度信号将衰减到物理测量噪声基底以下数万倍，模型将陷入彻底无法学习的“量子死寂”。

**现代学术界破解策略：**
1. **浅层交替线路设计（Local Cost Functions）**：使用局部单比特/双比特哈密顿量测量代替全系统全局测量；
2. **几何量子力学与等变性（Equivariant QNN）**：利用问题本身的物理对称群约束变分线路拓扑；
3. **量子前向初始化策略（Identity Initialization）**：在训练初期初始化为近恒等映射，抑制高维随机扩散。

---

## 6. Python 端到端实战：实现参数平移梯度优化

下面我们编写一个完整的 Python 纯数学实现，演示双量子比特变分分类器的参数平移梯度更新：

```python
import numpy as np

# 基础旋转门与 Pauli-Z 算符
def ry(theta):
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.array([[c, -s], [s, c]], dtype=complex)

def rz(phi):
    return np.array([[np.exp(-1j * phi / 2), 0],
                     [0, np.exp(1j * phi / 2)]], dtype=complex)

CNOT = np.array([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 1, 0]
], dtype=complex)

# 观测哈密顿量: H = Z ⊗ Z
Z = np.array([[1, 0], [0, -1]], dtype=complex)
H_obs = np.kron(Z, Z)

def quantum_circuit(params, x):
    # 1. 经典输入编码: R_y(x)
    enc = np.kron(ry(x[0]), ry(x[1]))
    state = enc @ np.array([[1], [0], [0], [0]], dtype=complex)
    
    # 2. 参数化线路 Ansatz: R_y(theta1) ⊗ R_z(theta2) -> CNOT -> R_y(theta3) ⊗ I
    rot1 = np.kron(ry(params[0]), rz(params[1]))
    state = rot1 @ state
    state = CNOT @ state
    rot2 = np.kron(ry(params[2]), np.eye(2, dtype=complex))
    state = rot2 @ state
    
    # 3. 计算哈密顿量期望值: <ψ| H |ψ>
    exp_val = np.real((state.conj().T @ H_obs @ state)[0, 0])
    return exp_val

def compute_parameter_shift_gradient(params, x):
    grad = np.zeros_like(params)
    shift = np.pi / 2
    for i in range(len(params)):
        params_plus = np.copy(params)
        params_minus = np.copy(params)
        params_plus[i] += shift
        params_minus[i] -= shift
        
        # 严格执行参数平移求导公式
        e_plus = quantum_circuit(params_plus, x)
        e_minus = quantum_circuit(params_minus, x)
        grad[i] = (e_plus - e_minus) / 2.0
    return grad

# 初始化变分参数与训练样本
np.random.seed(42)
params = np.random.uniform(0, 2 * np.pi, size=3)
sample_x = np.array([0.5, 1.2])
learning_rate = 0.1

print(f"初始参数: {np.round(params, 4)}")
print(f"初始能量期望值: {quantum_circuit(params, sample_x):.4f}")

# 执行 10 步梯度下降优化
for step in range(1, 11):
    grad = compute_parameter_shift_gradient(params, sample_x)
    params -= learning_rate * grad
    energy = quantum_circuit(params, sample_x)
    print(f"Step {step:02d} | 能量期望值: {energy:.4f} | 梯度范数: {np.linalg.norm(grad):.4f}")

print(f"\n优化完成！终态能量期望值: {quantum_circuit(params, sample_x):.4f}")
```

---

## 7. 结语

变分量子线路在数学本质上是将经典优化的能量流注入到了复希尔伯特流形中。在下一篇终局之战中，我们将连接更广阔的物理疆域——探讨**统计物理配分函数、冯·诺依曼信息熵与大语言模型注意力机制的终极数学同构**！

