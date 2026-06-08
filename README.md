# Phase Space Notes 使用说明

这是一个面向计算机、物理、数学研究笔记的静态博客。它适合写计算物理、数值分析、PDE、科学计算工程、论文阅读和实验日志。

## 功能总览

- Markdown 文章：每篇文章用一个 `index.md` 编写。
- 独立附件文件夹：每篇文章有自己的 `attachments/`，方便放图片、PDF、数据和实验输出。
- 自动内容管理：运行 `node scripts/generate-manifest.mjs` 自动扫描文章并生成 `content/manifest.json`。
- 数学公式：支持行内公式 `\( ... \)` 和块级公式 `$$ ... $$`。
- 图片显示：支持 Markdown 图片语法，推荐引用本篇 `attachments/` 里的图片。
- 代码块：支持 fenced code block，并接入 Prism 语法高亮。
- 表格：支持基础 Markdown 表格。
- 链接：支持 Markdown 链接。
- 脚注：支持 `[^id]` 和 `[^id]: 内容`。
- 任务列表：支持 `- [ ]` 和 `- [x]`。
- 分类：支持单分类 `category` 和多分类 `categories`。
- 标签：支持 `tags`。
- 专栏/系列：支持 `series` 和 `seriesOrder`。
- 独立文章：不写 `series` 就是独立文章。
- 全文搜索：搜索标题、摘要、分类、专栏、标签和正文内容。
- 文章目录：文章详情页会根据 `##`、`###` 自动生成目录。
- 附件列表：文章详情页会列出该文章文件夹下的附件。
- 研究字段：支持 `paper`、`repo`、`dataset`、`status`。
- 专栏页面：同一 `series` 的文章会组成专栏页。
- 本地导入预览：支持临时导入本地 Markdown 或笔记文件夹，但公开站点默认隐藏这个工具。
- Git 回滚：项目已经初始化 Git，方便回到历史版本。

## 顶部导航

- `文章`：回到首页文章列表。
- `专栏`：进入全部专栏页面，列出所有 `series`。
- `关于`：显示研究方向和站点简介。
- `说明`：显示站内使用说明。
- `联系`：显示站内联系页面。页面中的邮箱、GitHub 等信息可以在 `scripts.js` 的 `renderContact()` 里替换。

## 运行公开博客

只看公开博客，可以运行静态服务：

```bash
python3 -m http.server 4173
```

浏览器打开：

```text
http://localhost:4173
```

如果你的机器有 `npm`，也可以用：

```bash
npm run serve
```

注意：静态服务只能浏览博客，不能使用登录、在线写作和保存 API。

## 运行写作后台

后台需要 Node 服务，而不是 Python 静态服务。

```bash
node server.mjs
```

如果终端提示找不到 `node`，运行这个脚本：

```bash
./scripts/run-server.sh
```

它会自动寻找常见 Node 路径，包括 Codex 内置 Node：

```text
/Applications/Codex.app/Contents/Resources/node
```

启动前会先运行：

```bash
node scripts/generate-manifest.mjs
```

这样新增或修改文章后，`content/manifest.json` 会先刷新，再启动后台服务。

也可以手动指定 Node 路径：

```bash
NODE=/Applications/Codex.app/Contents/Resources/node ./scripts/run-server.sh
```

如果 `4173` 端口已经被 Python 静态服务占用，可以先停止原来的服务，或者临时换端口：

```bash
BLOG_PORT=4180 ./scripts/run-server.sh
```

然后访问：

```text
http://localhost:4180/admin
```

### 局域网或全局监听

默认后台只监听本机 `127.0.0.1`。如果想让同一局域网里的手机、平板或另一台电脑访问，可以用 `BLOG_HOST=0.0.0.0` 启动：

```bash
BLOG_HOST=0.0.0.0 ./scripts/run-server.sh
```

也可以同时指定端口：

```bash
BLOG_HOST=0.0.0.0 BLOG_PORT=4173 ./scripts/run-server.sh
```

其他设备访问：

```text
http://你的电脑IP:4173
http://你的电脑IP:4173/admin
```

