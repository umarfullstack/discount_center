const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name va slug kerak' });
  try {
    const category = await prisma.category.create({ data: { name, slug } });
    res.status(201).json(category);
  } catch {
    res.status(400).json({ error: 'Slug band yoki xato' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, slug } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug },
    });
    res.json(category);
  } catch {
    res.status(404).json({ error: 'Kategoriya topilmadi' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Kategoriya topilmadi' });
  }
});

module.exports = router;
