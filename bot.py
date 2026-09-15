"""
Zone 51 — Support Bot (port 8766)

Флоу:
  1. /start → заявка в группу [✅ Принять] [❌ Отклонить]
  2. Admin принимает → пользователь получает ссылку на бот + может писать
  3. Пользователь пишет в боте → тикет в группу [✅ Взять в работу] [🔒 Закрыть]
  4. Оператор берёт в работу → назначен
  5. Оператор делает REPLY на тикет в группе → ответ летит к пользователю
  6. Вся переписка через бота
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, ssl, urllib.request, urllib.error
import threading, os, time, random
from datetime import datetime, timezone

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

# ── CONFIG ──────────────────────────────────────────
TG_TOKEN      = os.environ['SUPPORT_TG_TOKEN']
TG_CHAT_ID    = os.environ['SUPPORT_TG_CHAT']
BOT_PORT      = 8766
SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bot_settings.json')
APPROVED_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'approved_users.json')
TICKETS_FILE  = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'active_tickets.json')

DEFAULT_SETTINGS = {
    'enabled':     True,
    'status':      'online',
    'welcome_msg': 'Hello! This is Zone 51 Support. How can we help you?',
    'offline_msg': 'Support is currently offline. Leave a message and we will get back to you.',
    'ticket_seq':  0,
    'reply_name':  'Zone 51 Support',
    'templates':   [],
}

GROUP_INVITE = 'https://t.me/+TD5wSLA7925iN2Jk'

# ── STATE ────────────────────────────────────────────
_settings:          dict = {}
_lock                    = threading.Lock()
_tg_ctx                  = ssl.create_default_context()
_pending_approvals: dict = {}   # user_id -> {username, first_name, requested_at}
_approved_users:    dict = {}   # user_id -> {username, first_name}
_active_tickets:    dict = {}   # group_msg_id -> {user_id, username, first_name, ticket_num, operator_id, operator_name}
_web_sessions:      dict = {}   # session_id -> {username, ticket_num, group_msg_id, operator_tg_id, pending_replies, queued_msgs}
_operator_reply:    dict = {}   # operator_tg_id -> session_id  (operator in "write reply" mode)
_operator_setname:  set  = set()  # operator_tg_id waiting to input new reply_name
_operator_add_tpl:  dict = {}   # operator_tg_id -> {'step': 'name'|'text', 'name': str}
_bot_username:      str  = ''

# ── SETTINGS ────────────────────────────────────────
def load_settings():
    global _settings
    if os.path.isfile(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                saved = json.load(f)
            _settings = {**DEFAULT_SETTINGS, **saved}
            return
        except Exception as e:
            print(f'[BOT] Settings error: {e}')
    _settings = dict(DEFAULT_SETTINGS)
    _save_settings()

def _save_settings():
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(_settings, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'[BOT] Save settings error: {e}')

def load_approved():
    """На каждом старте — сбрасываем одобренных (для чистого тестирования)."""
    global _approved_users
    _approved_users = {}
    _save_approved()
    print('[BOT] Approved users: 0 (cleared on startup)')

def _save_approved():
    try:
        with open(APPROVED_FILE, 'w', encoding='utf-8') as f:
            json.dump({str(k): v for k, v in _approved_users.items()},
                      f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'[BOT] Save approved error: {e}')

def load_tickets():
    global _active_tickets
    if os.path.isfile(TICKETS_FILE):
        try:
            with open(TICKETS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            _active_tickets = {int(k): v for k, v in data.items()}
            print(f'[BOT] Active tickets restored: {len(_active_tickets)}')
        except Exception as e:
            print(f'[BOT] Tickets file error: {e}')

def _save_tickets():
    try:
        with open(TICKETS_FILE, 'w', encoding='utf-8') as f:
            json.dump({str(k): v for k, v in _active_tickets.items()},
                      f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'[BOT] Save tickets error: {e}')

def cfg_get(key):
    with _lock:
        return _settings.get(key, DEFAULT_SETTINGS.get(key))

def cfg_set(key, value):
    with _lock:
        _settings[key] = value
        _save_settings()

# ── HELPERS ──────────────────────────────────────────
def tg_escape(s: str) -> str:
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def geo_lookup(ip: str) -> str:
    """Return 'Country, City' string for given IP, or empty string on failure."""
    try:
        if ip in ('127.0.0.1', '::1', 'localhost') or ip.startswith('192.168.') or ip.startswith('10.'):
            return 'Local network'
        url = f'http://ip-api.com/json/{ip}?fields=status,country,regionName,city'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as r:
            d = json.loads(r.read().decode('utf-8'))
        if d.get('status') == 'success':
            parts = [d.get('country',''), d.get('regionName',''), d.get('city','')]
            return ', '.join(p for p in parts if p)
    except Exception:
        pass
    return ''

# ── TELEGRAM API ─────────────────────────────────────
def tg_api(method: str, payload: dict):
    url  = f'https://api.telegram.org/bot{TG_TOKEN}/{method}'
    body = json.dumps(payload).encode('utf-8')
    req  = urllib.request.Request(url, data=body,
                                  headers={'Content-Type': 'application/json'},
                                  method='POST')
    try:
        with urllib.request.urlopen(req, context=_tg_ctx, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'[TG] {method} HTTP {e.code}: {e.read().decode("utf-8","replace")}')
    except Exception as ex:
        print(f'[TG] {method} error: {ex}')
    return None

def tg_send(chat_id, text: str, markup=None) -> bool:
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if markup:
        payload['reply_markup'] = markup
    r = tg_api('sendMessage', payload)
    return bool(r and r.get('ok'))

def send_to_group(text: str, markup=None):
    """Отправить в группу. Возвращает message_id или None."""
    payload = {'chat_id': TG_CHAT_ID, 'text': text, 'parse_mode': 'HTML'}
    if markup:
        payload['reply_markup'] = markup
    r = tg_api('sendMessage', payload)
    if r and r.get('ok'):
        return r['result']['message_id']
    return None

def tg_send_file(chat_id, file_bytes: bytes, filename: str, mimetype: str,
                 caption: str = None, markup=None):
    """Send photo or document to a Telegram chat using multipart/form-data."""
    safe_mime = mimetype or 'application/octet-stream'
    if safe_mime.startswith('image/'):
        method, field = 'sendPhoto', 'photo'
    else:
        method, field = 'sendDocument', 'document'

    bnd = ('Boundary' + str(random.randint(0, 0xFFFFFFFF))).encode()

    def fld(name: str, value: str) -> bytes:
        return (b'--' + bnd + b'\r\nContent-Disposition: form-data; name="'
                + name.encode() + b'"\r\n\r\n' + value.encode('utf-8') + b'\r\n')

    body = b''
    body += fld('chat_id', str(chat_id))
    if caption:
        body += fld('caption', caption[:1024])
        body += fld('parse_mode', 'HTML')
    if markup:
        body += fld('reply_markup', json.dumps(markup))
    safe_filename = filename.encode('ascii', errors='replace').decode()
    body += (b'--' + bnd + b'\r\nContent-Disposition: form-data; name="'
             + field.encode() + b'"; filename="' + safe_filename.encode() + b'"\r\n'
             + b'Content-Type: ' + safe_mime.encode() + b'\r\n\r\n'
             + file_bytes + b'\r\n')
    body += b'--' + bnd + b'--\r\n'

    url = f'https://api.telegram.org/bot{TG_TOKEN}/{method}'
    req = urllib.request.Request(
        url, data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={bnd.decode()}'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, context=_tg_ctx, timeout=30) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'[TG] {method} HTTP {e.code}: {e.read().decode("utf-8","replace")}')
    except Exception as ex:
        print(f'[TG] {method} error: {ex}')
    return None

def fetch_bot_username():
    global _bot_username
    r = tg_api('getMe', {})
    if r and r.get('ok'):
        _bot_username = r['result'].get('username', '')
        print(f'[BOT] Bot: @{_bot_username}')

# ── INLINE MENUS ─────────────────────────────────────

BRAND = '🎰 <b>Zone 51</b>'
DIV   = '─' * 25

def _new_user_markup():
    """Для нового — только кнопка вступления в команду."""
    return {'inline_keyboard': [[{'text': '📋 Вступить в команду', 'callback_data': 'menu_register'}]]}

def _operator_main_markup():
    """Главная панель оператора."""
    enabled = cfg_get('enabled')
    status  = cfg_get('status')
    return {
        'inline_keyboard': [
            [{'text': '🎫 Активные тикеты',  'callback_data': 'op_queue'},
             {'text': '📊 Статистика',       'callback_data': 'op_stats'}],
            [{'text': '🟢 Онлайн' if status != 'online' else '🌙 Оффлайн',
              'callback_data': 'admin_online' if status != 'online' else 'admin_offline'},
             {'text': '✅ Чат вкл' if not enabled else '🔴 Чат выкл',
              'callback_data': 'admin_enable' if not enabled else 'admin_disable'}],
            [{'text': '⚙️ Настройки системы', 'callback_data': 'op_settings'}],
        ]
    }

def _op_settings_markup():
    enabled = cfg_get('enabled')
    status  = cfg_get('status')
    rname   = cfg_get('reply_name') or 'Поддержка Zone 51'
    tpls    = cfg_get('templates') or []
    return {
        'inline_keyboard': [
            [{'text': '✅ Включить чат' if not enabled else '🔴 Выключить чат',
              'callback_data': 'admin_enable' if not enabled else 'admin_disable'},
             {'text': '🟢 Онлайн' if status != 'online' else '🌙 Оффлайн',
              'callback_data': 'admin_online' if status != 'online' else 'admin_offline'}],
            [{'text': f'✏️ Имя в чате: {rname}', 'callback_data': 'admin_set_name'}],
            [{'text': f'📌 Шаблоны ({len(tpls)})', 'callback_data': 'tpl_menu'}],
            [{'text': '📋 Статус системы', 'callback_data': 'admin_status'}],
            [{'text': '◀️ Назад', 'callback_data': 'menu_back'}],
        ]
    }

# Legacy aliases (used in callbacks)
def _user_menu_markup_new():
    return _new_user_markup()

def _user_menu_markup_approved():
    return _operator_main_markup()

def _user_menu_markup(user_id=None):
    if user_id is not None and user_id in _approved_users:
        return _operator_main_markup()
    return _new_user_markup()

def _admin_menu_markup():
    return _op_settings_markup()

# ── TEMPLATES HELPERS ────────────────────────────────
def _tpl_list():
    return cfg_get('templates') or []

def _tpl_add(name: str, text: str) -> str:
    """Add template, return its id."""
    tpl_id = f'{random.randint(0, 0xFFFFFF):06x}'
    tpls   = list(_tpl_list())
    tpls.append({'id': tpl_id, 'name': name, 'text': text})
    cfg_set('templates', tpls)
    return tpl_id

def _tpl_delete(tpl_id: str):
    tpls = [t for t in _tpl_list() if t['id'] != tpl_id]
    cfg_set('templates', tpls)

def _tpl_get(tpl_id: str):
    return next((t for t in _tpl_list() if t['id'] == tpl_id), None)

def _tpl_menu_markup():
    """Templates management keyboard (from settings)."""
    tpls = _tpl_list()
    rows = []
    for t in tpls:
        rows.append([
            {'text': f'📌 {t["name"]}', 'callback_data': f'tpl_preview:{t["id"]}'},
            {'text': '🗑',               'callback_data': f'tpl_del:{t["id"]}'},
        ])
    rows.append([{'text': '➕ Добавить шаблон', 'callback_data': 'tpl_add'}])
    rows.append([{'text': '◀️ Назад',           'callback_data': 'op_settings'}])
    return {'inline_keyboard': rows}

def _tpl_menu_text():
    tpls = _tpl_list()
    if not tpls:
        return '📌 <b>Шаблоны ответов</b>\n\nШаблонов пока нет.\nНажмите ➕ чтобы добавить первый.'
    lines = ['📌 <b>Шаблоны ответов</b>\n']
    for t in tpls:
        preview = t['text'][:60] + ('…' if len(t['text']) > 60 else '')
        lines.append(f'• <b>{tg_escape(t["name"])}</b>\n  <i>{tg_escape(preview)}</i>')
    return '\n'.join(lines)

def _tpl_pick_markup(session_id: str):
    """Templates picker keyboard (inline, during reply mode)."""
    tpls = _tpl_list()
    if not tpls:
        return {'inline_keyboard': [
            [{'text': '📭 Нет шаблонов', 'callback_data': 'noop'}],
            [{'text': '✖️ Отменить',     'callback_data': 'cancel_reply'}],
        ]}
    rows = []
    for t in tpls:
        rows.append([{'text': f'📌 {t["name"]}', 'callback_data': f'tpl_send:{session_id}:{t["id"]}'}])
    rows.append([{'text': '✖️ Отменить', 'callback_data': 'cancel_reply'}])
    return {'inline_keyboard': rows}

def _status_text():
    enabled = cfg_get('enabled')
    status  = cfg_get('status')
    chat_icon   = '✅' if enabled else '🔴'
    status_icon = '🟢 Онлайн' if status == 'online' else '🌙 Оффлайн'
    return (
        '🎰 <b>Zone 51 — Система поддержки</b>\n'
        '─────────────────────────\n'
        f'{chat_icon} Чат: <b>{"\u2705 включ¸н" if enabled else "\ud83d\udd34 выключ¸н"}</b>\n'
        f'📡 Статус: <b>{status_icon}</b>\n'
        '─────────────────────────\n'
        f'🎫 Тикетов всего:  <b>{cfg_get("ticket_seq")}</b>\n'
        f'🟡 Ожидают одобрения: <b>{len(_pending_approvals)}</b>\n'
        f'👥 Операторов:  <b>{len(_approved_users)}</b>\n'
        f'🔶 Открытых тикетов: <b>{len(_active_tickets)}</b>\n'
        '─────────────────────────\n'
        f'📝 <b>Приветствие:</b>\n<i>{tg_escape(cfg_get("welcome_msg"))}</i>\n\n'
        f'🌙 <b>Оффлайн сообщение:</b>\n<i>{tg_escape(cfg_get("offline_msg"))}</i>\n\n'
        f'✏️ <b>Имя оператора в чате:</b> <i>{tg_escape(cfg_get("reply_name") or "Поддержка Zone 51")}</i>'
    )

def _operator_dashboard_text(name: str) -> str:
    """Dashboard text for approved operator."""
    enabled = cfg_get('enabled')
    status  = cfg_get('status')
    open_t  = len(_active_tickets)
    pending = len(_pending_approvals)
    chat_icon   = '✅' if enabled else '🔴'
    status_icon = '🟢 Онлайн' if status == 'online' else '🌙 Оффлайн'
    return (
        '🎰 <b>Zone 51 — Операторская панель</b>\n'
        '─────────────────────────\n'
        f'👤 Оператор: <b>{tg_escape(name)}</b>\n'
        f'{chat_icon} Чат: <b>{"\u2705 включ¸н" if enabled else "\ud83d\udd34 выключ¸н"}</b>  \u00b7  {status_icon}\n'
        '─────────────────────────\n'
        f'🔶 Активных тикетов: <b>{open_t}</b>\n'
        f'🟡 Новых заявок: <b>{pending}</b>\n'
        f'🎫 Всего тикетов: <b>{cfg_get("ticket_seq")}</b>'
    )

def _queue_text() -> str:
    if not _active_tickets:
        return '🎰 <b>Zone 51 — Очередь тикетов</b>\n─────────────────────────\n✅ Очередь пустая'
    lines = ['🎰 <b>Zone 51 — Очередь тикетов</b>', '─' * 25]
    for msg_id, t in list(_active_tickets.items()):
        op = f'@{tg_escape(t["operator_name"])}' if t.get('operator_name') else '— свободен'
        status = '🟢 В работе' if t.get('operator_id') else '🟡 Ожидает'
        lines.append(f'{status} • <b>#{t["ticket_num"]:04d}</b> | @{tg_escape(t["username"])} | Оп: {op}')
    return '\n'.join(lines)

def _stats_text() -> str:
    total   = cfg_get('ticket_seq')
    open_t  = len(_active_tickets)
    closed  = total - open_t
    ops     = len(_approved_users)
    pending = len(_pending_approvals)
    return (
        '🎰 <b>Zone 51 — Статистика</b>\n'
        '─────────────────────────\n'
        f'🎫 Тикетов всего:     <b>{total}</b>\n'
        f'🔶 Активных:      <b>{open_t}</b>\n'
        f'✅ Закрытых:       <b>{closed}</b>\n'
        '─────────────────────────\n'
        f'👥 Операторов:     <b>{ops}</b>\n'
        f'🟡 Ожидают доступа: <b>{pending}</b>'
    )

# ── TICKET ──────────────────────────────────────────
def _send_ticket(user_id: int, username: str, first_name: str, message: str, source: str = '🤖 Бот'):
    """Отправить тикет в группу, сохранить в _active_tickets."""
    with _lock:
        _settings['ticket_seq'] += 1
        num = _settings['ticket_seq']
        _save_settings()

    ts      = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
    profile = f'<a href="tg://user?id={user_id}">@{tg_escape(username)}</a>'
    text = (
        f'🎰 <b>Zone 51 — Тикет #{num:04d}</b>\n'
        f'─────────────────────────\n'
        f'👤 {profile}  ({tg_escape(first_name)})\n'
        f'🔗 Источник: {source}\n'
        f'🕒 {ts}\n'
        f'─────────────────────────\n'
        f'💬 {tg_escape(message)}'
    )
    markup = {
        'inline_keyboard': [[
            {'text': '⚡️ Взять в работу', 'callback_data': 'take_ticket'},
        ]]
    }
    msg_id = send_to_group(text, markup)
    if msg_id:
        _active_tickets[msg_id] = {
            'user_id':       user_id,
            'username':      username,
            'first_name':    first_name,
            'ticket_num':    num,
            'operator_id':   None,
            'operator_name': None,
        }
        _save_tickets()
        print(f'[BOT] Ticket #{num:04d} -> group msg_id={msg_id}')
    return msg_id

# ── COMMAND HANDLER ──────────────────────────────────
def handle_command(text: str, from_id: int, from_username: str, from_first_name: str):
    parts = text.strip().split(None, 1)
    cmd   = parts[0].lower().split('@')[0]
    arg   = parts[1].strip() if len(parts) > 1 else ''
    name  = from_first_name or from_username or 'User'

    if cmd == '/start':
        if from_id in _approved_users:
            return (
                _operator_dashboard_text(name),
                _operator_main_markup(),
            )
        return (
            f'🎰 <b>Zone 51 — Операторский центр</b>\n'
            f'─────────────────────────\n'
            f'👋 Привет, <b>{tg_escape(name)}</b>!\n\n'
            f'Этот бот — внутренний инструмент команды Zone 51.\n'
            f'Для получения доступа подай заявку.',
            _new_user_markup(),
        )

    elif cmd == '/status':
        return (
            _status_text(),
            {
                'inline_keyboard': [
                    [
                        {
                            'text':          '🔴 Выключить' if cfg_get('enabled') else '✅ Включить',
                            'callback_data': 'admin_disable' if cfg_get('enabled') else 'admin_enable',
                        },
                        {
                            'text':          '🌙 Оффлайн' if cfg_get('status') == 'online' else '🟢 Онлайн',
                            'callback_data': 'admin_offline' if cfg_get('status') == 'online' else 'admin_online',
                        },
                    ],
                    [{'text': '← Назад', 'callback_data': 'menu_admin'}],
                ]
            }
        )

    elif cmd == '/enable':
        cfg_set('enabled', True);  return ('✅ Чат <b>включён</b>.', _admin_menu_markup())
    elif cmd == '/disable':
        cfg_set('enabled', False); return ('🔴 Чат <b>выключен</b>.', _admin_menu_markup())
    elif cmd == '/online':
        cfg_set('status', 'online');  return ('🟢 Статус: <b>онлайн</b>.', _admin_menu_markup())
    elif cmd == '/offline':
        cfg_set('status', 'offline'); return ('🌙 Статус: <b>оффлайн</b>.', _admin_menu_markup())
    elif cmd == '/setwelcome':
        if not arg: return ('⚠ /setwelcome <текст>', _admin_menu_markup())
        cfg_set('welcome_msg', arg)
        return (f'✅ Приветствие:\n<i>{tg_escape(arg)}</i>', _admin_menu_markup())
    elif cmd == '/setoffmsg':
        if not arg: return ('⚠ /setoffmsg <текст>', _admin_menu_markup())
        cfg_set('offline_msg', arg)
        return (f'✅ Оффлайн:\n<i>{tg_escape(arg)}</i>', _admin_menu_markup())
    else:
        return (
            f'👋 Привет, <b>{tg_escape(name)}</b>! Выбери действие:',
            _user_menu_markup(),
        )

# ── CALLBACK HANDLER ─────────────────────────────────
def handle_callback(cb_id, from_id, data, message_id, chat_id_msg,
                    from_username='', from_first_name=''):
    name  = from_first_name or from_username or 'User'
    uname = from_username or str(from_id)

    # ── Подать заявку ────────────────────────────────
    if data == 'menu_register':
        if from_id in _approved_users:
            tg_api('editMessageText', {
                'chat_id': chat_id_msg, 'message_id': message_id,
                'text': '✅ Ты уже в команде!',
                'parse_mode': 'HTML', 'reply_markup': _operator_main_markup(),
            })
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
            return
        if from_id in _pending_approvals:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id,
                'text': '⏳ Заявка уже отправлена, ожидай.', 'show_alert': True,
            })
            return
        _pending_approvals[from_id] = {
            'username': uname, 'first_name': name, 'requested_at': time.time(),
        }
        ts = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
        send_to_group(
            '🔔 <b>Zone 51 — Заявка в команду</b>\n'
            '─────────────────────────\n'
            f'👤 <a href="tg://user?id={from_id}">@{tg_escape(uname)}</a>  ({tg_escape(name)})\n'
            f'🕒 {ts}',
            {'inline_keyboard': [[
                {'text': '✅ Добавить в команду', 'callback_data': f'reg_approve:{from_id}'},
                {'text': '❌ Отклонить',              'callback_data': f'reg_reject:{from_id}'},
            ]]}
        )
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': (
                '⏳ <b>Заявка отправлена!</b>\n\n'
                'Ожидайте одобрения от администрации.'
            ),
            'parse_mode': 'HTML',
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '📋 Заявка отправлена!'})

    # ── Написать в поддержку (легаси, не используется) ─────────────────
    elif data == 'menu_support':
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Принять заявку ───────────────────────────────
    elif data.startswith('reg_approve:'):
        try:
            user_id = int(data.split(':', 1)[1])
        except ValueError:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Ошибка'})
            return
        info = _pending_approvals.get(user_id)
        if not info:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id, 'text': '⚠ Уже обработана', 'show_alert': True,
            })
            return
        username   = info['username']
        first_name = info['first_name']
        del _pending_approvals[user_id]
        _approved_users[user_id] = {'username': username, 'first_name': first_name}
        _save_approved()

        bot_link = f'https://t.me/{_bot_username}' if _bot_username else ''
        tg_api('sendMessage', {
            'chat_id': user_id,
            'text': (
                '🎰 <b>Zone 51 — Доступ одобр¸н!</b>\n'
                '─────────────────────────\n'
                f'👋 Привет, <b>{tg_escape(first_name)}</b>!\n\n'
                'Ты добавлен в команду Zone 51.\n'
                'Используй этот бот для работы с тикетами и управления системой.\n\n'
                f'🔗 Чат команды: <a href="{GROUP_INVITE}">{GROUP_INVITE}</a>'
            ),
            'parse_mode': 'HTML',
            'reply_markup': _operator_main_markup(),
        })
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': (
                f'✅ <b>Заявка принята</b>\n'
                f'👤 @{tg_escape(username)} ({tg_escape(first_name)})\n'
                f'Пользователь уведомлён.'
            ),
            'parse_mode': 'HTML',
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '✅ Принято!'})

    # ── Отклонить заявку ────────────────────────────
    elif data.startswith('reg_reject:'):
        try:
            user_id = int(data.split(':', 1)[1])
        except ValueError:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Ошибка'})
            return
        info = _pending_approvals.pop(user_id, None)
        username   = info['username']   if info else str(user_id)
        first_name = info['first_name'] if info else '?'
        tg_api('sendMessage', {
            'chat_id': user_id,
            'text': (
                '🎰 <b>Zone 51 — Доступ отклон¸н</b>\n'
                '─────────────────────────\n'
                'К сожалению, администрация отклонила заявку.'
            ),
            'parse_mode': 'HTML', 'reply_markup': _new_user_markup(),
        })
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': f'❌ <b>Отклонено</b>\n👤 @{tg_escape(username)} ({tg_escape(first_name)})',
            'parse_mode': 'HTML',
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '❌ Отклонено'})

    # ── Взять в работу ───────────────────────────────
    elif data == 'take_ticket':
        ticket = _active_tickets.get(message_id)
        if not ticket:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id, 'text': '⚠ Тикет не найден', 'show_alert': True,
            })
            return
        if ticket.get('operator_id'):
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id,
                'text': f'⚠ Уже взят оператором @{ticket["operator_name"]}',
                'show_alert': True,
            })
            return
        _active_tickets[message_id]['operator_id']   = from_id
        _active_tickets[message_id]['operator_name'] = uname
        _save_tickets()
        num = ticket['ticket_num']
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'🟢 В работе — @{tg_escape(uname)}', 'callback_data': 'noop'},
                {'text': '🔐 Закрыть', 'callback_data': f'close_ticket:{message_id}'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'⚡️ Тикет #{num:04d} взят!'})

    # ── Закрыть тикет ────────────────────────────────
    elif data.startswith('close_ticket:'):
        try:
            tmsg_id = int(data.split(':', 1)[1])
        except ValueError:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Ошибка'})
            return
        ticket = _active_tickets.pop(tmsg_id, None)
        if not ticket:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Тикет уже закрыт'})
            return
        _save_tickets()
        num = ticket['ticket_num']
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'✅ Закрыт — @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'✅ Тикет #{num:04d} закрыт'})

    # ── Операторская панель ─────────────────────────────────────
    elif data == 'op_queue':
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _queue_text(), 'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[
                {'text': '🔄 Обновить', 'callback_data': 'op_queue'},
                {'text': '◀️ Назад',    'callback_data': 'menu_back'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'op_stats':
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _stats_text(), 'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[
                {'text': '🔄 Обновить', 'callback_data': 'op_stats'},
                {'text': '◀️ Назад',    'callback_data': 'menu_back'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'op_settings':
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _status_text(), 'parse_mode': 'HTML',
            'reply_markup': _op_settings_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Панель управления ────────────────────────────
    elif data == 'menu_admin':
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _status_text(), 'parse_mode': 'HTML',
            'reply_markup': _op_settings_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'menu_back':
        txt = _operator_dashboard_text(name) if from_id in _approved_users else (
            f'🎰 <b>Zone 51 — Операторский центр</b>\n'
            f'─────────────────────────\n'
            f'👤 {tg_escape(name)} | Подай заявку для доступа.'
        )
        mkp = _operator_main_markup() if from_id in _approved_users else _new_user_markup()
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': txt, 'parse_mode': 'HTML', 'reply_markup': mkp,
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'admin_status':
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _status_text(), 'parse_mode': 'HTML',
            'reply_markup': _op_settings_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'admin_set_name':
        _operator_setname.add(from_id)
        tg_api('sendMessage', {
            'chat_id': chat_id_msg,
            'text': (
                f'✏️ <b>Текущее имя:</b> <i>{tg_escape(cfg_get("reply_name") or "Поддержка Zone 51")}</i>\n\n'
                'Напишите новое имя для отображения в чате сайта:'
            ),
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[{'text': '✖️ Отмена', 'callback_data': 'cancel_setname'}]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'cancel_setname':
        _operator_setname.discard(from_id)
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': '✖️ <i>Отменено.</i>', 'parse_mode': 'HTML',
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data in ('admin_enable', 'admin_disable', 'admin_online', 'admin_offline'):
        if data == 'admin_enable':  cfg_set('enabled', True)
        if data == 'admin_disable': cfg_set('enabled', False)
        if data == 'admin_online':  cfg_set('status', 'online')
        if data == 'admin_offline': cfg_set('status', 'offline')
        labels = {
            'admin_enable': '✅ Чат включ¸н', 'admin_disable': '🔴 Чат выключ¸н',
            'admin_online': '🟢 Онлайн',          'admin_offline': '🌙 Оффлайн',
        }
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'reply_markup': _op_settings_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': labels[data]})

    # ── Взять веб-тикет ──────────────────────────────────────────────────────
    elif data.startswith('take_web:'):
        session_id = data.split(':', 1)[1]
        sess = _web_sessions.get(session_id)
        if not sess:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id, 'text': '⚠ Сессия не найдена', 'show_alert': True,
            })
            return
        if sess.get('operator_tg_id'):
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id,
                'text': f'⚠ Уже взят оператором @{tg_escape(str(sess.get("operator_name","?")))}',
                'show_alert': True,
            })
            return
        sess['operator_tg_id'] = from_id
        sess['operator_name']  = uname
        # Update group message button
        tg_api('editMessageReplyMarkup', {
            'chat_id': TG_CHAT_ID, 'message_id': sess['group_msg_id'],
            'reply_markup': {'inline_keyboard': [[
                {'text': f'🟢 В работе — @{tg_escape(uname)}', 'callback_data': 'noop'},
                {'text': '🔒 Закрыть', 'callback_data': f'close_web:{session_id}'},
            ]]},
        })
        num = sess['ticket_num']
        # Build user info card
        uinfo_name    = sess.get('user_name')    or sess.get('username') or '—'
        uinfo_email   = sess.get('user_email')   or '—'
        uinfo_ip      = sess.get('user_ip')      or '—'
        uinfo_country = sess.get('user_country') or ''
        uinfo_ua      = sess.get('user_agent')   or '—'
        uinfo_page    = sess.get('user_page')    or '—'
        uinfo_ts      = sess.get('started_at')   or '—'
        uinfo_sid     = sess.get('search_id')    or '—'
        ua_short      = uinfo_ua[:110]
        geo_line      = f' <tg-emoji emoji-id="5368324170671202286">🌍</tg-emoji> {tg_escape(uinfo_country)}' if uinfo_country else ''
        # Send queued messages combined with full user info
        for qm in sess.get('queued_msgs', []):
            ts = datetime.now(timezone.utc).strftime('%H:%M UTC')
            tg_api('sendMessage', {
                'chat_id': from_id,
                'text': (
                    f'<tg-emoji emoji-id="5431815452437257407">🌐</tg-emoji> <b>Zone 51 — Веб-тикет #{num:04d}</b>  <code>#{uinfo_sid}</code>\n'
                    f'\n'
                    f'<tg-emoji emoji-id="5370869268012381412">👤</tg-emoji> <b>{tg_escape(uinfo_name)}</b>\n'
                    f'<tg-emoji emoji-id="5451882707875276247">📧</tg-emoji> <code>{tg_escape(uinfo_email)}</code>\n'
                    f'\n'
                    f'<tg-emoji emoji-id="5451646226975955576">🌐</tg-emoji> <code>{tg_escape(uinfo_ip)}</code>{geo_line}\n'
                    f'<tg-emoji emoji-id="5441499253950470267">📄</tg-emoji> {tg_escape(uinfo_page)}\n'
                    f'<tg-emoji emoji-id="5467555879886506492">🖥</tg-emoji> <code>{tg_escape(ua_short)}</code>\n'
                    f'<tg-emoji emoji-id="5440660757194744323">🕒</tg-emoji> {tg_escape(uinfo_ts)}\n'
                    f'\n'
                    f'<tg-emoji emoji-id="5368324170671202286">💬</tg-emoji> {tg_escape(qm)}  <i>({ts})</i>'
                ),
                'parse_mode': 'HTML',
                'reply_markup': {'inline_keyboard': [[
                    {'text': '✏️ Ответить', 'callback_data': f'reply_web:{session_id}'},
                    {'text': '📌 Шаблоны',  'callback_data': f'tpl_pick:{session_id}'},
                ]]},
            })
        sess['queued_msgs'] = []
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'⚡️ Тикет #{num:04d} взят!'})

    # ── Закрыть веб-тикет ────────────────────────────────────────────────────
    elif data.startswith('close_web:'):
        session_id = data.split(':', 1)[1]
        sess = _web_sessions.get(session_id)
        if not sess:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id, 'text': '⚠ Сессия не найдена', 'show_alert': True,
            })
            return
        if sess.get('closed'):
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id, 'text': '⚠ Ticket already closed', 'show_alert': True,
            })
            return
        num = sess['ticket_num']
        sess['closed'] = True
        reply_name = cfg_get('reply_name') or 'Zone 51 Support'
        sess.setdefault('pending_replies', []).append({
            'text': 'Your support request has been closed by the operator. Thank you for contacting Zone 51!',
            'from': reply_name,
            'closed': True,
        })
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'✅ Closed — @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'✅ Ticket #{num:04d} closed'})

    # ── Ответить на веб-сообщение ─────────────────────────────────────────────
    elif data.startswith('reply_web:'):
        session_id = data.split(':', 1)[1]
        _operator_reply[from_id] = session_id
        tg_api('sendMessage', {
            'chat_id': chat_id_msg,
            'text': (
                '✍️ <b>Напишите ответ пользователю:</b>\n'
                '<i>Следующее сообщение будет отправлено на сайт пользователю.</i>'
            ),
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[
                {'text': '📌 Шаблоны',  'callback_data': f'tpl_pick:{session_id}'},
                {'text': '✖️ Отменить', 'callback_data': 'cancel_reply'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Отменить режим ответа ─────────────────────────────────────────────────
    elif data == 'cancel_reply':
        _operator_reply.pop(from_id, None)
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': '✖️ <i>Ответ отменён.</i>',
            'parse_mode': 'HTML',
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Меню шаблонов (из настроек) ───────────────────────────────────────────
    elif data == 'tpl_menu':
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _tpl_menu_text(), 'parse_mode': 'HTML',
            'reply_markup': _tpl_menu_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Превью шаблона ────────────────────────────────────────────────────────
    elif data.startswith('tpl_preview:'):
        tpl_id = data.split(':', 1)[1]
        tpl    = _tpl_get(tpl_id)
        if tpl:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id,
                'text': f'📌 {tpl["name"]}:\n{tpl["text"][:200]}',
                'show_alert': True,
            })
        else:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Не найден'})

    # ── Добавить шаблон (шаг 1: ждём название) ───────────────────────────────
    elif data == 'tpl_add':
        _operator_add_tpl[from_id] = {'step': 'name'}
        tg_api('sendMessage', {
            'chat_id': chat_id_msg,
            'text': '📌 <b>Новый шаблон</b>\n\nШаг 1/2: Введите <b>название</b> шаблона (до 32 символов):',
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[
                {'text': '✖️ Отмена', 'callback_data': 'tpl_add_cancel'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Отмена добавления шаблона ─────────────────────────────────────────────
    elif data == 'tpl_add_cancel':
        _operator_add_tpl.pop(from_id, None)
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _tpl_menu_text(), 'parse_mode': 'HTML',
            'reply_markup': _tpl_menu_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Удалить шаблон ────────────────────────────────────────────────────────
    elif data.startswith('tpl_del:'):
        tpl_id = data.split(':', 1)[1]
        tpl    = _tpl_get(tpl_id)
        if tpl:
            _tpl_delete(tpl_id)
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'🗑 Удалён: {tpl["name"]}'})
        else:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Не найден'})
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': _tpl_menu_text(), 'parse_mode': 'HTML',
            'reply_markup': _tpl_menu_markup(),
        })

    # ── Выбрать шаблон для отправки (из режима ответа) ───────────────────────
    elif data.startswith('tpl_pick:'):
        session_id = data.split(':', 1)[1]
        sess = _web_sessions.get(session_id)
        if not sess:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Сессия не найдена', 'show_alert': True})
            return
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': '📌 <b>Выберите шаблон:</b>',
            'parse_mode': 'HTML',
            'reply_markup': _tpl_pick_markup(session_id),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    # ── Отправить шаблон пользователю ────────────────────────────────────────
    elif data.startswith('tpl_send:'):
        parts = data.split(':', 2)
        if len(parts) != 3:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
            return
        _, session_id, tpl_id = parts
        sess = _web_sessions.get(session_id)
        tpl  = _tpl_get(tpl_id)
        if not sess or not tpl:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Сессия или шаблон не найден', 'show_alert': True})
            return
        display_name = cfg_get('reply_name') or uname or fname or 'Поддержка Zone 51'
        sess.setdefault('pending_replies', []).append({'text': tpl['text'], 'from': display_name})
        sid_label = sess.get('search_id') or '—'
        tg_api('editMessageText', {
            'chat_id': chat_id_msg, 'message_id': message_id,
            'text': (
                f'✅ <b>Шаблон отправлен</b> <code>#{sid_label}</code>:\n'
                f'<b>{tg_escape(tpl["name"])}</b>\n'
                f'<i>{tg_escape(tpl["text"][:200])}</i>'
            ),
            'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[
                {'text': '✏️ Ответить', 'callback_data': f'reply_web:{session_id}'},
                {'text': '📌 Шаблоны',  'callback_data': f'tpl_pick:{session_id}'},
            ]]},
        })
        # Remove operator from reply mode if active
        _operator_reply.pop(from_id, None)
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'✅ Отправлен шаблон: {tpl["name"]}'})

    else:
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

# ── REMINDER THREAD ──────────────────────────────────
# Если тикет не взят в работу в течение REMIND_AFTER секунд —
# повторно отправляем в группу с кнопкой "⚡️ Взять в работу".
# Повтор не чаще чем раз в REMIND_INTERVAL секунд.
REMIND_AFTER    = 180   # 3 минуты без ответа — первый напомин.
REMIND_INTERVAL = 180   # и затем каждые 3 минуты

def _reminder_loop():
    while True:
        time.sleep(30)
        try:
            now = time.time()
            for session_id, sess in list(_web_sessions.items()):
                if sess.get('operator_tg_id'):
                    continue  # уже взят
                # parse started_at to timestamp
                started = sess.get('_started_ts')
                if started is None:
                    continue
                last_remind = sess.get('_last_remind', 0)
                age = now - started
                since_last = now - last_remind
                if age < REMIND_AFTER:
                    continue
                if last_remind and since_last < REMIND_INTERVAL:
                    continue
                # Send reminder to group
                num      = sess['ticket_num']
                u_name   = sess.get('user_name')  or sess.get('username') or '—'
                u_email  = sess.get('user_email') or '—'
                u_ip     = sess.get('user_ip')    or '—'
                u_country= sess.get('user_country') or ''
                u_sid    = sess.get('search_id')  or '—'
                geo_str  = f' 🌍 {tg_escape(u_country)}' if u_country else ''
                remind_count = sess.get('_remind_count', 0) + 1
                sess['_remind_count'] = remind_count
                sess['_last_remind']  = now
                tg_text = (
                    f'🔔 <b>Напоминание #{remind_count} — тикет #{num:04d} не взят!</b>  <code>#{u_sid}</code>\n\n'
                    f'👤 <b>{tg_escape(u_name)}</b>\n'
                    f'📧 <code>{tg_escape(u_email)}</code>\n'
                    f'🌐 <code>{tg_escape(u_ip)}</code>{geo_str}\n\n'
                    f'⏳ Ожидает <b>{int(age // 60)} мин</b> без ответа'
                )
                markup = {'inline_keyboard': [[
                    {'text': '⚡️ Взять в работу', 'callback_data': f'take_web:{session_id}'},
                ]]}
                send_to_group(tg_text, markup)
                print(f'[BOT] Reminder #{remind_count} for ticket #{num:04d}')
        except Exception as ex:
            print(f'[BOT] Reminder error: {ex}')

# ── POLLING THREAD ───────────────────────────────────
def _poll_loop():
    offset = 0
    print('[BOT] Polling started...')
    while True:
        try:
            url  = f'https://api.telegram.org/bot{TG_TOKEN}/getUpdates'
            body = json.dumps({
                'offset': offset, 'timeout': 30,
                'allowed_updates': ['message', 'callback_query'],
            }).encode()
            req = urllib.request.Request(url, data=body,
                                         headers={'Content-Type': 'application/json'},
                                         method='POST')
            with urllib.request.urlopen(req, context=_tg_ctx, timeout=40) as r:
                data = json.loads(r.read().decode('utf-8'))

            for upd in data.get('result', []):
                offset = upd['update_id'] + 1

                # Нажатие inline-кнопки
                cb = upd.get('callback_query')
                if cb:
                    handle_callback(
                        cb_id           = cb['id'],
                        from_id         = cb['from']['id'],
                        data            = cb.get('data', ''),
                        message_id      = cb.get('message', {}).get('message_id'),
                        chat_id_msg     = cb.get('message', {}).get('chat', {}).get('id'),
                        from_username   = cb['from'].get('username', ''),
                        from_first_name = cb['from'].get('first_name', ''),
                    )
                    continue

                msg      = upd.get('message', {})
                text     = msg.get('text', '').strip()
                from_obj = msg.get('from', {})
                chat_id  = msg.get('chat', {}).get('id')
                uname    = from_obj.get('username', '')
                fname    = from_obj.get('first_name', '')
                if not text or not chat_id:
                    continue

                # ── Сообщение из группы (оператор отвечает на тикет) ──
                if str(chat_id) == TG_CHAT_ID:
                    reply_to = msg.get('reply_to_message', {})
                    if reply_to:
                        ticket_msg_id = reply_to.get('message_id')
                        ticket = _active_tickets.get(ticket_msg_id)
                        if ticket:
                            op_name = fname or uname or 'Оператор'
                            # Форвардим ответ пользователю
                            tg_api('sendMessage', {
                                'chat_id':    ticket['user_id'],
                                'text': (
                                    f'💬 <b>Ответ от оператора @{tg_escape(op_name)}:</b>\n\n'
                                    f'{tg_escape(text)}'
                                ),
                                'parse_mode':   'HTML',
                                'reply_markup': _user_menu_markup(),
                            })
                            print(f'[BOT] Operator reply -> user {ticket["user_id"]}')
                    continue

                # ── Сообщение от пользователя ──────────────────────
                # Проверить: оператор добавляет шаблон?
                if chat_id in _operator_add_tpl:
                    state = _operator_add_tpl[chat_id]
                    if state['step'] == 'name':
                        name_val = text.strip()[:32]
                        _operator_add_tpl[chat_id] = {'step': 'text', 'name': name_val}
                        tg_api('sendMessage', {
                            'chat_id': chat_id,
                            'text': (
                                f'📌 <b>Новый шаблон</b>\n'
                                f'Название: <b>{tg_escape(name_val)}</b>\n\n'
                                f'Шаг 2/2: Введите <b>текст</b> шаблона:'
                            ),
                            'parse_mode': 'HTML',
                            'reply_markup': {'inline_keyboard': [[
                                {'text': '✖️ Отмена', 'callback_data': 'tpl_add_cancel'},
                            ]]},
                        })
                    elif state['step'] == 'text':
                        tpl_name = state.get('name', '—')
                        tpl_text = text.strip()
                        del _operator_add_tpl[chat_id]
                        _tpl_add(tpl_name, tpl_text)
                        tg_api('sendMessage', {
                            'chat_id': chat_id,
                            'text': (
                                f'✅ <b>Шаблон сохранён!</b>\n\n'
                                f'📌 <b>{tg_escape(tpl_name)}</b>\n'
                                f'<i>{tg_escape(tpl_text[:200])}</i>'
                            ),
                            'parse_mode': 'HTML',
                            'reply_markup': _tpl_menu_markup(),
                        })
                    continue

                # Проверить: оператор в режиме ввода нового имени?
                if chat_id in _operator_setname:
                    _operator_setname.discard(chat_id)
                    new_name = text.strip()[:64]
                    cfg_set('reply_name', new_name)
                    tg_api('sendMessage', {
                        'chat_id': chat_id,
                        'text': f'✅ <b>Имя обновлено:</b> <i>{tg_escape(new_name)}</i>',
                        'parse_mode': 'HTML',
                    })
                    continue

                # Проверить: оператор в режиме ответа на веб-тикет?
                if chat_id in _operator_reply:
                    session_id = _operator_reply.pop(chat_id)
                    sess = _web_sessions.get(session_id)
                    if sess is not None:
                        display_name = cfg_get('reply_name') or uname or fname or 'Поддержка Zone 51'
                        sess.setdefault('pending_replies', []).append({'text': text, 'from': display_name})
                        sid_label = sess.get('search_id') or '—'
                        tg_api('sendMessage', {
                            'chat_id': chat_id,
                            'text': f'✅ <b>Ответ отправлен</b> <code>#{sid_label}</code>:\n<i>{tg_escape(text)}</i>',
                            'parse_mode': 'HTML',
                        })
                    else:
                        tg_api('sendMessage', {
                            'chat_id': chat_id,
                            'text': '⚠ Сессия не найдена, ответ не отправлен.',
                            'parse_mode': 'HTML',
                        })
                    continue

                if text.startswith('/'):
                    reply_text, markup = handle_command(text, chat_id, uname, fname)
                    tg_api('sendMessage', {
                        'chat_id':      chat_id,
                        'text':         reply_text,
                        'parse_mode':   'HTML',
                        'reply_markup': markup,
                    })
                else:
                    if chat_id in _approved_users:
                        user_info = _approved_users[chat_id]
                        _send_ticket(
                            user_id    = chat_id,
                            username   = user_info.get('username', str(chat_id)),
                            first_name = user_info['first_name'],
                            message    = text,
                        )
                        tg_send(chat_id, '✅ Сообщение передано оператору. Ожидайте ответа здесь.')
                    else:
                        tg_api('sendMessage', {
                            'chat_id':    chat_id,
                            'text': (
                                '👋 Для обращения в поддержку сначала нужно зарегистрироваться.\n'
                                'Нажми <b>📋 Подать заявку</b>.'
                            ),
                            'parse_mode':   'HTML',
                            'reply_markup': _user_menu_markup(),
                        })

        except Exception as ex:
            print(f'[BOT] Polling error: {ex}')
            time.sleep(5)

# ── HTTP HANDLER ──────────────────────────────────────
class BotHandler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors(200)

    def do_GET(self):
        if self.path.rstrip('/') == '/settings':
            self._reply(200, {
                'enabled':     cfg_get('enabled'),
                'status':      cfg_get('status'),
                'welcome_msg': cfg_get('welcome_msg'),
                'offline_msg': cfg_get('offline_msg'),
                'reply_name':  cfg_get('reply_name') or 'Поддержка Zone 51',
                'bot_username': _bot_username,
                'bot_link':    GROUP_INVITE,
            })
        elif self.path.startswith('/chat/poll'):
            # GET /chat/poll?session=SESSION_ID
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(self.path).query)
            session_id = qs.get('session', [''])[0]
            sess = _web_sessions.get(session_id)
            if not sess:
                self._reply(200, {'ok': True, 'messages': []})
                return
            replies = sess.get('pending_replies', [])
            sess['pending_replies'] = []
            closed = sess.get('closed', False)
            self._reply(200, {'ok': True, 'messages': replies, 'closed': closed})
        else:
            self._reply(404, {'ok': False})

    def do_POST(self):
        # Handle file uploads before reading body as JSON
        if self.path.rstrip('/') == '/chat/upload':
            self._handle_upload()
            return

        try:
            length = int(self.headers.get('Content-Length', 0))
        except ValueError:
            length = 0
        if length > 8192:
            self._reply(413, {'ok': False, 'error': 'payload too large'})
            return
        raw = self.rfile.read(length) if length else b''
        try:
            data = json.loads(raw.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._reply(400, {'ok': False, 'error': 'invalid json'})
            return

        if self.path.rstrip('/') == '/chat':
            if not cfg_get('enabled'):
                self._reply(503, {'ok': False, 'error': 'chat disabled'})
                return
            username   = str(data.get('username', 'Guest'))[:64]
            user_name  = str(data.get('name',  data.get('username', 'Guest')))[:64]
            user_email = str(data.get('email', ''))[:120]
            user_page  = str(data.get('page',  ''))[:200]
            user_agent = self.headers.get('User-Agent', '')[:200]
            user_ip    = (self.headers.get('X-Forwarded-For') or self.client_address[0])[:64]
            message    = str(data.get('message', ''))[:1000].strip()
            session_id = str(data.get('session', ''))[:64]
            if not message:
                self._reply(400, {'ok': False, 'error': 'empty message'})
                return

            sess = _web_sessions.get(session_id)

            # ── Existing session with operator assigned ──────────────────
            if sess and sess.get('operator_tg_id'):
                op_tg_id = sess['operator_tg_id']
                ts = datetime.now(timezone.utc).strftime('%H:%M UTC')
                u_name    = sess.get('user_name')    or sess.get('username') or '—'
                u_email   = sess.get('user_email')   or '—'
                u_ip      = sess.get('user_ip')      or '—'
                u_country = sess.get('user_country') or ''
                u_ticket  = sess['ticket_num']
                u_sid     = sess.get('search_id')    or '—'
                geo_line  = f' <tg-emoji emoji-id="5368324170671202286">🌍</tg-emoji> {tg_escape(u_country)}' if u_country else ''
                u_ts      = sess.get('started_at') or '—'
                u_page    = sess.get('user_page')  or '—'
                tg_api('sendMessage', {
                    'chat_id': op_tg_id,
                    'text': (
                        f'<tg-emoji emoji-id="5431815452437257407">🌐</tg-emoji> <b>Zone 51 — Веб-тикет #{u_ticket:04d}</b>  <code>#{u_sid}</code>\n'
                        f'\n'
                        f'<tg-emoji emoji-id="5370869268012381412">👤</tg-emoji> <b>{tg_escape(u_name)}</b>\n'
                        f'<tg-emoji emoji-id="5451882707875276247">📧</tg-emoji> <code>{tg_escape(u_email)}</code>\n'
                        f'\n'
                        f'<tg-emoji emoji-id="5451646226975955576">🌐</tg-emoji> <code>{tg_escape(u_ip)}</code>{geo_line}\n'
                        f'<tg-emoji emoji-id="5441499253950470267">📄</tg-emoji> {tg_escape(u_page)}\n'
                        f'<tg-emoji emoji-id="5440660757194744323">🕒</tg-emoji> {tg_escape(u_ts)}\n'
                        f'\n'
                        f'<tg-emoji emoji-id="5368324170671202286">💬</tg-emoji> {tg_escape(message)}  <i>({ts})</i>'
                    ),
                    'parse_mode': 'HTML',
                    'reply_markup': {'inline_keyboard': [[
                        {'text': '✏️ Ответить', 'callback_data': f'reply_web:{session_id}'},
                        {'text': '📌 Шаблоны',  'callback_data': f'tpl_pick:{session_id}'},
                    ]]},
                })
                self._reply(200, {'ok': True, 'ticket': sess['ticket_num'], 'session_id': session_id})
                return

            # ── Existing session without operator yet ─────────────────────
            if sess:
                sess.setdefault('queued_msgs', []).append(message)
                self._reply(200, {'ok': True, 'ticket': sess['ticket_num'], 'session_id': session_id})
                return

            # ── New session ───────────────────────────────────────────────
            with _lock:
                _settings['ticket_seq'] += 1
                num = _settings['ticket_seq']
                _save_settings()

            if not session_id:
                import uuid
                session_id = str(uuid.uuid4())

            # Geo lookup (non-blocking best-effort)
            user_country = geo_lookup(user_ip)

            ts = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
            ua_short  = user_agent[:110] if user_agent else '—'
            geo_str   = f' <tg-emoji emoji-id="5368324170671202286">🌍</tg-emoji> {tg_escape(user_country)}' if user_country else ''
            search_id = f'SC{random.randint(10000000, 99999999)}'
            tg_text = (
                f'<tg-emoji emoji-id="5431815452437257407">🌐</tg-emoji> <b>Zone 51 — Сайт #{num:04d}</b>  <code>#{search_id}</code>\n'
                f'\n'
                f'<tg-emoji emoji-id="5370869268012381412">👤</tg-emoji> <b>{tg_escape(user_name)}</b>\n'
                f'<tg-emoji emoji-id="5451882707875276247">📧</tg-emoji> <code>{tg_escape(user_email) if user_email else "—"}</code>\n'
                f'<tg-emoji emoji-id="5368324170671202286">🔑</tg-emoji> {tg_escape(username)}\n'
                f'\n'
                f'<tg-emoji emoji-id="5451646226975955576">🌐</tg-emoji> <code>{tg_escape(user_ip)}</code>{geo_str}\n'
                f'<tg-emoji emoji-id="5441499253950470267">📄</tg-emoji> {tg_escape(user_page) if user_page else "—"}\n'
                f'<tg-emoji emoji-id="5467555879886506492">🖥</tg-emoji> <code>{tg_escape(ua_short)}</code>\n'
                f'<tg-emoji emoji-id="5440660757194744323">🕒</tg-emoji> {ts}\n'
                f'\n'
                f'<tg-emoji emoji-id="5368324170671202286">💬</tg-emoji> {tg_escape(message)}'
            )
            markup = {'inline_keyboard': [[
                {'text': '⚡️ Взять в работу', 'callback_data': f'take_web:{session_id}'},
            ]]}
            msg_id = send_to_group(tg_text, markup)

            _web_sessions[session_id] = {
                'username':      username,
                'user_name':     user_name,
                'user_email':    user_email,
                'user_ip':       user_ip,
                'user_country':  user_country,
                'user_agent':    user_agent,
                'user_page':     user_page,
                'ticket_num':    num,
                'group_msg_id':  msg_id,
                'operator_tg_id': None,
                'pending_replies': [],
                'queued_msgs':   [message],
                'started_at':    ts,
                '_started_ts':   time.time(),
                '_last_remind':  0,
                '_remind_count': 0,
                'search_id':     search_id,
            }
            self._reply(200 if msg_id else 502, {
                'ok': bool(msg_id), 'ticket': num, 'session_id': session_id,
            })
            return

        self._reply(404, {'ok': False, 'error': 'not found'})

    def _handle_upload(self):
        import cgi
        ct = self.headers.get('Content-Type', '')
        if 'multipart/form-data' not in ct:
            self._reply(400, {'ok': False, 'error': 'expected multipart/form-data'})
            return
        try:
            cl = int(self.headers.get('Content-Length', 0))
        except ValueError:
            cl = 0
        if cl > 10 * 1024 * 1024:  # 10 MB hard limit
            self._reply(413, {'ok': False, 'error': 'file too large (max 10 MB)'})
            return

        env = {'REQUEST_METHOD': 'POST'}
        try:
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ=env)
        except Exception as ex:
            print(f'[BOT] Upload parse error: {ex}')
            self._reply(400, {'ok': False, 'error': 'parse error'})
            return

        session_id = str(form.getvalue('session', '') or '')
        username   = str(form.getvalue('username', 'Guest') or 'Guest')[:64]
        user_name  = str(form.getvalue('name', username) or username)[:64]
        user_email = str(form.getvalue('email', '') or '')[:120]
        user_page  = str(form.getvalue('page',  '') or '')[:200]
        caption    = str(form.getvalue('caption', '') or '')[:500]

        file_item = form['file'] if 'file' in form else None
        if file_item is None or not hasattr(file_item, 'filename') or not file_item.filename:
            self._reply(400, {'ok': False, 'error': 'no file attached'})
            return

        file_bytes = file_item.file.read()
        filename   = file_item.filename or 'file'
        mimetype   = file_item.type or 'application/octet-stream'

        ts       = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
        ts_short = datetime.now(timezone.utc).strftime('%H:%M UTC')
        markup_reply = lambda sid: {'inline_keyboard': [[
            {'text': '✏️ Ответить', 'callback_data': f'reply_web:{sid}'},
            {'text': '📌 Шаблоны',  'callback_data': f'tpl_pick:{sid}'},
        ]]}

        sess = _web_sessions.get(session_id)

        # ── Session with operator: send directly to DM ──────────────
        if sess and sess.get('operator_tg_id'):
            op_tg_id = sess['operator_tg_id']
            u_name   = sess.get('user_name') or sess.get('username') or '—'
            u_ticket = sess['ticket_num']
            u_sid    = sess.get('search_id') or '—'
            cap = (f'Zone 51 — Веб-тикет #{u_ticket:04d}  #{u_sid}\n'
                   f'👤 {u_name}\n📎 {filename}'
                   + (f'\n\n💬 {caption}' if caption else '')
                   + f'\n({ts_short})')
            tg_send_file(op_tg_id, file_bytes, filename, mimetype,
                         caption=cap, markup=markup_reply(session_id))
            self._reply(200, {'ok': True, 'session_id': session_id, 'ticket': sess['ticket_num']})
            return

        # ── Session without operator: re-send to group ──────────────
        if sess:
            u_name   = sess.get('user_name') or sess.get('username') or '—'
            u_ticket = sess['ticket_num']
            u_sid    = sess.get('search_id') or '—'
            cap = (f'Zone 51 — Сайт #{u_ticket:04d}  #{u_sid}\n'
                   f'👤 {u_name}\n📎 {filename}'
                   + (f'\n\n💬 {caption}' if caption else ''))
            markup = {'inline_keyboard': [[
                {'text': '⚡️ Взять в работу', 'callback_data': f'take_web:{session_id}'},
            ]]}
            tg_send_file(TG_CHAT_ID, file_bytes, filename, mimetype, caption=cap, markup=markup)
            self._reply(200, {'ok': True, 'session_id': session_id, 'ticket': sess['ticket_num']})
            return

        # ── New session via file upload ──────────────────────────────
        with _lock:
            _settings['ticket_seq'] += 1
            num = _settings['ticket_seq']
            _save_settings()

        if not session_id:
            import uuid as _uuid
            session_id = str(_uuid.uuid4())

        user_ip = self.client_address[0]
        if self.headers.get('X-Forwarded-For'):
            user_ip = self.headers['X-Forwarded-For'].split(',')[0].strip()
        user_agent  = self.headers.get('User-Agent', '')[:200]
        user_country = geo_lookup(user_ip)
        search_id   = f'SC{random.randint(10000000, 99999999)}'
        geo_str     = f' 🌍 {user_country}' if user_country else ''

        cap = (f'Zone 51 — Сайт #{num:04d}  #{search_id}\n'
               f'👤 {user_name}\n'
               f'📧 {user_email or "—"}\n'
               f'🌐 {user_ip}{geo_str}\n'
               f'📄 {user_page or "—"}\n'
               f'🕒 {ts}\n📎 {filename}'
               + (f'\n\n💬 {caption}' if caption else ''))
        markup = {'inline_keyboard': [[
            {'text': '⚡️ Взять в работу', 'callback_data': f'take_web:{session_id}'},
        ]]}
        result = tg_send_file(TG_CHAT_ID, file_bytes, filename, mimetype, caption=cap, markup=markup)
        msg_id = result['result']['message_id'] if result and result.get('ok') else None

        _web_sessions[session_id] = {
            'username':      username,
            'user_name':     user_name,
            'user_email':    user_email,
            'user_ip':       user_ip,
            'user_country':  user_country,
            'user_agent':    user_agent,
            'user_page':     user_page,
            'ticket_num':    num,
            'group_msg_id':  msg_id,
            'operator_tg_id': None,
            'pending_replies': [],
            'queued_msgs':   [],
            'started_at':    ts,
            '_started_ts':   time.time(),
            '_last_remind':  0,
            '_remind_count': 0,
            'search_id':     search_id,
        }
        self._reply(200 if msg_id else 502, {
            'ok': bool(msg_id), 'ticket': num, 'session_id': session_id,
        })

    def _cors(self, code: int):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _reply(self, code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type',                'application/json; charset=utf-8')
        self.send_header('Content-Length',              str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f'[BOT] {self.address_string()} — ' + fmt % args)

# ── ENTRY POINT ───────────────────────────────────────
if __name__ == '__main__':
    load_settings()
    load_approved()
    load_tickets()
    fetch_bot_username()
    print(f'[BOT] Group: {TG_CHAT_ID}')
    print(f'[BOT] Chat {"enabled" if cfg_get("enabled") else "disabled"} | '
          f'Status: {cfg_get("status")} | Tickets: {cfg_get("ticket_seq")} | '
          f'Approved users: {len(_approved_users)}')
    t = threading.Thread(target=_poll_loop, daemon=True)
    t.start()
    r = threading.Thread(target=_reminder_loop, daemon=True)
    r.start()
    server = HTTPServer(('localhost', BOT_PORT), BotHandler)
    print(f'Bot started: http://localhost:{BOT_PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[BOT] Stopped.')
        server.server_close()
