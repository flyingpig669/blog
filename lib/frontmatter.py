"""One safe YAML reader and schema for ordinary and structured documents."""
import datetime
import re
import yaml


class UniqueLoader(yaml.BaseLoader):
    def construct_mapping(self, node, deep=False):
        result = {}
        folded = set()
        for key_node, value_node in node.value:
            key = self.construct_object(key_node, deep=deep)
            if not isinstance(key, str) or key.lower() in folded:
                raise ValueError(f"第 {key_node.start_mark.line + 1} 行: 重复或非法字段 {key!r}")
            folded.add(key.lower())
            result[key] = self.construct_object(value_node, deep=deep)
        return result


def parse_frontmatter(text, source='<document>'):
    text = text.replace('\r\n', '\n').lstrip('\ufeff')
    if not text.startswith('---\n'):
        return {}, text.strip()
    match = re.match(r'^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$', text)
    if not match:
        raise ValueError(f'{source}: FrontMatter 缺少结束分隔符 ---')
    try:
        metadata = yaml.load(match.group(1), Loader=UniqueLoader) or {}
        if not isinstance(metadata, dict):
            raise ValueError('FrontMatter 必须是字段映射')
        validate_metadata(metadata)
    except (yaml.YAMLError, ValueError) as error:
        raise ValueError(f'{source}: {error}') from error
    return metadata, match.group(2).strip()


def validate_metadata(data):
    fields = {key.lower(): value for key, value in data.items()}
    scalar_keys = ['title', 'slug', 'date', 'category', 'column', 'columnslug', 'columnname',
                   'columndesc', 'type', 'layout', 'excerpt', 'slide', 'pdf', 'status']
    for key in scalar_keys:
        if key in fields and not isinstance(fields[key], str):
            raise ValueError(f'{key} 必须是文本')
    if fields.get('date'):
        value = fields['date']
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
            raise ValueError('date 必须使用 YYYY-MM-DD')
        try:
            datetime.date.fromisoformat(value)
        except ValueError as error:
            raise ValueError('date 不是有效日期') from error
    for key in ['pinned', 'test']:
        if key in fields and (not isinstance(fields[key], str) or fields[key].lower() not in ['true', 'false']):
            raise ValueError(f'{key} 必须是 true 或 false')
    for key in ['type', 'layout']:
        if key in fields and fields[key].lower() not in ['normal', 'post', 'page', 'page-mode', 'standalone', 'single', 'page_mode']:
            raise ValueError(f'{key} 必须是 normal 或 post')
    for key in ['order', 'chapter']:
        if key in fields and (not isinstance(fields[key], str) or not fields[key].isdigit() or int(fields[key]) < 1):
            raise ValueError(f'{key} 必须是正整数')
    for key in ['tags', 'attachments', 'attachment']:
        if key in fields:
            value = fields[key]
            if not (isinstance(value, str) or isinstance(value, list) and all(isinstance(item, str) for item in value)):
                raise ValueError(f'{key} 必须是文本或文本数组')
    for key in ['bio', 'quote', 'author', 'authors']:
        value = fields.get(key)
        if value is not None and not (isinstance(value, str) or isinstance(value, list) and all(isinstance(line, str) for line in value)):
            raise ValueError(f'{key} 必须是文本或文本数组')
    for key in ['timeline', 'focusareas', 'publications', 'social', 'contacts', 'links']:
        if key in fields and not (isinstance(fields[key], list) and all(isinstance(item, dict) for item in fields[key])):
            raise ValueError(f'{key} 必须是对象列表（没有条目时写 []）')
    for pub in fields.get('publications', []):
        if not isinstance(pub.get('title'), str) or not pub['title'].strip():
            raise ValueError('publications 条目必须有 title')
        if 'year' in pub and not re.fullmatch(r'\d{4}', str(pub['year'])):
            raise ValueError('publications.year 必须是四位年份')
        if 'citations' in pub and not str(pub['citations']).isdigit():
            raise ValueError('publications.citations 必须是非负整数')
    for key in ['timeline', 'focusareas', 'publications']:
        for item in fields.get(key, []):
            for name in ['title', 'desc', 'detail', 'abstract', 'authors']:
                value = item.get(name)
                if value is not None and not (isinstance(value, str) or isinstance(value, list) and all(isinstance(line, str) for line in value)):
                    raise ValueError(f'{key}.{name} 必须是文本或文本数组')
            if 'links' in item and not isinstance(item['links'], dict):
                raise ValueError(f'{key}.links 必须是资源映射')
            for kind, value in item.get('links', {}).items():
                if not (isinstance(value, str) or key != 'publications' and isinstance(value, list) and all(isinstance(link, str) for link in value)):
                    raise ValueError(f'{key}.links.{kind} 必须是文本链接')
