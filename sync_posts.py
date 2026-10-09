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

IGNORE_DIRS = {".git", ".github", ".vscode", "node_modules", "assets", "attachments", "images", "img", "slides", "vendor"}

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
    project = ""
    project_name = ""
    order = 999
    tags = []
    pinned = False
    excerpt = ""
    slide = ""
    attachments = []
    is_test = False
    doc_type = "post"
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
            elif key in ["columnname", "column_name", "columntitle", "column_title"]:
                column_name = val
            elif key in ["project", "projects", "proj"]:
                project = val
            elif key in ["projectname", "project_name", "projecttitle", "project_title"]:
                project_name = val
            elif key == "test":
                is_test = (val.lower() == "true")
            elif key in ["type", "layout"]:
                doc_type = val.lower()
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
    if column:
        section = "columns"
    elif project:
        section = "projects"
    elif len(path_parts) >= 3 and path_parts[0] in ["projects", "project"]:
        section = "projects"
        project = path_parts[1]
    elif len(path_parts) == 2 and path_parts[0] in ["projects", "project"]:
        section = "projects"
        project = path_parts[0]
    elif len(path_parts) >= 3 and path_parts[0] in ["columns", "series", "column"]:
        section = "columns"
        if not column: column = path_parts[1]

    if not slide:
        slide_m = re.search(r":::\s*(?:slide|pdf|deck)\s+([^\s\r\n]+)", content)
        if slide_m:
            slide = slide_m.group(1).strip()

    if "test" in [t.lower() for t in tags] or is_test:
        is_test = True

    slug = os.path.splitext(filename)[0]
    if column:
        post_id = f"post-col-{column}-{slug}".replace(" ", "-").replace(".", "-")
    elif project:
        post_id = f"post-proj-{project}-{slug}".replace(" ", "-").replace(".", "-")
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
    proj_display = project_name or (project.replace("-", " ").replace("_", " ").title() if project else "")

    return {
        "id": post_id,
        "slug": slug,
        "title": title,
        "category": category,
        "section": section,
        "column": column,
        "columnName": col_display,
        "project": project,
        "projectName": proj_display,
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
        "social": [],
        "contacts": [],
        "links": [],
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
            if key in ["timeline", "focusAreas", "projects", "social", "contacts", "links"]:
                current_section = key
                current_item = None
            else:
                current_section = None
                current_item = None
                data[key] = val
            continue

        if current_section in ["timeline", "focusAreas", "projects", "social", "contacts", "links"]:
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
    projects_map = {}

    for filepath in sorted(md_files):
        p = parse_md_file(filepath)
        if not show_test and p.get("isTest"):
            print(f" ⊘ 跳过测试文档 (showTest=false): {p['relPath']}")
            continue

        synced_posts.append(p)
        col = p.get("column")
        proj = p.get("project")

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

        if proj:
            if proj not in projects_map:
                projects_map[proj] = {
                    "id": proj,
                    "name": p.get("projectName") or proj.title(),
                    "desc": f"Engineering project collection for {p.get('projectName') or proj}.",
                    "icon": "folder",
                    "posts": []
                }
            projects_map[proj]["posts"].append(p)

        extra_info = []
        if col: extra_info.append(f"专栏: {p['columnName']} Part {p['order']}")
        if proj: extra_info.append(f"项目: {p['projectName']}")
        if p.get("isTest"): extra_info.append("[TEST]")
        if p.get("slide"): extra_info.append("[SLIDE]")
        info_str = " (" + ", ".join(extra_info) + ")" if extra_info else ""
        print(f" -> 扫描博文: {p['relPath']}{info_str}")

    columns_list = []
    for col_id, col_info in columns_map.items():
        col_info["posts"].sort(key=lambda x: x["order"])
        col_info["postsCount"] = len(col_info["posts"])
        col_info["totalWords"] = sum(x["words"] for x in col_info["posts"])
        columns_list.append(col_info)

    projects_list = []
    for proj_id, proj_info in projects_map.items():
        proj_info["posts"].sort(key=lambda x: x["order"])
        proj_info["postsCount"] = len(proj_info["posts"])
        proj_info["totalWords"] = sum(x["words"] for x in proj_info["posts"])
        projects_list.append(proj_info)

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
        "projects": projects_list,
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

    print(f"\n✅ 同步完成！共收录 {len(synced_posts)} 篇博文，{len(columns_list)} 个专栏，{len(projects_list)} 个项目集合。")
    print(f" -> 索引文件已更新: js/posts-data.js")

if __name__ == "__main__":
    sync()
