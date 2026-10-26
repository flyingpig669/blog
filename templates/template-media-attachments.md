---
title: "在这里填写带附件的文章标题"
tags: ["资料"]
excerpt: "介绍正文与配套材料的用途。"
# 上传真实文件后再启用附件列表：
# attachments:
#   - "attachments/files/my-data.zip"
#   - "attachments/files/my-notes.docx"
---

<!-- 使用：复制到 posts/my-resources.md；所有资源先上传到 attachments/。
     下面的路径仅是写法示例，均放在代码块中，复制模板不会引用不存在的文件。
     使用某个示例时替换真实路径，再删除外侧代码围栏。 -->

## 正文

在这里介绍内容、实验或资料的阅读方式。

## 图片

基本写法：

```markdown
![说明图片内容](attachments/images/my-image.png)
```

指定宽度与题注：

```html
<figure>
  <img src="attachments/images/my-image.png" width="480" alt="说明图片内容">
  <figcaption>图 1：在这里填写题注。</figcaption>
</figure>
```

## 下载与预览

正文中插入链接，或启用上方 `attachments` 列表，在文末集中展示操作入口：

```markdown
[下载实验数据](attachments/files/my-data.zip)
[阅读课程讲义](attachments/files/my-notes.docx)
```

PDF / Word / PPT 统一显示文档预览入口，点击后加载并保留原文件下载。
PDF 与 Word 按正文宽度自适应，页高随当前页比例变化；可翻页、缩放、适应宽度和收起。
本地 Office 附件需要 LibreOffice，构建时先转成 PDF；不保留 PPT 动画和音视频。

## 音视频

```html
<video src="attachments/media/my-demo.mp4" controls preload="metadata" width="480"></video>
<audio src="attachments/media/my-audio.mp3" controls preload="metadata"></audio>
```

<!-- 资源路径相对站点根，如 attachments/images/my-image.png，不能写本机绝对路径。
     不要把图片放在 posts/ 下：它不在发布资源白名单中。
     data:、javascript:、file: 资源协议会被安全过滤。
     发布前运行 ./check.sh，检查活动资源引用是否真实存在。 -->
