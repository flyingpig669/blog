"""Build cached PDF previews for locally referenced Office attachments."""
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit
from xml.sax.saxutils import escape


OFFICE_SUFFIXES = {'.doc', '.docx', '.ppt', '.pptx'}


def attachment_sources(document):
    sources = list(document.get('attachments') or [])
    content = re.sub(r'(?ms)^\s*(`{3,}|~{3,})[^\n]*\n.*?^\s*\1[^\n]*$', '', document.get('content', ''))
    content = re.sub(r'(`+).*?\1', '', content)
    for target in re.findall(r'\[[^\]\n]*\]\(([^)\n]+)\)', content):
        target = target.strip()
        if target.startswith('<') and '>' in target:
            target = target[1:target.index('>')]
        else:
            target = re.split(r'\s+[\"\']', target, maxsplit=1)[0]
        sources.append(target)
    return sorted(set(sources))


def build_previews(document, root, output):
    previews = {}
    attachment_root = (Path(root) / 'attachments').resolve()
    for url in attachment_sources(document):
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc:
            continue
        relative = unquote(parsed.path).removeprefix('./')
        source = (Path(root) / relative).resolve()
        if source.suffix.lower() not in OFFICE_SUFFIXES:
            continue
        if not source.is_relative_to(attachment_root) or not source.is_file():
            raise ValueError(f'Office 附件必须位于 attachments/ 且存在：{url}')
        digest = hashlib.sha256(b'office-pdf-v2\0' + source.suffix.lower().encode() + source.read_bytes()).hexdigest()
        preview_url = f'data/office/{digest}.pdf'
        destination = Path(output) / preview_url
        if not destination.is_file():
            executable = os.environ.get('AURORA_SOFFICE') or shutil.which('soffice')
            mac_executable = '/Applications/LibreOffice.app/Contents/MacOS/soffice'
            if not executable and Path(mac_executable).is_file():
                executable = mac_executable
            if not executable:
                raise ValueError('Office 预览需要 LibreOffice：请安装后重新构建，或设置 AURORA_SOFFICE 指向 soffice。')
            destination.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.TemporaryDirectory(prefix='aurora-office-') as temporary:
                workspace = Path(temporary)
                input_file = workspace / ('document' + source.suffix.lower())
                shutil.copyfile(source, input_file)
                environment = os.environ.copy()
                # Headless macOS builds may use Fontconfig instead of CoreText.
                # Include system fonts so Chinese text has a real glyph fallback.
                if sys.platform == 'darwin' and not environment.get('FONTCONFIG_FILE'):
                    fontconfig = workspace / 'fonts.conf'
                    directories = ['/System/Library/Fonts', '/Library/Fonts', str(Path.home() / 'Library/Fonts')]
                    fontconfig.write_text('<?xml version="1.0"?><fontconfig>' +
                        ''.join('<dir>' + escape(directory) + '</dir>' for directory in directories) +
                        '<cachedir>' + escape(str(workspace / 'font-cache')) + '</cachedir></fontconfig>', encoding='utf-8')
                    environment['FONTCONFIG_FILE'] = str(fontconfig)
                result = subprocess.run([
                    executable, '-env:UserInstallation=' + (workspace / 'profile').as_uri(),
                    '--headless', '--convert-to', 'pdf', '--outdir', str(workspace), str(input_file)
                ], capture_output=True, text=True, timeout=120, env=environment)
                converted = workspace / 'document.pdf'
                if result.returncode != 0 or not converted.is_file() or not converted.read_bytes().startswith(b'%PDF-'):
                    raise ValueError(f'Office 附件转换失败：{url}\n{result.stdout}\n{result.stderr}')
                # Conversion finishes in isolation before the preview becomes visible.
                shutil.copyfile(converted, destination)
        previews[url] = preview_url
    return previews
