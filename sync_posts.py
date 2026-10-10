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
import hashlib
import subprocess
from xml.sax.saxutils import escape as escape_xml
from lib.frontmatter import parse_frontmatter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(BASE_DIR, "posts")
POSTS_DATA_FILE = os.path.join(BASE_DIR, "js", "posts-data.js")

IGNORE_DIRS = {".git", ".github", ".vscode", "node_modules", "assets", "attachments", "images", "img", "slides", "vendor", "templates", "drafts"}

# 文档类型字典：
#   normal = 普通文章（默认，进入首页/归档/标签等博文流）
#   post   = 结构化独立页（支持 status/quote/bio/timeline/focusAreas/social 等区块，类似 about）
# 兼容旧写法：page / page-mode / standalone 等一律归一化为 post。
RICH_DOC_TYPES = {"post", "page", "page-mode", "standalone", "single", "page_mode"}

def slugify(value):
    """生成 URL 安全的 slug：转小写，保留中日韩字符，其余非字母数字折叠为单个连字符。

    全站唯一的 slug 规则 —— 此前专栏用「仅 ASCII」而文章用「保留中文」两套规则，
    同一个词可能得到不同结果。
    """
    s = re.sub(r"[^a-z0-9\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+", "-", (value or "").strip().lower())
    return s.strip("-")


def estimate_word_units(text):
    """中英混排的「字数」估计：英文按单词计，CJK 按字符计。"""
    ascii_words = len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'_-]*", text or ""))
    cjk_chars = len(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]", text or ""))
    return ascii_words + cjk_chars


def load_config():
    """读取 blog.config.js 中编译期需要的配置：exclude 规则、阅读速度、站点地址。"""
    cfg = {"showTest": True, "files": [], "dirs": [], "wordsPerMinute": 300, "siteUrl": ""}
    config_path = os.path.join(BASE_DIR, "blog.config.js")
    if not os.path.exists(config_path):
        return cfg
    script = 'const fs=require("fs"),vm=require("vm"),ctx={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],"utf8"),ctx,{timeout:1000});process.stdout.write(JSON.stringify(ctx.window.BlogConfig));'
    result = subprocess.run(['node', '-e', script, config_path], capture_output=True, text=True, check=True)
    config = json.loads(result.stdout)
    site = config.get('site', {})
    exclude = config.get('exclude', {})
    cfg.update(exclude)
    cfg['wordsPerMinute'] = int(site.get('wordsPerMinute', 300))
    if cfg['wordsPerMinute'] < 1:
        raise ValueError('site.wordsPerMinute 必须是正整数')
    cfg['siteUrl'] = site.get('url', '').rstrip('/')
    return cfg


def normalize_doc_type(raw):
    """把 FrontMatter 里的 type / layout 归一化为 normal 或 post。"""
    value = (raw or "").strip().lower()
    if value in RICH_DOC_TYPES:
        return "post"
    return "normal"


