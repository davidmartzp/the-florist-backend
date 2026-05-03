const ShippingMethod = require('../models/ShippingMethod');

async function listSiteShippingMethods() {
  const { items } = await ShippingMethod.listActive({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: 1000,
    offset: 0,
  });

  return items;
}

module.exports = {
  listSiteShippingMethods,
};
