const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const fmt = n => new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';

async function notifyNewOrder(order, productMap) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const lines = order.items.map(i => {
    const p = productMap[i.productId];
    const name = p ? p.name : i.productId;
    const size = i.size ? `, o'lcham: ${i.size}` : '';
    return `• ${name} × ${i.qty}${size}`;
  });

  const text = [
    '🛒 <b>YANGI BUYURTMA</b>',
    '',
    `👤 Mijoz: <b>${order.customer}</b>`,
    `📞 Tel: ${order.phone}`,
    `📍 Manzil: ${order.address}`,
    '',
    '<b>Mahsulotlar:</b>',
    ...lines,
    '',
    order.promoCode ? `🎟 Promo: ${order.promoCode}` : null,
    `💰 Jami: <b>${fmt(order.total)}</b>`,
    `🆔 Buyurtma: ${order.id.slice(0, 8).toUpperCase()}`,
  ].filter(l => l !== null).join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });
    if (!res.ok) console.error('Telegram xato:', await res.text());
  } catch (err) {
    console.error('Telegram yuborilmadi:', err.message);
  }
}

module.exports = { notifyNewOrder };
