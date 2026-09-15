"""
Zone 51 — Admin Bot (port 8767)

Features:
  1. /start       → Admin dashboard with stats
  2. /stats        → Platform statistics
  3. /users        → List registered users
  4. /pending      → Pending withdrawal requests
  5. Notifications: new registration, deposit, withdrawal request
  6. Withdrawal [✅ Approve] [❌ Deny] via inline buttons
     — Approve → frontend polls status and confirms transaction
     — Deny    → frontend polls status, refunds balance
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, ssl, urllib.request, urllib.error
import threading, os, time
from datetime import datetime, timezone

# Load .env from project root (same directory as this script)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass  # python-dotenv not installed; fall back to OS environment variables

# ── CONFIG (loaded from .env / environment) ────────────────────
ADMIN_TG_TOKEN  = os.environ['ADMIN_TG_TOKEN']
ADMIN_TG_CHATS  = [int(x.strip()) for x in os.getenv('ADMIN_TG_CHATS', '').split(',') if x.strip()]
ADMIN_BOT_PORT  = int(os.getenv('ADMIN_BOT_PORT', '8767'))

API_BASE        = os.getenv('API_BASE', 'http://localhost:4000')
INTERNAL_SECRET = os.environ['INTERNAL_SECRET']
REF_BOT_PORT    = int(os.getenv('REF_BOT_PORT', '8769'))

DATA_FILE    = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'admin_data.json')
BONUSES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bonuses.json')


_lock                = threading.Lock()
_tg_ctx              = ssl.create_default_context()
_withdrawals         = {}   # txnId -> {username, uid, amount, method, wallet, memo, status, msg_id, created_at, ...}
_deposits            = {}   # txnId -> {username, uid, amount, method, status, msg_id, created_at, ...}
_users               = {}   # uid   -> {username, email, uid, registered_at, total_deposits, total_withdrawals}
_stats               = {'total_deposits': 0.0, 'total_withdrawals': 0.0}
_partner_withdrawals = {}   # wdr_id -> {partner_id, partner_name, amount, method, wallet, status, msg_id, ...}
_creatives           = {}   # creative_id -> creative dict
_admin_input_state   = {}   # str(chat_id) -> {'step': str, ...}
_slot_rtp            = 96.5  # slot RTP % — adjustable via admin bot
_bonuses             = {}   # bonus_id -> bonus dict
_bonus_claims        = {}   # uid -> list of bonus_ids claimed

def load_data():
    global _withdrawals, _deposits, _users, _stats, _partner_withdrawals, _slot_rtp, _creatives
    if os.path.isfile(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                d = json.load(f)
            _withdrawals         = d.get('withdrawals', {})
            _deposits            = d.get('deposits', {})
            _users               = d.get('users', {})
            _stats               = {**_stats, **d.get('stats', {})}
            _partner_withdrawals = d.get('partner_withdrawals', {})
            _creatives           = d.get('creatives', {})
            _slot_rtp            = float(d.get('slot_rtp', 96.5))
            print(f'[ADMIN] Loaded: {len(_users)} users, {len(_withdrawals)} withdrawals, '
                  f'{len(_deposits)} deposits, '
                  f'{len(_partner_withdrawals)} partner withdrawals, '
                  f'{len(_creatives)} creatives, slot RTP={_slot_rtp}%')
        except Exception as e:
            print(f'[ADMIN] Load error: {e}')

def save_data():
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                'withdrawals':         _withdrawals,
                'deposits':            _deposits,
                'users':               _users,
                'stats':               _stats,
                'partner_withdrawals': _partner_withdrawals,
                'creatives':           _creatives,
                'slot_rtp':            _slot_rtp,
            }, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'[ADMIN] Save error: {e}')

def load_bonuses():
    global _bonuses, _bonus_claims
    if os.path.isfile(BONUSES_FILE):
        try:
            with open(BONUSES_FILE, 'r', encoding='utf-8') as f:
                d = json.load(f)
            _bonuses      = d.get('bonuses', {})
            _bonus_claims = d.get('claims', {})
            print(f'[ADMIN] Loaded: {len(_bonuses)} bonuses')
        except Exception as e:
            print(f'[ADMIN] Load bonuses error: {e}')

def save_bonuses():
    try:
        with open(BONUSES_FILE, 'w', encoding='utf-8') as f:
            json.dump({'bonuses': _bonuses, 'claims': _bonus_claims},
                      f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'[ADMIN] Save bonuses error: {e}')

# ── TELEGRAM API ─────────────────────────────────────────────────
def tg_api(method: str, payload: dict):
    url  = f'https://api.telegram.org/bot{ADMIN_TG_TOKEN}/{method}'
    body = json.dumps(payload).encode('utf-8')
    req  = urllib.request.Request(url, data=body,
                                  headers={'Content-Type': 'application/json'},
                                  method='POST')
    try:
        with urllib.request.urlopen(req, context=_tg_ctx, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'[TG-ADMIN] {method} HTTP {e.code}: {e.read().decode("utf-8","replace")}')
    except Exception as ex:
        print(f'[TG-ADMIN] {method} error: {ex}')
    return None

def tg_escape(s: str) -> str:
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def send_to_admin(text: str, markup=None):
    last_msg_id = None
    for chat_id in ADMIN_TG_CHATS:
        payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
        if markup:
            payload['reply_markup'] = markup
        r = tg_api('sendMessage', payload)
        if r and r.get('ok'):
            last_msg_id = r['result']['message_id']
    return last_msg_id

# ── ADMIN TEXT BUILDERS ──────────────────────────────────────────
def _stats_text() -> str:
    with _lock:
        u_count = len(_users)
        w_count = sum(1 for w in _withdrawals.values() if w['status'] == 'pending')
        s = dict(_stats)
    return (
        '🎰 <b>Zone 51 — Admin Panel</b>\n'
        '──────────────────────────\n'
        f'👥 Total Users:            <b>{u_count}</b>\n'
        f'💰 Total Deposited:        <b>$ {s["total_deposits"]:.2f}</b>\n'
        f'💸 Total Withdrawn:        <b>$ {s["total_withdrawals"]:.2f}</b>\n'
        f'⏳ Pending Withdrawals: <b>{w_count}</b>'
    )

def _users_text() -> str:
    with _lock:
        us = list(_users.values())
    if not us:
        return '👥 <b>Users</b>\n\nNo users registered yet.'
    lines = ['👥 <b>Zone 51 — Users</b>\n──────────────────────────']
    for u in us[-20:]:
        dep = u.get('total_deposits', 0.0)
        wdr = u.get('total_withdrawals', 0.0)
        lines.append(
            f'• <b>{tg_escape(u["username"])}</b>  <code>{tg_escape(u.get("uid","?"))}</code>\n'
            f'  📧 {tg_escape(u.get("email","—"))}  |  💰 ${dep:.2f} dep  |  💸 ${wdr:.2f} wdr'
        )
    if len(list(_users.values())) > 20:
        lines.append(f'\n<i>...showing last 20 of {len(_users)} users</i>')
    return '\n'.join(lines)

def _pending_text() -> str:
    with _lock:
        pending = {k: v for k, v in _withdrawals.items() if v['status'] == 'pending'}
    if not pending:
        return '✅ <b>No pending withdrawals</b>'
    lines = [f'⏳ <b>Pending Withdrawals ({len(pending)})</b>\n──────────────────────────']
    for txn_id, w in list(pending.items())[:15]:
        wallet = f'\n  💳 {tg_escape(w["wallet"])}' if w.get('wallet') else ''
        lines.append(
            f'• <b>{tg_escape(w["username"])}</b> — <b>$ {w["amount"]:.2f}</b> via {tg_escape(w["method"])}'
            f'{wallet}\n'
            f'  <code>{txn_id}</code>'
        )
    return '\n'.join(lines)

def _admin_markup():
    return {
        'inline_keyboard': [
            [{'text': '👥 Users',      'callback_data': 'admin_users'},
             {'text': '📊 Stats',      'callback_data': 'admin_stats'}],
            [{'text': '⏳ Pending Withdrawals', 'callback_data': 'admin_pending'}],
            [{'text': '🤝 Partners',   'callback_data': 'admin_partners'},
             {'text': '💸 Partner Payouts', 'callback_data': 'admin_ref_pending'}],
            [{'text': '🎨 Креативы',   'callback_data': 'admin_creatives'},
             {'text': '🎁 Bonuses',    'callback_data': 'admin_bonuses'}],
            [{'text': '🎰 Slot RTP',   'callback_data': 'admin_slot_rtp'}],
        ]
    }


def _creatives_admin_text() -> str:
    with _lock:
        clist = sorted(_creatives.values(), key=lambda x: x.get('created_at', ''), reverse=True)
    if not clist:
        return '🎨 <b>Креативы</b>\n\nКреативов пока нет.'
    lines = [f'🎨 <b>Zone 51 — Креативы ({len(clist)})</b>\n──────────────────────────']
    for c in clist[:20]:
        dep = (f'+{c["deposit_bonus_pct"]}%' if c.get('deposit_bonus_pct', 0) > 0 else '—')
        codes = c.get('promo_codes', [])
        lines.append(
            f'• <b>{tg_escape(c["partner_name"])}</b>  '
            f'🎰 {c["freespins"]} спин  |  💰 {dep}  |  🎟 {len(codes)} кодов\n'
            f'  📅 {c.get("created_at", "")}'
        )
    return '\n'.join(lines)


def _slot_rtp_text() -> str:
    with _lock:
        rtp = _slot_rtp
    mult = rtp / 96.5  # 96.5% is the baseline
    return (
        f'🎰 <b>Alien Rush Bonanza — RTP Settings</b>\n'
        f'──────────────────────────\n'
        f'Current RTP: <b>{rtp:.1f}%</b>\n'
        f'Win multiplier: <b>×{mult:.4f}</b>\n\n'
        f'<i>Higher = players win more. 96.5% is the default calibrated RTP. '
        f'85% reduces payouts ~12%. 100% = break-even on average.</i>'
    )


def _slot_rtp_markup():
    presets = [75.0, 85.0, 90.0, 96.5, 98.0, 100.0]
    rows = []
    row = []
    for p in presets:
        row.append({'text': f'{p:.1f}%', 'callback_data': f'slotrtp:{p}'})
        if len(row) == 3:
            rows.append(row); row = []
    if row:
        rows.append(row)
    rows.append([
        {'text': '✏️ Custom %', 'callback_data': 'slotrtp_custom'},
        {'text': '◀️ Back', 'callback_data': 'admin_stats'},
    ])
    return {'inline_keyboard': rows}


def _fetch_partners() -> list:
    try:
        req = urllib.request.Request(f'http://localhost:{REF_BOT_PORT}/ref/partners', method='GET')
        with urllib.request.urlopen(req, context=_tg_ctx, timeout=5) as r:
            return json.loads(r.read().decode('utf-8')).get('partners', [])
    except Exception:
        return []


# ── BONUS HELPERS ─────────────────────────────────────────────────
import uuid as _uuid_mod

def _bonuses_text() -> str:
    with _lock:
        blist = list(_bonuses.values())
    if not blist:
        return '🎁 <b>Bonuses</b>\n\nNo bonuses created yet. Press <b>+ Create</b> to add one.'
    lines = [f'🎁 <b>Zone 51 — Bonuses ({len(blist)})</b>\n──────────────────────────']
    for b in blist:
        status = '✅ Active' if b.get('active', True) else '🔴 Disabled'
        lines.append(
            f'• <b>{tg_escape(b["title"])}</b>  [{status}]\n'
            f'  🎰 {b["freespins"]} spins  |  min dep: €{b["min_deposit"]:.0f}  |  '
            f'expires in: {b.get("expires_in_days","∞")} days\n'
            f'  <code>{b["id"][:8]}...</code>'
        )
    return '\n'.join(lines)

def _bonuses_markup() -> dict:
    with _lock:
        blist = list(_bonuses.values())
    rows = []
    for b in blist:
        short = b['title'][:22]
        toggle_lbl = '🔴 Disable' if b.get('active', True) else '✅ Enable'
        rows.append([
            {'text': f'📝 {short}', 'callback_data': f'bonus_toggle:{b["id"]}'},
            {'text': toggle_lbl,     'callback_data': f'bonus_toggle:{b["id"]}'},
            {'text': '🗑',            'callback_data': f'bonus_del_ask:{b["id"]}'},
        ])
    rows.append([
        {'text': '➕ Create Bonus', 'callback_data': 'bonus_create'},
        {'text': '◀️ Back',         'callback_data': 'admin_stats'},
    ])
    return {'inline_keyboard': rows}


def _partners_screen() -> tuple:
    """Returns (text, reply_markup) for the partners list."""
    partners = _fetch_partners()
    if not partners:
        text = '🤝 <b>Partners</b>\n\nNo partners yet or referral bot unavailable.'
        markup = {'inline_keyboard': [[
            {'text': '⚙️ Default %', 'callback_data': 'admin_ref_setdefault'},
            {'text': '◀️ Back',      'callback_data': 'admin_stats'},
        ]]}
        return text, markup
    lines = [f'🤝 <b>Zone 51 — Partners ({len(partners)})</b>\n──────────────────────────']
    for p in partners[:20]:
        lines.append(
            f'• <b>{tg_escape(p["name"])}</b>  <code>{p["code"]}</code>  '
            f'⚖️ {p["commission_pct"]:.1f}%  💰 ${p["total_earned"]:.2f}'
        )
    if len(partners) > 20:
        lines.append(f'<i>...showing 20 of {len(partners)}</i>')
    text = '\n'.join(lines)
    rows, row = [], []
    for p in partners[:20]:
        short = (p['name'] or 'Partner')[:16]
        row.append({'text': f'👤 {short}', 'callback_data': f'pv:{p["id"]}'})
        if len(row) == 2:
            rows.append(row); row = []
    if row:
        rows.append(row)
    rows.append([
        {'text': '⚙️ Default %', 'callback_data': 'admin_ref_setdefault'},
        {'text': '◀️ Back',      'callback_data': 'admin_stats'},
    ])
    return text, {'inline_keyboard': rows}


def _partner_screen(partner_id: str) -> tuple:
    """Returns (text, reply_markup) for a single partner management card."""
    partners = {p['id']: p for p in _fetch_partners()}
    p = partners.get(partner_id)
    if not p:
        return ('⚠️ Partner not found.',
                {'inline_keyboard': [[{'text': '◀️ Back', 'callback_data': 'admin_partners'}]]})
    text = (
        f'👤 <b>{tg_escape(p["name"])}</b>\n'
        f'──────────────────────────\n'
        f'🔑 Code:        <code>{tg_escape(p["code"])}</code>\n'
        f'⚖️ Commission:  <b>{p["commission_pct"]:.1f}%</b>\n'
        f'──────────────────────────\n'
        f'👥 Referrals:   <b>{p["referrals_count"]}</b>\n'
        f'💳 Deposits:    <b>{p["deposits_count"]}</b>\n'
        f'✅ Earned:      <b>$ {p["total_earned"]:.2f}</b>\n'
        f'💰 Balance:     <b>$ {p["balance"]:.2f}</b>\n'
        f'📤 Withdrawn:   <b>$ {p["total_withdrawn"]:.2f}</b>\n'
        f'📅 Since:       {p["created_at"]}'
    )
    markup = {'inline_keyboard': [
        [{'text': f'⚙️ Change % (now {p["commission_pct"]:.1f}%)', 'callback_data': f'ps_pct:{partner_id}'}],
        [{'text': '🗑️ Delete Partner', 'callback_data': f'ps_del_ask:{partner_id}'}],
        [{'text': '◀️ Back to Partners', 'callback_data': 'admin_partners'}],
    ]}
    return text, markup


def _handle_admin_input(state_key: str, text: str, chat_id):
    """Process text input from an admin in a multi-step flow."""
    state = _admin_input_state.pop(state_key, None)
    if not state:
        return
    step = state.get('step')

    if step == 'default_commission':
        try:
            pct = float(text.replace(',', '.'))
            if not (0 <= pct <= 100):
                raise ValueError
        except ValueError:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Enter a number between 0 and 100:'})
            _admin_input_state[state_key] = state
            return
        try:
            body = json.dumps({'commission_pct': pct}).encode()
            req  = urllib.request.Request(
                f'http://localhost:{REF_BOT_PORT}/ref/set_default_commission',
                data=body, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
            tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
                   'text': f'✅ Default commission set to <b>{pct:.1f}%</b>\n'
                           f'All new partners will use this rate.'})
        except Exception as ex:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': f'Error: {ex}'})

    elif step == 'partner_commission':
        partner_id   = state.get('partner_id')
        partner_name = state.get('partner_name', 'Partner')
        try:
            pct = float(text.replace(',', '.'))
            if not (0 <= pct <= 100):
                raise ValueError
        except ValueError:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Enter a number between 0 and 100:'})
            _admin_input_state[state_key] = state
            return
        try:
            body = json.dumps({'partner_id': partner_id, 'commission_pct': pct}).encode()
            req  = urllib.request.Request(
                f'http://localhost:{REF_BOT_PORT}/ref/set_commission',
                data=body, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
            tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
                   'text': f'✅ Commission for <b>{tg_escape(partner_name)}</b> '
                           f'set to <b>{pct:.1f}%</b>'})
        except Exception as ex:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': f'Error: {ex}'})

    elif step == 'slot_rtp':
        global _slot_rtp
        try:
            pct = float(text.replace(',', '.'))
            if not (0 < pct <= 200):
                raise ValueError
        except ValueError:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Enter a valid RTP % (e.g. 96.5):'})
            _admin_input_state[state_key] = state
            return
        with _lock:
            _slot_rtp = pct
            save_data()
        tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
               'text': f'✅ Slot RTP set to <b>{pct:.1f}%</b>'})

    elif step == 'bonus_title':
        if not text.strip():
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Title cannot be empty:'})
            _admin_input_state[state_key] = state
            return
        _admin_input_state[state_key] = {'step': 'bonus_min_deposit', 'title': text.strip()}
        tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
               'text': f'💰 Min deposit amount to unlock (€), e.g. <b>10</b>:'})

    elif step == 'bonus_min_deposit':
        try:
            min_dep = float(text.replace(',', '.'))
            if min_dep < 0:
                raise ValueError
        except ValueError:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Enter a valid number (e.g. 10):'})
            _admin_input_state[state_key] = state
            return
        state['min_deposit'] = min_dep
        _admin_input_state[state_key] = {**state, 'step': 'bonus_freespins'}
        tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
               'text': '🎰 Number of free spins to award (e.g. <b>20</b>):'})

    elif step == 'bonus_freespins':
        try:
            fs = int(text.strip())
            if fs < 1:
                raise ValueError
        except ValueError:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Enter a positive integer:'})
            _admin_input_state[state_key] = state
            return
        state['freespins'] = fs
        _admin_input_state[state_key] = {**state, 'step': 'bonus_expiry_days'}
        tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
               'text': '⏳ Expires in how many days? Enter <b>0</b> for no expiry:'})

    elif step == 'bonus_expiry_days':
        try:
            days = int(text.strip())
            if days < 0:
                raise ValueError
        except ValueError:
            tg_api('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Enter a non-negative integer:'})
            _admin_input_state[state_key] = state
            return
        state['expires_in_days'] = days if days > 0 else None
        _admin_input_state[state_key] = {**state, 'step': 'bonus_image_url'}
        tg_api('sendMessage', {'chat_id': chat_id,
               'text': '🖼 Image URL (optional). Send a URL or type "skip":'})

    elif step == 'bonus_image_url':
        img = text.strip()
        if img.lower() == 'skip' or not img:
            img = ''
        state['image_url'] = img
        _admin_input_state[state_key] = {**state, 'step': 'bonus_description'}
        tg_api('sendMessage', {'chat_id': chat_id,
               'text': '📝 Short description (optional). Send text or type "skip":'})

    elif step == 'bonus_description':
        desc = text.strip()
        if desc.lower() == 'skip' or not desc:
            desc = ''
        # Build and save the bonus
        bonus_id = str(_uuid_mod.uuid4())
        ts = datetime.now(timezone.utc).isoformat()
        bonus = {
            'id':             bonus_id,
            'title':          state.get('title', 'Bonus'),
            'description':    desc,
            'image_url':      state.get('image_url', ''),
            'min_deposit':    state.get('min_deposit', 10.0),
            'freespins':      state.get('freespins', 10),
            'expires_in_days': state.get('expires_in_days'),
            'created_at':     ts,
            'active':         True,
            'color':          'gold',
        }
        with _lock:
            _bonuses[bonus_id] = bonus
            save_bonuses()
        tg_api('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
               'text': (
                   f'✅ <b>Bonus created!</b>\n'
                   f'──────────────────────────\n'
                   f'🎁 <b>{tg_escape(bonus["title"])}</b>\n'
                   f'💰 Min deposit: €{bonus["min_deposit"]:.0f}\n'
                   f'🎰 Free spins: {bonus["freespins"]}\n'
                   f'⏳ Expires in: {bonus["expires_in_days"] or "∞"} days\n'
                   f'🔑 <code>{bonus_id}</code>'
               ),
               'reply_markup': _bonuses_markup()})


def _ref_pending_text() -> str:
    with _lock:
        pending = {k: v for k, v in _partner_withdrawals.items() if v['status'] == 'pending'}
    if not pending:
        return '✅ <b>No pending partner payouts</b>'
    lines = [f'💸 <b>Partner Payouts ({len(pending)})</b>\n──────────────────────────']
    for wdr_id, w in list(pending.items())[:10]:
        wallet_line = f'\n  💳 {tg_escape(w["wallet"])}' if w.get('wallet') else ''
        lines.append(
            f'• <b>{tg_escape(w["partner_name"])}</b> — <b>$ {w["amount"]:.2f}</b> via {tg_escape(w["method"])}'
            f'{wallet_line}\n'
            f'  <code>{wdr_id}</code>'
        )
    return '\n'.join(lines)

# ── CALLBACK HANDLER ─────────────────────────────────────────────
def _handle_callback(cb: dict):
    cb_id   = cb['id']
    from_id = cb['from']['id']
    data    = cb.get('data', '')
    msg_id  = cb.get('message', {}).get('message_id')
    chat_id = cb.get('message', {}).get('chat', {}).get('id')
    uname   = cb['from'].get('username', '') or cb['from'].get('first_name', 'Admin')

    if data == 'admin_stats':
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _stats_text(), 'parse_mode': 'HTML',
            'reply_markup': _admin_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'admin_users':
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _users_text(), 'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[{'text': '◀️ Back', 'callback_data': 'admin_stats'}]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'admin_pending':
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _pending_text(), 'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[{'text': '◀️ Back', 'callback_data': 'admin_stats'}]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'admin_partners':
        text, markup = _partners_screen()
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': text, 'parse_mode': 'HTML',
            'reply_markup': markup,
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data.startswith('pv:'):
        partner_id = data[3:]
        text, markup = _partner_screen(partner_id)
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': text, 'parse_mode': 'HTML',
            'reply_markup': markup,
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data.startswith('ps_pct:'):
        partner_id = data[7:]
        partners   = {p['id']: p for p in _fetch_partners()}
        p          = partners.get(partner_id)
        pname      = p['name'] if p else partner_id
        cur_pct    = p['commission_pct'] if p else 10.0
        _admin_input_state[str(chat_id)] = {
            'step': 'partner_commission',
            'partner_id': partner_id,
            'partner_name': pname,
        }
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
        tg_api('sendMessage', {
            'chat_id': chat_id, 'parse_mode': 'HTML',
            'text': f'⚙️ Enter new commission % for <b>{tg_escape(pname)}</b> '
                    f'(current: <b>{cur_pct:.1f}%</b>):',
        })

    elif data.startswith('ps_del_ask:'):
        partner_id = data[11:]
        partners   = {p['id']: p for p in _fetch_partners()}
        p          = partners.get(partner_id)
        pname      = (p['name'] if p else partner_id)[:20]
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [
                [{'text': f'⚠️ Confirm: delete {tg_escape(pname)}?',
                  'callback_data': f'ps_del:{partner_id}'}],
                [{'text': '❌ Cancel', 'callback_data': f'pv:{partner_id}'}],
            ]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data.startswith('ps_del:'):
        partner_id = data[7:]
        try:
            body = json.dumps({'partner_id': partner_id}).encode()
            req  = urllib.request.Request(
                f'http://localhost:{REF_BOT_PORT}/ref/delete_partner',
                data=body, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
            text, markup = _partners_screen()
            tg_api('editMessageText', {
                'chat_id': chat_id, 'message_id': msg_id,
                'text': text, 'parse_mode': 'HTML',
                'reply_markup': markup,
            })
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '✅ Partner deleted'})
        except Exception as ex:
            tg_api('answerCallbackQuery', {
                'callback_query_id': cb_id, 'text': f'Error: {ex}', 'show_alert': True})

    elif data == 'admin_ref_setdefault':
        _admin_input_state[str(chat_id)] = {'step': 'default_commission'}
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
        tg_api('sendMessage', {
            'chat_id': chat_id, 'parse_mode': 'HTML',
            'text': '⚙️ Enter new <b>default</b> commission % for all new partners:',
        })

    elif data == 'admin_ref_pending':
        with _lock:
            pending = {k: v for k, v in _partner_withdrawals.items() if v['status'] == 'pending'}
        if not pending:
            tg_api('editMessageText', {
                'chat_id': chat_id, 'message_id': msg_id,
                'text': '✅ <b>No pending partner payouts</b>', 'parse_mode': 'HTML',
                'reply_markup': {'inline_keyboard': [[{'text': '◀️ Back', 'callback_data': 'admin_stats'}]]},
            })
        else:
            tg_api('editMessageText', {
                'chat_id': chat_id, 'message_id': msg_id,
                'text': _ref_pending_text(), 'parse_mode': 'HTML',
                'reply_markup': {'inline_keyboard': [[{'text': '◀️ Back', 'callback_data': 'admin_stats'}]]},
            })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data.startswith('ref_wdr_approve:'):
        wdr_id = data.split(':', 1)[1]
        with _lock:
            w = _partner_withdrawals.get(wdr_id)
        if not w or w['status'] != 'pending':
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
                   'text': 'Not found or already resolved', 'show_alert': True})
            return
        # Tell referral bot
        try:
            body = json.dumps({'wdr_id': wdr_id, 'status': 'approved', 'by_name': uname}).encode()
            req  = urllib.request.Request(
                f'http://localhost:{REF_BOT_PORT}/ref/withdraw/resolve',
                data=body, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, context=_tg_ctx, timeout=8)
        except Exception as ex:
            print(f'[ADMIN] Ref bot notify error: {ex}')
        with _lock:
            if wdr_id in _partner_withdrawals:
                _partner_withdrawals[wdr_id]['status'] = 'approved'
                save_data()
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'✅ Approved by @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
               'text': f'✅ Partner payout ${w["amount"]:.2f} approved'})

    elif data.startswith('ref_wdr_deny:'):
        wdr_id = data.split(':', 1)[1]
        with _lock:
            w = _partner_withdrawals.get(wdr_id)
        if not w or w['status'] != 'pending':
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
                   'text': 'Not found or already resolved', 'show_alert': True})
            return
        try:
            body = json.dumps({'wdr_id': wdr_id, 'status': 'denied', 'by_name': uname}).encode()
            req  = urllib.request.Request(
                f'http://localhost:{REF_BOT_PORT}/ref/withdraw/resolve',
                data=body, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, context=_tg_ctx, timeout=8)
        except Exception as ex:
            print(f'[ADMIN] Ref bot notify error: {ex}')
        with _lock:
            if wdr_id in _partner_withdrawals:
                _partner_withdrawals[wdr_id]['status'] = 'denied'
                save_data()
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'❌ Denied by @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
               'text': f'❌ Partner payout ${w["amount"]:.2f} denied'})

    elif data.startswith('wdr_approve:'):
        txn_id = data.split(':', 1)[1]
        with _lock:
            w = _withdrawals.get(txn_id)
        if not w:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Request not found', 'show_alert': True})
            return
        if w['status'] != 'pending':
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Already {w["status"]}', 'show_alert': True})
            return
        with _lock:
            _withdrawals[txn_id]['status']      = 'approved'
            _withdrawals[txn_id]['resolved_by'] = uname
            _withdrawals[txn_id]['resolved_at'] = datetime.now(timezone.utc).isoformat()
            _stats['total_withdrawals'] = _stats.get('total_withdrawals', 0) + w['amount']
            save_data()
        # Notify API server so frontend polling gets the result
        try:
            _api_url = f'{API_BASE}/internal/withdrawal/{txn_id}/status'
            _body = json.dumps({'status': 'approved'}).encode()
            _req  = urllib.request.Request(_api_url, data=_body,
                    headers={'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET},
                    method='POST')
            urllib.request.urlopen(_req, context=_tg_ctx, timeout=8)
        except Exception as ex:
            print(f'[ADMIN] API notify error: {ex}')
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'✅ Approved by @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'✅ Withdrawal ${w["amount"]:.2f} approved'})
        print(f'[ADMIN] Withdrawal {txn_id} APPROVED by @{uname}')

    elif data.startswith('wdr_deny:'):
        txn_id = data.split(':', 1)[1]
        with _lock:
            w = _withdrawals.get(txn_id)
        if not w:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Request not found', 'show_alert': True})
            return
        if w['status'] != 'pending':
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Already {w["status"]}', 'show_alert': True})
            return
        with _lock:
            _withdrawals[txn_id]['status']      = 'denied'
            _withdrawals[txn_id]['resolved_by'] = uname
            _withdrawals[txn_id]['resolved_at'] = datetime.now(timezone.utc).isoformat()
            save_data()
        # Notify API server so frontend polling gets the result (and balance is refunded)
        try:
            _api_url = f'{API_BASE}/internal/withdrawal/{txn_id}/status'
            _body = json.dumps({'status': 'denied'}).encode()
            _req  = urllib.request.Request(_api_url, data=_body,
                    headers={'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET},
                    method='POST')
            urllib.request.urlopen(_req, context=_tg_ctx, timeout=8)
        except Exception as ex:
            print(f'[ADMIN] API notify error: {ex}')
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'❌ Denied by @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'❌ Withdrawal ${w["amount"]:.2f} denied — balance will be refunded'})
        print(f'[ADMIN] Withdrawal {txn_id} DENIED by @{uname}')

    elif data.startswith('dep_approve:'):
        txn_id = data.split(':', 1)[1]
        with _lock:
            dep = _deposits.get(txn_id)
        if not dep:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Request not found', 'show_alert': True})
            return
        if dep['status'] != 'pending':
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Already {dep["status"]}', 'show_alert': True})
            return
        with _lock:
            _deposits[txn_id]['status']      = 'approved'
            _deposits[txn_id]['resolved_by'] = uname
            _deposits[txn_id]['resolved_at'] = datetime.now(timezone.utc).isoformat()
            save_data()
        # Credit balance on server
        try:
            _api_url = f'{API_BASE}/internal/deposit/{txn_id}/approve'
            _req  = urllib.request.Request(_api_url, data=b'{}',
                    headers={'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET},
                    method='POST')
            resp = urllib.request.urlopen(_req, context=_tg_ctx, timeout=8)
            result = json.loads(resp.read().decode())
            # Update user stats
            uid = dep.get('uid', '')
            amount = dep.get('amount', 0)
            bonus = result.get('bonus', 0)
            with _lock:
                if uid:
                    if uid not in _users:
                        _users[uid] = {
                            'username': dep.get('username', ''), 'email': '', 'uid': uid,
                            'registered_at': dep.get('created_at', ''),
                            'total_deposits': 0.0, 'total_withdrawals': 0.0,
                        }
                    _users[uid]['total_deposits'] = _users[uid].get('total_deposits', 0) + amount
                _stats['total_deposits'] = _stats.get('total_deposits', 0) + amount
                save_data()
        except Exception as ex:
            print(f'[ADMIN] Deposit approve API error: {ex}')
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'✅ Confirmed by @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'✅ Deposit ${dep["amount"]:.2f} confirmed'})
        print(f'[ADMIN] Deposit {txn_id} APPROVED by @{uname}')

    elif data.startswith('dep_deny:'):
        txn_id = data.split(':', 1)[1]
        with _lock:
            dep = _deposits.get(txn_id)
        if not dep:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '⚠ Request not found', 'show_alert': True})
            return
        if dep['status'] != 'pending':
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'Already {dep["status"]}', 'show_alert': True})
            return
        with _lock:
            _deposits[txn_id]['status']      = 'denied'
            _deposits[txn_id]['resolved_by'] = uname
            _deposits[txn_id]['resolved_at'] = datetime.now(timezone.utc).isoformat()
            save_data()
        # Mark transaction as denied on server
        try:
            _api_url = f'{API_BASE}/internal/deposit/{txn_id}/deny'
            _req  = urllib.request.Request(_api_url, data=b'{}',
                    headers={'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET},
                    method='POST')
            urllib.request.urlopen(_req, context=_tg_ctx, timeout=8)
        except Exception as ex:
            print(f'[ADMIN] Deposit deny API error: {ex}')
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [[
                {'text': f'❌ Denied by @{tg_escape(uname)}', 'callback_data': 'noop'},
            ]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': f'❌ Deposit ${dep["amount"]:.2f} denied'})
        print(f'[ADMIN] Deposit {txn_id} DENIED by @{uname}')

    elif data == 'admin_creatives':
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _creatives_admin_text(), 'parse_mode': 'HTML',
            'reply_markup': {'inline_keyboard': [[{'text': '◀️ Назад', 'callback_data': 'admin_stats'}]]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'admin_slot_rtp':
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _slot_rtp_text(), 'parse_mode': 'HTML',
            'reply_markup': _slot_rtp_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data.startswith('slotrtp:'):
        global _slot_rtp
        try:
            pct = float(data.split(':', 1)[1])
            with _lock:
                _slot_rtp = pct
                save_data()
            tg_api('editMessageText', {
                'chat_id': chat_id, 'message_id': msg_id,
                'text': _slot_rtp_text(), 'parse_mode': 'HTML',
                'reply_markup': _slot_rtp_markup(),
            })
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
                   'text': f'✅ RTP set to {pct:.1f}%'})
        except Exception as ex:
            tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
                   'text': f'Error: {ex}', 'show_alert': True})

    elif data == 'slotrtp_custom':
        _admin_input_state[str(chat_id)] = {'step': 'slot_rtp'}
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
        tg_api('sendMessage', {
            'chat_id': chat_id, 'parse_mode': 'HTML',
            'text': f'🎰 Enter new slot RTP % (current: <b>{_slot_rtp:.1f}%</b>).\n'
                    f'Example: 96.5 for normal, 85 for tight, 100 for break-even.',
        })

    elif data == 'admin_bonuses':
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _bonuses_text(), 'parse_mode': 'HTML',
            'reply_markup': _bonuses_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data == 'bonus_create':
        _admin_input_state[str(chat_id)] = {'step': 'bonus_title'}
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})
        tg_api('sendMessage', {'chat_id': chat_id,
               'text': '🎁 Creating new bonus.\n\nStep 1/6 — Enter bonus title:'})

    elif data.startswith('bonus_toggle:'):
        bonus_id = data[13:]
        with _lock:
            b = _bonuses.get(bonus_id)
            if b:
                b['active'] = not b.get('active', True)
                save_bonuses()
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _bonuses_text(), 'parse_mode': 'HTML',
            'reply_markup': _bonuses_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id,
               'text': '✅ Bonus status toggled'})

    elif data.startswith('bonus_del_ask:'):
        bonus_id = data[14:]
        with _lock:
            b = _bonuses.get(bonus_id)
        title = tg_escape(b['title'][:20]) if b else bonus_id[:8]
        tg_api('editMessageReplyMarkup', {
            'chat_id': chat_id, 'message_id': msg_id,
            'reply_markup': {'inline_keyboard': [
                [{'text': f'⚠️ Confirm delete: {title}?', 'callback_data': f'bonus_del:{bonus_id}'}],
                [{'text': '❌ Cancel', 'callback_data': 'admin_bonuses'}],
            ]},
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

    elif data.startswith('bonus_del:'):
        bonus_id = data[10:]
        with _lock:
            _bonuses.pop(bonus_id, None)
            save_bonuses()
        tg_api('editMessageText', {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': _bonuses_text(), 'parse_mode': 'HTML',
            'reply_markup': _bonuses_markup(),
        })
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '🗑 Bonus deleted'})

    else:
        tg_api('answerCallbackQuery', {'callback_query_id': cb_id})

# ── POLLING THREAD ───────────────────────────────────────────────
def _poll_loop():
    offset = 0
    print('[ADMIN] Polling started...')
    while True:
        try:
            url  = f'https://api.telegram.org/bot{ADMIN_TG_TOKEN}/getUpdates'
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

                cb = upd.get('callback_query')
                if cb:
                    _handle_callback(cb)
                    continue

                msg     = upd.get('message', {})
                text    = msg.get('text', '').strip()
                chat_id = msg.get('chat', {}).get('id')
                if not text or not chat_id:
                    continue

                # Multi-step admin input (commission setting)
                if str(chat_id) in _admin_input_state and not text.startswith('/'):
                    _handle_admin_input(str(chat_id), text, chat_id)
                    continue

                if text.startswith('/start'):
                    tg_api('sendMessage', {
                        'chat_id': chat_id,
                        'text': _stats_text(),
                        'parse_mode': 'HTML',
                        'reply_markup': _admin_markup(),
                    })
                elif text.startswith('/stats'):
                    tg_api('sendMessage', {'chat_id': chat_id, 'text': _stats_text(), 'parse_mode': 'HTML'})
                elif text.startswith('/users'):
                    tg_api('sendMessage', {'chat_id': chat_id, 'text': _users_text(), 'parse_mode': 'HTML'})
                elif text.startswith('/pending'):
                    tg_api('sendMessage', {'chat_id': chat_id, 'text': _pending_text(), 'parse_mode': 'HTML'})
                elif text.startswith('/partners'):
                    text_p, markup_p = _partners_screen()
                    tg_api('sendMessage', {'chat_id': chat_id, 'text': text_p, 'parse_mode': 'HTML',
                                          'reply_markup': markup_p})
                elif text.startswith('/ref_pending'):
                    tg_api('sendMessage', {'chat_id': chat_id, 'text': _ref_pending_text(), 'parse_mode': 'HTML'})
                elif text.startswith('/setdefaultcommission'):
                    # /setdefaultcommission 15
                    parts = text.split()
                    if len(parts) < 2:
                        tg_api('sendMessage', {'chat_id': chat_id,
                               'text': 'Usage: /setdefaultcommission &lt;pct&gt;', 'parse_mode': 'HTML'})
                    else:
                        try:
                            pct = float(parts[1])
                            body = json.dumps({'commission_pct': pct}).encode()
                            req  = urllib.request.Request(
                                f'http://localhost:{REF_BOT_PORT}/ref/set_default_commission',
                                data=body, headers={'Content-Type': 'application/json'}, method='POST')
                            urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
                            tg_api('sendMessage', {'chat_id': chat_id,
                                   'text': f'Default commission set to <b>{pct:.1f}%</b>', 'parse_mode': 'HTML'})
                        except Exception as ex:
                            tg_api('sendMessage', {'chat_id': chat_id, 'text': f'Error: {ex}'})
                elif text.startswith('/setcommission'):
                    # /setcommission <code_or_partner_id> <pct>
                    parts = text.split()
                    if len(parts) < 3:
                        tg_api('sendMessage', {'chat_id': chat_id,
                               'text': 'Usage: /setcommission &lt;partner_tg_id&gt; &lt;pct&gt;',
                               'parse_mode': 'HTML'})
                    else:
                        try:
                            partner_id = parts[1]
                            pct        = float(parts[2])
                            body = json.dumps({'partner_id': partner_id, 'commission_pct': pct}).encode()
                            req  = urllib.request.Request(
                                f'http://localhost:{REF_BOT_PORT}/ref/set_commission',
                                data=body, headers={'Content-Type': 'application/json'}, method='POST')
                            urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
                            tg_api('sendMessage', {'chat_id': chat_id,
                                   'text': f'Commission for <code>{tg_escape(partner_id)}</code> set to <b>{pct:.1f}%</b>',
                                   'parse_mode': 'HTML'})
                        except Exception as ex:
                            tg_api('sendMessage', {'chat_id': chat_id, 'text': f'Error: {ex}'})

        except urllib.error.HTTPError as ex:
            if ex.code == 409:
                # Another instance is running — wait longer before retrying
                print(f'[ADMIN] Polling 409 Conflict: another bot instance detected. Retrying in 15s...')
                time.sleep(15)
            else:
                print(f'[ADMIN] Polling error: {ex}')
                time.sleep(5)
        except Exception as ex:
            print(f'[ADMIN] Polling error: {ex}')
            time.sleep(5)

# ── HTTP HANDLER ──────────────────────────────────────────────────
class AdminHandler(BaseHTTPRequestHandler):

    # Endpoints that require x-internal-secret authentication.
    # The frontend never calls these directly — only the Node API server does.
    _PROTECTED_PATHS = {'/register', '/deposit', '/withdraw', '/ref/withdraw', '/ref/creative', '/bonus/claim'}

    def _check_secret(self) -> bool:
        """Return True if the request carries the correct x-internal-secret header."""
        return self.headers.get('x-internal-secret') == INTERNAL_SECRET

    def do_OPTIONS(self):
        self._cors(200)

    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        path   = parsed.path.rstrip('/')
        qs     = parse_qs(parsed.query)

        if path == '/stats':
            with _lock:
                self._reply(200, {
                    'ok': True,
                    'total_users':         len(_users),
                    'total_deposits':      _stats.get('total_deposits', 0.0),
                    'total_withdrawals':   _stats.get('total_withdrawals', 0.0),
                    'pending_withdrawals': sum(1 for w in _withdrawals.values() if w['status'] == 'pending'),
                })
        elif path == '/slot/config':
            with _lock:
                rtp = _slot_rtp
            mult = rtp / 96.5
            self._reply(200, {'ok': True, 'rtp': rtp, 'rtp_multiplier': mult})
        elif path == '/withdraw/status':
            txn_id = qs.get('id', [''])[0]
            with _lock:
                w = _withdrawals.get(txn_id)
            if not w:
                self._reply(404, {'ok': False, 'error': 'not found'})
            else:
                self._reply(200, {'ok': True, 'status': w['status']})
        elif path == '/bonuses':
            with _lock:
                active = [b for b in _bonuses.values() if b.get('active', True)]
            self._reply(200, {'ok': True, 'bonuses': active})
        else:
            self._reply(404, {'ok': False, 'error': 'not found'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
        except ValueError:
            length = 0
        if length > 16384:
            self._reply(413, {'ok': False, 'error': 'payload too large'})
            return
        raw = self.rfile.read(length) if length else b''
        try:
            data = json.loads(raw.decode('utf-8'))
        except Exception:
            self._reply(400, {'ok': False, 'error': 'invalid json'})
            return

        from urllib.parse import urlparse
        path = urlparse(self.path).path.rstrip('/')

        # ── Authenticate inter-service requests ───────────────────
        if path in self._PROTECTED_PATHS and not self._check_secret():
            self._reply(403, {'ok': False, 'error': 'forbidden'})
            return

        # ── Partner withdrawal notification (from referral_bot) ───
        if path == '/ref/withdraw':
            wdr_id       = str(data.get('wdr_id', ''))[:64]
            partner_name = str(data.get('partner_name', 'Partner'))[:64]
            partner_id   = str(data.get('partner_id', ''))[:32]
            amount       = abs(float(data.get('amount', 0) or 0))
            method       = str(data.get('method', ''))[:64]
            wallet       = str(data.get('wallet', ''))[:200]
            ts           = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
            if not wdr_id:
                self._reply(400, {'ok': False, 'error': 'wdr_id required'})
                return
            with _lock:
                _partner_withdrawals[wdr_id] = {
                    'partner_id':   partner_id,
                    'partner_name': partner_name,
                    'amount':       amount,
                    'method':       method,
                    'wallet':       wallet,
                    'status':       'pending',
                    'created_at':   ts,
                    'msg_id':       None,
                }
                save_data()
            wallet_line = f'\n💳 Wallet: <code>{tg_escape(wallet)}</code>' if wallet else ''
            markup = {'inline_keyboard': [[
                {'text': '✅ Approve', 'callback_data': f'ref_wdr_approve:{wdr_id}'},
                {'text': '❌ Deny',    'callback_data': f'ref_wdr_deny:{wdr_id}'},
            ]]}
            msg_id = send_to_admin(
                f'💸 <b>Partner Payout Request</b>\n'
                f'──────────────────────────\n'
                f'🤝 <b>{tg_escape(partner_name)}</b>  <code>{tg_escape(partner_id)}</code>\n'
                f'💵 Amount: <b>$ {amount:.2f}</b>\n'
                f'📤 Method: {tg_escape(method)}'
                f'{wallet_line}\n'
                f'🕒 {ts}\n'
                f'🔑 <code>{wdr_id}</code>',
                markup,
            )
            with _lock:
                if wdr_id in _partner_withdrawals and msg_id:
                    _partner_withdrawals[wdr_id]['msg_id'] = msg_id
                    save_data()
            self._reply(200, {'ok': True})

        # ── Creative notification (from referral_bot) ─────────────
        elif path == '/ref/creative':
            creative_id       = str(data.get('creative_id', ''))[:64]
            partner_name      = str(data.get('partner_name', 'Partner'))[:64]
            freespins         = int(data.get('freespins', 0))
            deposit_bonus_pct = int(data.get('deposit_bonus_pct', 0))
            promo_codes       = data.get('promo_codes', [])
            created_at        = str(data.get('created_at', ''))
            if not creative_id:
                self._reply(400, {'ok': False, 'error': 'creative_id required'})
                return
            with _lock:
                _creatives[creative_id] = {
                    'id':               creative_id,
                    'partner_name':     partner_name,
                    'freespins':        freespins,
                    'deposit_bonus_pct': deposit_bonus_pct,
                    'promo_codes':      promo_codes,
                    'created_at':       created_at,
                }
                save_data()
            dep_line    = f'+{deposit_bonus_pct}%' if deposit_bonus_pct > 0 else 'без бонуса'
            codes_block = '\n'.join(f'  <code>{tg_escape(c)}</code>' for c in promo_codes)
            send_to_admin(
                f'🎨 <b>Новый креатив!</b>\n'
                f'──────────────────────────\n'
                f'👤 Траффер: <b>{tg_escape(partner_name)}</b>\n'
                f'🎰 Спинов: <b>{freespins}</b> (Alien Rush Bonanza)\n'
                f'💰 Бонус к депозиту: <b>{dep_line}</b>\n'
                f'🎟 Промокодов: <b>{len(promo_codes)}</b>\n'
                f'──────────────────────────\n'
                f'<b>Коды:</b>\n{codes_block}\n'
                f'📅 {created_at}',
            )
            self._reply(200, {'ok': True})

        # ── New Registration ──────────────────────────────────────
        elif path == '/register':
            username = str(data.get('username', 'Guest'))[:64]
            email    = str(data.get('email', ''))[:120]
            uid      = str(data.get('uid', ''))[:32]
            ts       = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
            with _lock:
                if uid and uid not in _users:
                    _users[uid] = {
                        'username': username, 'email': email, 'uid': uid,
                        'registered_at': ts, 'total_deposits': 0.0, 'total_withdrawals': 0.0,
                    }
                    save_data()
            send_to_admin(
                f'🆕 <b>New Registration</b>\n'
                f'──────────────────────────\n'
                f'👤 <b>{tg_escape(username)}</b>\n'
                f'📧 {tg_escape(email)}\n'
                f'🔑 <code>{tg_escape(uid)}</code>\n'
                f'🕒 {ts}\n'
                f'👥 Total users: <b>{len(_users)}</b>'
            )
            self._reply(200, {'ok': True})

        # ── New Deposit ───────────────────────────────────────────
        elif path == '/deposit':
            txn_id   = str(data.get('txnId', ''))[:64]
            username = str(data.get('username', 'Guest'))[:64]
            uid      = str(data.get('uid', ''))[:32]
            amount   = abs(float(data.get('amount', 0) or 0))
            method   = str(data.get('method', ''))[:64]
            ts       = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')

            if not txn_id:
                self._reply(400, {'ok': False, 'error': 'txnId required'})
                return

            with _lock:
                _deposits[txn_id] = {
                    'username': username, 'uid': uid, 'amount': amount,
                    'method': method, 'status': 'pending', 'created_at': ts, 'msg_id': None,
                }
                save_data()

            markup = {'inline_keyboard': [[
                {'text': '✅ Confirm',  'callback_data': f'dep_approve:{txn_id}'},
                {'text': '❌ Deny',     'callback_data': f'dep_deny:{txn_id}'},
            ]]}
            msg_id = send_to_admin(
                f'💰 <b>Deposit Request</b>\n'
                f'──────────────────────────\n'
                f'👤 <b>{tg_escape(username)}</b>  <code>{tg_escape(uid)}</code>\n'
                f'💵 Amount:  <b>$ {amount:.2f}</b>\n'
                f'💳 Method:  {tg_escape(method)}\n'
                f'🕒 {ts}\n'
                f'🔑 <code>{txn_id}</code>',
                markup,
            )
            with _lock:
                if txn_id in _deposits and msg_id:
                    _deposits[txn_id]['msg_id'] = msg_id
                    save_data()
            self._reply(200, {'ok': True})

        # ── Withdrawal Request ────────────────────────────────────
        elif path == '/withdraw':
            txn_id   = str(data.get('txnId', ''))[:64]
            username = str(data.get('username', 'Guest'))[:64]
            uid      = str(data.get('uid', ''))[:32]
            amount   = abs(float(data.get('amount', 0) or 0))
            method   = str(data.get('method', ''))[:64]
            wallet   = str(data.get('wallet', ''))[:200]
            memo     = str(data.get('memo', ''))[:100]
            balance  = float(data.get('balance', 0) or 0)
            ts       = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')

            if not txn_id:
                self._reply(400, {'ok': False, 'error': 'txnId required'})
                return

            with _lock:
                _withdrawals[txn_id] = {
                    'username': username, 'uid': uid, 'amount': amount,
                    'method': method, 'wallet': wallet, 'memo': memo,
                    'status': 'pending', 'created_at': ts, 'msg_id': None,
                }
                save_data()

            wallet_line = f'\n💳 Wallet:  <code>{tg_escape(wallet)}</code>' if wallet else ''
            memo_line   = f'\n🏷 MEMO:    <code>{tg_escape(memo)}</code>'   if memo   else ''
            markup = {'inline_keyboard': [[
                {'text': '✅ Approve', 'callback_data': f'wdr_approve:{txn_id}'},
                {'text': '❌ Deny',    'callback_data': f'wdr_deny:{txn_id}'},
            ]]}
            msg_id = send_to_admin(
                f'💸 <b>Withdrawal Request</b>\n'
                f'──────────────────────────\n'
                f'👤 <b>{tg_escape(username)}</b>  <code>{tg_escape(uid)}</code>\n'
                f'💵 Amount:  <b>$ {amount:.2f}</b>\n'
                f'📤 Method:  {tg_escape(method)}'
                f'{wallet_line}'
                f'{memo_line}\n'
                f'💰 Balance after: <b>$ {balance:.2f}</b>\n'
                f'🕒 {ts}\n'
                f'🔑 <code>{txn_id}</code>',
                markup
            )
            with _lock:
                if txn_id in _withdrawals and msg_id:
                    _withdrawals[txn_id]['msg_id'] = msg_id
                    save_data()

            self._reply(200, {'ok': True, 'txnId': txn_id})

        # ── Bonus Claim ───────────────────────────────────────────
        elif path == '/bonus/claim':
            bonus_id = str(data.get('bonus_id', ''))[:64]
            uid      = str(data.get('uid', ''))[:64]
            if not bonus_id or not uid:
                self._reply(400, {'ok': False, 'error': 'bonus_id and uid required'})
                return
            with _lock:
                b = _bonuses.get(bonus_id)
                if not b or not b.get('active', True):
                    self._reply(404, {'ok': False, 'error': 'Bonus not found or inactive'})
                    return
                # Look up total deposits from server records (do not trust client)
                user_data = _users.get(uid, {})
                total_deposited = float(user_data.get('total_deposits', 0))
                min_dep = float(b.get('min_deposit', 0))
                if total_deposited < min_dep:
                    self._reply(403, {'ok': False,
                        'error': f'Deposit at least \u20ac{min_dep:.0f} to claim this bonus (your deposits: \u20ac{total_deposited:.0f})'})
                    return
                claimed = _bonus_claims.get(uid, [])
                if bonus_id in claimed:
                    self._reply(409, {'ok': False, 'error': 'Already claimed'})
                    return
                _bonus_claims.setdefault(uid, []).append(bonus_id)
                save_bonuses()
            self._reply(200, {'ok': True, 'freespins': b['freespins'], 'title': b['title']})

        else:
            self._reply(404, {'ok': False, 'error': 'not found'})

    def _cors(self, code: int):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _reply(self, code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f'[ADMIN] {self.address_string()} — "{fmt % args}"')


def _delete_webhook():
    """Remove any existing webhook so long-polling can work."""
    try:
        url  = f'https://api.telegram.org/bot{ADMIN_TG_TOKEN}/deleteWebhook'
        body = json.dumps({'drop_pending_updates': False}).encode()
        req  = urllib.request.Request(url, data=body,
                                      headers={'Content-Type': 'application/json'},
                                      method='POST')
        urllib.request.urlopen(req, context=_tg_ctx, timeout=10)
        print('[ADMIN] Webhook cleared.')
    except Exception as ex:
        print(f'[ADMIN] deleteWebhook error (ignored): {ex}')


def main():
    if ADMIN_TG_TOKEN == 'YOUR_ADMIN_BOT_TOKEN_HERE':
        print('[ADMIN] ⚠ WARNING: Admin bot token not configured!')
        print('[ADMIN]   Open admin_bot.py and set ADMIN_TG_TOKEN and ADMIN_TG_CHAT')
        print()

    load_data()
    load_bonuses()
    _delete_webhook()  # must clear webhook before long-polling

    t = threading.Thread(target=_poll_loop, daemon=True)
    t.start()

    server = HTTPServer(('0.0.0.0', ADMIN_BOT_PORT), AdminHandler)
    print(f'[ADMIN] Admin bot started: http://localhost:{ADMIN_BOT_PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[ADMIN] Stopped.')


if __name__ == '__main__':
    main()
