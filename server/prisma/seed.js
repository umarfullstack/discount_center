const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Ko'ylaklar", slug: 'shirts' },
  { name: 'Kurtkalar', slug: 'jackets' },
  { name: 'Shimlar', slug: 'trousers' },
  { name: 'Aksessuarlar', slug: 'accessories' },
  { name: 'Trikotaj', slug: 'knitwear' },
];

const PRODUCTS_BY_SLUG = {
  shirts: [
    { name: "Tikuvchi Oxford Ko'ylagi", price: 890000, image: 'https://images.unsplash.com/photo-1760128761565-c0d779481070?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.8, reviewCount: 124, isNew: true, colors: ['#FFFFFF', '#1B2D4F', '#6B7B8D', '#1A1A1A'], stock: 45 },
    { name: "Ko'k Oxford Rasmiy Ko'ylagi", price: 950000, image: 'https://images.unsplash.com/photo-1732605559386-bc59426d1b16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.5, reviewCount: 108, colors: ['#1B2D4F', '#FFFFFF', '#6B7B8D'], stock: 53 },
  ],
  jackets: [
    { name: 'Klassik Jun Blazer', price: 2450000, originalPrice: 2900000, image: 'https://images.unsplash.com/photo-1754485115876-9221149ccc19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.9, reviewCount: 87, isSale: true, colors: ['#1A1A1A', '#6B5A4E', '#1B2D4F'], stock: 18 },
    { name: 'Ikki Qatorli Palto', price: 3850000, image: 'https://images.unsplash.com/photo-1627906933655-906bde7d79e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 5.0, reviewCount: 42, isNew: true, colors: ['#1A1A1A', '#6B5A4E'], stock: 12 },
  ],
  trousers: [
    { name: 'Slim-Fit Chino Shimlari', price: 1190000, image: 'https://images.unsplash.com/photo-1760433468572-44d1cf0b8641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.6, reviewCount: 93, colors: ['#C9A96E', '#1A1A1A', '#8B8B8B'], stock: 32 },
    { name: 'Burmalangan Rasmiy Shimlar', price: 1350000, image: 'https://images.unsplash.com/photo-1493357335960-4583bfa6f8d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.4, reviewCount: 55, colors: ['#8B8B8B', '#1A1A1A', '#1B2D4F'], stock: 21 },
  ],
  accessories: [
    { name: 'Premium Charm Kamar', price: 580000, image: 'https://images.unsplash.com/photo-1631160246898-58192f971b5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.6, reviewCount: 79, colors: ['#1A1A1A', '#8B5A2B'], stock: 64 },
  ],
  knitwear: [
    { name: 'Merino Yuqori Yoqali Trikotaj', price: 1650000, image: 'https://images.unsplash.com/photo-1686704814231-ef0474eea7f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600', rating: 4.7, reviewCount: 61, isNew: true, colors: ['#C9A96E', '#FFFFFF', '#1A1A1A', '#8B7355'], stock: 27 },
  ],
};

const PROMOS = [
  { code: 'NOVUS10', type: 'percent', discount: 10, minOrder: 0, maxUses: 0, active: true },
  { code: 'YANGI20', type: 'percent', discount: 20, minOrder: 500000, maxUses: 50, active: true },
  { code: 'BEPUL', type: 'fixed', discount: 50000, minOrder: 300000, maxUses: 100, active: false, expires: new Date('2026-05-31') },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@novushomme.uz';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: await bcrypt.hash(adminPassword, 10) },
  });

  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });

    for (const p of PRODUCTS_BY_SLUG[cat.slug] || []) {
      const existing = await prisma.product.findFirst({ where: { name: p.name } });
      if (!existing) {
        await prisma.product.create({ data: { ...p, categoryId: category.id, status: 'active' } });
      }
    }
  }

  for (const promo of PROMOS) {
    await prisma.promo.upsert({ where: { code: promo.code }, update: {}, create: promo });
  }

  console.log('Seed tugadi. Admin login:', adminEmail, '/', adminPassword);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
