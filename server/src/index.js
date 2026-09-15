'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Fastify = require('fastify');
const bcrypt  = require('bcrypt');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });
const app = Fastify({ logger: false });

// ── HELPERS ──────────────────────────────────────────────────────────────────
// Shared secret used for all server → bot inter-service calls
const INTERNAL_HEADERS = {
  'Content-Type': 'application/json',
  'x-internal-secret': process.env.INTERNAL_SECRET,
};

function internalFetch(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: INTERNAL_HEADERS,
    body: JSON.stringify(body),
  }).catch(() => {});
}

function internalGet(url) {
  return fetch(url, { headers: INTERNAL_HEADERS }).then(r => r.json()).catch(() => null);
}

// ── PLUGINS ──────────────────────────────────────────────────────────────────
app.register(require('@fastify/cors'), {
  // Allow requests from configured frontend URL, any localhost port, and file://
  origin: (origin, cb) => {
    const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!origin || origin === allowed || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  credentials: true,
});

app.register(require('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
});

app.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
  sign:   { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
});

// Global rate limit — generous for game traffic
app.register(require('@fastify/rate-limit'), {
  max: 60,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
});

// ── AUTH DECORATOR ────────────────────────────────────────────────────────────
app.decorate('authenticate', async function (req, reply) {
  try {
    await req.jwtVerify();
    const session = await prisma.session.findUnique({
      where: { id: req.user.sessionId },
    });
    if (!session || session.expiresAt < new Date()) {
      return reply.code(401).send({ ok: false, error: 'Session expired' });
    }
  } catch {
    return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  }
});

// ── ROUTE HELPERS ────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12;
const SESSION_DAYS  = 7;

function sessionExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d;
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

// Health
app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));

// ── AUTH ──────────────────────────────────────────────────────────────────────

// Stricter rate limit for auth endpoints: 10 requests per minute per IP
const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

// GET /ref/banner?ref=CODE — public, returns creative info for the referral banner
app.get('/ref/banner', async (req, reply) => {
  const ref = (req.query.ref || '').trim().toUpperCase().slice(0, 32);
  if (!ref) return { ok: true, banner: null };
  const data = await internalGet(
    `http://localhost:${process.env.REF_BOT_PORT || 8769}/ref/banner?ref=${encodeURIComponent(ref)}`
  );
  return { ok: true, banner: data ? (data.banner || null) : null };
});

// POST /ref/promo/claim — user activates a promo code
app.post('/ref/promo/claim', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['code'],
      properties: { code: { type: 'string', maxLength: 32 } },
    },
  },
}, async (req, reply) => {
  const { code } = req.body;
  let result = null;
  try {
    const resp = await internalFetch(
      `http://localhost:${process.env.REF_BOT_PORT || 8769}/ref/promo/claim`,
      { code: code.trim().toUpperCase(), uid: req.user.userId, username: req.user.username }
    );
    if (resp) result = await resp.json();
  } catch(e) {}
  if (!result || !result.ok) {
    return reply.code(result ? 409 : 500).send({ ok: false, error: result ? result.error : 'server error' });
  }
  return { ok: true, freespins: result.freespins, deposit_bonus_pct: result.deposit_bonus_pct };
});

// POST /auth/register
app.post('/auth/register', {
  ...authRateLimit,
  schema: {
    body: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 64 },
        email:    { type: 'string', format: 'email', maxLength: 120 },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        ref:      { type: 'string', maxLength: 32 },
      },
    },
  },
}, async (req, reply) => {
  const { username, email, password, ref } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return reply.code(409).send({ ok: false, error: 'Username or email already taken.' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt: sessionExpiry() },
  });

  const token = app.jwt.sign({ userId: user.id, username: user.username, sessionId: session.id });

  // Notify admin bot (authenticated with internal secret)
  internalFetch(`http://localhost:${process.env.ADMIN_BOT_PORT || 8767}/register`,
    { username: user.username, email: user.email, uid: user.id });

  // Register referral if ref code provided
  if (ref) {
    internalFetch(`http://localhost:${process.env.REF_BOT_PORT || 8769}/ref/register`,
      { ref_code: ref, uid: user.id, username: user.username });
  }

  return reply.code(201).send({
    ok: true,
    token,
    user: { id: user.id, username: user.username, email: user.email, balance: Number(user.balance) },
  });
});

