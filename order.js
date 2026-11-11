// REAL ORDER (bKash / Nagad / Rocket) — Netlify Function.
// Set BOT_TOKEN and CHAT_ID in Netlify Environment Variables.
// IMPORTANT: this function can only check the *format* of a TrxID. It cannot confirm that money
// was received (that needs the bKash merchant API or a manual check in your wallet app), so every
// order is sent to Telegram marked UNVERIFIED and must be checked by you before sending the files.
const BOT = process.env.BOT_TOKEN;
const CHAT = process.env.CHAT_ID;

const TRX_RULES = {
  'বিকাশ': (t) => /^[A-Z0-9]{10}$/.test(t) && /[A-Z]/.test(t) && /[0-9]/.test(t) && new Set(t).size >= 5,
  'নগদ': (t) => /^[A-Z0-9]{8,12}$/.test(t) && new Set(t).size >= 4,
  'রকেট': (t) => /^[A-Z0-9]{8,12}$/.test(t) && new Set(t).size >= 4,
};

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return reply(405, { ok: false, error: 'method_not_allowed' });
  if (!BOT || !CHAT) {
    console.error('Missing BOT_TOKEN or CHAT_ID environment variable');
    return reply(500, { ok: false, error: 'server_not_configured' });
  }
  try {
    const d = JSON.parse(event.body || '{}');
    const clean = (key) => String(d[key] || '').replace(/<[^>]*>/g, '').trim().slice(0, 120);
    const name = clean('name'), email = clean('email'), phone = clean('phone');
    const method = clean('method'), trx = clean('trx').replace(/\s+/g, '').toUpperCase();
    if (d.website || !name || !/^\S+@\S+\.\S+$/.test(email) || !/^01\d{9}$/.test(phone) || !TRX_RULES[method]) {
      return reply(422, { ok: false, error: 'invalid_data' });
    }
    if (!TRX_RULES[method](trx)) return reply(422, { ok: false, error: 'invalid_trx' });

    const message = `🛒 নতুন অর্ডার (REAL) - Digital Shop\n⚠️ পেমেন্ট এখনো যাচাই হয়নি (UNVERIFIED) — ফাইল পাঠানোর আগে ${method} অ্যাপে TrxID মিলিয়ে নিন\n\n👤 নাম: ${name}\n📧 জিমেইল: ${email}\n📱 ফোন: ${phone}\n💳 মেথড: ${method}\n🧾 TrxID: ${trx}\n💰 পরিমাণ: 99৳\n🕒 ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}`;
    const response = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text: message })
    });
    const telegram = await response.json();
    if (!response.ok || !telegram.ok) {
      console.error('Telegram sendMessage failed');
      return reply(502, { ok: false, error: 'notification_failed' });
    }
    return reply(200, { ok: true, verified: false });
  } catch (error) {
    console.error('Order function error:', error.message);
    return reply(400, { ok: false, error: 'bad_request' });
  }
};
