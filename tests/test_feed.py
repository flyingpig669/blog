import unittest
import xml.etree.ElementTree as ET
from scripts.python.lib.feed import render_feed
from scripts.python.lib.frontmatter import parse_frontmatter

class FeedTests(unittest.TestCase):
    def test_home_and_rss_are_independent_and_xml_is_escaped(self):
        posts=[{'slug':'中文','title':'A & B','date':'2026-10-16','home':False,'rss':True}, {'slug':'hidden','title':'Hidden','home':False}, {'slug':'opt-out','title':'Out','rss':False}, {'slug':'page','title':'Page','type':'post'}]
        root=ET.fromstring(render_feed(posts,{'title':'Blog','url':'https://example.com/blog','description':'Description'}))
        items=root.findall('./channel/item')
        self.assertEqual(len(items),1)
        self.assertEqual(items[0].findtext('title'),'A & B')
        self.assertEqual(items[0].findtext('link'),'https://example.com/blog/#/posts/%E4%B8%AD%E6%96%87')
        self.assertIn('16 Oct 2026',items[0].findtext('pubDate'))

    def test_global_hidden_visibility_respects_explicit_opt_out(self):
        posts=[{'slug':'hidden','title':'Hidden','home':False},{'slug':'out','title':'Out','rss':False}]
        root=ET.fromstring(render_feed(posts,{'url':'https://example.com'},include_hidden=True))
        self.assertEqual(len(root.findall('./channel/item')),1)

    def test_rss_flag_rejects_non_boolean_values(self):
        with self.assertRaisesRegex(ValueError,'rss'):
            parse_frontmatter('---\nrss: perhaps\n---\nBody','sample.md')