// POST /auth/login
app.post('/auth/login', {
  ...authRateLimit,
  schema: {
    body: {
      type: 'object',
      required: ['login', 'password'],
      properties: {
        login:    { type: 'string', maxLength: 120 },
        password: { type: 'string', maxLength: 128 },
      },
    },
  },
}, async (req, reply) => {
  const { login, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: login }, { username: login }] },
  });
  if (!user) {
    return reply.code(401).send({ ok: false, error: 'Invalid credentials.' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return reply.code(401).send({ ok: false, error: 'Invalid credentials.' });
  }

  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt: sessionExpiry() },
  });

  const token = app.jwt.sign({ userId: user.id, username: user.username, sessionId: session.id });

  return {
    ok: true,
    token,
    user: { id: user.id, username: user.username, email: user.email, balance: Number(user.balance) },
  };
});

// POST /auth/logout
app.post('/auth/logout', { preHandler: [app.authenticate] }, async (req) => {
  await prisma.session.delete({ where: { id: req.user.sessionId } });
  return { ok: true };
});

// GET /auth/me
app.get('/auth/me', { preHandler: [app.authenticate] }, async (req) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return { ok: false, error: 'User not found' };
  return {
    ok: true,
    user: { id: user.id, username: user.username, email: user.email, balance: Number(user.balance) },
  };
});

// ── BALANCE ───────────────────────────────────────────────────────────────────

// GET /balance
app.get('/balance', { preHandler: [app.authenticate] }, async (req) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { balance: true },
  });
  return { ok: true, balance: Number(user.balance) };
});

// POST /balance/set  (used by games — signed request)
app.post('/balance/set', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['balance'],
      properties: {
        balance: { type: 'number', minimum: 0 },
      },
    },
  },
}, async (req, reply) => {
  const { balance } = req.body;
  const updated = await prisma.user.update({
    where:  { id: req.user.userId },
    data:   { balance: balance },
    select: { balance: true },
  });
  return { ok: true, balance: Number(updated.balance) };
});

// POST /balance/deduct  (atomic: subtract amount, reject if insufficient)
app.post('/balance/deduct', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'number', minimum: 0.01 },
      },
    },
  },
}, async (req, reply) => {
  const { amount } = req.body;
  // Atomic check-and-deduct using a raw query to avoid race conditions
  const result = await prisma.$queryRaw`
    UPDATE "User" SET balance = balance - ${amount}
    WHERE id = ${req.user.userId} AND balance >= ${amount}
    RETURNING balance
  `;
  if (!result || result.length === 0) {
    return reply.code(400).send({ ok: false, error: 'Insufficient balance' });
  }
  return { ok: true, balance: Number(result[0].balance) };
});

// POST /balance/credit  (atomic: add amount to balance)
app.post('/balance/credit', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'number', minimum: 0.01 },
      },
    },
  },
}, async (req, reply) => {
  const { amount } = req.body;
  const updated = await prisma.user.update({
    where:  { id: req.user.userId },
    data:   { balance: { increment: amount } },
    select: { balance: true },
  });
  return { ok: true, balance: Number(updated.balance) };
});

