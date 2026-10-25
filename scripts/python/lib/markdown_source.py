"""Ignore literal examples when discovering resources in Markdown source."""
import re


def without_examples(text):
    # A longer closing fence is valid; an unclosed fence consumes the remainder.
    lines = []
    fence = None
    for line in text.splitlines(keepends=True):
        match = re.match(r'^ {0,3}(?:>[ \t]*)*(`{3,}|~{3,})(.*)$', line.rstrip('\r\n'))
        if fence:
            if match and match[1][0] == fence[0] and len(match[1]) >= len(fence) and not match[2].strip():
                fence = None
            continue
        if match:
            fence = match[1]
            continue
        if not re.match(r'^(?: {4}|\t)', line):
            lines.append(line)
    visible = ''.join(lines)
    visible = re.sub(r'(`+)([\s\S]*?)\1(?!`)', '', visible)
    return re.sub(r'<!--[\s\S]*?(?:-->|$)', '', visible)
