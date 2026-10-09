#!/usr/bin/env python3
"""
==============================================================================
Aurora Blog - 博文与关于页索引构建器 (Compiler & Indexer)
==============================================================================
自动扫描 posts/ 目录与 about.md 文件，结构化解析博文元数据、专栏与个人履历，
并编译生成轻量级前端数据包 js/posts-data.js。
"""

import os
import re
import json
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(BASE_DIR, "posts")
POSTS_DATA_FILE = os.path.join(BASE_DIR, "js", "posts-data.js")
SAMPLE_DATA_FILE = os.path.join(BASE_DIR, "js", "sample-data.js")

def parse_md_file(filepath):
    rel_path = os.path.relpath(filepath, POSTS_DIR)
    path_parts = rel_path.split(os.sep)

    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    filename = os.path.basename(filepath)
    title = ""
    date = time.strftime("%Y-%m-%d")
    category = "general"
    column = ""
    order = 999
    tags = []
    pinned = False
    excerpt = ""
    content = raw

    if len(path_parts) >= 3 and path_parts[0] in ["columns", "series", "column"]:
        column = path_parts[1]
    elif len(path_parts) == 2:
        category = path_parts[0]

    m = re.match(r"^(\d+)[-_.]", filename)
    if m:
        order = int(m.group(1))

    fm_pattern = re.compile(r"^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$")
    fm_match = fm_pattern.match(raw)
    if fm_match:
        fm = fm_match.group(1)
        content = fm_match.group(2).strip()

        for line in fm.splitlines():
            line = line.strip()
            if not line or ":" not in line:
                continue
            key, val = line.split(":", 1)
            key = key.strip().lower()
            val = val.strip().strip("'\"")
            if key == "title":
                title = val
            elif key == "date":
                date = val
            elif key == "category":
                category = val
            elif key in ["column", "series"]:
                column = val
            elif key in ["order", "chapter"]:
                if val.isdigit(): order = int(val)
            elif key == "pinned":
                pinned = (val.lower() == "true")
            elif key == "excerpt":
                excerpt = val
            elif key == "tags":
                clean_tags = val.strip("[]")
                tags = [t.strip().strip("'\"") for t in clean_tags.split(",") if t.strip()]
    else:
        h1_m = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_m:
            title = h1_m.group(1).strip()
            content = re.sub(r"^#\s+.+[\r\n]+", "", content, count=1).strip()

    if not title:
        title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()

    slug = os.path.splitext(filename)[0]
    post_id = "post-" + slug.replace(".", "-")

    if not excerpt:
        clean_text = re.sub(r"[#*>`\[\]]", "", content)
        excerpt = clean_text[:140].replace("\n", " ").strip()
        if len(clean_text) > 140:
            excerpt += "..."

    words_count = len(content)
    read_mins = max(1, round(words_count / 300))
    read_time = f"{read_mins} min read"

    col_display = column.replace("-", " ").replace("_", " ").title() if column else ""

    return {
        "id": post_id,
        "slug": slug,
        "title": title,
        "category": category,
        "column": column,
        "columnName": col_display,
        "order": order,
        "relPath": rel_path,
        "date": date,
        "readTime": read_time,
        "words": words_count,
        "views": 1,
        "likes": 0,
        "pinned": pinned,
        "excerpt": excerpt,
        "tags": tags or [category],
        "content": content
    }

