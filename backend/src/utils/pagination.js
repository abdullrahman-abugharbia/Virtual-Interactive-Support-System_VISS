function parsePagination(query) {
  const page = Math.max(Number(query._page) || 1, 1);
  const limit = Math.min(Math.max(Number(query._limit) || 12, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function parseSort(query, allowList = [], defaultSort = 'id', defaultOrder = 'asc') {
  const sort = allowList.includes(query._sort) ? query._sort : defaultSort;
  const order = String(query._order || defaultOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return { sort, order };
}

module.exports = {
  parsePagination,
  parseSort,
};
