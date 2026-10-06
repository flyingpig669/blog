#!/usr/bin/env python3
import os
import re
import json
import glob

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(BASE_DIR, "posts")
SAMPLE_DATA_FILE = os.path.join(BASE_DIR, "js", "sample-data.js")

def parse_md_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    title = ""
    date = "2026-10-06"
    category = "backend"
    tags = []
    content = raw

    # Parse YAML frontmatter
    fm_match = re.match(r"^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$", raw)
    if fm_match:
        fm = fm_match.group(1)
        content = fm_match.group(2).strip()
        t_match = re.search(r"^title:\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if t_match: title = t_match.group(1).strip()
        d_match = re.search(r"^date:\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if d_match: date = d_match.group(1).strip()
        c_match = re.search(r"^category:\s*['\"]?(.*?)['\"]?$", fm, re.M)
        if c_match: category = c_match.group(1).strip()
        tags_match = re.search(r"^tags:\s*\[?(.*?)\]?$", fm, re.M)
        if tags_match:
            tags = [t.strip().strip("'\"") for t in tags_match.group(1).split(",") if t.strip()]
    else:
        h1_match = re.search(r"^#\s+(.+)$", content, re.M)
        if h1_match:
            title = h1_match.group(1).strip()
            content = re.sub(r"^#\s+.+\n+", "", content, count=1).strip()

    filename = os.path.basename(filepath)
    if not title:
        title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ")

    post_id = "post-md-" + os.path.splitext(filename)[0]
    cat_names = {"ai": "人工智能", "frontend": "前端技术", "backend": "后端架构", "design": "设计美学", "life": "思考随笔"}
    gradients = ["from-blue-600 to-cyan-500", "from-purple-600 to-indigo-600", "from-emerald-600 to-teal-500", "from-pink-600 to-rose-500", "from-amber-500 to-orange-500"]
    cover_gradient = gradients[hash(post_id) % len(gradients)]
    excerpt = re.sub(r"[#*`>\[\]]", "", content)[:140].replace("\n", " ").strip() + "..."

    return {
        "id": post_id,
        "slug": os.path.splitext(filename)[0],
        "title": title,
        "category": category,
        "categoryName": cat_names.get(category, "技术随笔"),
        "coverGradient": cover_gradient,
        "date": date,
        "readTime": f"{max(1, len(content) // 400)} 分钟",
        "words": len(content),
        "views": 1,
        "likes": 0,
        "pinned": False,
        "excerpt": excerpt,
        "tags": tags or ["Markdown"],
        "content": content
    }

def sync():
    if not os.path.exists(SAMPLE_DATA_FILE):
        print(f"Error: {SAMPLE_DATA_FILE} not found.")
        return
    with open(SAMPLE_DATA_FILE, "r", encoding="utf-8") as f:
        js_text = f.read()
    prefix = "window.BlogSampleData = "
    if js_text.startswith(prefix):
        json_str = js_text[len(prefix):].rstrip(";\n")
        data = json.loads(json_str)
    else:
        print("Error: Could not parse sample-data.js")
        return
    md_files = glob.glob(os.path.join(POSTS_DIR, "*.md"))
    if not md_files:
        print(f"No .md files found in {POSTS_DIR}")
        return
    existing_ids = {p["id"]: p for p in data.get("posts", [])}
    synced_count = 0
    for filepath in md_files:
        new_post = parse_md_file(filepath)
        existing_ids[new_post["id"]] = new_post
        synced_count += 1
        print(f" -> 导入文件: {os.path.basename(filepath)} => {new_post['title']}")
    data["posts"] = list(existing_ids.values())
    with open(SAMPLE_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(prefix + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")
    print(f"\n✅ 同步完成！已成功扫描并提交 {synced_count} 篇 Markdown 文章至博客数据中心。")

if __name__ == "__main__":
    sync()