def parse_md_file(filepath, words_per_minute=300):
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

    metadata, content = parse_frontmatter(raw, filepath)
    if metadata:
        for key, value in metadata.items():
            key = key.lower()
            val = str(value)
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
                attachments = value if isinstance(value, list) else [value] if value else []
            elif key in ["order", "chapter"]:
                if val.isdigit(): order = int(val)
            elif key in ["toclevels", "toc_levels", "toc"]:
                toc_levels = normalize_toc_levels(value)
            elif key == "pinned":
                pinned = (val.lower() == "true")
            elif key == "excerpt":
                excerpt = val
            elif key == "tags":
                tags = value if isinstance(value, list) else [value] if value else []
    else:
        h1_m = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_m:
            title = h1_m.group(1).strip()
            content = re.sub(r"^#\s+.+[\r\n]+", "", content, count=1).strip()

    if not title:
        title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()

    if len(path_parts) >= 3 and path_parts[0] in ["columns", "series", "column"]:
        if not column:
            column = path_parts[1]
    # 若声明了 columnSlug，则用其作为专栏的 URL 标识（满足路由禁用中文的规范）
    if column_slug:
        column = slugify(column_slug) or column

    if not slide:
        slide_m = re.search(r":::\s*(?:slide|pdf|deck)\s+([^\s\r\n]+)", content)
        if slide_m:
            slide = slide_m.group(1).strip()

    if "test" in [t.lower() for t in tags] or is_test:
        is_test = True

    slug = slugify(slug_override) or slugify(os.path.splitext(filename)[0]) or os.path.splitext(filename)[0]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError(f"{rel_path}: 请声明英文小写 slug（使用连字符连接）")
    if column and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", column):
        raise ValueError(f"{rel_path}: 请声明英文小写 columnSlug")
    if column:
        post_id = f"post-col-{column}-{slug}".replace(".", "-")
    else:
        post_id = f"post-{slug}".replace(".", "-")

    if not excerpt:
        clean_text = re.sub(r"[#*>`\[\]]", "", content)
        excerpt = clean_text[:140].replace("\n", " ").strip()
        if len(clean_text) > 140:
            excerpt += "..."

    word_units = estimate_word_units(content)
    read_mins = max(1, round(word_units / max(1, words_per_minute)))
    read_time = f"{read_mins} min read"

    col_display = column_name or (column.replace("-", " ").replace("_", " ").title() if column else "")

    return {
        "id": post_id,
        "slug": slug,
        "title": title,
        "category": category,
        "column": column,
        "columnName": col_display,
        "columnDesc": column_desc,
        "order": order,
        "relPath": rel_path,
        "date": date,
        "readTime": read_time,
        "words": word_units,
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

def normalize_toc_levels(value):
    if value is None:
        return None
    if str(value).lower() in ['false', 'off', 'none', '0']:
        return []
    values = value if isinstance(value, list) else str(value).split(',')
    if any(not str(level).strip().isdigit() or not 1 <= int(level) <= 6 for level in values):
        raise ValueError("FrontMatter: tocLevels 必须是 1 到 6 的层级数组或 false")
    return list(dict.fromkeys(int(level) for level in values))


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
        "slug": slugify(os.path.splitext(filename)[0]),
        "sourcePath": os.path.relpath(filepath, BASE_DIR).replace(os.sep, "/"),
        "status": "",
        "quote": "",
        "bio": "",
        "timeline": [],
        "focusAreas": [],
        "publications": [],
        "social": [],
        "contacts": [],
        "links": [],
        "notes": "",
        "content": "",
        "raw": text,
        "tocLevels": None
    }
    metadata, content = parse_frontmatter(text, filepath)
    if not metadata:
        h1_match = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_match:
            data["title"] = h1_match.group(1).strip()
            content = re.sub(r"^#\s+.+[\r\n]+", "", content, count=1).strip()
    data.update(metadata)
    data["notes"] = content
    data["content"] = content

    # 缺省、显式禁用与层级校验在两类文档中使用同一入口。
    toc = next((data[key] for key in ['tocLevels', 'toclevels', 'toc_levels', 'toc'] if data.get(key) is not None), None)
    data['tocLevels'] = normalize_toc_levels(toc)

    return data

def parse_about_file(filepath):
    return parse_structured_page_file(filepath)