// POST /balance/beacon — used by navigator.sendBeacon on page-unload.
// sendBeacon cannot set custom headers, so we accept the JWT in the JSON body.
// Intentionally unauthenticated at the route-decorator level; we verify the
// token manually so an invalid token returns 200 (sendBeacon ignores response).
app.post('/balance/beacon', async (req, reply) => {
  try {
    const body = req.body || {};
    const token = body.token;
    const balance = Number(body.balance);
    if (!token || !Number.isFinite(balance) || balance < 0) {
      return { ok: false };
    }
    const decoded = await app.jwt.verify(token);
    if (!decoded || !decoded.userId) return { ok: false };
    await prisma.user.update({
      where: { id: decoded.userId },
      data:  { balance: balance },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false };
  }
});

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

// GET /transactions
app.get('/transactions', { preHandler: [app.authenticate] }, async (req) => {
  const txns = await prisma.transaction.findMany({
    where:   { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    take:    100,
  });
  return {
    ok: true,
    transactions: txns.map(t => ({
      id:        t.id,
      type:      t.type,
      method:    t.method,
      amount:    Number(t.amount),
      status:    t.status,
      wallet:    t.wallet,
      createdAt: t.createdAt.toISOString(),
    })),
  };
});

// POST /transactions/deposit
app.post('/transactions/deposit', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['amount', 'method'],
      properties: {
        amount: { type: 'number', minimum: 1 },
        method: { type: 'string', maxLength: 64 },
      },
    },
  },
}, async (req, reply) => {
  const { amount, method } = req.body;

  // Create PENDING transaction — balance credited only after admin approval
  const txn = await prisma.transaction.create({
    data: {
      userId: req.user.userId,
      type:   'deposit',
      method,
      amount,
      status: 'pending',
    },
  });

  // Notify admin bot — admin approves/denies via inline buttons
  internalFetch(`http://localhost:${process.env.ADMIN_BOT_PORT || 8767}/deposit`, {
    txnId:    txn.id,
    username: req.user.username,
    uid:      req.user.userId,
    amount,
    method,
  });

  return {
    ok: true,
    transaction: {
      id:     txn.id,
      type:   txn.type,
      method: txn.method,
      amount: Number(txn.amount),
      status: txn.status,
      createdAt: txn.createdAt.toISOString(),
    },
  };
});

// POST /internal/deposit/:id/approve  (called by admin_bot when deposit is approved)
app.post('/internal/deposit/:id/approve', async (req, reply) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(403).send({ ok: false });
  }
  const txn = await prisma.transaction.findUnique({
    where:  { id: req.params.id },
    select: { id: true, userId: true, amount: true, status: true, method: true },
  });
  if (!txn) return reply.code(404).send({ ok: false, error: 'Not found' });
  if (txn.status !== 'pending') return reply.code(409).send({ ok: false, error: 'Not pending' });

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where:  { id: txn.userId },
      data:   { balance: { increment: Number(txn.amount) } },
      select: { balance: true, username: true },
    }),
    prisma.transaction.update({
      where: { id: txn.id },
      data:  { status: 'confirmed' },
    }),
  ]);

  // Check for referral deposit bonus
  let bonusAmount = 0;
  try {
    const userInfo = await prisma.user.findUnique({
      where:  { id: txn.userId },
      select: { username: true },
    });
    const refResp = await internalFetch(
      `http://localhost:${process.env.REF_BOT_PORT || 8769}/ref/deposit`,
      { uid: txn.userId, username: userInfo?.username || '', amount: Number(txn.amount) }
    );
    if (refResp) {
      const refData = await refResp.json().catch(() => null);
      if (refData && refData.bonus_amount > 0) {
        bonusAmount = refData.bonus_amount;
        await prisma.user.update({
          where: { id: txn.userId },
          data:  { balance: { increment: bonusAmount } },
        });
      }
    }
  } catch(e) {}

  return { ok: true, balance: Number(user.balance) + bonusAmount, bonus: bonusAmount };
});

// POST /internal/deposit/:id/deny  (called by admin_bot when deposit is denied)
app.post('/internal/deposit/:id/deny', async (req, reply) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(403).send({ ok: false });
  }
  const txn = await prisma.transaction.findUnique({
    where:  { id: req.params.id },
    select: { id: true, status: true },
  });
  if (!txn) return reply.code(404).send({ ok: false, error: 'Not found' });
  if (txn.status !== 'pending') return reply.code(409).send({ ok: false, error: 'Not pending' });
  await prisma.transaction.update({
    where: { id: txn.id },
    data:  { status: 'denied' },
  });
  return { ok: true };
});

// ── CRYPTO DEPOSIT ────────────────────────────────────────────────────────────