Mac 查看本机局域网 IP：

```bash
ipconfig getifaddr en0
```

监听 `0.0.0.0` 会把服务暴露给局域网或公网。启动前一定要换掉默认后台密码和 session secret：

```bash
BLOG_HOST=0.0.0.0 \
BLOG_PORT=4173 \
BLOG_ADMIN_PASSWORD='换成强密码' \
BLOG_SESSION_SECRET="$(openssl rand -hex 32)" \
./scripts/run-server.sh
```

如果仍使用默认密码或默认 session secret，服务会拒绝在 `0.0.0.0` 下启动。公网正式上线更推荐保持 `BLOG_HOST=127.0.0.1`，再用 Nginx 反向代理到外部域名。

如果你的机器有 `npm`，也可以用：

```bash
npm run server
```

然后访问：

```text
http://localhost:4173/admin
```

不要用 `http://localhost:4173/admin.html` 作为正式后台入口。虽然它能加载页面文件，但如果当前端口跑的是 Python 静态服务，`/api/session`、`/api/login`、`/api/notes` 都不存在，后台无法登录和保存。

## .env 配置

复制示例配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
BLOG_PORT=4173
BLOG_HOST=127.0.0.1
BLOG_ADMIN_USER=admin
BLOG_ADMIN_PASSWORD=change-this-password
BLOG_SESSION_SECRET=change-this-long-random-secret
BLOG_SITE_ORIGIN=http://localhost:4173
BLOG_MAX_JSON_BYTES=12582912
BLOG_MAX_UPLOAD_BYTES=8388608
```

字段说明：

- `BLOG_PORT`：服务端口。
- `BLOG_HOST`：监听地址。默认 `127.0.0.1` 只允许本机访问；多端访问可设为 `0.0.0.0`。
- `BLOG_ADMIN_USER`：后台登录账号。
- `BLOG_ADMIN_PASSWORD`：后台登录密码。
- `BLOG_SESSION_SECRET`：登录 cookie 签名密钥，建议设置成长随机字符串。
- `BLOG_SITE_ORIGIN`：公网访问来源。使用 Lucky、Nginx、Cloudflare Tunnel 等反向代理时，填外部访问地址，例如 `https://blog.example.com`。
- `BLOG_MAX_JSON_BYTES`：API 请求体最大字节数。
- `BLOG_MAX_UPLOAD_BYTES`：单个附件最大字节数。

`.env` 已经在 `.gitignore` 中，不会提交到 GitHub。

### Lucky 反向代理说明

如果通过 Lucky 把公网域名反代到本机后台，建议 `.env` 使用：

```env
BLOG_HOST=127.0.0.1
BLOG_PORT=4173
BLOG_SITE_ORIGIN=https://你的域名
```

Lucky 反代目标填：

```text
http://127.0.0.1:4173
```

后台入口使用：

```text
https://你的域名/admin
```

如果保存、上传或登录时报 `Forbidden`，通常是浏览器请求来源和后台判断的来源不一致。优先确认：

- `BLOG_SITE_ORIGIN` 是否和浏览器地址栏的协议、域名、端口一致。
- Lucky 是否转发了原始 `Host`。
- Lucky 是否设置或保留了 `X-Forwarded-Proto` 和 `X-Forwarded-Host`。

使用 HTTPS 域名访问时，`BLOG_SITE_ORIGIN` 必须写 `https://...`，不要写内网的 `http://127.0.0.1:4173`。

## 从 Git clone 到上线

下面以一台 Linux 服务器为例，说明从拉取代码到公开访问的完整流程。博客本身没有第三方 npm 依赖，只需要 Git、Node.js 和一个反向代理，例如 Nginx。

### 1. 准备服务器环境

在 Ubuntu/Debian 服务器上安装基础工具：

```bash
sudo apt update
sudo apt install -y git nodejs nginx
```

确认 Node.js 可用：

```bash
node -v
```

如果服务器系统源里的 Node.js 太旧，可以用 NodeSource、nvm 或云服务商提供的 Node.js 运行时安装新版 Node.js。

