"""
Zone 51 — Referral Bot (port 8769)

Партнёрская программа:
  - Партнёр пишет /start → получает личный кабинет + реферальную ссылку
  - Ссылка формата: {CASINO_URL}/?ref=<code>
  - При регистрации игрока через ссылку → уведомление партнёру
  - При депозите реферала → партнёр получает X% комиссии
  - Партнёр может запросить вывод прямо из бота
  - Администратор регулирует комиссии и выводы из admin_bot
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, ssl, urllib.request, urllib.error
import threading, os, time, secrets, string, uuid
from datetime import datetime, timezone

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
except ImportError:
    pass

# ── CONFIG ──────────────────────────────────────────────────────
REF_BOT_TOKEN   = os.environ['REF_TG_TOKEN']
REF_BOT_PORT    = 8769
ADMIN_BOT_PORT  = 8767
INTERNAL_SECRET = os.environ.get('INTERNAL_SECRET', '')

# Публичный URL казино — замените на настоящий домен
CASINO_URL = 'http://localhost:8765'

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'referral_data.json')

# ── STATE ────────────────────────────────────────────────────────
_lock   = threading.Lock()
_tg_ctx = ssl.create_default_context()

_data: dict = {
    'partners':            {},   # str(tg_chat_id) → partner dict
    'codes':               {},   # code → str(tg_chat_id)
    'referred_users':      {},   # casino_uid → str(tg_chat_id)
    'settings':            {'default_commission_pct': 10.0},
    'partner_withdrawals': {},   # wdr_id → withdrawal dict
    'creatives':           {},   # creative_id → creative dict
    'promo_codes':         {},   # promo_code → promo dict
    'promo_bonuses':       {},   # casino_uid → {freespins, deposit_bonus_pct, code, used_deposit}
}

# Multi-step input states (not persisted)
_withdraw_state:  dict = {}   # str(chat_id) → {'step': str, 'amount': float, 'method': str}
_creative_state:  dict = {}   # str(chat_id) → {'step': str, 'spins': int, 'deposit_bonus_pct': int}


# ── DATA PERSISTENCE ─────────────────────────────────────────────
def _load():
    global _data
    if not os.path.isfile(DATA_FILE):
        return
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            saved = json.load(f)
        for key in _data:
            if key in saved:
                _data[key] = saved[key]
        print(f'[REF] Loaded: {len(_data["partners"])} partners, '
              f'{len(_data["partner_withdrawals"])} withdrawals, '
              f'{len(_data["creatives"])} creatives, '
              f'{len(_data["promo_bonuses"])} promo bonuses')
    except Exception as e:
        print(f'[REF] Load error: {e}')


def _save():
    """Must be called inside _lock or when already protected."""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'[REF] Save error: {e}')


# ── CODE GENERATION ──────────────────────────────────────────────
def _gen_code() -> str:
    """8-char random alphanumeric code, guaranteed unique."""
    alphabet = string.ascii_lowercase + string.digits
    while True:
        code = ''.join(secrets.choice(alphabet) for _ in range(8))
        if code not in _data['codes']:
            return code


def _gen_promo_code() -> str:
    """10-char uppercase promo code like Z51-AB3X9K, guaranteed unique."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = 'Z51-' + ''.join(secrets.choice(alphabet) for _ in range(6))
        if code not in _data['promo_codes']:
            return code


# ── TELEGRAM API ─────────────────────────────────────────────────
def tg(method: str, payload: dict):
    url  = f'https://api.telegram.org/bot{REF_BOT_TOKEN}/{method}'
    body = json.dumps(payload).encode('utf-8')
    req  = urllib.request.Request(
        url, data=body,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, context=_tg_ctx, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f'[REF-TG] {method} HTTP {e.code}: {e.read().decode("utf-8", "replace")}')
    except Exception as ex:
        print(f'[REF-TG] {method}: {ex}')
    return None


def esc(s) -> str:
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


# ── PARTNER MANAGEMENT ───────────────────────────────────────────
def _get_or_create_partner(chat_id: str, name: str) -> dict:
    if chat_id in _data['partners']:
        return _data['partners'][chat_id]
    code = _gen_code()
    partner = {
        'name':            name,
        'code':            code,
        'commission_pct':  _data['settings'].get('default_commission_pct', 10.0),
        'balance':         0.0,
        'total_earned':    0.0,
        'total_withdrawn': 0.0,
        'referrals_count': 0,
        'deposits_count':  0,
        'total_volume':    0.0,
        'created_at':      datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC'),
    }
    _data['partners'][chat_id] = partner
    _data['codes'][code]       = chat_id
    _save()
    print(f'[REF] New partner registered: {name} (code={code})')
    return partner


# ── KEYBOARDS ────────────────────────────────────────────────────
def _main_keyboard():
    return {
        'inline_keyboard': [
            [
                {'text': '🔗 Моя ссылка',  'callback_data': 'ref_link'},
                {'text': '📊 Статистика',  'callback_data': 'ref_stats'},
            ],
            [
                {'text': '💰 Баланс',      'callback_data': 'ref_balance'},
                {'text': '🎨 Создать креатив', 'callback_data': 'creative_start'},
            ],
            [
                {'text': '📦 Мои креативы', 'callback_data': 'creative_list'},
            ],
        ]
    }