// POST /transactions/deposit/crypto/init
// Создаёт уникальный USDT TRC-20 адрес для депозита
app.post('/transactions/deposit/crypto/init', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount:   { type: 'number', minimum: 1, maximum: 50000 },
        currency: { type: 'string', default: 'USDT_TRC20' },
      },
    },
  },
}, async (req, reply) => {
  const { amount, currency = 'USDT_TRC20' } = req.body;

  // Генерируем адрес через crypto_monitor
  let address, privateKey;
  try {
    const r = await fetch('http://localhost:8768/generate', { method: 'POST', signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || 'generation failed');
    address    = data.address;
    privateKey = data.privateKey;
  } catch (e) {
    return reply.code(503).send({ ok: false, error: 'Crypto service unavailable: ' + e.message });
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 минут

  const deposit = await prisma.cryptoDeposit.create({
    data: {
      userId:    req.user.userId,
      address,
      privateKey,
      currency,
      amountUSD: amount,
      status:    'pending',
      expiresAt,
    },
  });

  return {
    ok: true,
    deposit: {
      id:        deposit.id,
      address:   deposit.address,
      currency:  deposit.currency,
      amountUSD: Number(deposit.amountUSD),
      expiresAt: deposit.expiresAt.toISOString(),
    },
  };
});

// GET /transactions/deposit/:id/crypto-status  (polling by frontend)
app.get('/transactions/deposit/:id/crypto-status', { preHandler: [app.authenticate] }, async (req, reply) => {
  const dep = await prisma.cryptoDeposit.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
    select: { status: true, txHash: true, amountUSD: true },
  });
  if (!dep) return reply.code(404).send({ ok: false, error: 'Not found' });
  return { ok: true, status: dep.status, txHash: dep.txHash, amountUSD: Number(dep.amountUSD) };
});

// GET /internal/deposits/pending  (called by crypto_monitor.py)
app.get('/internal/deposits/pending', async (req, reply) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(403).send({ ok: false });
  }
  const deposits = await prisma.cryptoDeposit.findMany({
    where:  { status: 'pending', expiresAt: { gt: new Date() } },
    select: { id: true, address: true, privateKey: true, amountUSD: true, userId: true },
  });
  return { ok: true, deposits: deposits.map(d => ({ ...d, amountUSD: Number(d.amountUSD) })) };
});

// POST /internal/deposit/confirm  (called by crypto_monitor.py when payment detected)
app.post('/internal/deposit/confirm', {
  schema: {
    body: {
      type: 'object',
      required: ['depositId', 'txHash'],
      properties: {
        depositId: { type: 'string' },
        txHash:    { type: 'string' },
      },
    },
  },
}, async (req, reply) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(403).send({ ok: false });
  }
  const { depositId, txHash } = req.body;
  const dep = await prisma.cryptoDeposit.findUnique({ where: { id: depositId } });
  if (!dep)                     return reply.code(404).send({ ok: false, error: 'Not found' });
  if (dep.status !== 'pending') return reply.code(409).send({ ok: false, error: `Already ${dep.status}` });

  const amount = Number(dep.amountUSD);
  const method = dep.currency === 'USDT_TRC20' ? 'USDT TRC-20' : dep.currency;

  await prisma.$transaction([
    prisma.cryptoDeposit.update({
      where: { id: depositId },
      data:  { status: 'confirmed', txHash, confirmedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: dep.userId },
      data:  { balance: { increment: amount } },
    }),
    prisma.transaction.create({
      data: { userId: dep.userId, type: 'deposit', method, amount, status: 'confirmed' },
    }),
  ]);

  console.log(`[API] Crypto deposit confirmed: ${depositId} | $${amount} | tx: ${txHash}`);

  // Notify referral bot — also checks for promo deposit bonus
  try {
    const refResp = await internalFetch(
      `http://localhost:${process.env.REF_BOT_PORT || 8769}/ref/deposit`,
      { uid: dep.userId, username: dep.userId, amount }
    );
    if (refResp) {
      const refData = await refResp.json().catch(() => null);
      if (refData && refData.bonus_amount > 0) {
        await prisma.user.update({
          where: { id: dep.userId },
          data:  { balance: { increment: refData.bonus_amount } },
        });
      }
    }
  } catch(e) {}

  return { ok: true };
});

