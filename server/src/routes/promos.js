const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const promos = await prisma.promo.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(promos);
});

router.post('/check', async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Promo kod kerak' });

  const promo = await prisma.promo.findUnique({ where: { code: code.toUpperCase() } });
  if (!promo || !promo.active) return res.status(404).json({ error: 'Promo kod topilmadi' });
  if (promo.expires && new Date(promo.expires) < new Date()) return res.status(400).json({ error: 'Promo kod muddati tugagan' });
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Promo kod limiti tugagan' });
  if (orderTotal < promo.minOrder) return res.status(400).json({ error: `Minimal buyurtma summasi: ${promo.minOrder}` });

  res.json({ code: promo.code, type: promo.type, discount: promo.discount });
});

router.post('/', requireAuth, async (req, res) => {
  const { code, type, discount, minOrder, maxUses, expires, active } = req.body;
  if (!code || !type || discount == null) return res.status(400).json({ error: 'code, type, discount kerak' });
  try {
    const promo = await prisma.promo.create({
      data: { code: code.toUpperCase(), type, discount, minOrder: minOrder || 0, maxUses: maxUses || 0, expires, active: active ?? true },
    });
    res.status(201).json(promo);
  } catch {
    res.status(400).json({ error: 'Kod band yoki xato' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { discount, minOrder, maxUses, expires, active, type } = req.body;
  try {
    const promo = await prisma.promo.update({
      where: { id: req.params.id },
      data: { discount, minOrder, maxUses, expires, active, type },
    });
    res.json(promo);
  } catch {
    res.status(404).json({ error: 'Promo topilmadi' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.promo.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Promo topilmadi' });
  }
});

module.exports = router;
