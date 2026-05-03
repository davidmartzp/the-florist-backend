const bcrypt = require('bcryptjs');

const { pool } = require('../src/config/db');
const orderService = require('../src/services/order.service');
const productService = require('../src/services/product.service');

const PERMISSIONS = [
  {
    code: 'USERS',
    name: 'Users',
    description: 'Access to the internal users CRUD module',
  },
  {
    code: 'ORDERS',
    name: 'Orders',
    description: 'Access to the internal orders CRUD module',
  },
  {
    code: 'PRODUCTS',
    name: 'Products',
    description: 'Access to the internal products CRUD module',
  },
];

const USERS = [
  {
    email: 'admin@floreriacolon.local',
    firstName: 'Amalia',
    lastName: 'Colón',
    password: 'Floreria123!',
    permissions: ['USERS', 'ORDERS', 'PRODUCTS'],
  },
  {
    email: 'ventas@floreriacolon.local',
    firstName: 'Lucía',
    lastName: 'Rosas',
    password: 'Ventas123!',
    permissions: ['ORDERS', 'PRODUCTS'],
  },
  {
    email: 'catalogo@floreriacolon.local',
    firstName: 'Mateo',
    lastName: 'Jardín',
    password: 'Catalogo123!',
    permissions: ['PRODUCTS'],
  },
  {
    email: 'operaciones@floreriacolon.local',
    firstName: 'Sara',
    lastName: 'Entrega',
    password: 'Operaciones123!',
    permissions: ['ORDERS'],
  },
];

const CATEGORIES = [
  {
    name: 'Ramos clásicos',
    slug: 'ramos-clasicos',
    description: 'Bouquets tradicionales para regalo inmediato y fechas especiales.',
  },
  {
    name: 'Arreglos premium',
    slug: 'arreglos-premium',
    description: 'Diseños de alto valor con flores importadas, bases y detalles gourmet.',
  },
  {
    name: 'Plantas regalo',
    slug: 'plantas-regalo',
    description: 'Opciones duraderas para oficina, hogar y obsequios corporativos.',
  },
  {
    name: 'Ocasiones especiales',
    slug: 'ocasiones-especiales',
    description: 'Productos versátiles para cumpleaños, aniversarios y celebraciones.',
  },
  {
    name: 'Bodas',
    slug: 'bodas',
    description: 'Ramos y arreglos pensados para ceremonias, novias y eventos.',
  },
  {
    name: 'Condolencias',
    slug: 'condolencias',
    description: 'Diseños sobrios para acompañar homenajes y despedidas.',
  },
  {
    name: 'Corporativo',
    slug: 'corporativo',
    description: 'Arreglos y plantas para oficinas, recepción y clientes empresariales.',
  },
];

const TAGS = [
  { name: 'Rosas', slug: 'rosas' },
  { name: 'Lirios', slug: 'lirios' },
  { name: 'Tulipanes', slug: 'tulipanes' },
  { name: 'Premium', slug: 'premium' },
  { name: 'Plantas', slug: 'plantas' },
  { name: 'Romántico', slug: 'romantico' },
  { name: 'Express', slug: 'express' },
  { name: 'Best seller', slug: 'best-seller' },
  { name: 'Sin IVA', slug: 'sin-iva' },
  { name: 'Condolencias', slug: 'condolencias' },
];

const CATALOGS = [
  {
    name: 'Colección Romance',
    slug: 'coleccion-romance',
    description: 'Selección pensada para aniversarios, propuestas y San Valentín.',
    is_active: true,
  },
  {
    name: 'Madres en Flor',
    slug: 'madres-en-flor',
    description: 'Curaduría de arreglos delicados para homenajear a mamá.',
    is_active: true,
  },
  {
    name: 'Cumpleaños Alegres',
    slug: 'cumpleanos-alegres',
    description: 'Bouquets coloridos y vibrantes para celebraciones memorables.',
    is_active: true,
  },
  {
    name: 'Bodas Jardín',
    slug: 'bodas-jardin',
    description: 'Diseños elegantes para novias, mesas principales y ceremonia.',
    is_active: true,
  },
  {
    name: 'Condolencias Serenas',
    slug: 'condolencias-serenas',
    description: 'Arreglos blancos y verdes para acompañar con respeto.',
    is_active: true,
  },
];

