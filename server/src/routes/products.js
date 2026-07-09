const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/all', requireAuth, async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.json(product);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, price, originalPrice, image, categoryId, stock, rating, reviewCount, colors, isNew, isSale, status } = req.body;
  if (!name || price == null || !categoryId) return res.status(400).json({ error: 'name, price, categoryId kerak' });

  const product = await prisma.product.create({
    data: { name, price, originalPrice, image, categoryId, stock, rating, reviewCount, colors, isNew, isSale, status },
  });
  res.status(201).json(product);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, price, originalPrice, image, categoryId, stock, rating, reviewCount, colors, isNew, isSale, status } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, price, originalPrice, image, categoryId, stock, rating, reviewCount, colors, isNew, isSale, status },
    });
    res.json(product);
  } catch {
    res.status(404).json({ error: 'Mahsulot topilmadi' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Mahsulot topilmadi' });
  }
});

module.exports = router;