def _back_keyboard():
    return {'inline_keyboard': [[{'text': '◀️ Назад', 'callback_data': 'ref_back'}]]}


# ── MESSAGE BUILDERS ─────────────────────────────────────────────
def _welcome_text(partner: dict, name: str) -> str:
    return (
        f'👋 Добро пожаловать, <b>{esc(name)}</b>!\n\n'
        f'<b>Партнёрская программа Zone 51</b>\n'
        f'──────────────────────────\n'
        f'🔗 Ваш код: <code>{partner["code"]}</code>\n'
        f'💸 Комиссия: <b>{partner["commission_pct"]:.1f}%</b> с каждого депозита\n'
        f'💰 Баланс: <b>$ {partner["balance"]:.2f}</b>\n\n'
        f'Делитесь ссылкой и зарабатывайте с каждого пополнения рефералов.'
    )


def _link_text(partner: dict) -> str:
    link = f'{CASINO_URL}/?ref={partner["code"]}'
    return (
        f'🔗 <b>Ваша реферальная ссылка</b>\n'
        f'──────────────────────────\n'
        f'<code>{link}</code>\n\n'
        f'Отправьте эту ссылку друзьям. После регистрации и пополнения '
        f'вы получите <b>{partner["commission_pct"]:.1f}%</b> от их депозита.\n\n'
        f'Код: <code>{partner["code"]}</code>'
    )


def _stats_text(partner: dict) -> str:
    return (
        f'📊 <b>Статистика</b>\n'
        f'──────────────────────────\n'
        f'👥 Рефералов:    <b>{partner["referrals_count"]}</b>\n'
        f'💳 Депозитов:    <b>{partner["deposits_count"]}</b>\n'
        f'💵 Оборот:       <b>$ {partner["total_volume"]:.2f}</b>\n'
        f'💸 Ставка:       <b>{partner["commission_pct"]:.1f}%</b>\n'
        f'──────────────────────────\n'
        f'✅ Заработано:   <b>$ {partner["total_earned"]:.2f}</b>\n'
        f'💰 К выводу:     <b>$ {partner["balance"]:.2f}</b>\n'
        f'📤 Выведено:     <b>$ {partner["total_withdrawn"]:.2f}</b>'
    )


def _balance_text(partner: dict) -> str:
    return (
        f'💰 <b>Ваш баланс</b>\n'
        f'──────────────────────────\n'
        f'К выводу:      <b>$ {partner["balance"]:.2f}</b>\n'
        f'Всего заработано: <b>$ {partner["total_earned"]:.2f}</b>\n'
        f'Выведено:      <b>$ {partner["total_withdrawn"]:.2f}</b>'
    )


# ── WITHDRAWAL FLOW ──────────────────────────────────────────────
def _start_withdraw(chat_id: str, partner: dict):
    if partner['balance'] < 1.0:
        tg('sendMessage', {
            'chat_id': chat_id, 'parse_mode': 'HTML',
            'text': f'⚠️ Минимальная сумма — $1.00\nВаш баланс: <b>$ {partner["balance"]:.2f}</b>',
        })
        return
    _withdraw_state[chat_id] = {'step': 'amount'}
    tg('sendMessage', {
        'chat_id': chat_id, 'parse_mode': 'HTML',
        'text': (
            f'💸 <b>Вывод средств</b>\n\n'
            f'Доступно: <b>$ {partner["balance"]:.2f}</b>\n\n'
            f'Введите сумму (USD):'
        ),
    })


def _process_withdraw_input(chat_id: str, text: str):
    state   = _withdraw_state.get(chat_id)
    if not state:
        return
    with _lock:
        partner = _data['partners'].get(chat_id)
    if not partner:
        return

    if state['step'] == 'amount':
        try:
            amount = round(float(text.replace(',', '.')), 2)
        except ValueError:
            tg('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Введите корректное число:'})
            return
        if amount < 1.0:
            tg('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Минимальная сумма — $1.00. Введите сумму:'})
            return
        if amount > partner['balance']:
            tg('sendMessage', {
                'chat_id': chat_id, 'parse_mode': 'HTML',
                'text': f'⚠️ Недостаточно средств. Доступно: <b>$ {partner["balance"]:.2f}</b>. Введите сумму:',
            })
            return
        state['amount'] = amount
        state['step']   = 'method'
        _withdraw_state[chat_id] = state
        tg('sendMessage', {
            'chat_id': chat_id, 'parse_mode': 'HTML',
            'text': f'Сумма: <b>$ {amount:.2f}</b>\n\nВыберите метод вывода:',
            'reply_markup': {
                'inline_keyboard': [
                    [{'text': 'USDT TRC-20', 'callback_data': 'wm_USDT TRC-20'}],
                    [{'text': 'BTC',          'callback_data': 'wm_BTC'}],
                    [{'text': 'ETH',          'callback_data': 'wm_ETH'}],
                    [{'text': 'Карта (RUB)',  'callback_data': 'wm_Card RUB'}],
                ],
            },
        })

    elif state['step'] == 'wallet':
        wallet = text.strip()
        if not wallet:
            tg('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Введите корректные реквизиты:'})
            return
        _finalize_withdraw(chat_id, partner, state['amount'], state['method'], wallet)
        _withdraw_state.pop(chat_id, None)


