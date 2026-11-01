import importlib.util
from datetime import datetime, timedelta, timezone
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("ingest_news", Path(__file__).with_name("ingest-news.py"))
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)
NOW = datetime(2026, 11, 1, 15, 0, tzinfo=timezone.utc)
SOURCE = ingest.SOURCES[0]

class EditorialFeedTests(unittest.TestCase):
    def test_rss_parses_articles(self):
        rss = b'''<?xml version="1.0"?>
        <rss version="2.0"><channel><item>
        <title>Oferta inmobiliaria y construccion de viviendas en Chile</title>
        <link>https://www.informeconstruccion.com/noticias/proyecto/?utm_source=feed</link>
        <pubDate>Sat, 31 Oct 2026 15:00:00 +0000</pubDate>
        </item></channel></rss>'''
        articles = ingest.parse_source(rss, SOURCE, NOW)
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]["url"], "https://www.informeconstruccion.com/noticias/proyecto/")
        self.assertEqual(articles[0]["source"], SOURCE["name"])
        self.assertIn("2026-10-31", articles[0]["publishedAt"])

    def test_rejects_external_and_malicious_urls(self):
        for url in (
            "https://evil.example/item",
            "http://www.informeconstruccion.com/news",
            "https://www.informeconstruccion.com.evil.example/item",
            "javascript:alert(1)",
            "https://www.informeconstruccion.com@evil.example/item",
            "https://127.0.0.1/item",
        ):
            with self.subTest(url=url):
                self.assertIsNone(ingest.canonical_url(url, SOURCE["hosts"]))

    def test_uses_atom_links_and_dates(self):
        atom = b'''<feed xmlns="http://www.w3.org/2005/Atom">
        <entry><title>El mercado inmobiliario y nueva oferta de viviendas</title>
        <link rel="alternate" href="https://www.informeconstruccion.com/mercado/"/>
        <updated>2026-10-31T12:00:00Z</updated></entry></feed>'''
        result = ingest.parse_source(atom, SOURCE, NOW)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["category"], "Mercado")

    def test_relevance_filter_for_general_feed(self):
        sii = next(s for s in ingest.SOURCES if s["id"] == "sii-noticias")
        xml = b'''<rss version="2.0"><channel>
        <item><title>Calendario de facturacion electronica para empresas</title>
        <link>https://www.sii.cl/noticia-uno</link><pubDate>Sat, 31 Oct 2026 13:00:00 +0000</pubDate></item>
        <item><title>Devolucion del IVA para viviendas nuevas en Chile</title>
        <link>https://www.sii.cl/noticia-dos</link><pubDate>Sat, 31 Oct 2026 12:00:00 +0000</pubDate></item>
        </channel></rss>'''
        articles=ingest.parse_source(xml, sii, NOW)
        self.assertEqual(len(articles), 1)
        self.assertIn("IVA", articles[0]["title"])

    def test_dedupe_old_and_new_and_retain_when_offline(self):
        article = {
            "id": "ref01", "title": "Proyecto inmobiliario y construcción en Chile",
            "url": "https://www.informeconstruccion.com/mercado/",
            "source": SOURCE["name"], "sourceId": SOURCE["id"], "category": "Mercado",
            "publishedAt": "2026-10-31T12:00:00Z"
        }
        merged = ingest.assemble({"items": [article], "updatedAt": "2026-11-01T12:00:00Z"},
                                  [dict(article)], [{"id": SOURCE["id"],"name":SOURCE["name"],"ok":True,"count":1}], NOW)
        self.assertEqual(len(merged["items"]), 1)
        offline = ingest.assemble(merged, [], [{"id":SOURCE["id"],"name":SOURCE["name"],"ok":False,"count":0}], NOW+timedelta(hours=2))
        self.assertEqual(len(offline["items"]), 1)
        self.assertEqual(offline["updatedAt"], merged["updatedAt"])

    def test_rejects_oversized_xml_and_bad_format(self):
        with self.assertRaises(ValueError):
            ingest.feed_entries(b"<x />")
        with self.assertRaises(ValueError):
            ingest.feed_entries(b"a"*(ingest.MAX_BYTES + 1))

    def test_preserves_escaped_titles_without_html(self):
        rss = b'''<rss><channel><item><title>Mercado inmobiliario &amp; viviendas &lt;oferta&gt;</title>
        <link>https://www.informeconstruccion.com/noticias/</link>
        <pubDate>Sat, 31 Oct 2026 15:00:00 +0000</pubDate>
        </item></channel></rss>'''
        result = ingest.parse_source(rss, SOURCE, NOW)
        self.assertEqual(len(result), 1)
        self.assertNotIn("&amp;", result[0]["title"])

    def test_no_invented_publication_dates(self):
        rss = b'''<rss><channel><item><title>La vivienda y la actividad inmobiliaria en Chile</title>
        <link>https://www.informeconstruccion.com/noticias/</link>
        </item></channel></rss>'''
        self.assertEqual(ingest.parse_source(rss, SOURCE, NOW), [])

if __name__ == "__main__":
    unittest.main()
