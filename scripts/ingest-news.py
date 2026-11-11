#!/usr/bin/env python3
"""Agregador editorial de titulares inmobiliarios de feeds RSS/Atom públicos.

Solo publica metadatos (titular, fecha, categoría, fuente y enlace).
Enlaza las imágenes de vista previa del medio; no descarga fotografías ni artículos completos.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import hashlib
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from xml.etree import ElementTree as ET

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data" / "news-feed.json"
MAX_BYTES = 1_500_000
MAX_AGE_DAYS = 100
MAX_ITEMS = 48
UA = "InmueblesEnChile/1.0 (+https://github.com/medinacaj/inmuebles-en-chile)"
ATOM = "{http://www.w3.org/2005/Atom}"

# Los medios ofrecen expresamente RSS. No extraemos artículos completos.
SOURCES = (
    {
        "id": "df-economia",
        "name": "Diario Financiero",
        "feed": "https://www.df.cl/noticias/site/list/port/rss.xml",
        "hosts": ("df.cl",),
        "category": "Mercado",
        "filter": True,
    },
    {
        "id": "cooperativa-economia",
        "name": "Cooperativa Economía",
        "feed": "https://www.cooperativa.cl/noticias/site/tax/port/all/rss_5___1.xml",
        "hosts": ("cooperativa.cl",),
        "category": "Mercado",
        "filter": True,
    },
    {
        "id": "diario-inmobiliario",
        "name": "El Diario Inmobiliario",
        "feed": "https://eldiarioinmobiliario.cl/feed/",
        "hosts": ("eldiarioinmobiliario.cl",),
        "category": "Mercado",
        "filter": True,
    },
    {
        "id": "la-tercera",
        "image_hosts": ("cloudfront-us-east-1.images.arcpublishing.com", "arc-anglerfish-arc2-prod-copesa.s3.amazonaws.com"),
        "name": "La Tercera",
        "feed": "https://www.latercera.com/arcio/rss/",
        "hosts": ("latercera.com",),
        "category": "Mercado",
        "filter": True,
    },
    {
        "id": "sii-noticias",
        "name": "Servicio de Impuestos Internos",
        "feed": "https://www.sii.cl/pagina/actualizada/noticias/rss/siiall_rss.xml",
        "hosts": ("sii.cl",),
        "category": "Normativa",
        "filter": True,
    },
)

KEYWORDS = re.compile(
    r"\b(?:inmobiliari[oa]s?|viviendas?|departamentos?|habitacion(?:al|ales)|"
    r"hipotecari[oa]s?|arriendos?|subsidios?|condominios?|"
    r"urbanism[oa]|grav[aá]menes|construcci[oó]n(?:es)?|"
    r"proyectos?\s+(?:residencial(?:es)?|inmobiliarios?|de\s+viviend)|"
    r"permisos?\s+de\s+edificaci[oó]n|contribuciones\s+de\s+bienes\s+ra[ií]ces|"
    r"venta\s+de\s+viviendas?|IVA\s+en\s+(?:la\s+)?vivienda)\b",
    re.IGNORECASE,
)
TRACKING = {"fbclid", "gclid", "ref", "mc_cid", "mc_eid"}
# Evitar noticias de otros países y coincidencias lingüísticas fuera del sector.
# No basta con que una palabra aislada contenga "casa" o "departamento".
FOREIGN_MARKERS = re.compile(
    r"\b(?:miami|argentina|buenos\s+aires|caba|brasil|per[uú]|"
    r"m[eé]xico|colombia|ee\.?\s?uu\.?|estados\s+unidos|"
    r"madrid|barcelona|espa[nñ]a|nueva\s+york|new\s+york|"
    r"par[ií]s|londres|uruguay|bolivia)\b", re.IGNORECASE
)
CHILE_MARKERS = re.compile(
    r"\b(?:chile|chilena?s?|santiago|valpara[ií]so|concepci[oó]n|"
    r"regi[oó]n\s+metropolitana|biob[ií]o|araucan[ií]a|"
    r"ma[ií]po|temuco|antofagasta|puerto\s+montt|"
    r"vi[nñ]a\s+del\s+mar|rancagua|talca|iquique)\b", re.IGNORECASE
)


def host_allowed(host: str, domains: tuple[str, ...]) -> bool:
    return any(host == d or host.endswith("." + d) for d in domains)

def canonical_url(value: str, domains: tuple[str, ...]) -> str | None:
    try:
        p = urlsplit(value.strip())
        host = (p.hostname or "").lower().rstrip(".")
        if p.scheme != "https" or p.username or p.password or p.port or not host_allowed(host, domains):
            return None
        query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True)
                 if k.lower() not in TRACKING and not k.lower().startswith("utm_")]
        return urlunsplit(("https", host, p.path or "/", urlencode(query), ""))
    except (ValueError, AttributeError):
        return None

# Imágenes facilitadas por los feeds o metadatos de sus artículos.
MEDIA = '{http://search.yahoo.com/mrss/}'
MAX_METADATA_BYTES = 300_000
MAX_IMAGE_REQUESTS = 16
IMAGE_CACHE_DAYS = 3


def same_article_url(left, right, source):
    left = canonical_url(left, source['hosts'])
    right = canonical_url(right, source['hosts'])
    if not left or not right:
        return False
    def identity(url):
        parsed = urlsplit(url)
        host = parsed.hostname.removeprefix('www.')
        return host, parsed.path.rstrip('/') or '/', parsed.query
    return identity(left) == identity(right)


def image_url(value: str, article_url: str, source: dict) -> str | None:
    from urllib.parse import urljoin
    try:
        if not isinstance(value, str) or not value.strip() or len(value) > 3000:
            return None
        parsed = urlsplit(urljoin(article_url, unescape(value.strip())))
        hosts = (*source['hosts'], *source.get('image_hosts', ()))
        host = (parsed.hostname or '').lower().rstrip('.')
        if (parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port
                or not host_allowed(host, hosts) or parsed.path.lower().endswith('.svg')
                or re.search(r'(?:^|[/_.-])(?:logo|avatar|pixel|sprite|icon)(?:[/_.-]|$)', parsed.path, re.I)):
            return None
        return urlunsplit(('https', host, parsed.path or '/', parsed.query, ''))
    except (ValueError, TypeError, AttributeError):
        return None


class ImageMarkup(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []
        self.meta = {}

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'meta':
            name = (attrs.get('property') or attrs.get('name') or '').lower()
            self.meta.setdefault(name, attrs.get('content') or '')
        if tag == 'link' and 'canonical' in (attrs.get('rel') or '').lower().split():
            self.meta.setdefault('canonical', attrs.get('href') or '')
        if tag == 'img' and len(self.images) < 12:
            for dimension in ('width', 'height'):
                size = attrs.get(dimension) or ''
                if size.isdigit() and int(size) < 80:
                    return
            value = attrs.get('data-src') or attrs.get('src')
            if value:
                self.images.append((value, attrs.get('alt') or ''))


def make_image(value, article_url, source, now, origin, alt='', credit=''):
    url = image_url(value, article_url, source)
    if not url:
        return None
    return {'url': url, 'sourceUrl': article_url, 'origin': origin,
            'credit': re.sub(r'\s+', ' ', str(credit or source['name'])).strip()[:140],
            'alt': re.sub(r'\s+', ' ', str(alt or '')).strip()[:400],
            'checkedAt': now.isoformat(timespec='seconds').replace('+00:00', 'Z')}


def entry_image(entry, article_url, source, now):
    candidates = []
    credit = text_of(entry.find('.//' + MEDIA + 'credit'))
    for element in entry.iter():
        tag = element.tag.rsplit('}', 1)[-1].lower()
        attrs = element.attrib
        if element.tag in (MEDIA + 'content', MEDIA + 'thumbnail'):
            media_type = attrs.get('type', '').lower()
            if media_type and media_type not in ('image/jpeg', 'image/png', 'image/webp', 'image/avif'):
                continue
            if any(attrs.get(d, '').isdigit() and int(attrs[d]) < 80 for d in ('width', 'height')):
                continue
            if attrs.get('medium', 'image') == 'image':
                candidates.append((attrs.get('url'), text_of(element.find(MEDIA + 'description'))))
        elif tag in ('enclosure', 'link') and attrs.get('type', '').lower() in ('image/jpeg', 'image/png', 'image/webp', 'image/avif'):
            if tag == 'enclosure' or attrs.get('rel') == 'enclosure':
                candidates.append((attrs.get('url') or attrs.get('href'), ''))
        elif tag == 'img':
            candidates.append((attrs.get('src'), attrs.get('alt', '')))
    for tag in ('description', 'content', 'encoded', 'summary'):
        for element in entry.iter():
            if element.tag.rsplit('}', 1)[-1].lower() == tag and element.text:
                markup = ImageMarkup()
                markup.feed(element.text[:100_000])
                candidates.extend(markup.images)
    for value, alt in candidates:
        image = make_image(value, article_url, source, now, 'rss', alt, credit)
        if image:
            return image
    return None


def clean_image(image, article_url, source, now):
    if not isinstance(image, dict) or image.get('origin') not in ('rss', 'opengraph'):
        return None
    if canonical_url(image.get('sourceUrl', ''), source['hosts']) != article_url:
        return None
    if not isinstance(image.get('checkedAt'), str):
        return None
    checked = parse_date(image.get('checkedAt', ''))
    if not checked or checked > now + timedelta(days=1):
        return None
    result = make_image(image.get('url'), article_url, source, checked, image['origin'], image.get('alt'), image.get('credit'))
    return result


def parse_article_image(html, article_url, source, now):
    markup = ImageMarkup()
    markup.feed(html[:MAX_METADATA_BYTES])
    from urllib.parse import urljoin
    for identity in ('og:url', 'canonical'):
        if markup.meta.get(identity) and not same_article_url(urljoin(article_url, markup.meta[identity]), article_url, source):
            return None
    for key in ('og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'):
        image = make_image(markup.meta.get(key), article_url, source, now, 'opengraph',
                           markup.meta.get('og:image:alt') or markup.meta.get('twitter:image:alt'))
        if image:
            return image
    return None


def fetch_article_metadata(article_url, source):
    if not canonical_url(article_url, source['hosts']):
        raise ValueError('Artículo fuera del medio autorizado')
    request = Request(article_url, headers={'User-Agent': UA, 'Accept': 'text/html, application/xhtml+xml'})
    opener = build_opener(SafeRedirect(source['hosts']))
    with opener.open(request, timeout=6) as response:
        if not same_article_url(response.geturl(), article_url, source):
            raise ValueError('La respuesta ya no corresponde al artículo solicitado')
        content_type = response.headers.get('Content-Type', '').lower()
        if content_type and not any(kind in content_type for kind in ('text/html', 'application/xhtml+xml')):
            raise ValueError('El artículo no es HTML')
        # Solo el prefijo con metadatos; cerrar sin descargar el artículo completo.
        return response.read(MAX_METADATA_BYTES).decode('utf-8', errors='replace')


def enrich_images(report, now, fetcher=None, max_requests=MAX_IMAGE_REQUESTS):
    fetcher = fetcher or fetch_article_metadata
    result = dict(report)
    result['items'] = [dict(item) for item in report['items']]
    checked = failures = 0
    candidates = []
    for item in result['items']:
        source = next((s for s in SOURCES if s['id'] == item['sourceId']), None)
        if not source:
            continue
        image = clean_image(item.get('image'), item['url'], source, now)
        if image:
            item['image'] = image
            if parse_date(image['checkedAt']) >= now - timedelta(days=IMAGE_CACHE_DAYS):
                continue
        else:
            item.pop('image', None)
        value = item.get('imageCheckedAt')
        last_check = parse_date(value) if isinstance(value, str) else None
        if last_check and now - timedelta(hours=12) <= last_check <= now:
            continue
        candidates.append((last_check or datetime.min.replace(tzinfo=timezone.utc), item, source))
    # Primero los artículos nunca consultados; después el intento más antiguo.
    # Conservar el orden editorial de result['items'].
    candidates.sort(key=lambda entry: entry[0])
    for _, item, source in candidates[:max(0, max_requests)]:
        checked += 1
        item['imageCheckedAt'] = now.isoformat(timespec='seconds').replace('+00:00', 'Z')
        try:
            image = parse_article_image(fetcher(item['url'], source), item['url'], source, now)
            if image:
                item['image'] = image
            else:
                failures += 1
        except Exception:
            failures += 1
    result['imageStats'] = {'total': sum('image' in item for item in result['items']),
                            'checkedArticles': checked, 'unavailable': failures}
    return result


def text_of(el: ET.Element | None) -> str:
    if el is None:
        return ""
    value = "".join(el.itertext())[:700]
    return re.sub(r"\s+", " ", unescape(value)).strip()

def parse_date(value: str) -> datetime | None:
    if not value:
        return None
    try:
        date = parsedate_to_datetime(value)
        if date is None:
            date = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        return date.astimezone(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        try:
            date = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return date.replace(tzinfo=timezone.utc) if date.tzinfo is None else date.astimezone(timezone.utc)
        except (TypeError, ValueError):
            return None

def feed_entries(xml: bytes) -> list[tuple[str, str, str, ET.Element]]:
    # Solo se aceptan RSS y Atom; ElementTree no resuelve entidades externas de red.
    if len(xml) > MAX_BYTES:
        raise ValueError("RSS demasiado grande")
    root = ET.fromstring(xml)
    kind = root.tag.lower()
    entries: list[tuple[str, str, str, ET.Element]] = []
    if kind == "rss" or kind.endswith("}rss"):
        for item in root.findall("./channel/item")[:150]:
            title = text_of(item.find("title"))
            url = text_of(item.find("link"))
            published = text_of(item.find("pubDate")) or text_of(item.find("date"))
            entries.append((title, url, published, item))
    elif root.tag == ATOM + "feed":
        for item in root.findall(ATOM + "entry")[:150]:
            title = text_of(item.find(ATOM + "title"))
            link = next((x.get("href") or "" for x in item.findall(ATOM + "link")
                         if x.get("rel", "alternate") == "alternate"), "")
            published = text_of(item.find(ATOM + "published")) or text_of(item.find(ATOM + "updated"))
            entries.append((title, link, published, item))
    else:
        raise ValueError("El contenido no es RSS ni Atom")
    return entries


def categorize(title: str, default: str) -> str:
    if re.search(r"\b(?:proyecto(?:s)?\s+(?:habitacional|inmobiliario|residencial)|viviendas?\s+nuevas?|edificio(?:s)?\s+residencial)", title, re.IGNORECASE):
        return "Proyectos"
    if re.search(r"\b(?:cr[eé]ditos?\s+hipotecari[oa]s?|tasas?\s+hipotecari[oa]s?|financiamient[oa]\s+(?:de\s+)?vivienda|subsidios?)\b", title, re.IGNORECASE):
        return "Financiamiento"
    return default

def is_relevant_title(title: str) -> bool:
    if not KEYWORDS.search(title):
        return False
    if FOREIGN_MARKERS.search(title) and not CHILE_MARKERS.search(title):
        return False
    return True

def parse_source(xml: bytes, source: dict, now: datetime) -> list[dict]:
    output: list[dict] = []
    earliest = now - timedelta(days=MAX_AGE_DAYS)
    for title, url, date, entry in feed_entries(xml):
        if not 18 <= len(title) <= 230:
            continue
        if source["filter"] and not is_relevant_title(title):
            continue
        link = canonical_url(url, source["hosts"])
        published = parse_date(date)
        if not link or not published or published < earliest or published > now + timedelta(days=1):
            continue
        output.append({
            "id": hashlib.sha256(link.encode()).hexdigest()[:18],
            "title": title,
            "url": link,
            "source": source["name"],
            "sourceId": source["id"],
            "category": categorize(title, source["category"]),
            "publishedAt": published.isoformat(timespec="seconds").replace("+00:00", "Z"),
        })
        image = entry_image(entry, link, source, now)
        if image:
            output[-1]['image'] = image
    return output

class SafeRedirect(HTTPRedirectHandler):
    def __init__(self, hosts):
        self.hosts = hosts
        self.redirects = 0

    def redirect_request(self, request, fp, code, msg, headers, newurl):
        from urllib.parse import urljoin
        self.redirects += 1
        resolved = urljoin(request.full_url, newurl)
        if self.redirects > 3 or canonical_url(resolved, self.hosts) is None:
            raise ValueError("Redirección no autorizada")
        return super().redirect_request(request, fp, code, msg, headers, resolved)


def bounded_fetch(source: dict) -> bytes:
    if not canonical_url(source["feed"], source["hosts"]):
        raise ValueError("Fuente no autorizada")
    request = Request(source["feed"], headers={
        "User-Agent": UA,
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
    })
    opener = build_opener(SafeRedirect(source["hosts"]))
    with opener.open(request, timeout=14) as response:
        if not canonical_url(response.geturl(), source["hosts"]):
            raise ValueError("Destino de respuesta no autorizado")
        content_type = response.headers.get("Content-Type", "")
        if content_type and not any(x in content_type.lower() for x in ("xml", "rss", "atom")):
            raise ValueError("La fuente no respondió con XML")
        if int(response.headers.get("Content-Length") or 0) > MAX_BYTES:
            raise ValueError("Feed demasiado grande")
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("Feed demasiado grande")
        return data

def load_prior(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(value.get("items"), list):
            return value
    except (OSError, ValueError, TypeError):
        pass
    return {"items": [], "updatedAt": None, "sources": []}

def assemble(prior: dict, gathered: list[dict], source_status: list[dict], now: datetime) -> dict:
    earliest = now - timedelta(days=MAX_AGE_DAYS)
    all_entries: dict[str, dict] = {}
    for item in [*prior.get("items", []), *gathered]:
        try:
            source = next(s for s in SOURCES if s["id"] == item["sourceId"])
            date = parse_date(item["publishedAt"])
            link = canonical_url(item["url"], source["hosts"])
            if (not link or not date or date < earliest or date > now + timedelta(days=1)
                    or not 18 <= len(item["title"]) <= 230
                    or (source["filter"] and not is_relevant_title(item["title"]))):
                continue
            clean = {key: item[key] for key in ("id","title","url","source","sourceId","category","publishedAt")}
            clean['url'] = link
            attempt = item.get('imageCheckedAt') or all_entries.get(link, {}).get('imageCheckedAt')
            last_check = parse_date(attempt) if isinstance(attempt, str) else None
            if last_check and last_check <= now:
                clean['imageCheckedAt'] = last_check.isoformat(timespec='seconds').replace('+00:00', 'Z')
            image = clean_image(item.get('image'), link, source, now)
            if not image and link in all_entries:
                image = all_entries[link].get('image')
            if image:
                clean['image'] = image
            # Un mismo enlace conserva una única entrada.
            all_entries[link] = clean
        except (KeyError, StopIteration, TypeError):
            continue
    ordered = sorted(all_entries.values(), key=lambda a: (a["publishedAt"], a["id"]), reverse=True)[:MAX_ITEMS]
    successful = any(s["ok"] and s["count"] > 0 for s in source_status)
    # Si todos los proveedores fallan, no simular que se obtuvieron datos nuevos.
    health = ("failed" if not any(s["ok"] for s in source_status) else
              "empty" if not successful else
              "degraded" if any(not s["ok"] for s in source_status) else "ok")
    return {
        "schemaVersion": 1,
        "health": health,
        "updatedAt": now.isoformat(timespec="seconds").replace("+00:00", "Z") if successful else prior.get("updatedAt"),
        "lastAttemptAt": now.isoformat(timespec="seconds").replace("+00:00", "Z"),
        "sources": source_status,
        "items": ordered,
    }

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DATA)
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    previous = load_prior(args.output)
    gathered: list[dict] = []
    statuses: list[dict] = []
    for source in SOURCES:
        try:
            items = parse_source(bounded_fetch(source), source, now)
            gathered.extend(items)
            statuses.append({"id": source["id"], "name": source["name"], "ok": True, "count": len(items)})
        except Exception as error:
            # Exponer únicamente el tipo de error; nunca volcar contenido del proveedor.
            statuses.append({"id": source["id"], "name": source["name"], "ok": False, "count": 0, "error": type(error).__name__})
    report = assemble(previous, gathered, statuses, now)
    result = enrich_images(report, now, max_requests=0 if report['health'] == 'failed' else MAX_IMAGE_REQUESTS)
    if not result["items"] and not previous.get("items"):
        print("No hay titulares válidos; se conserva el catálogo vacío", file=sys.stderr)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Noticias: {len(result['items'])}, fuentes correctas: {sum(s['ok'] for s in statuses)}/{len(SOURCES)}")
    for x in statuses:
        print(f"  {x['id']}: {'OK' if x['ok'] else 'ERROR'} ({x['count']} artículos)")
    summary = ["## Sincronización RSS", "", f"Estado: **{result['health']}**",
               f"Titulares conservados: {len(result['items'])}",
               f"Último éxito con titulares: {result['updatedAt'] or 'sin éxito registrado'}", "",
               f"Imágenes asociadas: {result['imageStats']['total']}",
               "| Fuente | Respuesta | Titulares |", "| --- | --- | ---: |"]
    summary.extend(f"| {s['name']} | {'OK' if s['ok'] else 'ERROR'} | {s['count']} |" for s in statuses)
    import os
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as stream:
            stream.write("\n".join(summary) + "\n")
    if result["health"] == "failed":
        print("::error::Todas las fuentes RSS fallaron; se conservó el contenido anterior vigente", file=sys.stderr)
        return 1
    if result["health"] in ("empty", "degraded"):
        print("::warning::Sincronización RSS parcial o sin titulares válidos", file=sys.stderr)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
