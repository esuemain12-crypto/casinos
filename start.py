import subprocess, sys, os, time, signal, threading, io, socket, urllib.request, json as _json

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)

BASE = os.path.dirname(os.path.abspath(__file__))
PY   = sys.executable


def load_dotenv_file(path):
    if not os.path.isfile(path):
        return
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, _, v = line.partition('=')
                key = k.strip()
                val = v.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"[Launcher] .env load warning ({path}): {e}")


def is_port_in_use(port, host='127.0.0.1'):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.2)
        return s.connect_ex((host, int(port))) == 0


def find_free_port(preferred, max_offset=20, host='127.0.0.1'):
    preferred = int(preferred)
    if not is_port_in_use(preferred, host=host):
        return preferred
    for p in range(preferred + 1, preferred + max_offset + 1):
        if not is_port_in_use(p, host=host):
            return p
    return None


load_dotenv_file(os.path.join(BASE, '.env'))
load_dotenv_file(os.path.join(BASE, 'server', '.env'))

_TG_TOKEN = os.environ.get('TRACKER_TG_TOKEN', '')
_TG_CHAT  = os.environ.get('TRACKER_TG_CHAT', '-1003966556584')
_TG_API   = f'https://api.telegram.org/bot{_TG_TOKEN}/sendMessage'

def tg_send(text: str) -> None:
    try:
        payload = _json.dumps({'chat_id': _TG_CHAT, 'text': text,
                               'parse_mode': 'HTML',
                               'disable_web_page_preview': True}).encode()
        req = urllib.request.Request(_TG_API, data=payload,
                                     headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=6)
    except Exception:
        pass 

import datetime as _dt
def _now_msk() -> str:
    msk = _dt.timezone(_dt.timedelta(hours=3))
    return _dt.datetime.now(msk).strftime('%d.%m.%Y %H:%M:%S')


_NODE_DIR = r'C:\Program Files\nodejs'
if os.path.isdir(_NODE_DIR) and _NODE_DIR not in os.environ.get('PATH', ''):
    os.environ['PATH'] = _NODE_DIR + os.pathsep + os.environ.get('PATH', '')
NODE = 'node'

_requested_api_port = int(os.getenv('PORT', '4000'))
_resolved_api_port = find_free_port(_requested_api_port)
if _resolved_api_port is None:
    print(f"[Launcher] ERROR: no free port in range {_requested_api_port}-{_requested_api_port + 20} for API")
    _resolved_api_port = _requested_api_port
elif _resolved_api_port != _requested_api_port:
    print(f"[Launcher] API port {_requested_api_port} is busy -> using {_resolved_api_port}")

os.environ['PORT'] = str(_resolved_api_port)
os.environ.setdefault('API_BASE', f'http://localhost:{_resolved_api_port}')

SERVICES = [
    {
        'name':  'Proxy',
        'cmd':   [PY, os.path.join(BASE, 'proxy.py')],
        'color': '\033[96m', 
    },
    {
        'name':  'Support Bot',
        'cmd':   [PY, os.path.join(BASE, 'bot.py')],
        'color': '\033[92m',  
    },
    {
        'name':  'Admin Bot',
        'cmd':   [PY, os.path.join(BASE, 'admin_bot.py')],
        'color': '\033[93m',   # yellow
        'required_env': ['ADMIN_TG_TOKEN', 'INTERNAL_SECRET'],
    },
    {
        'name':  'API Server',
        'cmd':   [NODE, os.path.join(BASE, 'server', 'src', 'index.js')],
        'color': '\033[95m',   # magenta
        'required_env': ['INTERNAL_SECRET', 'DATABASE_URL', 'JWT_SECRET'],
    },
    {
        'name':  'Crypto Monitor',
        'cmd':   [PY, os.path.join(BASE, 'crypto_monitor.py')],
        'color': '\033[94m',   # blue
    },
    {
        'name':  'Referral Bot',
        'cmd':   [PY, os.path.join(BASE, 'referral_bot.py')],
        'color': '\033[35m',   # purple
    },
]

RESET = '\033[0m'
RED   = '\033[91m'
BOLD  = '\033[1m'

procs = []
svc_state = [
    {
        'disabled': False,
        'last_start': 0.0,
        'quick_failures': 0,
    }
    for _ in SERVICES
]


def stream_output(proc, name, color):
    prefix = f'{color}[{name}]{RESET} '
    for line in iter(proc.stdout.readline, b''):
        try:
            text = line.decode('utf-8', errors='replace').rstrip()
        except Exception:
            text = repr(line)
        sys.stdout.write(prefix + text + '\n')
        sys.stdout.flush()


