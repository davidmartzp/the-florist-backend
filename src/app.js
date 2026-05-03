const express = require('express');
const cors = require('cors');
const packageInfo = require('../package.json');
const authRoutes = require('./routes/auth.routes');
const catalogRoutes = require('./routes/catalog.routes');
const categoryRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const productRoutes = require('./routes/product.routes');
const shippingMethodRoutes = require('./routes/shipping-method.routes');
const tagRoutes = require('./routes/tag.routes');
const userRoutes = require('./routes/user.routes');
const siteProductRoutes = require('./routes/site-product.routes');
const siteCategoryRoutes = require('./routes/site-category.routes');
const siteCheckoutRoutes = require('./routes/site-checkout.routes');
const siteShippingMethodRoutes = require('./routes/site-shipping-method.routes');
const siteCartRoutes = require('./routes/site-cart.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: packageInfo.name,
    version: packageInfo.version,
    description: packageInfo.description,
    author: packageInfo.author || null,
    license: packageInfo.license,
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shipping-methods', shippingMethodRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/site/products', siteProductRoutes);
app.use('/api/site/categories', siteCategoryRoutes);
app.use('/api/site/shipping-methods', siteShippingMethodRoutes);
app.use('/api/site/cart', siteCartRoutes);
app.use('/api/site/checkout', siteCheckoutRoutes);

module.exports = app;
