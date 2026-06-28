import { BASE_URL } from '../../app/constants';

export function fetchProductById(id) {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/products/${id}`, { credentials: 'include' });
    const data = await response.json();
    resolve({ data });
  });
}

export function createProduct(product) {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/products/`, {
      method: 'POST',
      body: JSON.stringify(product),
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    resolve({ data });
  });
}

export function updateProduct(update) {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/products/${update.id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
    });
    const data = await response.json();
    resolve({ data });
  });
}

export function fetchProductsByFilters(filter, sort, pagination, admin, search, minPrice, maxPrice) {
  let queryString = '';
  for (let key in filter) {
    const categoryValues = filter[key];
    if (categoryValues.length) {
      queryString += `${key}=${categoryValues}&`;
    }
  }
  for (let key in sort) {
    queryString += `${key}=${sort[key]}&`;
  }
  for (let key in pagination) {
    queryString += `${key}=${pagination[key]}&`;
  }
  if (search) {
    queryString += `q=${encodeURIComponent(search)}&`;
  }
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    queryString += `minPrice=${encodeURIComponent(minPrice)}&`;
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    queryString += `maxPrice=${encodeURIComponent(maxPrice)}&`;
  }
  if (admin) {
    queryString += `admin=true`;
  }

  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/products?${queryString}`, { credentials: 'include' });
    if (!response.ok) {
      // Don't let an API error become a non-array that crashes the grid.
      resolve({ data: { products: [], totalItems: 0 } });
      return;
    }
    const data = await response.json();
    const totalItems = response.headers.get('X-Total-Count');
    resolve({ data: { products: Array.isArray(data) ? data : [], totalItems: +totalItems || 0 } });
  });
}

export function fetchCategories() {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/categories`, { credentials: 'include' });
    const data = await response.json();
    resolve({ data });
  });
}

export function fetchBrands() {
  return new Promise(async (resolve) => {
    const response = await fetch(`${BASE_URL}/brands`, { credentials: 'include' });
    const data = await response.json();
    resolve({ data });
  });
}
