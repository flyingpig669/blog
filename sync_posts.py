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

IGNORE_DIRS = {".git", ".github", ".vscode", "node_modules", "assets", "attachments", "images", "img", "slides", "vendor", "templates", "drafts"}

# 文档类型字典：
#   normal = 普通文章（默认，进入首页/归档/标签等博文流）
#   post   = 结构化独立页（支持 status/quote/bio/timeline/focusAreas/social 等区块，类似 about）
# 兼容旧写法：page / page-mode / standalone 等一律归一化为 post。
RICH_DOC_TYPES = {"post", "page", "page-mode", "standalone", "single", "page_mode"}

# 结构化独立页 (type: post) 支持的列表型区块
STRUCTURED_LIST_KEYS = ["timeline", "focusAreas", "social", "contacts", "links"]


def slugify(value):
    """生成 URL 安全的 slug：转小写、非字母数字(保留连字符)替换为连字符并去重。"""
    s = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return s.strip("-")


def normalize_doc_type(raw):
    """把 FrontMatter 里的 type / layout 归一化为 normal 或 post。"""
    value = (raw or "").strip().lower()
    if value in RICH_DOC_TYPES:
        return "post"
    return "normal"


def load_config_exclude():
    config_path = os.path.join(BASE_DIR, "blog.config.js")
    exclude = {"showTest": True, "files": [], "dirs": []}
    if not os.path.exists(config_path):
        return exclude
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "exclude:" in content:
            idx = content.find("exclude:")
            block = content[idx:content.find("}", idx) + 1]
            if "showtest: false" in block.lower():
                exclude["showTest"] = False
            elif "showtest: true" in block.lower():
                exclude["showTest"] = True

            files_m = re.search(r"files\s*:\s*\[(.*?)\]", block, re.S)
            if files_m:
                raw_files = [x.strip().replace("'", "").replace('"', '') for x in files_m.group(1).split(",") if x.strip()]
                exclude["files"] = [f for f in raw_files if f]

            dirs_m = re.search(r"dirs\s*:\s*\[(.*?)\]", block, re.S)
            if dirs_m:
                raw_dirs = [x.strip().replace("'", "").replace('"', '') for x in dirs_m.group(1).split(",") if x.strip()]
                exclude["dirs"] = [d for d in raw_dirs if d]
    except Exception:
        pass
    return exclude

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
    column_name = ""
    column_slug = ""
    column_desc = ""
    slug_override = ""
    order = 999
    tags = []
    pinned = False
    excerpt = ""
    slide = ""
    attachments = []
    is_test = False
    doc_type = "normal"
    toc_levels = None
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

        for raw_line in fm.splitlines():
            if not raw_line.strip() or raw_line.startswith(" ") or raw_line.startswith("	") or raw_line.strip().startswith("-"):
                continue
            line = raw_line.strip()
            if ":" not in line:
                continue
            key, val = line.split(":", 1)
            key = key.strip().lower()
            val = re.split(r'\s+#', val)[0].strip().strip(chr(39) + chr(34))
            if key == "title":
                title = val
            elif key == "date":
                date = val
            elif key == "category":
                category = val
            elif key in ["column", "series"]:
                column = val
            elif key in ["columnname", "column_name", "columntitle", "column_title"]:
                column_name = val
            elif key in ["columnslug", "column_slug", "serieslug", "series_slug"]:
                column_slug = val
            elif key in ["columndesc", "column_desc", "columndescription", "column_description"]:
                column_desc = val
            elif key == "slug":
                slug_override = val
            elif key == "test":
                is_test = (val.lower() == "true")
            elif key in ["type", "layout"]:
                doc_type = normalize_doc_type(val)
            elif key in ["slide", "slides", "pdf", "deck"]:
                slide = val
            elif key in ["attachment", "attachments"]:
                clean_att = val.strip("[]")
                attachments = [t.strip().strip("'\"") for t in clean_att.split(",") if t.strip()]
            elif key in ["order", "chapter"]:
                if val.isdigit(): order = int(val)
            elif key in ["toclevels", "toc_levels", "toc"]:
                if val.lower() in ["false", "off", "none", "0"]:
                    toc_levels = []
                else:
                    clean_toc = val.strip("[]")
                    toc_levels = [int(t.strip().strip(chr(39) + chr(34))) for t in clean_toc.split(",") if t.strip() and t.strip().strip(chr(39) + chr(34)).isdigit()]
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

    section = "posts"
    if len(path_parts) >= 3 and path_parts[0] in ["columns", "series", "column"]:
        if not column:
            column = path_parts[1]
    # 若声明了 columnSlug，则用其作为专栏的 URL 标识（满足路由禁用中文的规范）
    if column_slug:
        column = slugify(column_slug) or column
    if column:
        section = "columns"

    if not slide:
        slide_m = re.search(r":::\s*(?:slide|pdf|deck)\s+([^\s\r\n]+)", content)
        if slide_m:
            slide = slide_m.group(1).strip()

    if "test" in [t.lower() for t in tags] or is_test:
        is_test = True

    slug_clean = re.sub(r"[^a-zA-Z0-9 \u4e00-\u9fff]+", "-", (slug_override or "").strip()).strip("-")
    slug = slug_clean or os.path.splitext(filename)[0]
    if column:
        post_id = f"post-col-{column}-{slug}".replace(" ", "-").replace(".", "-")
    else:
        post_id = f"post-{slug}".replace(".", "-")

    if not excerpt:
        clean_text = re.sub(r"[#*>`\[\]]", "", content)
        excerpt = clean_text[:140].replace("\n", " ").strip()
        if len(clean_text) > 140:
            excerpt += "..."

    words_count = len(content)
    read_mins = max(1, round(words_count / 300))
    read_time = f"{read_mins} min read"

    col_display = column_name or (column.replace("-", " ").replace("_", " ").title() if column else "")

    return {
        "id": post_id,
        "slug": slug,
        "title": title,
        "category": category,
        "section": section,
        "column": column,
        "columnName": col_display,
        "columnDesc": column_desc,
        "order": order,
        "relPath": rel_path,
        "date": date,
        "readTime": read_time,
        "words": words_count,
        "views": 1,
        "likes": 0,
        "pinned": pinned,
        "type": doc_type,
        "isTest": is_test,
        "slide": slide,
        "attachments": attachments,
        "tocLevels": toc_levels,
        "excerpt": excerpt,
        "tags": tags or [category],
        "content": content
    }