def parse_about_file(filepath):
    """结构化解析 about.md 为原生组件数据对象"""
    if not os.path.exists(filepath):
        return None

    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    data = {
        "status": "",
        "quote": "",
        "bio": "",
        "timeline": [],
        "focusAreas": [],
        "projects": [],
        "notes": ""
    }

    fm_match = re.match(r"^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*([\s\S]*)$", text)
    if not fm_match:
        data["bio"] = text.strip()
        return data

    fm = fm_match.group(1)
    notes = fm_match.group(2).strip()
    data["notes"] = notes

    current_section = None
    current_item = None

    for line in fm.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue

        top_m = re.match(r"^([a-zA-Z0-9_-]+):\s*(.*)$", line)
        if top_m and not line.startswith(" ") and not line.startswith("\t"):
            key = top_m.group(1)
            val = top_m.group(2).strip().strip("\"'")
            if key in ["timeline", "focusAreas", "projects"]:
                current_section = key
                current_item = None
            else:
                current_section = None
                current_item = None
                data[key] = val
            continue

        if current_section in ["timeline", "focusAreas", "projects"]:
            item_start = re.match(r"^\s*-\s+([a-zA-Z0-9_-]+):\s*(.*)$", line)
            if item_start:
                k = item_start.group(1)
                v = item_start.group(2).strip().strip("\"'")
                current_item = {k: v}
                data[current_section].append(current_item)
                continue

            field_m = re.match(r"^\s+([a-zA-Z0-9_-]+):\s*(.*)$", line)
            if field_m and current_item is not None:
                k = field_m.group(1)
                v = field_m.group(2).strip().strip("\"'")
                current_item[k] = v
                continue

    return data

def sync():
    os.makedirs(POSTS_DIR, exist_ok=True)
    md_files = []
    for root, dirs, files in os.walk(POSTS_DIR):
        for file in files:
            if file.endswith(".md") or file.endswith(".markdown"):
                md_files.append(os.path.join(root, file))

    synced_posts = []
    columns_map = {}

    for filepath in sorted(md_files):
        p = parse_md_file(filepath)
        synced_posts.append(p)
        col = p.get("column")
        if col:
            if col not in columns_map:
                columns_map[col] = {
                    "id": col,
                    "name": p.get("columnName") or col.title(),
                    "desc": f"Technical series collection for {p.get('columnName') or col}.",
                    "icon": "layers",
                    "posts": []
                }
            columns_map[col]["posts"].append(p)
        print(f" -> 扫描博文: {p['relPath']} (分类: {p['category']}" + (f", 专栏: {p['columnName']} Part {p['order']}" if col else "") + ")")

    columns_list = []
    for col_id, col_info in columns_map.items():
        col_info["posts"].sort(key=lambda x: x["order"])
        col_info["postsCount"] = len(col_info["posts"])
        col_info["totalWords"] = sum(x["words"] for x in col_info["posts"])
        columns_list.append(col_info)

    # 结构化解析关于页 about.md
    about_path = os.path.join(BASE_DIR, "about.md")
    if not os.path.exists(about_path):
        about_path = os.path.join(POSTS_DIR, "about.md")
    about_data = parse_about_file(about_path)
    if about_data:
        print(f" -> 扫描关于页: {os.path.relpath(about_path, BASE_DIR)} (收录 {len(about_data.get('timeline', []))} 条经历时间线)")

    # 扫描根目录与其他自定义页面 Markdown 文件 (如 projects.md 等)
    custom_pages = {}
    for filename in sorted(os.listdir(BASE_DIR)):
        if filename.endswith(".md") and filename not in ["README.md", "about.md", "AGENTS.md"]:
            page_id = os.path.splitext(filename)[0]
            with open(os.path.join(BASE_DIR, filename), "r", encoding="utf-8") as f:
                custom_pages[page_id] = f.read()
            print(f" -> 扫描自定义页面: {filename}")

    payload = {
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "posts": synced_posts,
        "columns": columns_list,
        "about": about_data,
        "customPages": custom_pages
    }

    js_output = "/** Auto-generated by sync_posts.py - Do not edit manually */\n"
    js_output += "window.BlogPostsData = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    js_output += "window.BlogSampleData = window.BlogPostsData; // Backwards compatibility\n"

    os.makedirs(os.path.dirname(POSTS_DATA_FILE), exist_ok=True)
    with open(POSTS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_output)

    with open(SAMPLE_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_output)

    print(f"\n✅ 同步完成！共收录 {len(synced_posts)} 篇博文，{len(columns_list)} 个专栏。")
    print(f" -> 索引文件已更新: js/posts-data.js")

if __name__ == "__main__":
    sync()
