#!/usr/bin/env python3
"""Archive only the public HTML and same-origin static assets of the original game.
No player data, API responses, authentication routes, cookies or admin records.
This is a deployed frontend snapshot, not a recovered server-side source tree.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlsplit, unquote
import hashlib, json, re, time
ROOT = 'https://sinfonia-castlevanica-futuristica.maiconheverton.chatgpt.site/'
OUT = Path('public-snapshot')
HOST = urlsplit(ROOT).netloc
QUEUE = [ROOT, urljoin(ROOT, 'demo/')]
SEEN = set()
MANIFEST = []
ERRORS = []
EXTENSIONS = {'.js','.mjs','.css','.json','.png','.jpg','.jpeg','.webp','.svg','.gif','.ico','.mid','.midi','.ogg','.wav','.mp3','.woff','.woff2','.map','.wasm','.webmanifest','.avif'}
def allowed(url):
    u = urlsplit(url)
    parts = unquote(u.path).lower().split('/')
    return u.scheme == 'https' and u.netloc == HOST and not any(x in {'api','admin','auth','login','logout','signup','register','sessions','saves','players','visits'} for x in parts)
def destination(url):
    path = unquote(urlsplit(url).path).lstrip('/')
    p = Path(path)
    if '..' in p.parts: raise ValueError('Unsafe URL path')
    if not path or path.endswith('/'): p /= 'index.html'
    return OUT / p
while QUEUE and len(SEEN) < 180:
    url = QUEUE.pop(0).split('#')[0]
    if url in SEEN or not allowed(url): continue
    SEEN.add(url)
    try:
        with urlopen(Request(url, headers={'User-Agent':'SinfonIA-Owner-Public-Backup/1.0'}), timeout=35) as r:
            final = r.geturl()
            if not allowed(final): raise ValueError('Redirected outside public project')
            raw = r.read(16000000)
            content_type = r.headers.get('Content-Type', '')
        p = destination(url); p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(raw)
        MANIFEST.append({'url':url,'path':str(p),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'type':content_type})
        if any(t in content_type for t in ['html','javascript','css','json']) or p.suffix in {'.js','.mjs','.css','.html','.json'}:
            text = raw.decode('utf-8', errors='replace')
            candidates = re.findall(r'''(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)'"\s]+)|["']((?:\.?\.?/|assets/|audio/|images/|music/)[^"'\s]+)["']''', text)
            for group in candidates:
                candidate = next((x for x in group if x), '')
                absolute = urljoin(url, candidate)
                suffix = Path(urlsplit(absolute).path).suffix.lower()
                if suffix in EXTENSIONS and allowed(absolute): QUEUE.append(absolute)
    except Exception as ex:
        ERRORS.append({'url':url,'error':str(ex)})
Path('backup-manifest.json').write_text(json.dumps({'origin':ROOT,'scope':'Public deployed frontend only; original backend source not available through this archive','files':MANIFEST,'errors':ERRORS}, ensure_ascii=False, indent=2)+'\n')
if not (OUT/'index.html').is_file(): raise SystemExit('Public homepage could not be archived')
print(json.dumps({'files':len(MANIFEST),'errors':ERRORS,'bytes':sum(x['bytes'] for x in MANIFEST)},ensure_ascii=False,indent=2))
