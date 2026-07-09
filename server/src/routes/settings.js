const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res) => {
  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
  res.json({
    storeName: settings.storeName,
    storeTagline: settings.storeTagline,
    currency: settings.currency,
    freeShippingThreshold: settings.freeShippingThreshold,
    shippingCost: settings.shippingCost,
  });
});

router.get('/', requireAuth, async (req, res) => {
  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
  res.json(settings);
});

router.put('/', requireAuth, async (req, res) => {
  const { storeName, storeTagline, email, phone, address, currency, lang, freeShippingThreshold, shippingCost } = req.body;
  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: { storeName, storeTagline, email, phone, address, currency, lang, freeShippingThreshold, shippingCost },
    create: { id: 'singleton', storeName, storeTagline, email, phone, address, currency, lang, freeShippingThreshold, shippingCost },
  });
  res.json(settings);
});

router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak' });

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  const valid = await bcrypt.compare(currentPassword || '', admin.password);
  if (!valid) return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });

  await prisma.admin.update({ where: { id: admin.id }, data: { password: await bcrypt.hash(newPassword, 10) } });
  res.json({ success: true });
});

module.exports = router;