def start_service(svc, idx):
    missing = [k for k in svc.get('required_env', []) if not os.getenv(k)]
    if missing:
        svc_state[idx]['disabled'] = True
        print(f"{RED}[{svc['name']}] skipped: missing env {', '.join(missing)}{RESET}")
        return None
    try:
        proc = subprocess.Popen(
            svc['cmd'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=BASE,
            env=os.environ.copy(),
        )
        svc_state[idx]['last_start'] = time.time()
        if idx < len(procs):
            procs[idx] = proc
        else:
            procs.append(proc)
        t = threading.Thread(target=stream_output, args=(proc, svc['name'], svc['color']), daemon=True)
        t.start()
        print(f"{svc['color']}[{svc['name']}]{RESET} started (pid {proc.pid})")
        return proc
    except FileNotFoundError as e:
        print(f"{RED}[{svc['name']}] ERROR: {e}{RESET}")
        return None


def shutdown(signum=None, frame=None):
    print(f'\n{BOLD}Stopping all services...{RESET}')
    tg_send(
        '🔴 <b>СЕРВЕР ОСТАНОВЛЕН</b>\n'
        f'🕐 <code>{_now_msk()} МСК</code>'
    )
    for p in procs:
        try:
            p.terminate()
        except Exception:
            pass
    time.sleep(1)
    for p in procs:
        if p.poll() is None:
            try:
                p.kill()
            except Exception:
                pass
    print(f'{BOLD}All stopped.{RESET}')
    sys.exit(0)


signal.signal(signal.SIGINT,  shutdown)
signal.signal(signal.SIGTERM, shutdown)

print(f'{BOLD}Zone 51 — starting all services...{RESET}\n')

print(f"[Launcher] API base for this run: http://localhost:{_resolved_api_port}")
if _resolved_api_port != 4000:
    print(f"[Launcher] Frontend override: localStorage.setItem('z51_api_base','http://localhost:{_resolved_api_port}')")

for i, svc in enumerate(SERVICES):
    start_service(svc, i)
    time.sleep(0.5)

print(f'\n{BOLD}All services running. Press Ctrl+C to stop all.{RESET}\n')

tg_send(
    '🟢 <b>СЕРВЕР ЗАПУЩЕН</b>\n'
    f'📡 API: <code>http://localhost:{_resolved_api_port}</code>\n'
    f'🌐 Proxy: <code>http://localhost:8765</code>\n'
    f'🕐 <code>{_now_msk()} МСК</code>'
)
while True:
    time.sleep(1)
    for i, svc in enumerate(SERVICES):
        p = procs[i] if i < len(procs) else None
        if svc_state[i]['disabled']:
            continue
        if p and p.poll() is not None:
            runtime = time.time() - svc_state[i]['last_start'] if svc_state[i]['last_start'] else 0
            if runtime < 12:
                svc_state[i]['quick_failures'] += 1
            else:
                svc_state[i]['quick_failures'] = 0

            if svc_state[i]['quick_failures'] >= 3:
                svc_state[i]['disabled'] = True
                print(f"{RED}[{svc['name']}] exited too often (code {p.returncode}) — disabled to avoid restart loop.{RESET}")
                tg_send(
                    f'⛔ <b>СЕРВИС СЛЕТЕЛ</b>\n'
                    '────────────────────────────\n'
                    f'📦 Сервис: <b>{svc["name"]}</b>\n'
                    f'❌ Код выхода: <code>{p.returncode}</code>\n'
                    f'⚠️ Причина: 3+ быстрых падения — авторестарт отключён\n'
                    f'🕐 <code>{_now_msk()} МСК</code>'
                )
                continue

            print(f"{RED}[{svc['name']}] exited (code {p.returncode}) — restarting in 5s...{RESET}")
            tg_send(
                f'⚠️ <b>ПАДЕНИЕ СЕРВИСА</b>\n'
                '────────────────────────────\n'
                f'📦 Сервис: <b>{svc["name"]}</b>\n'
                f'❌ Код выхода: <code>{p.returncode}</code>\n'
                f'🔄 Авторестарт через 5 сек...\n'
                f'🕐 <code>{_now_msk()} МСК</code>'
            )
            time.sleep(5)
            new_proc = start_service(svc, i)
            if new_proc:
                procs[i] = new_proc