const SHIPPING_METHODS = [
  {
    name: 'Retiro en tienda',
    slug: 'retiro-en-tienda',
    description: 'El cliente recoge el pedido en el punto de venta.',
    price: 0,
    is_active: true,
  },
  {
    name: 'Domicilio Medellín',
    slug: 'domicilio-medellin',
    description: 'Entrega estándar en Medellín y área metropolitana.',
    price: 12000,
    is_active: true,
  },
  {
    name: 'Entrega express',
    slug: 'entrega-express',
    description: 'Entrega prioritaria el mismo día sujeta a cobertura.',
    price: 22000,
    is_active: true,
  },
  {
    name: 'Envío nacional',
    slug: 'envio-nacional',
    description: 'Despacho coordinado fuera del área metropolitana.',
    price: 28000,
    is_active: true,
  },
];

const PRODUCTS = [
  {
    key: 'ramo-12-rosas-rojas',
    payload: {
      name: 'Ramo 12 rosas rojas',
      price: 79000,
      stock: 24,
      hasVat: true,
      vatRate: 19,
      description: 'Doce rosas rojas, eucalipto y lazo satinado para aniversarios y detalles románticos.',
      image: null,
      categorySlugs: ['ramos-clasicos', 'ocasiones-especiales'],
      tagSlugs: ['rosas', 'romantico', 'best-seller', 'express'],
      catalogSlugs: ['coleccion-romance', 'madres-en-flor'],
    },
  },
  {
    key: 'bouquet-primavera-pastel',
    payload: {
      name: 'Bouquet primavera pastel',
      price: 68000,
      stock: 18,
      hasVat: true,
      vatRate: 19,
      description: 'Mezcla de claveles, margaritas, lirios y follajes suaves en tonos pastel.',
      image: null,
      categorySlugs: ['ramos-clasicos', 'ocasiones-especiales'],
      tagSlugs: ['lirios', 'best-seller'],
      catalogSlugs: ['cumpleanos-alegres', 'madres-en-flor'],
    },
  },
  {
    key: 'caja-luxe-24-rosas',
    payload: {
      name: 'Caja luxe 24 rosas y chocolates',
      price: 159000,
      stock: 10,
      hasVat: true,
      vatRate: 19,
      description: 'Caja premium con 24 rosas rojas, chocolates artesanales y tarjeta personalizada.',
      image: null,
      categorySlugs: ['arreglos-premium', 'ocasiones-especiales'],
      tagSlugs: ['rosas', 'premium', 'romantico'],
      catalogSlugs: ['coleccion-romance'],
    },
  },
  {
    key: 'orquidea-blanca',
    payload: {
      name: 'Orquídea blanca en cerámica',
      price: 92000,
      stock: 12,
      hasVat: true,
      vatRate: 19,
      description: 'Orquídea phalaenopsis en base de cerámica blanca para hogar u oficina.',
      image: null,
      categorySlugs: ['plantas-regalo', 'ocasiones-especiales'],
      tagSlugs: ['plantas', 'premium'],
      catalogSlugs: ['madres-en-flor'],
    },
  },
  {
    key: 'centro-girasoles',
    payload: {
      name: 'Centro de mesa girasoles',
      price: 74000,
      stock: 16,
      hasVat: true,
      vatRate: 19,
      description: 'Arreglo alegre con girasoles, solidago y base reutilizable para mesas o recepción.',
      image: null,
      categorySlugs: ['ocasiones-especiales', 'corporativo'],
      tagSlugs: ['best-seller', 'express'],
      catalogSlugs: ['cumpleanos-alegres'],
    },
  },
  {
    key: 'corona-serenidad',
    payload: {
      name: 'Corona serenidad blanca',
      price: 185000,
      stock: 8,
      hasVat: true,
      vatRate: 19,
      description: 'Corona fúnebre con rosas blancas, lirios y follajes verdes de acompañamiento.',
      image: null,
      categorySlugs: ['condolencias'],
      tagSlugs: ['condolencias', 'lirios'],
      catalogSlugs: ['condolencias-serenas'],
    },
  },
  {
    key: 'bouquet-novia-marfil',
    payload: {
      name: 'Bouquet novia marfil',
      price: 145000,
      stock: 6,
      hasVat: true,
      vatRate: 19,
      description: 'Bouquet para novia con rosas crema, lisianthus y acabado elegante en marfil.',
      image: null,
      categorySlugs: ['bodas', 'arreglos-premium'],
      tagSlugs: ['premium', 'lirios'],
      catalogSlugs: ['bodas-jardin'],
    },
  },
  {
    key: 'kit-suculentas-terrazo',
    payload: {
      name: 'Kit suculentas terrazo',
      price: 45000,
      stock: 20,
      hasVat: false,
      vatRate: 0,
      description: 'Set de tres suculentas en materas pequeñas de estilo terrazo para escritorio.',
      image: null,
      categorySlugs: ['plantas-regalo', 'corporativo'],
      tagSlugs: ['plantas', 'sin-iva'],
      catalogSlugs: ['cumpleanos-alegres'],
    },
  },
  {
    key: 'galletas-artesanas',
    payload: {
      name: 'Galletas artesanas',
      price: 22000,
      stock: 50,
      hasVat: true,
      vatRate: 19,
      type: 'COMPLEMENT',
      description: 'Caja de galletas artesanales para acompañar tu arreglo floral con un detalle dulce.',
      image: null,
      categorySlugs: [],
      tagSlugs: ['premium'],
      catalogSlugs: [],
    },
  },
  {
    key: 'base-floral',
    payload: {
      name: 'Base floral',
      price: 18000,
      stock: 40,
      hasVat: true,
      vatRate: 19,
      type: 'COMPLEMENT',
      description: 'Base floral elaborada para extender la vida de tus flores y proteger cualquier superficie.',
      image: null,
      categorySlugs: [],
      tagSlugs: ['premium'],
      catalogSlugs: [],
    },
  },
  {
    key: 'tulipanes-holandeses',
    payload: {
      name: 'Tulipanes holandeses deluxe',
      price: 98000,
      stock: 14,
      hasVat: true,
      vatRate: 19,
      description: 'Ramo de tulipanes importados en tonos intensos con empaque premium.',
      image: null,
      categorySlugs: ['ramos-clasicos', 'arreglos-premium'],
      tagSlugs: ['tulipanes', 'premium', 'romantico'],
      catalogSlugs: ['coleccion-romance', 'cumpleanos-alegres'],
    },
  },
];

