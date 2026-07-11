require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const promoRoutes = require('./routes/promos');
const settingsRoutes = require('./routes/settings');

const app = express();
app.use(cors());
// Rasm base64 ko'rinishida JSON ichida keladi — standart 100kb limit yetmaydi
app.use(express.json({ limit: '15mb' }));

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Rasm juda katta. Kichikroq rasm tanlang.' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON formati noto\'g\'ri' });
  }
  console.error('Unhandled API error:', err);
  return res.status(500).json({ error: 'Server xatosi' });
});

app.use((req, res) => res.status(404).json({ error: 'Topilmadi' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API ${PORT}-portda ishlamoqda`));