### 2. 拉取项目

进入准备存放网站的目录，然后 clone 仓库：

```bash
sudo mkdir -p /var/www/phase-space-notes
sudo chown -R $USER:$USER /var/www/phase-space-notes
git clone git@github.com:flyingpig669/blog.git /var/www/phase-space-notes
cd /var/www/phase-space-notes
```

如果服务器还没有配置 GitHub SSH key，也可以使用 HTTPS 地址：

```bash
git clone https://github.com/flyingpig669/blog.git /var/www/phase-space-notes
```

### 3. 配置生产环境变量

复制示例配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```bash
nano .env
```

公网部署时建议至少修改这些字段：

```env
BLOG_PORT=4173
BLOG_HOST=127.0.0.1
BLOG_ADMIN_USER=admin
BLOG_ADMIN_PASSWORD=换成强密码
BLOG_SESSION_SECRET=换成长随机字符串
BLOG_SITE_ORIGIN=https://你的域名
```

说明：

- `BLOG_HOST=127.0.0.1` 表示 Node 服务只给本机访问，外部用户通过 Nginx 访问，更安全。
- `BLOG_ADMIN_PASSWORD` 不要使用默认值。
- `BLOG_SESSION_SECRET` 可以用下面命令生成：

```bash
openssl rand -hex 32
```

### 4. 生成文章索引并本机试跑

生成 `content/manifest.json`：

```bash
node scripts/generate-manifest.mjs
```

启动服务测试：

```bash
node server.mjs
```

另开一个终端检查：

```bash
curl http://127.0.0.1:4173
curl http://127.0.0.1:4173/admin
```

如果能返回页面内容，按 `Ctrl+C` 停止临时服务，继续配置常驻运行。

