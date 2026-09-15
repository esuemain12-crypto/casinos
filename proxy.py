from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import urllib.error
import os
import mimetypes

CDN   = 'https://demo.casinomobule.com'
ROOT  = os.path.dirname(os.path.abspath(__file__))
IMG_CDN = 'https://cdn.effective-solution.com/CasinoMobule'

# ── Server-side bot filter ────────────────────────────────────────────────────
_BOT_UA = [
    'googlebot','bingbot','yandexbot','yandex','baiduspider','duckduckbot',
    'slurp','facebot','facebookexternalhit','twitterbot','linkedinbot',
    'applebot','mj12bot','semrushbot','ahrefsbot','petalbot','bytespider',
    'dotbot','rogerbot','exabot','gigabot','ia_archiver','seznambot',
    'blexbot','proximic','brandwatch','screaming frog','dataforseo',
    'crawler','spider','scraper','python-requests','python-urllib',
    'go-http-client','java/','libwww','mechanize','phantomjs',
    'headlesschrome','nmap','zgrab','masscan','nikto',
]
# Only block HTML page requests (not assets/API calls)
_HTML_EXTS = ('.html', '.htm', '')

def _is_bot_ua(ua: str) -> bool:
    ua = ua.lower()
    return any(p in ua for p in _BOT_UA)
# ─────────────────────────────────────────────────────────────────────────────

DEMO_FILES_MAP = {
    'DemoParagmatik_files': 'pragmatic',
    'DemoPlayson_files':    'playson',
    'DemoIgrosoft_files':   'igrosoft',
    'Demo3oak_files':       '3oaks',
    'DemoAmatic_files':     'amatic',
    'DemoGreen_files':      'greentube',
    'DemoEvoplay_files':    'evoplay',
    'DemoPush_files':       'pushgaming',
    'DemoRelax_files':      'relax',
    'DemoSpino_files':      'spinomenal',
    'Demo_files':           'hacksaw',
}

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.end_headers()

    def do_GET(self):
        # ── Bot UA filter (HTML pages only) ──────────────────────────────────
        ua = self.headers.get('User-Agent', '')
        parsed = urllib.parse.urlparse(self.path)
        ext = os.path.splitext(parsed.path)[1].lower()
        if _is_bot_ua(ua) and ext in _HTML_EXTS:
            self.send_response(301)
            self.send_header('Location', 'https://www.google.com')
            self.end_headers()
            return

        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        # ── Redirect Demo*_files/*.png → CDN ──
        # Handles both /Demo*_files/img.png and /providers/Demo*_files/img.png
        path_segs = parsed.path.lstrip('/').split('/')
        demo_folder = None
        img_name = None
        if len(path_segs) >= 2 and path_segs[0] in DEMO_FILES_MAP and path_segs[-1].endswith('.png'):
            demo_folder = path_segs[0]
            img_name = path_segs[-1]
        elif len(path_segs) >= 3 and path_segs[1] in DEMO_FILES_MAP and path_segs[-1].endswith('.png'):
            demo_folder = path_segs[1]
            img_name = path_segs[-1]
        if demo_folder and img_name:
            provider = DEMO_FILES_MAP[demo_folder]
            cdn_img_url = f'{IMG_CDN}/{provider}/156-156/{img_name}'
            self.send_response(302)
            self.send_header('Location', cdn_img_url)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
        path_parts = parsed.path.lstrip('/').split('/', 1)

        # ── Serve local casino files ──
        # Strip leading slash, resolve to local file
        rel = parsed.path.lstrip('/')
        # Directory index: / or empty → index.html
        if rel == '' or rel.endswith('/'):
            rel = rel + 'index.html'
        local_path = os.path.normpath(os.path.join(ROOT, rel))
        # Security: only serve files inside ROOT
        if local_path.startswith(ROOT) and os.path.isfile(local_path):
            mime, _ = mimetypes.guess_type(local_path)
            mime = mime or 'application/octet-stream'
            with open(local_path, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
            return

        # ── Proxy to CDN (Hacksaw and others via demo.casinomobule.com) ──
        is_hacksaw = params.get('game.provider', [''])[0].lower() == 'hacksaw'
        cdn_url = CDN + self.path

        class NoFollow(urllib.request.HTTPRedirectHandler):
            def http_error_302(self, req, fp, code, msg, hdrs):
                raise urllib.error.HTTPError(req.full_url, code, msg, hdrs, fp)
            http_error_301 = http_error_303 = http_error_302

        req = urllib.request.Request(cdn_url, headers={'User-Agent': 'Mozilla/5.0'})
        opener = urllib.request.build_opener(NoFollow)
        try:
            opener.open(req)
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303):
                loc = e.headers.get('Location', '')
                if is_hacksaw:
                    loc += ('&' if '?' in loc else '?') + 'disableddemotext=true'
                self.send_response(302)
                self.send_header('Location', loc)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                return
            print(f'ERROR {e.code}: {cdn_url}')
        except Exception as ex:
            print(f'EXCEPTION: {ex}')
        self.send_response(502)
        self.end_headers()

    def log_message(self, *a):
        pass

if __name__ == '__main__':
    print('Прокси запущен: http://localhost:8765  (Ctrl+C для остановки)')
    print(f'Раздаёт файлы из: {ROOT}')
    HTTPServer(('localhost', 8765), Handler).serve_forever()
