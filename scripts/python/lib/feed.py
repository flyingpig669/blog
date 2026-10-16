"""RSS metadata feed; home visibility and subscription visibility are independent."""
from datetime import datetime, timezone
from email.utils import format_datetime
from urllib.parse import quote
import xml.etree.ElementTree as ET

def render_feed(posts, site, posts_route='/posts', include_hidden=False):
    root = ET.Element('rss', version='2.0')
    channel = ET.SubElement(root, 'channel')
    for key, value in [('title',site.get('title','')),('link',site.get('url','')),('description',site.get('description',''))]:
        ET.SubElement(channel,key).text = value
    selected = [post for post in posts if post.get('rss') is not False and (post.get('home') is not False or include_hidden or post.get('rss') is True) and post.get('type') not in ['post','page']]
    for post in sorted(selected,key=lambda p:(p.get('date',''),p['slug']),reverse=True)[:50]:
        item = ET.SubElement(channel,'item')
        url = site['url'].rstrip('/') + '/#' + posts_route + '/' + quote(post['slug'],safe='')
        ET.SubElement(item,'title').text = post['title']
        ET.SubElement(item,'link').text = url
        ET.SubElement(item,'guid',isPermaLink='true').text = url
        ET.SubElement(item,'description').text = post.get('excerpt','')
        if post.get('date'):
            date=datetime.fromisoformat(post['date']).replace(tzinfo=timezone.utc)
            ET.SubElement(item,'pubDate').text = format_datetime(date,usegmt=True)
        for tag in post.get('tags',[]): ET.SubElement(item,'category').text=tag
    return ET.tostring(root,encoding='unicode',xml_declaration=True) + '\n'
