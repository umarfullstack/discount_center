const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const { notifyNewOrder } = require('../telegram');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.get('/:id', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  res.json(order);
});

router.post('/', async (req, res) => {
  const { customer, email, phone, address, items, promoCode } = req.body;
  if (!customer || !phone || !address || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
  }

  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  let total = 0;
  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) return res.status(400).json({ error: 'Mahsulot topilmadi' });
    total += product.price * item.qty;
  }

  let appliedPromo = null;
  if (promoCode) {
    appliedPromo = await prisma.promo.findUnique({ where: { code: promoCode.toUpperCase() } });
    if (appliedPromo && appliedPromo.active && total >= appliedPromo.minOrder) {
      total = appliedPromo.type === 'percent'
        ? total - (total * appliedPromo.discount) / 100
        : Math.max(0, total - appliedPromo.discount);
    } else {
      appliedPromo = null;
    }
  }

  const order = await prisma.order.create({
    data: {
      customer, email, phone, address, items, total,
      promoCode: appliedPromo ? appliedPromo.code : null,
    },
  });

  if (appliedPromo) {
    await prisma.promo.update({ where: { id: appliedPromo.id }, data: { usedCount: { increment: 1 } } });
  }
  for (const item of items) {
    await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.qty } } });
  }

  notifyNewOrder(order, productMap);

  res.status(201).json(order);
});

router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json(order);
  } catch {
    res.status(404).json({ error: 'Buyurtma topilmadi' });
  }
});

module.exports = router;
