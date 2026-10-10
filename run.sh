#!/usr/bin/env bash
# ==============================================================================
# Aurora Blog (极光随笔) - 本地开发服务器（实时刷新版）
# ==============================================================================
# 这个脚本做两件事：
#
#   1. 启动前先释放端口。上一次的 dev server 若还占着 18888，直接启动会报
#      "Address already in use"；这里先检测端口占用并结束旧进程。
#      出于安全考虑，只自动结束后台里本项目的 server.py —— 端口被其它程序
#      占用时会中止并打印占用的进程，绝不静默 kill 无关进程。
#
#   2. 以「监听文件变更 + 浏览器自动刷新」模式启动 server.py。
#      保存 css/ js/ posts/ 下任意文件，浏览器会自动刷新；
#      改动内容与前端源码时会先统一构建内容和 CSS 再刷新。
#
# 用法：
#   ./run.sh                      # 默认 18888，前台运行，Ctrl+C 停止
#   ./run.sh --port 8900          # 换端口（端口检测会跟着换）
#   ./run.sh --no-sync            # 只刷新页面，不自动重建文章索引
#   ./run.sh --no-watch           # 关闭监听，退回纯静态服务器
#   ./run.sh --daemon             # 后台运行（日志写入 server.log）
#   FORCE=1 ./run.sh              # 端口被非本项目进程占用时，强制结束它
# ==============================================================================

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

PORT="${AURORA_PORT:-18888}"
FORCE="${FORCE:-0}"
SERVER_ARGS=()

# ---- 解析参数：端口单独记下来给「端口检测」用，其余原样透传给 server.py ----
# 注意：--port 不放进 SERVER_ARGS，最后统一拼一次，避免重复传参。
while [ $# -gt 0 ]; do
  case "$1" in
    --port|-p)
      if [ $# -lt 2 ]; then
        echo "❌ $1 需要一个端口值，例如：$1 8900" >&2
        exit 2
      fi
      PORT="$2"
      shift 2
      ;;
    --port=*)
      PORT="${1#--port=}"
      shift
      ;;
    *)
      SERVER_ARGS+=("$1")
      shift
      ;;
  esac
done

case "$PORT" in
  ''|*[!0-9]*)
    echo "❌ 端口必须是数字，当前为：$PORT" >&2
    exit 2
    ;;
esac
if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  echo "❌ 端口需在 1-65535 之间，当前为：$PORT" >&2
  exit 2
fi

# 列出占用指定端口的监听进程，每行输出「PID<TAB>命令名」。
# 用 lsof 的 -F 机器可读格式：p 行是 PID，c 行是命令名（可能被截断）。
port_owners() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -Fpc 2>/dev/null | awk '
    /^p/ { pid = substr($0, 2) }
    /^c/ { if (pid != "") print pid "\t" substr($0, 2) }
  ' || true
}

# 端口上是否还有监听者（有则输出 PID，无则输出空）
list_pids_on_port() {
  lsof -nP -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null || true
}

# 释放端口：只结束「本项目 server.py」；其它程序需 FORCE=1 显式确认
free_port() {
  local port="$1"
  local owners pid name full safe="" unsafe="" guessed="" tries=0

  owners="$(port_owners "$port")"
  if [ -z "$owners" ]; then
    echo "✔ 端口 $port 空闲"
    return 0
  fi

  while IFS="$(printf '\t')" read -r pid name; do
    [ -n "$pid" ] || continue
    # 首选：完整命令行里能看到 server.py —— 这是最可靠的判据
    full="$(ps -o command= -p "$pid" 2>/dev/null || true)"
    if [ -n "$full" ]; then
      case "$full" in
        *server.py*) safe="$safe $pid" ;;
        *)           unsafe="$unsafe $pid" ;;
      esac
      continue
    fi
    # 退路：ps 不可用时（受限环境）只能用 lsof 给的命令名粗判，
    # 命中 python* 视为本项目的 dev server，但标记为「推断」以便提示用户。
    case "$name" in
      python*|Python*) safe="$safe $pid"; guessed="$guessed $pid" ;;
      *)               unsafe="$unsafe $pid" ;;
    esac
  done <<< "$owners"

  if [ -n "$unsafe" ]; then
    echo ""
    echo "⚠️  端口 $port 被以下「非本项目」进程占用："
    while IFS="$(printf '\t')" read -r pid name; do
      case " $unsafe " in
        *" $pid "*) printf '      PID %-7s %s\n' "$pid" "$name" ;;
      esac
    done <<< "$owners"
    if [ "$FORCE" != "1" ]; then
      echo ""
      echo "    结束无关进程可能影响你正在使用的其它程序，因此已中止。"
      echo "    确认无误后可执行：  FORCE=1 ./run.sh --port $port"
      return 1
    fi
    echo "    FORCE=1 已启用，将继续结束上述进程。"
    safe="$safe $unsafe"
  fi

  if [ -n "$guessed" ]; then
    echo "ℹ️  当前环境无法读取完整命令行（ps 受限），已按进程名推断 PID:$guessed 为本项目的 dev server"
  fi

  echo "… 端口 $port 上有旧进程 (PID:$safe)，正在结束"
  # shellcheck disable=SC2086
  kill $safe 2>/dev/null || true

  while [ "$tries" -lt 12 ]; do
    if [ -z "$(list_pids_on_port "$port")" ]; then
      echo "✔ 端口 $port 已释放"
      return 0
    fi
    sleep 0.25
    tries=$((tries + 1))
  done

  echo "… 优雅退出超时（3s），发送 SIGKILL"
  pid="$(list_pids_on_port "$port")"
  if [ -n "$pid" ]; then
    # shellcheck disable=SC2086
    kill -9 $pid 2>/dev/null || true
  fi
  sleep 0.3

  if [ -n "$(list_pids_on_port "$port")" ]; then
    echo "❌ 无法释放端口 $port，请手动排查：lsof -nP -iTCP:$port -sTCP:LISTEN" >&2
    return 1
  fi
  echo "✔ 端口 $port 已释放"
}

echo "========================================="
echo "  Aurora Blog (极光随笔) 开发服务器"
echo "========================================="
echo ""

free_port "$PORT" || exit 1

echo ""
echo "  访问地址： http://localhost:$PORT"
echo "  实时刷新： 保存 css/ js/ posts/ 下任意文件即自动刷新"
echo "  停止服务： Ctrl+C"
echo ""

# 用数组拼命令：macOS 自带 bash 3.2 在 `set -u` 下展开空数组会直接报
# "unbound variable"，所以绝不能把可能为空的 SERVER_ARGS 直接展开。
PYTHON="${AURORA_PYTHON:-python3}"
if [ -x "$DIR/.venv/bin/python" ]; then PYTHON="$DIR/.venv/bin/python"; fi
AURORA_PYTHON="$PYTHON" npm run build
CMD=("$PYTHON" server.py --port "$PORT")
if [ "${#SERVER_ARGS[@]}" -gt 0 ]; then
  CMD+=("${SERVER_ARGS[@]}")
fi

exec "${CMD[@]}"