def _set_withdraw_method(chat_id: str, method: str):
    state = _withdraw_state.get(chat_id)
    if not state or state['step'] != 'method':
        return
    state['method'] = method
    state['step']   = 'wallet'
    _withdraw_state[chat_id] = state
    tg('sendMessage', {
        'chat_id': chat_id, 'parse_mode': 'HTML',
        'text': f'Метод: <b>{esc(method)}</b>\n\nВведите адрес / реквизиты:',
    })


def _finalize_withdraw(chat_id: str, partner: dict, amount: float, method: str, wallet: str):
    wdr_id = str(uuid.uuid4())
    ts     = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
    with _lock:
        if partner['balance'] < amount:
            tg('sendMessage', {'chat_id': chat_id, 'text': '⚠️ Недостаточно средств.'})
            return
        partner['balance'] = round(partner['balance'] - amount, 2)
        _data['partner_withdrawals'][wdr_id] = {
            'partner_id':   chat_id,
            'partner_name': partner['name'],
            'amount':       amount,
            'method':       method,
            'wallet':       wallet,
            'status':       'pending',
            'created_at':   ts,
            'resolved_at':  None,
        }
        _save()

    tg('sendMessage', {
        'chat_id': chat_id, 'parse_mode': 'HTML',
        'text': (
            f'✅ <b>Заявка на вывод создана</b>\n\n'
            f'Сумма:       <b>$ {amount:.2f}</b>\n'
            f'Метод:       {esc(method)}\n'
            f'Реквизиты:   <code>{esc(wallet)}</code>\n'
            f'Статус:      <b>Ожидает обработки</b>\n\n'
            f'Администратор рассмотрит заявку в ближайшее время.'
        ),
    })

    # Notify admin bot
    try:
        body = json.dumps({
            'wdr_id':       wdr_id,
            'partner_name': partner['name'],
            'partner_id':   chat_id,
            'amount':       amount,
            'method':       method,
            'wallet':       wallet,
        }).encode('utf-8')
        req = urllib.request.Request(
            f'http://localhost:{ADMIN_BOT_PORT}/ref/withdraw',
            data=body,
            headers={'Content-Type': 'application/json',
                     'x-internal-secret': INTERNAL_SECRET},
            method='POST',
        )
        urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
    except Exception as ex:
        print(f'[REF] Admin notify error: {ex}')


# ── CREATIVE FLOW ────────────────────────────────────────────────
CREATIVE_PROMO_COUNT = 6   # always generate 6 promo codes per creative

def _creative_spins_keyboard():
    """Step 1: choose free spins amount."""
    return {
        'inline_keyboard': [
            [
                {'text': '25 спинов',  'callback_data': 'cs_spins:25'},
                {'text': '50 спинов',  'callback_data': 'cs_spins:50'},
                {'text': '75 спинов',  'callback_data': 'cs_spins:75'},
            ],
            [
                {'text': '100 спинов', 'callback_data': 'cs_spins:100'},
                {'text': '150 спинов', 'callback_data': 'cs_spins:150'},
                {'text': '200 спинов', 'callback_data': 'cs_spins:200'},
            ],
            [{'text': '◀️ Отмена', 'callback_data': 'creative_cancel'}],
        ]
    }


def _creative_bonus_keyboard():
    """Step 2: choose deposit bonus %."""
    return {
        'inline_keyboard': [
            [
                {'text': '0% (без бонуса)', 'callback_data': 'cs_dep:0'},
            ],
            [
                {'text': '+25% к депозиту', 'callback_data': 'cs_dep:25'},
                {'text': '+50% к депозиту', 'callback_data': 'cs_dep:50'},
            ],
            [
                {'text': '+75% к депозиту', 'callback_data': 'cs_dep:75'},
                {'text': '+100% к депозиту', 'callback_data': 'cs_dep:100'},
            ],
            [{'text': '◀️ Назад', 'callback_data': 'creative_back_step1'}],
        ]
    }


def _finalize_creative(chat_id: str, partner: dict, spins: int, deposit_bonus_pct: int) -> dict:
    """Generate creative + 6 promo codes, save, notify admin, return creative dict."""
    ts          = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
    creative_id = str(uuid.uuid4())
    codes       = []

    with _lock:
        for _ in range(CREATIVE_PROMO_COUNT):
            code = _gen_promo_code()
            promo = {
                'code':              code,
                'creative_id':       creative_id,
                'partner_id':        chat_id,
                'partner_name':      partner['name'],
                'freespins':         spins,
                'deposit_bonus_pct': deposit_bonus_pct,
                'claimed_by':        [],
                'use_count':         0,
                'created_at':        ts,
            }
            _data['promo_codes'][code] = promo
            codes.append(code)

        creative = {
            'id':                creative_id,
            'partner_id':        chat_id,
            'partner_name':      partner['name'],
            'freespins':         spins,
            'deposit_bonus_pct': deposit_bonus_pct,
            'promo_codes':       codes,
            'created_at':        ts,
        }
        _data['creatives'][creative_id] = creative
        _save()

    return creative


