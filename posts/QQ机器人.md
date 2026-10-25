---
title: "QQ Bot部署"
date: "2026-10-25"
tags: ["qq", "bot", "自动化","python","snowluma","astrbot"]
excerpt: "本文档介绍如何部署一个QQ机器人，使用Python和Snowluma框架以及AstrBot实现自动化功能。"
pinned: false            # 是否置顶于首页 (true / false)
tocLevels: [2, 3]        # 大纲目录追踪层级，默认追踪 h2 与 h3 (亦可设为 [2, 3, 4] 或 false 隐藏)
---

# QQ Bot部署

这个学期我担任了宿舍长，因为每天晚上都要在qq群里完成签到任务，所以我决定部署一个QQ机器人来自动化这个过程。本文档将详细介绍如何使用Python和Snowluma框架以及AstrBot来实现这个功能。

## 环境准备
- 一台linux服务器或虚拟机，推荐使用Ubuntu 24.04。（**注意不要使用openwrt**）
- 安装Python 3.10或更高版本。
- Docker环境 。

## [Snowluma框架安装](https://github.com/SnowLuma/SnowLuma)

### 1. docker直接部署
```bash
docker run -d \
  --name snowluma \
  --restart unless-stopped \
  --shm-size=1g \
  --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  -p 6081:6081 \
  -p 5099:5099 \
  -p 3000:3000 \
  -p 3001:3001 \
  -v qq-gateway-data:/app/data \
  -v qq-client-config:/app/.config \
  -v qq-client-data:/app/.local/share \
  motricseven7/snowluma:latest
```

端口号说明：
- 5099: WebUI网页端口
- 6081: VNC登陆端口
- 3000: HTTP API端口
- 3001: WebSocket API端口
数据卷说明：
- qq-gateway-data: 网关数据卷
- qq-client-config: QQ客户端配置数据卷
- qq-client-data: QQ客户端数据卷

### 2. 访问WebUI
在浏览器中访问 `http://<服务器IP>:5099`，使用默认账号和密码登录，默认账号为 `admin`，默认密码在 **docker logs snowluma** 中可以找到。然后提示修改密码，修改后即可使用。
### 3. 配置QQ账号
访问`http://<服务器IP>:6081`，使用VNC客户端连接，输入QQ账号和密码进行登录。VNC密码使用下面命令查看
```bash
docker logs snowluma 2>&1 | grep -E "远程桌面密码:|remote desktop password:" | tail -n 1
```

这样一般就好了，QQ登录成功后，Snowluma就可以正常工作了。Snowluma会显示你的QQ账号信息，并且可以在WebUI中进行管理。到这里其实发消息自动化的功能就已经可以使用了，但是如果你想要实现更复杂的自动化功能，比如签到、自动回复等，就需要使用AstrBot。下面接着介绍自动化发消息的功能。

### 4. 编写Python脚本

在这里我们需要拿到HTTP API的token，访问`http://<服务器IP>:3000`，在WebUI中找到HTTP API的token。然后我们可以编写一个Python脚本来实现自动化发消息的功能。 或者使用如下命令,**第一个**就是HTTP API的token，第二个是WebSocket API的token
```bash
docker exec  snowluma cat /app/data/config/onebot.json | grep -E "accessToken"
```

使用如下脚本
```python

import os
import sys
import requests

# SnowLuma 的 HTTP API 地址
API_URL = "http://127.0.0.1:3000/send_msg"

# Bearer Token 和群号
ACCESS_TOKEN = ""
GROUP_ID = int("")


def send_checkin():
    # 请求主体：JSON
    payload = {
        "message": "奇了",
        "message_type": "group",
        "group_id": GROUP_ID,
        "auto_escape": False
    }

    # Bearer Token 授权
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers=headers,
            timeout=15
        )

        # HTTP 状态码异常时抛出异常
        response.raise_for_status()

        # 解析 API 返回的 JSON
        result = response.json()

        if result.get("status") != "ok" or result.get("retcode") != 0:
            raise RuntimeError(f"API 返回失败：{result}")

        message_id = result.get("data", {}).get("message_id")
        print(f"签到请求成功，message_id={message_id}")

    except (requests.RequestException, ValueError, RuntimeError) as exc:
        print(f"签到失败：{exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    send_checkin()
```
### 5. 使用Cron定时任务
为了实现每天自动签到，我们可以使用Cron定时任务来执行上面的Python脚本
```bash
# 编辑Cron任务
crontab -e
```
然后添加如下内容，每天晚上10点执行签到脚本
```bash
0 22 * * * /usr/bin/python3 /path/to/your/script.py
```
## astrBot自动化功能
 这个还没研究 接下来再说吧




