#!/usr/bin/env python3
"""Recover this project's anonymous, publicly served frontend only.
This is not a server-source or user-database backup. No credentials are used.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, re, urllib.request, urllib.parse
from datetime import datetime, timezone

ORIGIN = 'https://sinfonia-castlevanica-futuristica.maiconheverton.chatgpt.site'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
EXTENSIONS = {'.js', '.mjs', '.css', '.json', '.png', '.webp', '.jpg', '.jpeg', '.svg', '.ico', '.mid', '.midi', '.wav', '.ogg', '.mp3', '.map'}
ATLASES = ['atlas-01-library-crypt-garden-reservoir.webp', 'atlas-02-clocktower-observatory-core-throne.webp', 'atlas-03-gate-forge-rooftop-vault.webp']
queue = ['/', '/demo/'] + ['/assets/' + name for name in ATLASES]
seen, report = set(), []
link_pattern = re.compile(r'''(?:src|href)=["']([^"']+)["']|url\(["']?([^\)"']+)|["']([^"'\s]+\.(?:js|mjs|json|png|webp|svg|mid|midi|wav|ogg|mp3|css|map))["']''')
def excluded(path):
    return path.startswith(('/api/', '/auth/', '/admin', '/cdn-cgi/'))
def digest(data):
    return hashlib.sha256(data).hexdigest()

while queue and len(seen) < 120:
    path = queue.pop(0)
    path = urllib.parse.urlparse(path).path
    if path in seen or excluded(path):
        continue
    seen.add(path)
    if '..' in PurePosixPath(path).parts:
        raise ValueError('Unsafe path')
    url = ORIGIN + path
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'SinfonIA public frontend backup'})
        with urllib.request.urlopen(req, timeout=25) as response:
            if urllib.parse.urlparse(response.geturl()).netloc != urllib.parse.urlparse(ORIGIN).netloc:
                raise ValueError('Unexpected redirect outside the project')
            mime = response.headers.get('Content-Type', '')
            data = response.read(15000001)
        if len(data) > 15000000:
            raise ValueError('Asset too large')
        original_hash = digest(data)
        modifications = []
        if 'text/html' in mime:
            if PurePosixPath(path).suffix:
                raise ValueError('HTML fallback returned instead of asset')
            text = data.decode('utf-8')
            def clean_script(match):
                if '/cdn-cgi/challenge-platform/' in match.group(0):
                    modifications.append('Removed host-injected Cloudflare challenge script, not game code')
                    return ''
                return match.group(0)
            data = re.sub(r'<script\b[^>]*>[\s\S]*?</script>', clean_script, text, flags=re.I).encode('utf-8')
        target = path.lstrip('/')
        if not target or target.endswith('/'):
            target += 'index.html'
        p = OUT / target
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        report.append(dict(path=path, file='public/' + target, bytes=len(data), source_sha256=original_hash, stored_sha256=digest(data), modifications=modifications))
        if any(key in mime for key in ('text/', 'javascript', 'json')):
            text = data.decode('utf-8', errors='replace')
            for groups in link_pattern.findall(text):
                raw = next((value for value in groups if value), '')
                # These names are concatenated with assets/ in campaign-render.mjs.
                if raw in ATLASES:
                    raw = '/assets/' + raw
                resolved = urllib.parse.urlparse(urllib.parse.urljoin(url, raw))
                if resolved.netloc == urllib.parse.urlparse(ORIGIN).netloc and PurePosixPath(resolved.path).suffix in EXTENSIONS:
                    queue.append(resolved.path)
    except Exception as error:
        report.append(dict(path=path, error=str(error)))

required = ['index.html', 'campaign.js', 'campaign-data.mjs', 'campaign-engine.mjs', 'campaign-render.mjs', 'audio.js', 'scores.js', 'demo/index.html'] + ['assets/' + name for name in ATLASES]
missing = [name for name in required if not (OUT / name).is_file()]
summary = dict(recovered_at=datetime.now(timezone.utc).isoformat(), origin=ORIGIN, scope='Public frontend only. Server source, authentication backend and databases were not recovered.', files=report, missing_required_files=missing)
(ROOT / 'recovery-report.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False, indent=2))
if missing:
    raise SystemExit('Missing required assets: ' + ', '.join(missing))