const PRODUCT_UPDATES = [
  {
    key: 'ramo-12-rosas-rojas',
    payload: { price: 85000 },
  },
  {
    key: 'bouquet-primavera-pastel',
    payload: { price: 72000 },
  },
  {
    key: 'caja-luxe-24-rosas',
    payload: { price: 169000 },
  },
  {
    key: 'kit-suculentas-terrazo',
    payload: { price: 48000 },
  },
];

const ORDERS = [
  {
    actorEmail: 'admin@floreriacolon.local',
    payload: {
      userId: null,
      customerName: 'Valentina Mejía',
      customerEmail: 'valentina.mejia@example.com',
      customerPhone: '3001234567',
      shippingAddress: 'Cra. 43A #8-21, El Poblado, Medellín',
      includesCard: true,
      cardMessage: 'Feliz aniversario, que siempre florezca nuestro amor.',
      status: 'pending',
      shippingMethodSlug: 'domicilio-medellin',
      includeShippingPrice: true,
      items: [
        { productKey: 'ramo-12-rosas-rojas', quantity: 1 },
        { productKey: 'kit-suculentas-terrazo', quantity: 2 },
      ],
    },
  },
  {
    actorEmail: 'ventas@floreriacolon.local',
    payload: {
      userId: null,
      customerName: 'Tomás Arbeláez',
      customerEmail: 'tomas.arbelaez@example.com',
      customerPhone: '3019988776',
      shippingAddress: 'Cl. 10 #35-14, Laureles, Medellín',
      includesCard: true,
      cardMessage: 'Que tengas un cumpleaños lleno de color.',
      status: 'confirmed',
      shippingMethodSlug: 'entrega-express',
      includeShippingPrice: true,
      shippingPrice: 25000,
      items: [
        { productKey: 'caja-luxe-24-rosas', quantity: 1 },
      ],
    },
  },
  {
    actorEmail: 'operaciones@floreriacolon.local',
    payload: {
      userId: null,
      customerName: 'Marcela Gómez',
      customerEmail: 'marcela.gomez@example.com',
      customerPhone: '3104567788',
      shippingAddress: null,
      includesCard: false,
      cardMessage: null,
      status: 'completed',
      shippingMethodSlug: 'retiro-en-tienda',
      includeShippingPrice: false,
      items: [
        { productKey: 'orquidea-blanca', quantity: 1 },
        { productKey: 'centro-girasoles', quantity: 1 },
      ],
    },
  },
  {
    actorEmail: 'admin@floreriacolon.local',
    payload: {
      userId: null,
      customerName: 'Fundación Luz Serena',
      customerEmail: 'contacto@luzserena.org',
      customerPhone: '6045553322',
      shippingAddress: 'Av. Oriental #52-31, Medellín',
      includesCard: true,
      cardMessage: 'Con profundo respeto y solidaridad.',
      status: 'cancelled',
      shippingMethodSlug: 'domicilio-medellin',
      includeShippingPrice: true,
      items: [
        { productKey: 'corona-serenidad', quantity: 1 },
      ],
    },
  },
  {
    actorEmail: 'ventas@floreriacolon.local',
    payload: {
      userId: null,
      customerName: 'Paula Restrepo',
      customerEmail: 'paula.restrepo@example.com',
      customerPhone: '3152223344',
      shippingAddress: 'Carrera 9 #18-45, Rionegro',
      includesCard: false,
      cardMessage: null,
      status: 'completed',
      shippingMethodSlug: 'envio-nacional',
      includeShippingPrice: true,
      items: [
        { productKey: 'bouquet-novia-marfil', quantity: 1 },
        { productKey: 'tulipanes-holandeses', quantity: 1 },
      ],
    },
  },
];

