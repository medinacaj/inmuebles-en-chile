#!/usr/bin/env python3
"""Agregador editorial de titulares inmobiliarios de feeds RSS/Atom públicos.

Solo publica metadatos (titular, fecha, categoría, fuente y enlace).
No copia artículos, fotografías ni genera ofertas de inmuebles.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import hashlib
from html import unescape
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
        "id": "la-tercera",
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
    r"\b(?:inmobiliari[oa]s?|viviendas?|departamentos?|casas?|habitacion(?:al|ales)|"
    r"hipotecari[oa]s?|arriendos?|subsidios?|condominios?|"
    r"urbanism[oa]|grav[aá]menes|construcci[oó]n(?:es)?|"
    r"proyectos?\s+(?:residencial(?:es)?|inmobiliarios?|de\s+viviend)|"
    r"permisos?\s+de\s+edificaci[oó]n|contribuciones\s+de\s+bienes\s+ra[ií]ces|"
    r"venta\s+de\s+viviendas?|IVA\s+en\s+(?:la\s+)?vivienda)\b",
    re.IGNORECASE,
)
TRACKING = {"fbclid", "gclid", "ref", "mc_cid", "mc_eid"}

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

def feed_entries(xml: bytes) -> list[tuple[str, str, str]]:
    # Solo se aceptan RSS y Atom; ElementTree no resuelve entidades externas de red.
    if len(xml) > MAX_BYTES:
        raise ValueError("RSS demasiado grande")
    root = ET.fromstring(xml)
    kind = root.tag.lower()
    entries: list[tuple[str, str, str]] = []
    if kind == "rss" or kind.endswith("}rss"):
        for item in root.findall("./channel/item")[:150]:
            title = text_of(item.find("title"))
            url = text_of(item.find("link"))
            published = text_of(item.find("pubDate")) or text_of(item.find("date"))
            entries.append((title, url, published))
    elif root.tag == ATOM + "feed":
        for item in root.findall(ATOM + "entry")[:150]:
            title = text_of(item.find(ATOM + "title"))
            link = next((x.get("href") or "" for x in item.findall(ATOM + "link")
                         if x.get("rel", "alternate") == "alternate"), "")
            published = text_of(item.find(ATOM + "published")) or text_of(item.find(ATOM + "updated"))
            entries.append((title, link, published))
    else:
        raise ValueError("El contenido no es RSS ni Atom")
    return entries


def categorize(title: str, default: str) -> str:
    if re.search(r"\b(?:proyecto(?:s)?\s+(?:habitacional|inmobiliario|residencial)|viviendas?\s+nuevas?|edificio(?:s)?\s+residencial)", title, re.IGNORECASE):
        return "Proyectos"
    if re.search(r"\b(?:cr[eé]ditos?\s+hipotecari[oa]s?|tasas?\s+hipotecari[oa]s?|financiamient[oa]\s+(?:de\s+)?vivienda|subsidios?)\b", title, re.IGNORECASE):
        return "Financiamiento"
    return default

def parse_source(xml: bytes, source: dict, now: datetime) -> list[dict]:
    output: list[dict] = []
    earliest = now - timedelta(days=MAX_AGE_DAYS)
    for title, url, date in feed_entries(xml):
        if not 18 <= len(title) <= 230:
            continue
        if source["filter"] and not KEYWORDS.search(title):
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
                    or not 18 <= len(item["title"]) <= 230):
                continue
            clean = {key: item[key] for key in ("id","title","url","source","sourceId","category","publishedAt")}
            # Un mismo enlace conserva una única entrada.
            all_entries[link] = clean
        except (KeyError, StopIteration, TypeError):
            continue
    ordered = sorted(all_entries.values(), key=lambda a: (a["publishedAt"], a["id"]), reverse=True)[:MAX_ITEMS]
    successful = any(s["ok"] and s["count"] > 0 for s in source_status)
    # Si todos los proveedores fallan, no simular que se obtuvieron datos nuevos.
    return {
        "schemaVersion": 1,
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
    result = assemble(previous, gathered, statuses, now)
    if not result["items"] and not previous.get("items"):
        print("No hay titulares válidos; se conserva el catálogo vacío", file=sys.stderr)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Noticias: {len(result['items'])}, fuentes correctas: {sum(s['ok'] for s in statuses)}/{len(SOURCES)}")
    for x in statuses:
        print(f"  {x['id']}: {'OK' if x['ok'] else 'ERROR'} ({x['count']} artículos)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
