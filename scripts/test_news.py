import importlib.util
from datetime import datetime, timedelta, timezone
import unittest
from unittest.mock import patch
import tempfile
import json
import sys
import io
from contextlib import redirect_stdout, redirect_stderr
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
        <link>https://www.df.cl/noticias/proyecto/?utm_source=feed</link>
        <pubDate>Sat, 31 Oct 2026 15:00:00 +0000</pubDate>
        </item></channel></rss>'''
        articles = ingest.parse_source(rss, SOURCE, NOW)
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]["url"], "https://www.df.cl/noticias/proyecto/")
        self.assertEqual(articles[0]["source"], SOURCE["name"])
        self.assertIn("2026-10-31", articles[0]["publishedAt"])

    def test_rejects_external_and_malicious_urls(self):
        for url in (
            "https://evil.example/item",
            "http://www.df.cl/news",
            "https://www.df.cl.evil.example/item",
            "javascript:alert(1)",
            "https://www.df.cl@evil.example/item",
            "https://127.0.0.1/item",
        ):
            with self.subTest(url=url):
                self.assertIsNone(ingest.canonical_url(url, SOURCE["hosts"]))

    def test_uses_atom_links_and_dates(self):
        atom = b'''<feed xmlns="http://www.w3.org/2005/Atom">
        <entry><title>El mercado inmobiliario y nueva oferta de viviendas</title>
        <link rel="alternate" href="https://www.df.cl/mercado/"/>
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
            "url": "https://www.df.cl/mercado/",
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
        <link>https://www.df.cl/noticias/</link>
        <pubDate>Sat, 31 Oct 2026 15:00:00 +0000</pubDate>
        </item></channel></rss>'''
        result = ingest.parse_source(rss, SOURCE, NOW)
        self.assertEqual(len(result), 1)
        self.assertNotIn("&amp;", result[0]["title"])

    def test_foreign_real_estate_is_not_chilean_content(self):
        self.assertFalse(ingest.is_relevant_title(
            "El millonario negocio inmobiliario de un empresario en Miami"))
        self.assertFalse(ingest.is_relevant_title(
            "El mercado inmobiliario bonaerense muestra recuperación en Argentina"))
        self.assertTrue(ingest.is_relevant_title(
            "Subsidios habitacionales para viviendas en Chile"))
        self.assertTrue(ingest.is_relevant_title(
            "El mercado inmobiliario de Santiago registra más ventas"))

    def test_book_title_is_not_a_house_listing(self):
        self.assertFalse(ingest.is_relevant_title(
            "Isabel Allende ganó el Premio Planeta por La Casa de los Espíritus"))
        self.assertFalse(ingest.is_relevant_title(
            "La casa de los Espíritus tendrá nueva adaptación de televisión"))

    def test_previous_irrelevant_items_are_not_preserved(self):
        old = {
          "schemaVersion":1, "updatedAt":"2026-11-01T12:00:00Z",
          "items":[{
            "id":"foreign", "title":"El negocio inmobiliario de un millonario en Miami",
            "url":"https://www.latercera.com/pulso/negocio-inmobiliario-en-miami",
            "source":"La Tercera", "sourceId":"la-tercera", "category":"Mercado",
            "publishedAt":"2026-11-01T10:00:00Z"
          }]
        }
        result=ingest.assemble(old,[],[{"id":"la-tercera","name":"La Tercera","ok":False,"count":0}],NOW)
        self.assertEqual(result["items"],[])

    def test_total_outage_reports_failure_and_preserves_prior_news(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "news.json"
            article = {"id":"prior", "title":"Proyecto inmobiliario y viviendas en Chile",
                       "url":"https://www.df.cl/mercado/", "source":SOURCE["name"],
                       "sourceId":SOURCE["id"], "category":"Mercado",
                       "publishedAt":datetime.now(timezone.utc).isoformat()}
            previous = {"items":[article], "updatedAt":"2026-11-01T12:00:00Z"}
            output.write_text(json.dumps(previous))
            with patch.object(sys, "argv", ["ingest-news.py", "--output", str(output)]), \
                 patch.object(ingest, "bounded_fetch", side_effect=OSError("offline")), \
                 patch.dict("os.environ", {"GITHUB_STEP_SUMMARY":str(Path(tmp) / "summary.md")}), \
                 redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                status = ingest.main()
            result = json.loads(output.read_text())
            self.assertEqual(result["items"], [article])
            self.assertEqual(result["updatedAt"], previous["updatedAt"])
            self.assertEqual(status, 1, "Una caída total debe fallar en CI")
            self.assertEqual(result["health"], "failed")
            self.assertIn("Estado: **failed**", (Path(tmp) / "summary.md").read_text())

    def test_empty_success_does_not_invent_new_sync(self):
        previous = {"items":[], "updatedAt":"2026-10-31T12:00:00Z"}
        result = ingest.assemble(previous, [], [{"id":SOURCE["id"],"name":SOURCE["name"],"ok":True,"count":0}], NOW)
        self.assertEqual(result["updatedAt"], previous["updatedAt"])
        self.assertEqual(result["health"], "empty")

    def test_partial_outage_is_degraded(self):
        statuses = [{"id":"a","name":"A","ok":True,"count":1},
                    {"id":"b","name":"B","ok":False,"count":0}]
        self.assertEqual(ingest.assemble({"items":[]}, [], statuses, NOW)["health"], "degraded")

    def test_rss_media_image_is_preserved(self):
        rss = b'''<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item>
        <title>El mercado inmobiliario y viviendas nuevas en Chile</title>
        <link>https://www.df.cl/mercado/</link><pubDate>Sat, 31 Oct 2026 12:00:00 +0000</pubDate>
        <media:content url="https://www.df.cl/images/viviendas.jpg" medium="image" type="image/jpeg" width="800" height="450" />
        <media:credit>Diario Financiero</media:credit></item></channel></rss>'''
        result = ingest.parse_source(rss, SOURCE, NOW)
        self.assertEqual(result[0].get("image", {}).get("url"), "https://www.df.cl/images/viviendas.jpg")
        report = ingest.assemble({"items":[]}, result, [{"ok":True,"count":1}], NOW)
        self.assertEqual(report["items"][0]["image"]["sourceUrl"], result[0]["url"])
        self.assertEqual(report["items"][0]["image"]["origin"], "rss")

    def test_enclosure_and_html_description_images(self):
        for media in [
            '<enclosure type="image/jpeg" url="https://www.df.cl/images/casa.jpg"/>',
            '<description>&lt;p&gt;&lt;img src="https://www.df.cl/images/casa.jpg" width="800" height="450"&gt;&lt;/p&gt;</description>',
        ]:
            with self.subTest(media=media):
                rss = ('<rss><channel><item><title>El mercado inmobiliario y viviendas nuevas en Chile</title>'
                       '<link>https://www.df.cl/mercado/</link><pubDate>Sat, 31 Oct 2026 12:00:00 +0000</pubDate>'
                       + media + '</item></channel></rss>').encode()
                image = ingest.parse_source(rss, SOURCE, NOW)[0].get("image", {})
                self.assertEqual(image.get("url"), "https://www.df.cl/images/casa.jpg")

    def test_atom_image_and_untrusted_images(self):
        atom = b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry>
        <title>El mercado inmobiliario y nuevas viviendas en Chile</title>
        <link href="https://www.df.cl/mercado/"/><updated>2026-10-31T12:00:00Z</updated>
        <link rel="enclosure" type="image/jpeg" href="https://www.df.cl/images/casa.jpg"/>
        </entry></feed>'''
        self.assertEqual(ingest.parse_source(atom, SOURCE, NOW)[0].get("image", {}).get("url"), "https://www.df.cl/images/casa.jpg")
        for url in ['http://www.df.cl/a.jpg','https://evil.example/a.jpg','https://127.0.0.1/a.jpg',
                    'https://www.df.cl:8443/a.jpg','https://user:pass@www.df.cl/a.jpg','javascript:alert(1)',
                    'https://www.df.cl/logo.svg']:
            with self.subTest(url=url):
                bad = atom.decode().replace('https://www.df.cl/images/casa.jpg', url).encode()
                self.assertNotIn('image', ingest.parse_source(bad, SOURCE, NOW)[0])

    def test_article_metadata_extracts_only_associated_image(self):
        html = '<meta property="og:image" content="/images/edificio.jpg"><meta property="og:image:alt" content="Edificio en Chile">'
        image = ingest.parse_article_image(html, 'https://www.df.cl/mercado/', SOURCE, NOW)
        self.assertEqual(image['url'], 'https://www.df.cl/images/edificio.jpg')
        self.assertEqual(image['origin'], 'opengraph')
        self.assertIsNone(ingest.parse_article_image('<meta property="og:image" content="https://evil.example/a.jpg">', 'https://www.df.cl/mercado/', SOURCE, NOW))

    def test_enrichment_is_bounded_and_caches_photo(self):
        article = {"id":"one","title":"Mercado inmobiliario y viviendas nuevas en Chile",
                   "url":"https://www.df.cl/mercado/","source":SOURCE['name'],"sourceId":SOURCE['id'],
                   "category":"Mercado","publishedAt":"2026-10-31T12:00:00Z"}
        calls = []
        def fetch(url, source):
            calls.append(url)
            return '<meta property="og:image" content="https://www.df.cl/images/casa.jpg">'
        report = ingest.enrich_images({"items":[article,dict(article,id='two',url='https://www.df.cl/otra/')]}, NOW, fetcher=fetch, max_requests=1)
        self.assertEqual(len(calls), 1)
        self.assertIn('image', report['items'][0])
        self.assertNotIn('image', report['items'][1])
        calls.clear()
        cached = ingest.enrich_images({"items":[report['items'][0]]}, NOW, fetcher=fetch, max_requests=1)
        self.assertEqual(calls, [])
        self.assertEqual(cached['items'][0]['image']['url'], report['items'][0]['image']['url'])

    def test_existing_photo_survives_refresh_without_new_image(self):
        rss = b'''<rss><channel><item><title>El mercado inmobiliario y viviendas nuevas en Chile</title>
        <link>https://www.df.cl/mercado/</link><pubDate>Sat, 31 Oct 2026 12:00:00 +0000</pubDate>
        <enclosure type="image/jpeg" url="https://www.df.cl/images/casa.jpg"/></item></channel></rss>'''
        prior = ingest.parse_source(rss, SOURCE, NOW)
        fresh = [dict(prior[0])]
        fresh[0].pop('image')
        report = ingest.assemble({'items':prior}, fresh, [{'ok':True,'count':1}], NOW)
        self.assertEqual(report['items'][0]['image']['url'], prior[0]['image']['url'])
        bad = [dict(prior[0], image=dict(prior[0]['image'], sourceUrl='https://www.df.cl/otra-noticia/'))]
        self.assertNotIn('image', ingest.assemble({'items':[]}, bad, [{'ok':True,'count':1}], NOW)['items'][0])

    def test_small_trackers_do_not_replace_article_photo(self):
        rss = b'''<rss><channel><item><title>El mercado inmobiliario y viviendas nuevas en Chile</title>
        <link>https://www.df.cl/mercado/</link><pubDate>Sat, 31 Oct 2026 12:00:00 +0000</pubDate>
        <description>&lt;img src="https://www.df.cl/images/a.jpg" width="1" height="1"&gt;
        &lt;img src="https://www.df.cl/images/casa.jpg" width="800" height="450"&gt;</description>
        </item></channel></rss>'''
        self.assertEqual(ingest.parse_source(rss,SOURCE,NOW)[0]['image']['url'],'https://www.df.cl/images/casa.jpg')

    def test_article_metadata_respects_bounded_response_and_redirects(self):
        class Response:
            headers = {'Content-Type':'text/html'}
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def geturl(self): return 'https://www.df.cl/mercado/'
            def read(self, count):
                self.count = count
                return b'<meta property="og:image" content="/images/casa.jpg">'
        response = Response()
        with patch.object(ingest,'build_opener') as opener:
            opener.return_value.open.return_value = response
            html = ingest.fetch_article_metadata('https://www.df.cl/mercado/',SOURCE)
            self.assertEqual(response.count,ingest.MAX_METADATA_BYTES)
            self.assertIn('og:image',html)
        with patch.object(ingest,'build_opener') as opener:
            with self.assertRaises(ValueError):
                ingest.fetch_article_metadata('https://127.0.0.1/private',SOURCE)
            opener.assert_not_called()

    def test_homepage_or_other_article_metadata_is_rejected(self):
        for target in ['https://www.df.cl/','https://www.df.cl/otra-noticia/']:
            html = f'<meta property="og:url" content="{target}"><meta property="og:image" content="/images/portada.jpg">'
            self.assertIsNone(ingest.parse_article_image(html,'https://www.df.cl/mercado/',SOURCE,NOW))
        html = '<link rel="canonical" href="https://www.df.cl/"><meta property="og:image" content="/images/portada.jpg">'
        self.assertIsNone(ingest.parse_article_image(html,'https://www.df.cl/mercado/',SOURCE,NOW))

    def test_final_article_url_must_match_requested_article(self):
        class Response:
            headers = {'Content-Type':'text/html'}
            def __enter__(self): return self
            def __exit__(self,*args): pass
            def geturl(self): return 'https://www.df.cl/'
            def read(self,count): return b'<meta property="og:image" content="/images/portada.jpg">'
        with patch.object(ingest,'build_opener') as opener:
            opener.return_value.open.return_value=Response()
            with self.assertRaises(ValueError):
                ingest.fetch_article_metadata('https://www.df.cl/mercado/',SOURCE)

    def test_articles_without_images_do_not_starve_others(self):
        articles=[{'id':str(i),'title':'Mercado inmobiliario y viviendas nuevas en Chile',
                   'url':f'https://www.df.cl/noticia-{i}/','source':SOURCE['name'],'sourceId':SOURCE['id'],
                   'category':'Mercado','publishedAt':f'2026-10-31T{12-i:02d}:00:00Z'} for i in range(3)]
        calls=[]
        def fetch(url,source):
            calls.append(url)
            return '<meta property="og:image" content="/images/casa.jpg">' if 'noticia-2' in url else '<html></html>'
        report={'items':articles}
        for run in range(3):
            now=NOW+timedelta(hours=16*run)
            report=ingest.assemble(report,[],[{'ok':True,'count':0}],now)
            report=ingest.enrich_images(report,now,fetcher=fetch,max_requests=1)
        self.assertEqual(calls,[item['url'] for item in articles])
        self.assertTrue(any(x['id']=='2' and 'image' in x for x in report['items']))

    def test_no_invented_publication_dates(self):
        rss = b'''<rss><channel><item><title>La vivienda y la actividad inmobiliaria en Chile</title>
        <link>https://www.df.cl/noticias/</link>
        </item></channel></rss>'''
        self.assertEqual(ingest.parse_source(rss, SOURCE, NOW), [])

if __name__ == "__main__":
    unittest.main()