def _creative_result_text(creative: dict) -> str:
    dep_line = (f'+{creative["deposit_bonus_pct"]}% к депозиту'
                if creative['deposit_bonus_pct'] > 0 else 'без бонуса к депозиту')
    codes_block = '\n'.join(f'  <code>{c}</code>' for c in creative['promo_codes'])
    return (
        f'🎨 <b>Креатив создан!</b>\n'
        f'──────────────────────────\n'
        f'🎰 Бесплатных спинов:  <b>{creative["freespins"]}</b> (Alien Rush Bonanza)\n'
        f'💰 Бонус к депозиту:   <b>{dep_line}</b>\n'
        f'🎟 Промокодов:         <b>{len(creative["promo_codes"])}</b>\n'
        f'──────────────────────────\n'
        f'<b>Промокоды для распространения:</b>\n'
        f'{codes_block}\n'
        f'──────────────────────────\n'
        f'<i>Каждый код — одноразовый. Поделитесь ими с игроками.</i>'
    )


def _creatives_list_text(chat_id: str) -> str:
    with _lock:
        creatives = [c for c in _data['creatives'].values() if c['partner_id'] == chat_id]
    if not creatives:
        return '📦 <b>Ваши креативы</b>\n\nУ вас ещё нет созданных креативов. Нажмите «🎨 Создать креатив».'
    creatives.sort(key=lambda x: x['created_at'], reverse=True)
    lines = [f'📦 <b>Ваши креативы ({len(creatives)})</b>\n──────────────────────────']
    for c in creatives[:10]:
        used  = sum(_data['promo_codes'].get(code, {}).get('use_count', 0)
                    for code in c['promo_codes'])
        total = len(c['promo_codes'])
        dep   = f'+{c["deposit_bonus_pct"]}%' if c['deposit_bonus_pct'] > 0 else '—'
        lines.append(
            f'• 🎰 <b>{c["freespins"]} спинов</b>  |  💰 {dep}  |  '
            f'🎟 {used}/{total} использовано\n'
            f'  📅 {c["created_at"]}'
        )
    return '\n'.join(lines)


def _notify_admin_creative(partner: dict, creative: dict):
    """POST notification to admin bot about a new creative."""
    try:
        body = json.dumps({
            'creative_id':       creative['id'],
            'partner_name':      partner['name'],
            'freespins':         creative['freespins'],
            'deposit_bonus_pct': creative['deposit_bonus_pct'],
            'promo_codes':       creative['promo_codes'],
            'created_at':        creative['created_at'],
        }).encode('utf-8')
        req = urllib.request.Request(
            f'http://localhost:{ADMIN_BOT_PORT}/ref/creative',
            data=body,
            headers={'Content-Type': 'application/json',
                     'x-internal-secret': INTERNAL_SECRET},
            method='POST',
        )
        urllib.request.urlopen(req, context=_tg_ctx, timeout=5)
    except Exception as ex:
        print(f'[REF] Admin creative notify error: {ex}')