### 5. 用 systemd 常驻运行

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/phase-space-notes.service
```

写入以下内容，并把 `User` 和路径改成你的服务器实际值：

```ini
[Unit]
Description=Phase Space Notes
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/phase-space-notes
ExecStart=/usr/bin/node /var/www/phase-space-notes/server.mjs
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable phase-space-notes
sudo systemctl start phase-space-notes
sudo systemctl status phase-space-notes
```

查看日志：

```bash
journalctl -u phase-space-notes -f
```

### 6. 用 Nginx 绑定域名

创建 Nginx 配置：

```bash
sudo nano /etc/nginx/sites-available/phase-space-notes
```

写入：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

把 `example.com` 换成你的域名。启用配置并重载 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/phase-space-notes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

这时访问：

```text
http://example.com
http://example.com/admin
```

### 7. 配置 HTTPS

如果域名已经解析到服务器，可以用 Certbot 配置免费 HTTPS：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

完成后把 `.env` 里的来源改成 HTTPS：

```env
BLOG_SITE_ORIGIN=https://example.com
```

然后重启服务：

```bash
sudo systemctl restart phase-space-notes
```

### 8. 后续更新上线

每次在服务器上拉取新内容或新代码后，按这个顺序更新：

```bash
cd /var/www/phase-space-notes
git pull
node scripts/generate-manifest.mjs
sudo systemctl restart phase-space-notes
```

如果是在后台 `/admin` 写文章，保存时会自动刷新 `content/manifest.json`。写完后建议提交到 Git，方便备份和回滚：

```bash
git status
git add content/ content/manifest.json
git commit -m "Add new note"
git push
```

### 9. 只发布静态博客的选择

如果你不需要公网写作后台，只想展示文章，可以把这些文件部署到 GitHub Pages、Netlify、Vercel 或任意静态空间：

```text
index.html
styles.css
scripts.js
assets/
content/
```

静态部署前记得生成索引：

```bash
node scripts/generate-manifest.mjs
```

静态部署只能浏览博客，不能使用登录、在线写作、保存文章和上传附件功能。

## 在线写作后台

后台功能：

- 登录后才能访问保存接口。
- 提供固定写作模板字段。
- 自动生成 Markdown front matter。
- 分类、标签支持逗号分隔。
- 专栏字段为空时就是独立文章。
- 专栏字段有值时才写入 `series` 和 `seriesOrder`。
- 正文 Markdown 支持实时预览。
- 可以在后台上传附件到当前文章的 `attachments/` 文件夹。
- 上传附件后会返回 `attachments/文件名`，可直接复制进正文、封面或 dataset 字段。
- 保存后自动写入 `content/<slug>/index.md`。
- 保存后自动刷新 `content/manifest.json`。

多端同步说明：

- 只要多台设备访问同一个运行中的 `server.mjs` 服务，就会写入同一个服务器上的 `content/` 目录。
- 这不是浏览器本地缓存同步，而是通过服务端文件系统同步。
- 默认 `BLOG_HOST=127.0.0.1` 只允许本机访问。局域网或公网多端访问需要改成 `BLOG_HOST=0.0.0.0`。
- 如果部署到公网服务器，建议使用 HTTPS，并设置强密码。
- 保存后仍建议用 Git 提交和推送，作为长期备份与回滚点。

## 后台 API

服务端提供这些接口：

```text
POST /api/login
POST /api/logout
GET  /api/session
GET  /api/options
GET  /api/notes
POST /api/notes
POST /api/attachments
```

除 `/api/login` 和 `/api/session` 外，写作相关接口都需要登录 cookie。

## 安全说明

Node 后台服务做了这些防护：

- 默认只监听 `127.0.0.1`，不会直接暴露到局域网或公网。
- 如果监听 `0.0.0.0` 且仍使用默认密码或默认 session secret，服务会拒绝启动。
- 静态文件服务使用白名单，只公开博客页面、后台前端、`assets/` 和 `content/`。
- `.env`、`.git/`、`server.mjs`、`package.json` 等敏感或内部文件不会被公开访问。
- 写作类 POST API 会检查同源请求，降低跨站请求风险。
- 登录失败会做简单的内存限速，降低暴力尝试风险。
- 附件上传需要登录。
- 附件上传限制文件数量、文件大小和扩展名。
- 文章保存和附件上传都把 slug 和文件名做安全化处理。
- 后台实时预览会把 `attachments/...` 映射到 `/content/<slug>/attachments/...`，保存到 Markdown 时仍保留相对路径。

公网部署建议：

- 一定要修改 `.env` 中的 `BLOG_ADMIN_PASSWORD` 和 `BLOG_SESSION_SECRET`。
- 使用 HTTPS。
- 不要把 `.env` 提交到 GitHub。
- 定期 `git commit` 和 `git push` 作为备份。

`POST /api/attachments` 用于上传附件。它会根据 `slug` 保存到：

```text
content/<slug>/attachments/
```

返回值里会包含可在 Markdown 中引用的路径：

```text
attachments/figure.png
```

## 修改个人信息

个人信息主要在两个地方修改。

### 站点标题、导航和页脚

编辑：

```text
index.html
```

可修改内容：

- 浏览器标题：`<title>`
- SEO 描述：`<meta name="description">`
- 顶部品牌名：`Phase Space Notes`
- 顶部副标题：`computation · physics · math`
- 导航链接文字
- 页脚文字
- favicon：`assets/favicon.svg`

### 关于页和联系页

编辑：

```text
scripts.js
```

找到开头的配置：

```js
const SITE_PROFILE = {
  aboutTitle: "计算、物理和数学之间的研究笔记。",
  aboutParagraphs: [
    "我关注计算物理、数值分析、PDE、Hamiltonian 系统和科学计算工具链。",
  ],
  contactTitle: "联系与研究入口。",
  links: [
    { label: "Email", href: "mailto:hello@example.com" },
    { label: "GitHub", href: "https://github.com/" },
  ],
};
```

把邮箱、GitHub、Google Scholar、ORCID、个人主页或实验室页面替换成你的真实信息即可。

### 后台账号密码

编辑：

```text
.env
```

修改：

```env
BLOG_ADMIN_USER=admin
BLOG_ADMIN_PASSWORD=change-this-password
BLOG_SESSION_SECRET=change-this-long-random-secret
```

## 内容结构

每篇笔记一个独立文件夹：

```text
content/
  manifest.json
  my-note-slug/
    index.md
    attachments/
      cover.png
      figure-01.png
      result.csv
      paper.pdf