// POST /transactions/withdraw
app.post('/transactions/withdraw', {
  preHandler: [app.authenticate],
  schema: {
    body: {
      type: 'object',
      required: ['amount', 'method'],
      properties: {
        amount: { type: 'number', minimum: 1 },
        method: { type: 'string', maxLength: 64 },
        wallet: { type: 'string', maxLength: 200 },
        memo:   { type: 'string', maxLength: 100 },
      },
    },
  },
}, async (req, reply) => {
  const { amount, method, wallet, memo } = req.body;

  const current = await prisma.user.findUnique({
    where:  { id: req.user.userId },
    select: { balance: true },
  });
  if (Number(current.balance) < amount) {
    return reply.code(400).send({ ok: false, error: 'Insufficient funds.' });
  }

  const [user, txn] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.user.userId },
      data:  { balance: { decrement: amount } },
      select: { balance: true },
    }),
    prisma.transaction.create({
      data: {
        userId: req.user.userId,
        type:   'withdrawal',
        method,
        amount,
        status: 'pending',
        wallet: wallet || null,
      },
    }),
  ]);

  // Notify admin bot (authenticated with internal secret)
  internalFetch(`http://localhost:${process.env.ADMIN_BOT_PORT || 8767}/withdraw`, {
    txnId:    txn.id,
    username: req.user.username,
    uid:      req.user.userId,
    amount,
    method,
    wallet:   wallet || '',
    memo:     memo   || '',
    balance:  Number(user.balance),
  });

  return {
    ok:      true,
    balance: Number(user.balance),
    transaction: {
      id:     txn.id,
      type:   txn.type,
      method: txn.method,
      amount: Number(txn.amount),
      status: txn.status,
      wallet: txn.wallet,
      createdAt: txn.createdAt.toISOString(),
    },
  };
});

// GET /transactions/:id/status  (polled by frontend for withdrawal)
app.get('/transactions/:id/status', { preHandler: [app.authenticate] }, async (req, reply) => {
  const txn = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user.userId },
    select: { status: true },
  });
  if (!txn) return reply.code(404).send({ ok: false, error: 'Not found' });
  return { ok: true, status: txn.status };
});

// ── ADMIN BOT WEBHOOK — update withdrawal status ──────────────────────────────
// Called by admin_bot.py after approve/deny.
// Protected by a shared secret passed as a header.
app.post('/internal/withdrawal/:id/status', {
  schema: {
    body: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['approved', 'denied'] },
      },
    },
  },
}, async (req, reply) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(403).send({ ok: false, error: 'Forbidden' });
  }

  const txn = await prisma.transaction.findUnique({ where: { id: req.params.id } });
  if (!txn) return reply.code(404).send({ ok: false, error: 'Not found' });
  if (txn.status !== 'pending') {
    return reply.code(409).send({ ok: false, error: `Already ${txn.status}` });
  }

  await prisma.transaction.update({
    where: { id: req.params.id },
    data:  { status: req.body.status },
  });

  // If denied — refund balance
  if (req.body.status === 'denied') {
    await prisma.user.update({
      where: { id: txn.userId },
      data:  { balance: { increment: Number(txn.amount) } },
    });
  }

  return { ok: true };
});

// ── TG TRACKER PROXY ─────────────────────────────────────────────────────────
// Accepts structured events from the frontend and forwards to Telegram.
// The bot token never reaches the browser.
const _TG_TRACKER_TOKEN = process.env.TRACKER_TG_TOKEN;
const _TG_TRACKER_CHAT  = process.env.TRACKER_TG_CHAT  || '-1003966556584';
const _TG_TRACKER_URL   = _TG_TRACKER_TOKEN
  ? `https://api.telegram.org/bot${_TG_TRACKER_TOKEN}/sendMessage`
  : null;

app.post('/api/track', {
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  schema: {
    body: {
      type: 'object',
      required: ['html'],
      properties: {
        html: { type: 'string', minLength: 1, maxLength: 4096 },
      },
    },
  },
}, async (req) => {
  if (!_TG_TRACKER_URL) return { ok: false, error: 'tracker not configured' };
  // Fire-and-forget — frontend doesn't need to wait for TG
  fetch(_TG_TRACKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:                  _TG_TRACKER_CHAT,
      text:                     req.body.html,
      parse_mode:               'HTML',
      disable_web_page_preview: true,
    }),
  }).catch(() => {});
  return { ok: true };
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`[API] Zone 51 backend running → http://localhost:${PORT}`);
});