async function executeStatements(connection, statements) {
  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function insertRow(connection, tableName, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
  const values = columns.map((column) => data[column]);
  const [result] = await connection.execute(sql, values);
  return result.insertId;
}

async function ensurePermissions(connection) {
  for (const permission of PERMISSIONS) {
    await connection.execute(
      `
        INSERT IGNORE INTO permissions (code, name, description)
        VALUES (?, ?, ?)
      `,
      [permission.code, permission.name, permission.description]
    );
  }

  const [rows] = await connection.execute(
    'SELECT id, code FROM permissions WHERE code IN (?, ?, ?)',
    PERMISSIONS.map((permission) => permission.code)
  );

  return new Map(rows.map((row) => [row.code, row.id]));
}

async function createUsers(connection, permissionIdByCode) {
  const userIdsByEmail = new Map();

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const userId = await insertRow(connection, 'users', {
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      password_hash: passwordHash,
      is_active: 1,
      deactivated_at: null,
      reset_password_token_hash: null,
      reset_password_expires_at: null,
    });

    userIdsByEmail.set(user.email, userId);

    for (const permissionCode of user.permissions) {
      await insertRow(connection, 'user_permissions', {
        user_id: userId,
        permission_id: permissionIdByCode.get(permissionCode),
      });
    }
  }

  return userIdsByEmail;
}

async function createReferenceRows(connection, tableName, rows) {
  const idsBySlug = new Map();

  for (const row of rows) {
    const recordId = await insertRow(connection, tableName, row);
    idsBySlug.set(row.slug, recordId);
  }

  return idsBySlug;
}