def parse_structured_page_file(filepath):
    """结构化解析任意独立 Page 文档为原生高级组件数据对象"""
    if not os.path.exists(filepath):
        return None

    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    filename = os.path.basename(filepath)
    default_title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()

    data = {
        "title": default_title,
        "status": "",
        "quote": "",
        "bio": "",
        "timeline": [],
        "focusAreas": [],
        "social": [],
        "contacts": [],
        "links": [],
        "notes": "",
        "content": "",
        "raw": text,
        "tocLevels": None
    }
    fm_match = re.match(r"^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*([\s\S]*)$", text)
    if not fm_match:
        content = text.strip()
        h1_match = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_match:
            data["title"] = h1_match.group(1).strip()
            content = re.sub(r"^#\s+.+[\r\n]+", "", content, count=1).strip()
        data["content"] = content
        return data

    fm = fm_match.group(1)
    notes = fm_match.group(2).strip()
    data["notes"] = notes
    data["content"] = notes

    current_section = None
    current_item = None

    for line in fm.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue

        top_m = re.match(r"^([a-zA-Z0-9_-]+):\s*(.*)$", line)
        if top_m and not line.startswith(" ") and not line.startswith("\t"):
            key = top_m.group(1)
            val = re.split(r'\s+#', top_m.group(2))[0].strip().strip(chr(39) + chr(34))
            if key in STRUCTURED_LIST_KEYS:
                current_section = key
                current_item = None
            else:
                current_section = None
                current_item = None
                data[key] = val
            continue

        if current_section in STRUCTURED_LIST_KEYS:
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

def parse_about_file(filepath):
    return parse_structured_page_file(filepath)