def write_sitemap(site_url):
    """站点配置了 site.url 时生成 sitemap.xml。

    注意：本站使用 Hash 路由（#/posts/xxx）。搜索引擎不会把 Hash 片段视为独立 URL，
    因此 sitemap 只列出站点根地址 —— 若列出 #/... 形式反而会误导爬虫。
    """
    if not site_url:
        return False
    today = time.strftime("%Y-%m-%d")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += f'  <url>\n    <loc>{escape_xml(site_url)}/</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>daily</changefreq>\n  </url>\n'
    xml += '</urlset>\n'
    with open(os.path.join(BASE_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)
    return True


def sync():
    os.makedirs(POSTS_DIR, exist_ok=True)
    cfg = load_config()
    exclude_files = set(cfg.get("files", []))
    exclude_dirs = set(cfg.get("dirs", []))
    show_test = cfg.get("showTest", True)
    words_per_minute = cfg.get("wordsPerMinute", 300)

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
    slug_sources = {}

    for filepath in sorted(md_files):
        p = parse_md_file(filepath, words_per_minute)
        if not show_test and p.get("isTest"):
            print(f" ⊘ 跳过测试文档 (showTest=false): {p['relPath']}")
            continue

        if p["slug"] in slug_sources:
            raise ValueError(f"重复 slug '{p['slug']}': {slug_sources[p['slug']]} 与 {p['relPath']}")
        slug_sources[p["slug"]] = p["relPath"]

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
    def register_page(key, page):
        previous = pages_map.get(key)
        if previous and previous['sourcePath'] != page['sourcePath']:
            raise ValueError(f"重复文档路径 {key}: {previous['sourcePath']} 与 {page['sourcePath']}")
        pages_map[key] = page

    if about_data:
        register_page("about", about_data)
        register_page("about.md", about_data)

    for filename in sorted(os.listdir(BASE_DIR)):
        if filename.endswith(".md") and filename not in ["README.md", "about.md", "AGENTS.md"]:
            p_path = os.path.join(BASE_DIR, filename)
            p_data = parse_structured_page_file(p_path)
            if p_data:
                p_id = os.path.splitext(filename)[0]
                register_page(p_id, p_data)
                register_page(filename, p_data)
                print(f" -> 扫描独立单页 [根目录]: {filename}")

    for p in synced_posts:
        if p.get("type") == "post":
            full_p = os.path.join(POSTS_DIR, p["relPath"])
            p_data = parse_structured_page_file(full_p)
            if p_data:
                p_data["title"] = p.get("title") or p_data["title"]
                p_data["excerpt"] = p.get("excerpt") or ""
                p_data["slug"] = p["slug"]
                p_data["sourcePath"] = "posts/" + p["relPath"]
                p_id = p.get("slug") or p.get("id")
                register_page(p_id, p_data)
                register_page(p["relPath"], p_data)
                print(f" -> 扫描独立单页 [posts]: {p['relPath']}")

    # Each document is owned once. Collections and aliases contain IDs only.
    documents = {}
    aliases = {}
    bodies = {}
    for post in synced_posts:
        doc = pages_map.get(post['slug']) if post['type'] == 'post' else post
        doc = dict(post, **(doc or {}))
        doc['sourcePath'] = 'posts/' + post['relPath'].replace(os.sep, '/')
        documents[post['slug']] = doc
    for key, page in pages_map.items():
        slug = page['slug']
        if slug not in documents:
            documents[slug] = dict(page, type='post')
        elif documents[slug]['sourcePath'] != page['sourcePath']:
            raise ValueError(f"重复文档标识 {slug}: {page['sourcePath']}")
        previous = aliases.get(key.lower())
        if previous and previous != slug:
            raise ValueError(f'重复文档路径 {key}')
        aliases[key.lower()] = slug
    search = {}
    for slug, doc in documents.items():
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError(f"{doc['sourcePath']}: 请声明英文小写 slug")
        for alias in [slug, doc.get('id'), doc['sourcePath'], doc.get('relPath')]:
            if alias:
                alias = alias.lower()
                if alias in aliases and aliases[alias] != slug:
                    raise ValueError(f'重复文档路径 {alias}')
                aliases[alias] = slug
        clean_doc = {key: value for key, value in doc.items() if key not in ['raw', 'notes']}
        body = json.dumps(clean_doc, ensure_ascii=False, separators=(',', ':'))
        digest = hashlib.sha256(body.encode('utf-8')).hexdigest()[:16]
        body_url = f'data/documents/{slug}.{digest}.json'
        bodies[body_url] = body
        keep = ['id', 'slug', 'title', 'type', 'sourcePath', 'relPath', 'date', 'category', 'tags',
                'column', 'columnName', 'columnDesc', 'order', 'readTime', 'words', 'pinned', 'isTest', 'excerpt', 'tocLevels']
        documents[slug] = {key: doc[key] for key in keep if key in doc}
        documents[slug]['bodyUrl'] = body_url
        if doc.get('type', 'normal') == 'normal':
            search[slug] = doc.get('content', '')
    search_builder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'search-text.js')
    search_text = subprocess.run(['node', search_builder], input=json.dumps(search, ensure_ascii=False), text=True, capture_output=True, check=True).stdout
    search_digest = hashlib.sha256(search_text.encode('utf-8')).hexdigest()[:16]
    search_url = f'data/search.{search_digest}.json'
    bodies[search_url] = search_text
    for url, body in bodies.items():
        target = os.path.join(BASE_DIR, url)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, 'w', encoding='utf-8') as file:
            file.write(body)
    for column in columns_list:
        column['postIds'] = [post['slug'] for post in column.pop('posts')]
    payload = {
        'schemaVersion': 2,
        'documents': documents,
        'aliases': aliases,
        'posts': [post['slug'] for post in synced_posts],
        'columns': columns_list,
        'about': about_data['slug'] if about_data else None,
        'searchUrl': search_url
    }
    js_output = "/** Auto-generated by sync_posts.py - Do not edit manually */\n"
    js_output += "window.BlogPostsData = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"

    os.makedirs(os.path.dirname(POSTS_DATA_FILE), exist_ok=True)
    with open(POSTS_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(js_output)

    print(f"\n✅ 同步完成！共收录 {len(synced_posts)} 篇博文，{len(columns_list)} 个专栏。")
    print(f" -> 索引文件已更新: js/posts-data.js")
    if write_sitemap(cfg.get("siteUrl", "")):
        print(f" -> sitemap.xml 已生成: {cfg['siteUrl']}/")
    else:
        print(" ℹ️ 未设置 site.url，已跳过 sitemap.xml（在 blog.config.js 的 site.url 填入站点地址即可启用）")

if __name__ == "__main__":
    sync()
