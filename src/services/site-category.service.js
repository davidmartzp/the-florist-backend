const Category = require('../models/Category');

async function listSiteCategories() {
  const { items } = await Category.listWithStock({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: 1000,
    offset: 0,
  });
  
  return items;
}

module.exports = {
  listSiteCategories,
};
