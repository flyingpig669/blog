#!/usr/bin/env bash
# ==============================================================================
# Aurora Blog (极光随笔) - GitHub Pages 一键自动部署脚本
# ==============================================================================

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================================="
echo "  🚀 Aurora Blog (极光随笔) - GitHub Pages 自动化发布"
echo "=========================================================="

# 1. 执行语法检查并同步 Markdown 数据
echo ""
echo "[1/4] 检查项目并同步 Markdown 文章索引..."
if [ -x "check.sh" ]; then
  ./check.sh
else
  echo "错误: check.sh 不存在或不可执行。"
  exit 1
fi

# 2. 检查 Git 仓库初始化状态
echo ""
echo "[2/4] 检查 Git 本地版本库配置..."
if [ ! -d ".git" ]; then
  echo "本地未初始化 Git 仓库，正在初始化..."
  git init -b main
  echo "✅ Git 本地主分支 (main) 初始化完成。"
fi

# 检查远程仓库配置
if ! git remote get-url origin >/dev/null 2>&1; then
  echo ""
  echo "⚠️ 尚未配置 GitHub 远程仓库 origin。"
  echo "请在 GitHub 创建一个新仓库（例如 aurora-blog），然后输入仓库地址："
  read -r -p "请输入 GitHub 仓库地址 (例如 https://github.com/yourname/aurora-blog.git): " REPO_URL
  if [ -n "$REPO_URL" ]; then
    git remote add origin "$REPO_URL"
    echo "✅ 成功绑定远程仓库: $REPO_URL"
  else
    echo "❌ 未提供远程仓库地址，部署已中止。"
    exit 1
  fi
fi

# 3. 收集并提交所有更新变更
echo ""
echo "[3/4] 提交最新代码与博文资源..."
git add .

COMMIT_MSG="${1:-Update blog posts and static assets - $(date '+%Y-%m-%d %H:%M:%S')}"
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "ℹ️ 本地文件无新增改动，准备推送最新状态..."
else
  git commit -m "$COMMIT_MSG"
  echo "✅ 已完成本地 Commit: $COMMIT_MSG"
fi

# 4. 推送到 GitHub 触发自动化 Actions 工作流
echo ""
echo "[4/4] 推送至 GitHub 远程仓库并触发自动化构建..."
REMOTE_BRANCH=$(git symbolic-ref --short HEAD)
git push -u origin "$REMOTE_BRANCH"

echo ""
echo "=========================================================="
echo "  🎉 部署指令已成功发送！"
echo "  GitHub Actions 已自动被触发，正在为您构建上线。"
echo "  首次使用请确保在 GitHub 仓库中开启 Pages："
echo "   -> 打开仓库 Settings -> Pages"
echo "   -> 在 'Build and deployment' 的 Source 中选择 'GitHub Actions'"
echo "  上线后可通过 https://<用户名>.github.io/<仓库名> 访问！"
echo "=========================================================="
