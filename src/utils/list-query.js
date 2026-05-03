const HttpError = require('./http-error');

function normalizePositiveInteger(value, fieldName, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalizedValue = Number(value);

  if (!Number.isInteger(normalizedValue) || normalizedValue <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
  }

  return normalizedValue;
}

function normalizeSortOrder(value, fallback = 'desc') {
  if (value === undefined) {
    return fallback;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue !== 'asc' && normalizedValue !== 'desc') {
    throw new HttpError(400, 'sortOrder must be asc or desc');
  }

  return normalizedValue;
}

function parseListQuery(query, options) {
  const page = normalizePositiveInteger(query.page, 'page', 1);
  const rawPageSize = normalizePositiveInteger(query.pageSize, 'pageSize', options.defaultPageSize || 20);
  const pageSize = Math.min(rawPageSize, options.maxPageSize || 100);
  const sortBy = query.sortBy ? String(query.sortBy).trim() : options.defaultSortBy;

  if (!options.allowedSortBy.includes(sortBy)) {
    throw new HttpError(
      400,
      `sortBy must be one of: ${options.allowedSortBy.join(', ')}`
    );
  }

  return {
    page,
    pageSize,
    sortBy,
    sortOrder: normalizeSortOrder(query.sortOrder, options.defaultSortOrder || 'desc'),
    offset: (page - 1) * pageSize,
  };
}

function buildPaginatedResponse(items, total, pagination) {
  return {
    items,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
    },
  };
}

module.exports = {
  buildPaginatedResponse,
  parseListQuery,
};

