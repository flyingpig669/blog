#!/usr/bin/env python3
import os
import re
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(BASE_DIR, "posts")
SAMPLE_DATA_FILE = os.path.join(BASE_DIR, "js", "sample-data.js")

def parse_md_file(filepath):
    rel_path = os.path.relpath(filepath, POSTS_DIR)
    path_parts = rel_path.split(os.sep)

    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    title = ""
    date = "2026-10-06"
    category = ""
    column = ""
    order = 999
    tags = []
    content = raw
    pinned = False

    # Subfolder detection
    if len(path_parts) >= 3 and path_parts[0] in ["columns", "series", "column"]:
        column = path_parts[1]
    elif len(path_parts) == 2:
        category = path_parts[0]

    filename = os.path.basename(filepath)
    m = re.match(r"^(\d+)[-_.]", filename)
    if m: order = int(m.group(1))

    # YAML Frontmatter regex
    fm_pattern = re.compile(r"^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$")
    fm_match = fm_pattern.match(raw)
    if fm_match:
        fm = fm_match.group(1)
        content = fm_match.group(2).strip()

        tm = re.search(r"^title:\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if tm: title = tm.group(1).strip()

        dm = re.search(r"^date:\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if dm: date = dm.group(1).strip()

        cm = re.search(r"^category:\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if cm: category = cm.group(1).strip()

        col_m = re.search(r"^(?:column|series):\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if col_m: column = col_m.group(1).strip()

        ord_m = re.search(r"^(?:order|chapter):\s*(\d+)$", fm, re.M)
        if ord_m: order = int(ord_m.group(1))

        pin_m = re.search(r"^pinned:\s*(true|false)$", fm, re.M | re.I)
        if pin_m: pinned = (pin_m.group(1).lower() == "true")

        tag_m = re.search(r"^tags:\s*\[?(.*?)\]?$", fm, re.M)
        if tag_m:
            tags = [t.strip().strip("'\"") for t in tag_m.group(1).split(",") if t.strip()]
    else:
        h1_m = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_m:
            title = h1_m.group(1).strip()
            content = re.sub(r"^#\s+.+[\r\n]+", "", content, count=1).strip()

    if not title:
        title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ")

    if not category:
        category = "frontend"

    post_id = "post-" + os.path.splitext(filename)[0].replace(".", "-")

    cat_names = {
        "quantum-ai": "量子计算与深度智能",
        "ai": "量子计算与深度智能",
        "frontend": "前端技术",
        "backend": "后端架构",
        "design": "设计美学",
        "life": "思考随笔"
    }

    col_names = {
        "quantum-computing-ai": "量子物理与深度智能前沿专栏",
        "llm-in-action": "大模型系统化实战专栏",
        "frontend-architecture": "现代前端架构演进专栏",
        "distributed-systems": "分布式共识与系统工程专栏"
    }
    column_name = col_names.get(column, column) if column else ""

    gradients = [
        "from-blue-600 to-cyan-500",
        "from-purple-600 to-indigo-600",
        "from-emerald-600 to-teal-500",
        "from-pink-600 to-rose-500",
        "from-amber-500 to-orange-500"
    ]
    cover_gradient = gradients[abs(hash(post_id)) % len(gradients)]
    excerpt = re.sub(r"[#*>\`\[\]]", "", content)[:140].replace("\n", " ").strip() + "..."

    return {
        "id": post_id,
        "slug": os.path.splitext(filename)[0],
        "title": title,
        "category": category,
        "categoryName": cat_names.get(category, category),
        "column": column,
        "columnName": column_name,
        "order": order,
        "relPath": rel_path,
        "coverGradient": cover_gradient,
        "date": date,
        "readTime": f"{max(1, len(content) // 400)} 分钟",
        "words": len(content),
        "views": 1,
        "likes": 0,
        "pinned": pinned,
        "excerpt": excerpt,
        "tags": tags or [cat_names.get(category, "随笔")],
        "content": content
    }

def sync():
    if not os.path.exists(SAMPLE_DATA_FILE):
        print(f"Error: {SAMPLE_DATA_FILE} not found.")
        return

    with open(SAMPLE_DATA_FILE, "r", encoding="utf-8") as f:
        js_text = f.read()

    prefix = "window.BlogSampleData = "
    idx = js_text.find("{")
    last_idx = js_text.rfind("}")
    if idx != -1 and last_idx != -1:
        data = json.loads(js_text[idx:last_idx+1])
    else:
        print("Error: Could not parse sample-data.js")
        return

    md_files = []
    for root, dirs, files in os.walk(POSTS_DIR):
        for file in files:
            if file.endswith(".md") or file.endswith(".markdown"):
                md_files.append(os.path.join(root, file))

    if not md_files:
        print(f"No .md files found in {POSTS_DIR}")
        return

    synced_posts = []
    columns_map = {}

    col_meta = {
        "quantum-computing-ai": {"name": "量子物理与深度智能前沿专栏", "desc": "以严密数学为基石，深入量子态叠加、哈密顿量演化与变分量子神经网络(VQC)。", "icon": "atom", "color": "from-cyan-400 via-blue-500 to-indigo-600"},
        "llm-in-action": {"name": "大模型系统化实战专栏", "desc": "涵盖 Prompt 工程、RAG 向量检索与多代理协作落地。", "icon": "sparkles", "color": "from-purple-500 to-indigo-600"},
        "frontend-architecture": {"name": "现代前端架构演进专栏", "desc": "从虚拟 DOM、细粒度响应性到 RSC 服务端组件演变。", "icon": "code", "color": "from-blue-500 to-cyan-500"},
        "distributed-systems": {"name": "分布式共识与系统工程专栏", "desc": "Paxos、Raft 机制、网络分区容灾与生产级高可用实践。", "icon": "terminal", "color": "from-emerald-500 to-teal-600"}
    }

    for filepath in sorted(md_files):
        p = parse_md_file(filepath)
        synced_posts.append(p)
        col = p.get("column")
        if col:
            if col not in columns_map:
                meta = col_meta.get(col, {"name": p.get("columnName") or col, "desc": f"涵盖 {p.get('columnName') or col} 的系统化深度技术连载。", "icon": "layers", "color": "from-indigo-500 to-purple-600"})
                columns_map[col] = {
                    "id": col,
                    "name": meta["name"],
                    "desc": meta["desc"],
                    "icon": meta["icon"],
                    "color": meta["color"],
                    "posts": []
                }
            columns_map[col]["posts"].append(p)
        print(f" -> 扫描博文: {p['relPath']} (分类: {p['categoryName']}" + (f", 专栏: {p['columnName']} 第{p['order']}讲" if col else "") + ")")

    columns_list = []
    col_priority = ["quantum-computing-ai", "llm-in-action", "frontend-architecture", "distributed-systems"]
    sorted_cols = sorted(columns_map.items(), key=lambda item: col_priority.index(item[0]) if item[0] in col_priority else 99)
    for col_id, col_info in sorted_cols:
        col_info["posts"].sort(key=lambda x: x["order"])
        col_info["postsCount"] = len(col_info["posts"])
        col_info["totalWords"] = sum(x["words"] for x in col_info["posts"])
        columns_list.append(col_info)

    # Update author & categories for quantum tech style
    if "categories" in data and len(data["categories"]) > 0:
        data["categories"][0] = {
            "id": "quantum-ai",
            "name": "量子计算与深度智能",
            "desc": "高维希尔伯特空间、量子线路模拟、统计物理与深度自注意力同构",
            "color": "from-cyan-400 via-blue-500 to-indigo-600",
            "icon": "atom"
        }
    if "author" in data:
        data["author"]["title"] = "全栈架构师 · 量子计算与深度智能研究者"
        data["author"]["bio"] = "专注于现代计算架构、量子计算前沿、统计力学与大模型数学同构。崇尚严谨推导与心流开发，用代码记录思考与创造。"

    data["posts"] = synced_posts
    data["columns"] = columns_list

    with open(SAMPLE_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(prefix + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")

    print(f"\n✅ 同步完成！已成功扫描并提交 {len(synced_posts)} 篇博文，识别出 {len(columns_list)} 个独立专栏。")

if __name__ == "__main__":
    sync()