const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function productDataFromBody(body) {
  const price = Number(body.price);
  const stock = Number.parseInt(body.stock, 10);
  const rating = Number(body.rating);
  const reviewCount = Number.parseInt(body.reviewCount, 10);

  return {
    name: String(body.name || '').trim(),
    price,
    originalPrice: body.originalPrice == null || body.originalPrice === '' ? null : Number(body.originalPrice),
    image: body.image || '',
    categoryId: body.categoryId,
    stock: Number.isFinite(stock) ? stock : 0,
    rating: Number.isFinite(rating) ? rating : 4.5,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    colors: Array.isArray(body.colors) && body.colors.length ? body.colors : ['#1A1A1A'],
    isNew: !!body.isNew,
    isSale: !!body.isSale,
    status: body.status === 'draft' ? 'draft' : 'active',
  };
}

function validateProductData(data) {
  if (!data.name || !Number.isFinite(data.price) || !data.categoryId) {
    return 'Nomi, narxi va kategoriyasi kerak';
  }
  if (data.price < 0 || (data.originalPrice != null && (!Number.isFinite(data.originalPrice) || data.originalPrice < 0))) {
    return 'Narx noto\'g\'ri';
  }
  return null;
}

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
  const data = productDataFromBody(req.body);
  const error = validateProductData(data);
  if (error) return res.status(400).json({ error });

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return res.status(400).json({ error: 'Kategoriya topilmadi' });

  try {
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err) {
    console.error('Product create error:', err);
    res.status(500).json({ error: 'Mahsulotni saqlashda xato yuz berdi' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const data = productDataFromBody(req.body);
  const error = validateProductData(data);
  if (error) return res.status(400).json({ error });

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return res.status(400).json({ error: 'Kategoriya topilmadi' });

  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
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
