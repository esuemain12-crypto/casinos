"""
Zone 51 — Crypto Monitor (port 8768)

Генерирует USDT TRC-20 адреса и мониторит входящие платежи.
Зависимости: pip install tronpy requests
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, threading, time, os, urllib.request, urllib.error, sys

# ── CONFIG ─────────────────────────────────────────────────────────────────
PORT            = 8768
API_BASE        = os.getenv('API_BASE', 'http://localhost:4000')
INTERNAL_SECRET = os.getenv('INTERNAL_SECRET', 'z51_internal_7f3a9c2b4e1d6f8a')   # Должен совпадать с server/.env
POLL_INTERVAL   = 30  # сек между проверками

USDT_CONTRACT   = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'  # USDT TRC-20 mainnet
TRONGRID_BASE   = 'https://api.trongrid.io'

# Загружаем из server/.env
def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server', '.env')
    vals = {}
    try:
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, _, v = line.partition('=')
                    vals[k.strip()] = v.strip().strip('"')
    except Exception:
        pass
    return vals

_env = _load_env()
MAIN_WALLET_ADDRESS     = _env.get('MAIN_WALLET_ADDRESS', '')
MAIN_WALLET_PRIVATE_KEY = _env.get('MAIN_WALLET_PRIVATE_KEY', '')
GAS_TRX_AMOUNT          = 5_000_000   # 5 TRX в sun (хватит на 1 USDT-свип)
SWEEP_ENABLED           = bool(MAIN_WALLET_ADDRESS and MAIN_WALLET_PRIVATE_KEY)

# ── TRONPY ──────────────────────────────────────────────────────────────────
try:
    from tronpy import Tron
    from tronpy.keys import PrivateKey as TronPrivKey
    TRONPY_OK = True
except ImportError:
    TRONPY_OK = False
    print('[CRYPTO] tronpy не установлен! Запусти: pip install tronpy')

def generate_tron_address():
    """Генерирует уникальный TRC-20 адрес."""
    if not TRONPY_OK:
        raise RuntimeError('tronpy not installed. Run: pip install tronpy')
    priv = TronPrivKey.random()
    return {
        'address':    priv.public_key.to_base58check_address(),
        'privateKey': priv.hex(),
    }

def sweep_usdt(deposit_address, deposit_privkey_hex, amount_usdt_raw):
    """
    Переводит USDT с депозитного адреса на главный кошелёк.
    Сначала отправляет TRX для оплаты комиссии (gas), затем USDT.
    amount_usdt_raw — сумма в минимальных единицах (6 знаков, т.е. $1 = 1_000_000)
    """
    if not TRONPY_OK:
        print('[SWEEP] tronpy недоступен, свип пропущен')
        return None
    if not SWEEP_ENABLED:
        print('[SWEEP] MAIN_WALLET_PRIVATE_KEY не задан в .env, свип пропущен')
        return None
    if amount_usdt_raw <= 0:
        return None

    try:
        client = Tron()  # mainnet
        main_priv   = TronPrivKey(bytes.fromhex(MAIN_WALLET_PRIVATE_KEY))
        dep_priv    = TronPrivKey(bytes.fromhex(deposit_privkey_hex))

        # 1. Отправляем TRX для газа с главного кошелька на депозитный адрес
        trx_txn = (
            client.trx.transfer(MAIN_WALLET_ADDRESS, deposit_address, GAS_TRX_AMOUNT)
            .build()
            .sign(main_priv)
            .broadcast()
        )
        print(f'[SWEEP] Gas TRX отправлен: {trx_txn["txid"][:16]}... ({GAS_TRX_AMOUNT/1_000_000} TRX)')
        time.sleep(4)  # ждём попадания в блок

        # 2. Свипаем USDT с депозитного адреса на главный
        contract  = client.get_contract(USDT_CONTRACT)
        usdt_txn  = (
            contract.functions.transfer(MAIN_WALLET_ADDRESS, amount_usdt_raw)
            .with_owner(deposit_address)
            .fee_limit(30_000_000)  # 30 TRX лимит
            .build()
            .sign(dep_priv)
            .broadcast()
        )
        txid = usdt_txn['txid']
        print(f'[SWEEP] USDT своён на главный: {txid[:16]}... (${amount_usdt_raw/1_000_000:.2f})')
        return txid

    except Exception as e:
        print(f'[SWEEP] Ошибка свипа: {e}')
        return None

# ── TRONGRID API ─────────────────────────────────────────────────────────────
def trongrid_get(path):
    url = TRONGRID_BASE + path
    req = urllib.request.Request(url, headers={
        'User-Agent': 'zone51-crypto-monitor/1.0',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f'[CRYPTO] TronGrid error: {e}')
        return None

def get_usdt_txs(address):
    """Возвращает последние USDT TRC-20 транзакции на адрес."""
    data = trongrid_get(
        f'/v1/accounts/{address}/transactions/trc20'
        f'?contract_address={USDT_CONTRACT}&limit=20&order_by=block_timestamp,desc'
    )
    if data and isinstance(data.get('data'), list):
        return data['data']
    return []

def check_payment(deposit):
    """
    Проверяет, пришла ли оплата на адрес депозита.
    Возвращает tx_hash если найдено, иначе None.
    Допускает ±2% погрешность (комиссии сети).
    """
    txs = get_usdt_txs(deposit['address'])
    expected_min = int(float(deposit['amountUSD']) * 1_000_000 * 0.98)  # USDT = 6 знаков, -2%

    for tx in txs:
        try:
            token_info = tx.get('token_info', {})
            # Только USDT контракт
            if token_info.get('address') != USDT_CONTRACT:
                continue
            # Только входящие на наш адрес
            if tx.get('to') != deposit['address']:
                continue
            # Достаточная сумма
            value = int(tx.get('value', '0'))
            if value < expected_min:
                continue
            # Подтверждённая транзакция
            if not tx.get('block_timestamp'):
                continue
            tx_id = tx.get('transaction_id') or tx.get('txID', '')
            if not tx_id:
                continue
            return tx_id
        except Exception:
            continue
    return None

# ── INTERNAL API CALLS ───────────────────────────────────────────────────────
def api_call(path, payload):
    url  = API_BASE + path
    body = json.dumps(payload).encode('utf-8')
    req  = urllib.request.Request(url, data=body, headers={
        'Content-Type':     'application/json',
        'x-internal-secret': INTERNAL_SECRET,
    }, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f'[CRYPTO] API call {path} error: {e}')
        return None

def fetch_pending_deposits():
    url = API_BASE + '/internal/deposits/pending'
    req = urllib.request.Request(url, headers={'x-internal-secret': INTERNAL_SECRET})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode('utf-8'))
            return data.get('deposits', [])
    except Exception as e:
        print(f'[CRYPTO] Fetch pending error: {e}')
        return []

# ── POLL LOOP ─────────────────────────────────────────────────────────────────
def poll_loop():
    print('[CRYPTO] TRC-20 мониторинг запущен...')
    while True:
        time.sleep(POLL_INTERVAL)
        try:
            deposits = fetch_pending_deposits()
            if not deposits:
                continue
            print(f'[CRYPTO] Проверяю {len(deposits)} ожидающих депозит(ов)...')
            for dep in deposits:
                tx_hash = check_payment(dep)
                if tx_hash:
                    print(f'[CRYPTO] ✓ Платёж найден! deposit={dep["id"]} tx={tx_hash[:16]}...')
                    result = api_call('/internal/deposit/confirm', {
                        'depositId': dep['id'],
                        'txHash':    tx_hash,
                    })
                    if result and result.get('ok'):
                        print(f'[CRYPTO] ✓ Баланс зачислен: ${dep["amountUSD"]} → user={dep["userId"]}')
                        # Авто-свип: переводим USDT на главный кошелёк
                        if SWEEP_ENABLED and dep.get('privateKey'):
                            amount_raw = int(float(dep['amountUSD']) * 1_000_000)
                            threading.Thread(
                                target=sweep_usdt,
                                args=(dep['address'], dep['privateKey'], amount_raw),
                                daemon=True
                            ).start()
                    else:
                        print(f'[CRYPTO] ✗ Ошибка зачисления: {result}')
        except Exception as e:
            print(f'[CRYPTO] Poll error: {e}')

# ── HTTP SERVER ───────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # Отключаем стандартные логи

    def _json(self, code, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            self._json(200, {'ok': True, 'tronpy': TRONPY_OK, 'poll_interval': POLL_INTERVAL})
        else:
            self._json(404, {'ok': False, 'error': 'Not found'})

    def do_POST(self):
        if self.path == '/generate':
            try:
                result = generate_tron_address()
                self._json(200, {'ok': True, **result})
            except RuntimeError as e:
                self._json(503, {'ok': False, 'error': str(e)})
            except Exception as e:
                print(f'[CRYPTO] generate error: {e}')
                self._json(500, {'ok': False, 'error': 'Address generation failed'})
        else:
            self._json(404, {'ok': False, 'error': 'Not found'})


if __name__ == '__main__':
    # Сначала проверяем tronpy
    if not TRONPY_OK:
        print('[CRYPTO] Устанавливаю tronpy...')
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'tronpy', '-q'], check=False)
        try:
            from tronpy.keys import PrivateKey as TronPrivKey
            TRONPY_OK = True
            print('[CRYPTO] ✓ tronpy установлен')
        except ImportError:
            print('[CRYPTO] ✗ Не удалось установить tronpy. Генерация адресов недоступна.')

    # Запускаем poll loop в фоне
    t = threading.Thread(target=poll_loop, daemon=True)
    t.start()

    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'[CRYPTO] Сервис запущен на порту {PORT}')
    print(f'[CRYPTO] tronpy: {"OK" if TRONPY_OK else "недоступен"}')
    server.serve_forever()