```

`index.md` 写文章正文，`attachments/` 放这篇文章自己的图片、实验输出、PDF、数据文件等附件。

## 新增文章

1. 新建文件夹：

```text
content/symplectic-integrator-notes/
```

2. 放入 Markdown：

```text
content/symplectic-integrator-notes/index.md
```

3. 放入附件：

```text
content/symplectic-integrator-notes/attachments/cover.png
content/symplectic-integrator-notes/attachments/phase-plot.png
```

4. 自动生成 manifest：

```bash
node scripts/generate-manifest.mjs
```

生成器会自动扫描所有 `content/*/index.md`，并把每篇文章的附件写入 `content/manifest.json`。以后不需要手动编辑 manifest。

## 日常写作流程

推荐以后按这个顺序维护博客：

```bash
# 1. 新建文章文件夹和附件
mkdir -p content/new-note/attachments

# 2. 编写正文
$EDITOR content/new-note/index.md

# 3. 自动更新文章索引
node scripts/generate-manifest.mjs

# 4. 本地预览
python3 -m http.server 4173

# 5. 保存到 Git
git add .
git commit -m "Add new note"
```

浏览器打开：

```text
http://localhost:4173
```

## Markdown 头信息

每篇文章开头需要 front matter：

```md
---
title: 辛积分方法笔记
date: 2026-06-08
readTime: 8 分钟
categories: [计算物理, 数值方法]
series: 结构保持算法
seriesOrder: 2
tags: [计算物理, Hamiltonian, 数值方法]
status: experiment
paper: arXiv:xxxx.xxxxx
repo: https://github.com/your/name
dataset: attachments/result.csv
cover: attachments/cover.png
excerpt: 这是一篇关于辛积分的研究笔记。
---
```

字段说明：

- `title`：文章标题。
- `date`：发布日期。
- `readTime`：阅读时长。
- `category`：单个分类，适合只归属一个主题的文章。
- `categories`：多个分类，适合跨主题文章，例如 `[计算物理, 数值方法]`。如果同时写了 `categories` 和 `category`，网站优先使用 `categories`。
- `series`：专栏/系列，可选，同一个名字会自动聚合。
- `seriesOrder`：专栏内排序，可选。
- `tags`：标签，可写成 `[数学, PDE]`。
- `status`：研究状态，例如 `reading`、`experiment`、`finished`。
- `paper`：论文编号或链接。
- `repo`：代码仓库链接。
- `dataset`：数据文件路径，推荐放在 `attachments/`。
- `cover`：封面图路径，建议放在本篇 `attachments/` 里。
- `excerpt`：首页摘要。

## 独立文章

如果文章不属于任何专栏，直接不要写 `series` 和 `seriesOrder`。

```md
---
title: 一个独立的误差分析笔记
date: 2026-06-08
readTime: 5 分钟
categories: [数学札记, 数值方法]
tags: [误差分析, PDE]
cover: attachments/cover.png
excerpt: 这篇文章不属于任何专栏，只是一篇独立笔记。
---
```

独立文章会正常出现在首页、分类筛选和标签筛选里。文章详情里的“专栏”会显示 `无`，也不会出现在任何专栏列表中。

## 专栏文章

专栏用于系列化内容。多篇文章写同一个 `series` 名字，就会自动归到同一个专栏。

```md
---
title: 辛积分方法笔记
date: 2026-06-08
readTime: 8 分钟
categories: [计算物理, 数值方法]
series: 结构保持算法
seriesOrder: 2
tags: [Hamiltonian, 辛积分]
cover: attachments/cover.png
excerpt: 这是一篇属于“结构保持算法”专栏的文章。
---
```

`seriesOrder` 控制专栏内部的阅读顺序。比如同一个专栏可以有：

```md
series: 结构保持算法
seriesOrder: 1
```

```md
series: 结构保持算法
seriesOrder: 2
```

首页右侧会显示专栏列表，顶部筛选区也能按专栏筛选。打开文章详情时，同专栏文章会显示在右侧“同专栏”区域。

## Markdown 正文格式

行内公式：

```md
能量函数记作 \(H(q,p)\)。
```

块级公式：

```md
$$
\dot q = \frac{\partial H}{\partial p}
$$
```

图片：

```md
![相图](attachments/phase-plot.png)
```

代码块：

````md
```python
x = x + alpha * p
```
````

表格：

```md
| 方法 | 阶数 | 结构保持 |
| --- | --- | --- |
| Euler | 1 | 否 |
| Verlet | 2 | 是 |
```

链接：

```md
[项目仓库](https://github.com/your/name)
```

脚注：

```md
这是一个脚注引用[^note]。

[^note]: 这里是脚注内容。
```

任务列表：

```md
- [x] 跑通基准实验
- [ ] 补充误差图
```

## 分类、标签和搜索

单分类：

```md
category: 计算物理
```

多分类：

```md
categories: [计算物理, 数值方法]
```

标签：

```md
tags: [Hamiltonian, PDE, 稀疏矩阵]
```

首页可以按分类、专栏和标签筛选。搜索框会搜索标题、摘要、分类、专栏、标签、研究字段和正文内容。

## 附件管理

每篇文章的附件建议放在自己的 `attachments/` 目录：

```text
content/my-note/attachments/
  cover.png
  phase-plot.png
  result.csv
  derivation.pdf
```

运行：

```bash
node scripts/generate-manifest.mjs
```

文章详情页右侧会自动显示“本文附件”。图片可以直接在 Markdown 中引用：

```md
![相图](attachments/phase-plot.png)
```

数据或 PDF 可以通过研究字段引用：

```md
dataset: attachments/result.csv
paper: attachments/derivation.pdf
```

如果使用写作后台，可以直接在“附件上传”区域选择文件。上传后会显示两个常用操作：

- `插入图片`：自动把 `![文件名](attachments/文件名)` 插入正文。
- `复制路径`：复制 `attachments/文件名`，可填入 `cover`、`dataset`、`paper` 等字段。

附件上传依赖 Node 后台服务。静态服务 `python3 -m http.server 4173` 没有上传接口。

## 本地导入工具

站点里有本地导入预览功能，但默认关闭：

```js
const SHOW_LOCAL_IMPORT_TOOLS = false;
```

这个工具只适合作者在本机临时预览 Markdown。开启后，页面会出现“选择 Markdown”和“选择笔记文件夹”按钮。

重要说明：

- 这不是上传功能。
- 选择的文件不会发送到服务器。
- 选择的文件不会写入项目目录。
- 导入内容只存在于当前访问者自己的浏览器会话里。
- 公开部署时建议保持 `SHOW_LOCAL_IMPORT_TOOLS = false`。

如果公开站点上开启这个功能，任何访问者都可以在自己的浏览器里选择本地文件预览，但他们不能修改你的博客，也不能把文件上传到你的服务器。为了避免误解，正式发布时默认隐藏这个工具。

## 发布

这是一个静态站点，可以发布到 GitHub Pages、Cloudflare Pages、Netlify 或任意静态文件服务器。

发布前建议：

```bash
node scripts/generate-manifest.mjs
git status --short
```

确认 `content/manifest.json` 已更新，并且公开站点保持：

```js
const SHOW_LOCAL_IMPORT_TOOLS = false;
```

## 推送到 GitHub

当前目标仓库：

```text
git@github.com:flyingpig669/blog.git
```

第一次连接远程仓库：

```bash
git remote add origin git@github.com:flyingpig669/blog.git
```

后续推送当前分支：

```bash
git push -u origin main
```

如果推送失败，通常是 SSH key 没有配置到 GitHub。可以先检查：

```bash
ssh -T git@github.com
```

## Git 回滚

查看历史：

```bash
git log --oneline
```

回到某个版本：

```bash
git checkout <commit-hash>
```

当前项目已经有一次初始提交，可以作为稳定回滚点。