def sync():
    os.makedirs(POSTS_DIR, exist_ok=True)
    exclude_cfg = load_config_exclude()
    exclude_files = set(exclude_cfg.get("files", []))
    exclude_dirs = set(exclude_cfg.get("dirs", []))
    show_test = exclude_cfg.get("showTest", True)

    md_files = []
    for root, dirs, files in os.walk(POSTS_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and d not in exclude_dirs]
        for file in files:
            if file.endswith(".md") or file.endswith(".markdown"):
                rel = os.path.relpath(os.path.join(root, file), POSTS_DIR)
                if file in exclude_files or rel in exclude_files:
                    print(f" ⊘ 跳过排除文件 (exclude.files): {rel}")
                    continue
                md_files.append(os.path.join(root, file))

    synced_posts = []
    columns_map = {}

    for filepath in sorted(md_files):
        p = parse_md_file(filepath)
        if not show_test and p.get("isTest"):
            print(f" ⊘ 跳过测试文档 (showTest=false): {p['relPath']}")
            continue

        synced_posts.append(p)
        col = p.get("column")

        if col:
            if col not in columns_map:
                columns_map[col] = {
                    "id": col,
                    "name": p.get("columnName") or col.replace("-", " ").replace("_", " ").title(),
                    "desc": p.get("columnDesc") or "",
                    "icon": "layers",
                    "posts": []
                }
            columns_map[col]["posts"].append(p)

        extra_info = []
        if col: extra_info.append(f"专栏: {p['columnName']} Part {p['order']}")
        if p.get("isTest"): extra_info.append("[TEST]")
        if p.get("slide"): extra_info.append("[SLIDE]")
        info_str = " (" + ", ".join(extra_info) + ")" if extra_info else ""
        print(f" -> 扫描博文: {p['relPath']}{info_str}")

    columns_list = []
    for col_id, col_info in columns_map.items():
        col_info["posts"].sort(key=lambda x: x["order"])
        named_post = next((p for p in col_info["posts"] if p.get("columnName")), None)
        if named_post:
            col_info["name"] = named_post["columnName"]
        desc_post = next((p for p in col_info["posts"] if p.get("columnDesc")), None)
        if desc_post:
            col_info["desc"] = desc_post["columnDesc"]
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

    # 结构化扫描所有独立单页 (Pages: 包含根目录 md 文件及 posts/ 下声明 type: page 的独立页面)
    pages_map = {}
    custom_pages = {}
    if about_data:
        pages_map["about"] = about_data
        pages_map["about.md"] = about_data

    for filename in sorted(os.listdir(BASE_DIR)):
        if filename.endswith(".md") and filename not in ["README.md", "about.md", "AGENTS.md"]:
            p_path = os.path.join(BASE_DIR, filename)
            p_data = parse_structured_page_file(p_path)
            if p_data:
                p_id = os.path.splitext(filename)[0]
                pages_map[p_id] = p_data
                pages_map[filename] = p_data
                custom_pages[p_id] = p_data["raw"]
                print(f" -> 扫描独立单页 [根目录]: {filename}")

    for p in synced_posts:
        if p.get("type") == "post":
            full_p = os.path.join(POSTS_DIR, p["relPath"])
            p_data = parse_structured_page_file(full_p)
            if p_data:
                p_data["title"] = p.get("title") or p_data["title"]
                p_data["excerpt"] = p.get("excerpt") or ""
                p_id = p.get("slug") or p.get("id")
                pages_map[p_id] = p_data
                pages_map[p["relPath"]] = p_data
                pages_map[os.path.basename(p["relPath"])] = p_data
                custom_pages[p_id] = p_data["raw"]
                print(f" -> 扫描独立单页 [posts]: {p['relPath']}")

    source_paths = md_files + [p for p in [about_path, os.path.join(BASE_DIR, "blog.config.js")] if os.path.exists(p)]
    latest_source_mtime = max((os.path.getmtime(path) for path in source_paths), default=0)

    payload = {
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(latest_source_mtime)),
        "posts": synced_posts,
        "columns": columns_list,
        "about": about_data,
        "pages": pages_map,
        "customPages": custom_pages
    }
    js_output = "/** Auto-generated by sync_posts.py - Do not edit manually */\n"
    js_output += "window.BlogPostsData = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    js_output += "window.BlogSampleData = window.BlogPostsData; // Backwards compatibility\n"

    os.makedirs(os.path.dirname(POSTS_DATA_FILE), exist_ok=True)
    with open(POSTS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_output)

    print(f"\n✅ 同步完成！共收录 {len(synced_posts)} 篇博文，{len(columns_list)} 个专栏。")
    print(f" -> 索引文件已更新: js/posts-data.js")

if __name__ == "__main__":
    sync()