async function resetDatabase() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await executeStatements(connection, [
      'DELETE FROM user_permissions',
      'DELETE FROM order_items',
      'DELETE FROM orders',
      'DELETE FROM product_price_history',
      'DELETE FROM product_tags',
      'DELETE FROM product_catalogs',
      'DELETE FROM product_categories',
      'DELETE FROM products',
      'DELETE FROM shipping_methods',
      'DELETE FROM tags',
      'DELETE FROM catalogs',
      'DELETE FROM categories',
      'DELETE FROM users',
    ]);

    await executeStatements(connection, [
      'ALTER TABLE users AUTO_INCREMENT = 1',
      'ALTER TABLE categories AUTO_INCREMENT = 1',
      'ALTER TABLE tags AUTO_INCREMENT = 1',
      'ALTER TABLE catalogs AUTO_INCREMENT = 1',
      'ALTER TABLE shipping_methods AUTO_INCREMENT = 1',
      'ALTER TABLE products AUTO_INCREMENT = 1',
      'ALTER TABLE product_price_history AUTO_INCREMENT = 1',
      'ALTER TABLE orders AUTO_INCREMENT = 1',
      'ALTER TABLE order_items AUTO_INCREMENT = 1',
    ]);

    const permissionIdByCode = await ensurePermissions(connection);
    const userIdsByEmail = await createUsers(connection, permissionIdByCode);
    const categoryIdsBySlug = await createReferenceRows(connection, 'categories', CATEGORIES);
    const tagIdsBySlug = await createReferenceRows(connection, 'tags', TAGS);
    const catalogIdsBySlug = await createReferenceRows(connection, 'catalogs', CATALOGS);
    const shippingMethodIdsBySlug = await createReferenceRows(connection, 'shipping_methods', SHIPPING_METHODS);

    await connection.commit();

    return {
      userIdsByEmail,
      categoryIdsBySlug,
      tagIdsBySlug,
      catalogIdsBySlug,
      shippingMethodIdsBySlug,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function resolveRelationIds(slugs, idsBySlug, entityName) {
  return slugs.map((slug) => {
    const id = idsBySlug.get(slug);

    if (!id) {
      throw new Error(`Missing ${entityName} seed id for slug: ${slug}`);
    }

    return id;
  });
}

async function createProducts(referenceData) {
  const productIdsByKey = new Map();

  for (const product of PRODUCTS) {
    const createdProduct = await productService.createProduct({
      name: product.payload.name,
      price: product.payload.price,
      stock: product.payload.stock,
      hasVat: product.payload.hasVat,
      vatRate: product.payload.vatRate,
      description: product.payload.description,
      ...(product.payload.image ? { image: product.payload.image } : {}),
      categoryIds: resolveRelationIds(
        product.payload.categorySlugs,
        referenceData.categoryIdsBySlug,
        'category'
      ),
      tagIds: resolveRelationIds(product.payload.tagSlugs, referenceData.tagIdsBySlug, 'tag'),
      catalogIds: resolveRelationIds(
        product.payload.catalogSlugs,
        referenceData.catalogIdsBySlug,
        'catalog'
      ),
    });

    productIdsByKey.set(product.key, createdProduct.id);
  }

  for (const update of PRODUCT_UPDATES) {
    const productId = productIdsByKey.get(update.key);
    await productService.updateProduct(productId, update.payload);
  }

  return productIdsByKey;
}

async function createOrders(referenceData, productIdsByKey) {
  const createdOrderIds = [];

  for (const order of ORDERS) {
    const actorUserId = referenceData.userIdsByEmail.get(order.actorEmail);

    const createdOrder = await orderService.createOrder(actorUserId, {
      userId: actorUserId,
      customerName: order.payload.customerName,
      customerEmail: order.payload.customerEmail,
      customerPhone: order.payload.customerPhone,
      shippingAddress: order.payload.shippingAddress,
      includesCard: order.payload.includesCard,
      cardMessage: order.payload.cardMessage,
      status: order.payload.status,
      shippingMethodId: referenceData.shippingMethodIdsBySlug.get(order.payload.shippingMethodSlug),
      includeShippingPrice: order.payload.includeShippingPrice,
      shippingPrice: order.payload.shippingPrice,
      items: order.payload.items.map((item) => ({
        productId: productIdsByKey.get(item.productKey),
        quantity: item.quantity,
      })),
    });

    createdOrderIds.push(createdOrder.id);
  }

  return createdOrderIds;
}

async function printSummary(referenceData, productIdsByKey, orderIds) {
  console.log('Seed completado para la floristería.');
  console.log(`Usuarios internos: ${referenceData.userIdsByEmail.size}`);
  console.log(`Categorías: ${referenceData.categoryIdsBySlug.size}`);
  console.log(`Tags: ${referenceData.tagIdsBySlug.size}`);
  console.log(`Catálogos: ${referenceData.catalogIdsBySlug.size}`);
  console.log(`Métodos de envío: ${referenceData.shippingMethodIdsBySlug.size}`);
  console.log(`Productos: ${productIdsByKey.size}`);
  console.log(`Órdenes: ${orderIds.length}`);
  console.log('');
  console.log('Credenciales demo:');

  for (const user of USERS) {
    console.log(`- ${user.email} / ${user.password}`);
  }
}

async function main() {
  try {
    const referenceData = await resetDatabase();
    const productIdsByKey = await createProducts(referenceData);
    const orderIds = await createOrders(referenceData, productIdsByKey);
    await printSummary(referenceData, productIdsByKey, orderIds);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('No se pudo ejecutar el seed:', error.message);
  console.error(error);
  if (error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