# ── CALLBACK HANDLER ─────────────────────────────────────────────
def _handle_callback(cb: dict):
    cb_id   = cb['id']
    chat_id = str(cb['from']['id'])
    data    = cb.get('data', '')
    name    = cb['from'].get('username') or cb['from'].get('first_name') or 'Partner'
    msg_id  = cb.get('message', {}).get('message_id')

    with _lock:
        partner = _get_or_create_partner(chat_id, name)

    def edit(text, markup=None):
        payload = {
            'chat_id': chat_id, 'message_id': msg_id,
            'text': text, 'parse_mode': 'HTML',
        }
        if markup:
            payload['reply_markup'] = markup
        tg('editMessageText', payload)

    if data == 'ref_link':
        edit(_link_text(partner), _back_keyboard())

    elif data == 'ref_stats':
        edit(_stats_text(partner), _back_keyboard())

    elif data == 'ref_balance':
        edit(_balance_text(partner), _back_keyboard())

    elif data == 'ref_withdraw':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        _start_withdraw(chat_id, partner)
        return

    elif data == 'ref_back':
        edit(_welcome_text(partner, name), _main_keyboard())

    elif data.startswith('wm_'):
        method = data[3:]
        _set_withdraw_method(chat_id, method)

    # ── CREATIVE flow ─────────────────────────────────────────────
    elif data == 'creative_start':
        _creative_state.pop(chat_id, None)
        _creative_state[chat_id] = {'step': 'spins'}
        edit(
            '🎨 <b>Создание креатива</b>\n\n'
            f'Шаг 1/2 — Выберите количество бесплатных спинов в слоте <b>Alien Rush Bonanza</b>:',
            _creative_spins_keyboard(),
        )

    elif data.startswith('cs_spins:'):
        spins = int(data.split(':', 1)[1])
        _creative_state[chat_id] = {'step': 'deposit_bonus', 'spins': spins}
        edit(
            f'🎨 <b>Создание креатива</b>\n\n'
            f'✅ Спинов: <b>{spins}</b>\n\n'
            f'Шаг 2/2 — Выберите <b>бонус к депозиту</b>, который получит игрок:',
            _creative_bonus_keyboard(),
        )

    elif data == 'creative_back_step1':
        _creative_state[chat_id] = {'step': 'spins'}
        edit(
            '🎨 <b>Создание креатива</b>\n\n'
            'Шаг 1/2 — Выберите количество бесплатных спинов:',
            _creative_spins_keyboard(),
        )

    elif data.startswith('cs_dep:'):
        state = _creative_state.get(chat_id)
        if not state or 'spins' not in state:
            tg('answerCallbackQuery', {'callback_query_id': cb_id,
               'text': '⚠️ Начните заново — нажмите «Создать креатив»', 'show_alert': True})
            return
        dep_pct  = int(data.split(':', 1)[1])
        spins    = state['spins']
        _creative_state.pop(chat_id, None)

        creative = _finalize_creative(chat_id, partner, spins, dep_pct)
        _notify_admin_creative(partner, creative)

        edit(_creative_result_text(creative), _back_keyboard())

    elif data == 'creative_cancel':
        _creative_state.pop(chat_id, None)
        edit(_welcome_text(partner, name), _main_keyboard())

    elif data == 'creative_list':
        edit(_creatives_list_text(chat_id), _back_keyboard())

    tg('answerCallbackQuery', {'callback_query_id': cb_id})


