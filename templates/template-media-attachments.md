---
title: "图片、下载与多媒体嵌入指南"
date: "2026-10-11"
category: "engineering"
tags: ["media", "images", "attachments"]
excerpt: "在正文中展示图片、提供文件下载、嵌入音视频的完整写法与全部边界情况。"
tocLevels: [2, 3]
---

# 图片、下载与多媒体嵌入指南

> **复制本模板前必读**：模板里引用的示例文件（`attachments/images/…`）**并不存在**。
> 直接把本文件拷进 `posts/` 会让构建报 `missing resource`。正确用法是：先把自己要用
> 的文件放进 `attachments/`，再把下面对应示例的路径换成你的真实文件。

## 一、文件放哪里（最重要的一条）

**所有静态资源一律放在 `attachments/` 目录下**，按类型建子目录：

```text
attachments/
├── images/       # 文章配图（png / jpg / webp / svg）
├── slides/       # PDF 演示文稿
├── media/        # 音视频（mp4 / mp3）
├── datasets/     # 数据集、压缩包
└── files/        # 其它任意下载文件
```

原因：线上发布的是**白名单目录**（`attachments/` `css/` `js/` `vendor/` `data/`），
不是整个仓库。图片如果放在文章旁边（如 `posts/pic.png`），本地预览一切正常，但
**线上必然 404**。构建期会拦截并提示：

```text
posts/xxx.md: resource posts/pic.png 不在发布白名单内（本地可见、线上 404）。
静态资源请放入 attachments/，见 templates/template-media-attachments.md
```

路径**相对站点根**书写（不是相对 md 文件），因为本站是 Hash 路由单页应用，
所有文章共用同一个物理页面。写 `attachments/images/foo.png` 即可，加不加 `./` 都一样。

## 二、展示图片

### 1. 基本写法（Markdown 语法）

```markdown
![实验装置照片](attachments/images/apparatus.png)
```

- **alt 文本必写**：它是图片加载失败时的回退文案，也是读屏器的无障碍描述。
- 单独成段 = 块级图片（自动等比缩放、圆角、1px 细边）；写在句子中间 = 行内小图。
- 图片**永不撑破正文列**：超过版心宽度会自动等比缩小，无需手动处理。

### 2. 控制显示尺寸

Markdown 原生语法不支持宽高，需要精确尺寸时用原生 HTML（会被安全过滤器保留）：

```html
<img src="attachments/images/wide-benchmark.png" width="480" alt="基准测试结果">
```

`width` / `height` 属性与安全的 `style`（如 `style="width:50%"`）均可使用；
即使指定了大于版心的宽度，也会被自动约束在正文列内。

### 3. 带题注的图片（figure）

```html
<figure>
  <img src="attachments/images/apparatus.png" alt="实验装置">
  <figcaption>图 1：三镜腔真空系统示意（2026-09 摄于实验室）</figcaption>
</figure>
```

`figcaption` 会自动渲染为居中的等宽小字。不想用 HTML 时，用一行斜体小字
跟在图片下方也是等价的习惯写法：

```markdown
![实验装置](attachments/images/apparatus.png)

*图 1：三镜腔真空系统示意。*
```

### 4. 缩略图链到原图

```markdown
[![缩略图](attachments/images/preview.png)](attachments/images/full.png)
```

点击后在**当前标签页**打开原图（本站暂无站内灯箱放大，读者用浏览器返回键回到文章）。

### 5. 外链图片（可以，但不推荐）

```markdown
![外链图](https://cdn.example.com/pic.png)
```

`http(s)://` 外链允许使用，但要知道风险：**外站防盗链或图床跑路时你的文章直接裂图**，
而且构建期无法校验远端文件是否存在。正式内容建议下载到 `attachments/images/` 本地化。

### 6. 明确不支持的写法

| 写法 | 结果 |
| :--- | :--- |
| `![x](data:image/png;base64,…)` | **被安全过滤器剥掉 src**，只剩空图 |
| `![x](javascript:…)` 之类协议 | 同上，直接拒绝 |
| `![x](file:///Users/…)` 本机绝对路径 | 拒绝（线上也根本访问不到） |

## 三、提供下载

### 1. 正文里的行内下载链接（Markdown 语法）

```markdown
完整数据集见 [experiment-data.zip (2.1 MB)](attachments/datasets/experiment-data.zip)，
复现脚本在 [run.sh (4 KB)](attachments/files/run.sh)。
```

- 链接指向的文件**必须真实存在**，写错路径构建直接失败（`missing resource`）。
- 建议在链接文本里**标注文件大小**，读者好决定要不要下。
- 行为由浏览器按文件类型决定：`.zip` / `.tar.gz` 等直接下载；`.pdf` / 图片会先在
  新标签页打开预览，读者再另存。

### 2. 文末自动下载区（FrontMatter 声明）

```yaml
---
title: "…"
attachments:
  - "attachments/datasets/experiment-data.zip"
  - "attachments/files/run.sh"
---
```

声明后文章末尾会自动渲染一个 **Attachments (N)** 卡片，每项带下载箭头图标和
`download` 属性（**强制下载**，不会先打开预览），展示文件名。

### 3. 两种方式怎么选

- 想让读者**在阅读流程中随手拿到**某个文件 → 正文行内链接；
- 文章的**配套材料打包**（数据 + 脚本 + 附录）→ FrontMatter `attachments` 集中放文末；
- 两者可以同时用，互不冲突。

### 4. 文件名建议

中文文件名**可用**（构建与线上都正常，浏览器自动处理编码），但正式发布建议
英文小写连字符（`experiment-data.zip`），与全站 slug 规范一致，也避免跨平台解压乱码。

## 四、音视频（原生 HTML 标签）

Markdown 没有音视频语法，直接写 HTML（过滤器会保留 `controls`）：

```html
<video src="attachments/media/demo.mp4" controls width="480"></video>

<audio src="attachments/media/episode-01.mp3" controls></audio>
```

- 注意体积：视频没有转码服务，放多大的文件读者就下多大的文件。建议压缩到
  **10 MB 以内**并压制到 720p；音频建议 32–64 kbps。
- 与图片一样：必须放在 `attachments/` 下，线上才有这个文件。

## 五、与其它嵌入能力的边界

这些能力各有专门模板，此处只给一句话索引，不重复展开：

| 需求 | 用法 | 详见 |
| :--- | :--- | :--- |
| PDF / PPT 演示文稿播放器 | FrontMatter `slide:`（挂文首）或正文 `::: slide 路径`（挂所写处）；两处同写时以 FrontMatter 为准、同文件去重 | `templates/template-slide-presentation.md` |
| 数学公式 / 代码高亮 / Callout | `$$…$$`、围栏代码块、`::: tip` | `templates/template-standard-post.md` |
| 站内互链 | `[[slug]]` 双链或相对 `.md` 链接 | `templates/template-collection.md` |
| 论著列表（含 pdf 徽章） | 结构化页 `publications` 区块 | `templates/template-publications-page.md` |

## 六、改动后如何验证

```bash
./check.sh    # 校验所有引用的图片/文件真实存在且在发布白名单内
```

注意：本地 `python3 server.py` 的**实时重建只做同步、不做校验**——坏路径在浏览器里
是静默 404，只有 `./check.sh` 会报。发布前（`./deploy.sh`）会自动跑一遍校验。