# ── POLLING ──────────────────────────────────────────────────────
def _poll_loop():
    offset = 0
    print('[REF] Polling started...')
    while True:
        try:
            url  = f'https://api.telegram.org/bot{REF_BOT_TOKEN}/getUpdates'
            body = json.dumps({
                'offset': offset, 'timeout': 30,
                'allowed_updates': ['message', 'callback_query'],
            }).encode()
            req = urllib.request.Request(
                url, data=body,
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            with urllib.request.urlopen(req, context=_tg_ctx, timeout=40) as r:
                upds = json.loads(r.read().decode('utf-8'))

            for upd in upds.get('result', []):
                offset = upd['update_id'] + 1

                cb = upd.get('callback_query')
                if cb:
                    try:
                        _handle_callback(cb)
                    except Exception as ex:
                        print(f'[REF] Callback error: {ex}')
                    continue

                msg  = upd.get('message', {})
                text = msg.get('text', '').strip()
                cid  = str(msg.get('chat', {}).get('id', ''))
                name = (msg.get('from', {}).get('username')
                        or msg.get('from', {}).get('first_name')
                        or 'Partner')
                if not text or not cid:
                    continue

                # Multi-step withdrawal input
                if cid in _withdraw_state and not text.startswith('/'):
                    _process_withdraw_input(cid, text)
                    continue

                if text.startswith('/start') or text.startswith('/cabinet'):
                    with _lock:
                        partner = _get_or_create_partner(cid, name)
                    tg('sendMessage', {
                        'chat_id': cid,
                        'text': _welcome_text(partner, name),
                        'parse_mode': 'HTML',
                        'reply_markup': _main_keyboard(),
                    })

                elif text.startswith('/link'):
                    with _lock:
                        partner = _get_or_create_partner(cid, name)
                    tg('sendMessage', {
                        'chat_id': cid,
                        'text': _link_text(partner),
                        'parse_mode': 'HTML',
                    })

                elif text.startswith('/stats'):
                    with _lock:
                        partner = _get_or_create_partner(cid, name)
                    tg('sendMessage', {
                        'chat_id': cid,
                        'text': _stats_text(partner),
                        'parse_mode': 'HTML',
                    })

                elif text.startswith('/balance'):
                    with _lock:
                        partner = _get_or_create_partner(cid, name)
                    tg('sendMessage', {
                        'chat_id': cid,
                        'text': _balance_text(partner),
                        'parse_mode': 'HTML',
                    })

        except urllib.error.HTTPError as ex:
            if ex.code == 409:
                print('[REF] Polling 409 Conflict — retrying in 15s...')
                time.sleep(15)
            else:
                print(f'[REF] Poll error: {ex}')
                time.sleep(5)
        except Exception as ex:
            print(f'[REF] Poll error: {ex}')
            time.sleep(5)


# ── HTTP HANDLER ─────────────────────────────────────────────────
class RefHandler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors(200)

    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        path   = parsed.path.rstrip('/')
        qs     = parse_qs(parsed.query)

        # Check if a ref code is valid
        if path == '/ref/check':
            code = qs.get('code', [''])[0]
            with _lock:
                exists = code in _data['codes']
            self._reply(200, {'ok': exists})

        # Summary for admin bot
        elif path == '/ref/stats':
            with _lock:
                partners = list(_data['partners'].values())
                pending  = sum(1 for w in _data['partner_withdrawals'].values()
                               if w['status'] == 'pending')
            self._reply(200, {
                'ok':                  True,
                'total_partners':      len(partners),
                'pending_withdrawals': pending,
                'default_commission':  _data['settings'].get('default_commission_pct', 10.0),
            })

        # Full partner list for admin
        elif path == '/ref/partners':
            with _lock:
                partners_list = [
                    {
                        'id':              pid,
                        'name':            p['name'],
                        'code':            p['code'],
                        'commission_pct':  p['commission_pct'],
                        'balance':         p['balance'],
                        'total_earned':    p['total_earned'],
                        'total_withdrawn': p['total_withdrawn'],
                        'referrals_count': p['referrals_count'],
                        'deposits_count':  p['deposits_count'],
                        'created_at':      p['created_at'],
                    }
                    for pid, p in _data['partners'].items()
                ]
            self._reply(200, {'ok': True, 'partners': partners_list})

        # Pending partner withdrawals for admin
        elif path == '/ref/pending_withdrawals':
            with _lock:
                pending = {k: v for k, v in _data['partner_withdrawals'].items()
                           if v['status'] == 'pending'}
            self._reply(200, {'ok': True, 'withdrawals': pending})

        # All creatives (for admin monitoring)
        elif path == '/ref/creatives':
            with _lock:
                creatives_out = list(_data['creatives'].values())
                # enrich with claim stats
                for c in creatives_out:
                    used = sum(_data['promo_codes'].get(code, {}).get('use_count', 0)
                               for code in c['promo_codes'])
                    c = dict(c)
                    c['claimed_count'] = used
            self._reply(200, {'ok': True, 'creatives': creatives_out})

        # Promo code info (for casino frontend/API)
        elif path == '/ref/promo':
            from urllib.parse import urlparse, parse_qs
            qs   = parse_qs(urlparse(self.path).query)
            code = qs.get('code', [''])[0].strip().upper()
            with _lock:
                promo = _data['promo_codes'].get(code)
            if not promo:
                self._reply(404, {'ok': False, 'error': 'invalid promo code'})
            else:
                self._reply(200, {'ok': True, 'promo': {
                    'code':              promo['code'],
                    'freespins':         promo['freespins'],
                    'deposit_bonus_pct': promo['deposit_bonus_pct'],
                    'partner_name':      promo['partner_name'],
                }})

        # Banner info for frontend — given a partner ref code, return their latest creative
        elif path == '/ref/banner':
            from urllib.parse import urlparse, parse_qs
            qs       = parse_qs(urlparse(self.path).query)
            ref_code = qs.get('ref', [''])[0].strip().upper()
            with _lock:
                partner_id = _data['codes'].get(ref_code.lower()) or _data['codes'].get(ref_code)
                if not partner_id:
                    # try case-insensitive search
                    for code_key, pid in _data['codes'].items():
                        if code_key.upper() == ref_code:
                            partner_id = pid
                            break
                if partner_id:
                    # find latest creative for this partner
                    partner_creatives = [
                        c for c in _data['creatives'].values()
                        if c['partner_id'] == partner_id
                    ]
                    partner_creatives.sort(key=lambda x: x.get('created_at', ''), reverse=True)
                    latest = partner_creatives[0] if partner_creatives else None
                else:
                    latest = None
            if not latest:
                self._reply(200, {'ok': True, 'banner': None})
            else:
                self._reply(200, {'ok': True, 'banner': {
                    'freespins':         latest['freespins'],
                    'deposit_bonus_pct': latest['deposit_bonus_pct'],
                    'ref_code':          ref_code,
                }})

        # Active promo bonus for a user (called by API server to check deposit bonus)
        elif path == '/ref/user-bonus':
            from urllib.parse import urlparse, parse_qs
            qs  = parse_qs(urlparse(self.path).query)
            uid = qs.get('uid', [''])[0].strip()
            with _lock:
                bonus = _data['promo_bonuses'].get(uid)
            if not bonus or bonus.get('used_deposit'):
                self._reply(200, {'ok': True, 'bonus': None})
            else:
                self._reply(200, {'ok': True, 'bonus': {
                    'freespins':         bonus['freespins'],
                    'deposit_bonus_pct': bonus['deposit_bonus_pct'],
                    'code':              bonus['code'],
                }})

        else:
            self._reply(404, {'ok': False, 'error': 'not found'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
        except ValueError:
            length = 0
        if length > 32768:
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

        # ── Casino API: user registered via referral link ─────────────────
        if path == '/ref/register':
            ref_code = str(data.get('ref_code', '')).strip()
            uid      = str(data.get('uid', '')).strip()
            username = str(data.get('username', 'User'))[:64]
            if not ref_code or not uid:
                self._reply(400, {'ok': False, 'error': 'ref_code and uid required'})
                return
            with _lock:
                chat_id = _data['codes'].get(ref_code)
                if not chat_id:
                    self._reply(404, {'ok': False, 'error': 'invalid ref code'})
                    return
                if uid not in _data['referred_users']:
                    _data['referred_users'][uid] = chat_id
                    partner = _data['partners'].get(chat_id)
                    if partner:
                        partner['referrals_count'] += 1
                    _save()
                    refs = partner['referrals_count'] if partner else 1
            tg('sendMessage', {
                'chat_id': chat_id, 'parse_mode': 'HTML',
                'text': (
                    f'🆕 <b>Новый реферал!</b>\n\n'
                    f'👤 <b>{esc(username)}</b> зарегистрировался по вашей ссылке.\n'
                    f'👥 Всего рефералов: <b>{refs}</b>'
                ),
            })
            self._reply(200, {'ok': True})

        # ── Casino API: referred user made a deposit ──────────────────────
        elif path == '/ref/deposit':
            uid      = str(data.get('uid', '')).strip()
            username = str(data.get('username', 'User'))[:64]
            amount   = abs(float(data.get('amount', 0) or 0))
            if not uid or amount <= 0:
                self._reply(400, {'ok': False, 'error': 'uid and amount required'})
                return

            bonus_amount = 0.0
            commission   = 0.0

            with _lock:
                # One-time deposit bonus from promo code (applies to ALL users who activated a code)
                pb = _data['promo_bonuses'].get(uid)
                if pb and not pb.get('used_deposit') and pb.get('deposit_bonus_pct', 0) > 0:
                    bonus_amount = round(amount * pb['deposit_bonus_pct'] / 100, 2)
                    pb['used_deposit'] = True

                # Partner commission (only for referred users)
                chat_id = _data['referred_users'].get(uid)
                if chat_id:
                    partner = _data['partners'].get(chat_id)
                    if partner:
                        pct        = partner.get('commission_pct', 10.0)
                        commission = round(amount * pct / 100, 2)
                        partner['balance']        = round(partner['balance'] + commission, 2)
                        partner['total_earned']   = round(partner['total_earned'] + commission, 2)
                        partner['total_volume']   = round(partner['total_volume'] + amount, 2)
                        partner['deposits_count'] += 1
                _save()

            if commission > 0 and chat_id:
                partner = _data['partners'].get(chat_id, {})
                tg('sendMessage', {
                    'chat_id': chat_id, 'parse_mode': 'HTML',
                    'text': (
                        f'💰 <b>Депозит реферала!</b>\n\n'
                        f'👤 <b>{esc(username)}</b> пополнил баланс на <b>$ {amount:.2f}</b>\n'
                        f'💸 Ваша комиссия ({pct:.1f}%): <b>+$ {commission:.2f}</b>\n'
                        f'💰 Ваш баланс: <b>$ {partner.get("balance", 0):.2f}</b>'
                    ),
                })
            self._reply(200, {'ok': True, 'commission': commission, 'bonus_amount': bonus_amount})

        # ── Admin bot: resolve partner withdrawal ─────────────────────────
        elif path == '/ref/withdraw/resolve':
            wdr_id  = str(data.get('wdr_id', ''))
            status  = str(data.get('status', ''))
            by_name = str(data.get('by_name', 'Admin'))[:64]
            if status not in ('approved', 'denied'):
                self._reply(400, {'ok': False, 'error': 'status must be approved or denied'})
                return
            with _lock:
                w = _data['partner_withdrawals'].get(wdr_id)
                if not w:
                    self._reply(404, {'ok': False, 'error': 'not found'})
                    return
                if w['status'] != 'pending':
                    self._reply(409, {'ok': False, 'error': f'already {w["status"]}'})
                    return
                w['status']     = status
                w['resolved_at'] = datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')
                amount     = w['amount']
                partner_id = w['partner_id']
                p = _data['partners'].get(partner_id)
                if status == 'denied' and p:
                    p['balance'] = round(p['balance'] + amount, 2)
                elif status == 'approved' and p:
                    p['total_withdrawn'] = round(p['total_withdrawn'] + amount, 2)
                _save()

            if status == 'approved':
                msg = (
                    f'✅ <b>Вывод одобрен!</b>\n\n'
                    f'Сумма <b>$ {amount:.2f}</b> будет отправлена на указанные реквизиты.'
                )
            else:
                msg = (
                    f'❌ <b>Вывод отклонён</b>\n\n'
                    f'Сумма <b>$ {amount:.2f}</b> возвращена на ваш баланс.\n'
                    f'Обратитесь в поддержку для уточнения причины.'
                )
            tg('sendMessage', {'chat_id': partner_id, 'text': msg, 'parse_mode': 'HTML'})
            self._reply(200, {'ok': True})

        # ── Admin: set commission for specific partner ─────────────────────
        elif path == '/ref/set_commission':
            partner_id = str(data.get('partner_id', '')).strip()
            try:
                pct = float(data.get('commission_pct', 10.0))
            except (TypeError, ValueError):
                self._reply(400, {'ok': False, 'error': 'invalid commission_pct'})
                return
            if not (0.0 <= pct <= 100.0):
                self._reply(400, {'ok': False, 'error': 'commission_pct must be 0-100'})
                return
            with _lock:
                p = _data['partners'].get(partner_id)
                if not p:
                    self._reply(404, {'ok': False, 'error': 'partner not found'})
                    return
                old_pct = p['commission_pct']
                p['commission_pct'] = pct
                _save()
            tg('sendMessage', {
                'chat_id': partner_id, 'parse_mode': 'HTML',
                'text': (
                    f'⚙️ <b>Ставка комиссии изменена</b>\n\n'
                    f'Было: {old_pct:.1f}% → Стало: <b>{pct:.1f}%</b>'
                ),
            })
            self._reply(200, {'ok': True})

        # ── Admin: set default commission % ──────────────────────────────
        elif path == '/ref/set_default_commission':
            try:
                pct = float(data.get('commission_pct', 10.0))
            except (TypeError, ValueError):
                self._reply(400, {'ok': False, 'error': 'invalid commission_pct'})
                return
            with _lock:
                _data['settings']['default_commission_pct'] = pct
                _save()
            self._reply(200, {'ok': True})

        # ── Casino API: claim a promo code ────────────────────────────────
        elif path == '/ref/promo/claim':
            code     = str(data.get('code', '')).strip().upper()
            uid      = str(data.get('uid', '')).strip()
            username = str(data.get('username', 'Player'))[:64]
            if not code or not uid:
                self._reply(400, {'ok': False, 'error': 'code and uid required'})
                return
            with _lock:
                promo = _data['promo_codes'].get(code)
                if not promo:
                    self._reply(404, {'ok': False, 'error': 'invalid promo code'})
                    return
                if uid in promo.get('claimed_by', []):
                    self._reply(409, {'ok': False, 'error': 'already claimed by this user'})
                    return
                if not isinstance(promo.get('claimed_by'), list):
                    promo['claimed_by'] = []
                promo['claimed_by'].append(uid)
                promo['use_count'] = promo.get('use_count', 0) + 1
                partner_id = promo['partner_id']
                # Store deposit bonus for this user (one-time, applied on first deposit)
                _data['promo_bonuses'][uid] = {
                    'freespins':         promo['freespins'],
                    'deposit_bonus_pct': promo['deposit_bonus_pct'],
                    'code':              code,
                    'partner_id':        partner_id,
                    'used_deposit':      False,
                    'activated_at':      datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC'),
                }
                _save()
            # Notify the partner
            partner_chat = _data['partners'].get(partner_id)
            if partner_chat:
                dep_line = (f'+{promo["deposit_bonus_pct"]}% к депозиту'
                            if promo['deposit_bonus_pct'] > 0 else 'без бонуса к депозиту')
                tg('sendMessage', {
                    'chat_id': partner_id, 'parse_mode': 'HTML',
                    'text': (
                        f'🎟 <b>Промокод активирован!</b>\n\n'
                        f'👤 Игрок <b>{esc(username)}</b> активировал промокод '
                        f'<code>{esc(code)}</code>\n'
                        f'🎰 {promo["freespins"]} спинов в Alien Rush Bonanza\n'
                        f'💰 {dep_line}'
                    ),
                })
            self._reply(200, {'ok': True, 'freespins': promo['freespins'],
                              'deposit_bonus_pct': promo['deposit_bonus_pct']})

        # ── Admin: delete partner ─────────────────────────────────────────
        elif path == '/ref/delete_partner':
            partner_id = str(data.get('partner_id', '')).strip()
            if not partner_id:
                self._reply(400, {'ok': False, 'error': 'partner_id required'})
                return
            with _lock:
                p = _data['partners'].get(partner_id)
                if not p:
                    self._reply(404, {'ok': False, 'error': 'partner not found'})
                    return
                code = p.get('code', '')
                del _data['partners'][partner_id]
                if code in _data['codes']:
                    del _data['codes'][code]
                _save()
            tg('sendMessage', {
                'chat_id': partner_id, 'parse_mode': 'HTML',
                'text': '⚠️ Ваш партнёрский аккаунт был деактивирован администратором.\n'
                        'Обратитесь в поддержку за дополнительной информацией.',
            })
            self._reply(200, {'ok': True})

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
        pass  # silence HTTP log noise


# ── ENTRY POINT ──────────────────────────────────────────────────
def _delete_webhook():
    try:
        url  = f'https://api.telegram.org/bot{REF_BOT_TOKEN}/deleteWebhook'
        body = json.dumps({'drop_pending_updates': False}).encode()
        req  = urllib.request.Request(
            url, data=body,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        urllib.request.urlopen(req, context=_tg_ctx, timeout=10)
        print('[REF] Webhook cleared.')
    except Exception as ex:
        print(f'[REF] deleteWebhook error (ignored): {ex}')


def main():
    _load()
    _delete_webhook()

    t = threading.Thread(target=_poll_loop, daemon=True)
    t.start()

    server = HTTPServer(('0.0.0.0', REF_BOT_PORT), RefHandler)
    print(f'[REF] Referral bot running on port {REF_BOT_PORT}')
    server.serve_forever()


if __name__ == '__main__':
    main()
