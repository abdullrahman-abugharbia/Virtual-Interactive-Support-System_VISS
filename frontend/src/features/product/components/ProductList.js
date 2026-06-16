import React, { useState, Fragment, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchBrandsAsync,
  fetchCategoriesAsync,
  fetchProductsByFiltersAsync,
  selectAllProducts,
  selectBrands,
  selectCategories,
  selectProductListStatus,
  selectTotalItems,
} from '../productSlice';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Link, useSearchParams } from 'react-router-dom';
import { ITEMS_PER_PAGE } from '../../../app/constants';
import Pagination from '../../common/Pagination';
import { Grid } from 'react-loader-spinner';
import { addToCartAsync, selectItems } from '../../cart/cartSlice';
import { useAlert } from 'react-alert';
import ProductImage from '../../common/ProductImage';
import {
  selectRequestedFilters,
  clearRequestedFilters,
} from '../../support/supportSlice';

const sortOptions = [
  { name: 'Best rating', sort: 'rating', order: 'desc', current: false },
  { name: 'Price: low to high', sort: 'discountPrice', order: 'asc', current: false },
  { name: 'Price: high to low', sort: 'discountPrice', order: 'desc', current: false },
];

export default function ProductList() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const brands = useSelector(selectBrands);
  const categories = useSelector(selectCategories);
  const totalItems = useSelector(selectTotalItems);
  const status = useSelector(selectProductListStatus);
  const cartItems = useSelector(selectItems);
  const requestedFilters = useSelector(selectRequestedFilters);
  const alert = useAlert();
  const [searchParams] = useSearchParams();
  const search = (searchParams.get('q') || '').trim();
  const filters = [
    {
      id: 'category',
      name: 'Category',
      options: categories,
    },
    {
      id: 'brand',
      name: 'Brand',
      options: brands,
    },
  ];

  const [filter, setFilter] = useState({});
  const [sort, setSort] = useState({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const handleFilter = (e, section, option) => {
    // Immutable update — never mutate the existing arrays (they may be frozen
    // when applied from Aria via Redux state).
    const current = filter[section.id] ? [...filter[section.id]] : [];
    const next = e.target.checked
      ? [...current, option.value]
      : current.filter((el) => el !== option.value);

    const newFilter = { ...filter };
    if (next.length) {
      newFilter[section.id] = next;
    } else {
      delete newFilter[section.id];
    }
    setFilter(newFilter);
  };

  const handleSort = (e, option) => {
    const sort = { _sort: option.sort, _order: option.order };
    setSort(sort);
  };

  const handlePage = (page) => {
    setPage(page);
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) {
      alert.error('Sorry — out of stock');
      return;
    }
    if (cartItems.findIndex((item) => item.product.id === product.id) < 0) {
      dispatch(addToCartAsync({ item: { product: product.id, quantity: 1 }, alert }));
    } else {
      alert.error('Item Already added');
    }
  };

  const activeFilterCount = Object.values(filter).reduce(
    (n, arr) => n + (arr ? arr.length : 0),
    0
  );
  const hasFilters = activeFilterCount > 0;
  const clearFilters = () => setFilter({});

  useEffect(() => {
    const pagination = { _page: page, _limit: ITEMS_PER_PAGE };
    dispatch(fetchProductsByFiltersAsync({ filter, sort, pagination, search }));
  }, [dispatch, filter, sort, page, search]);

  useEffect(() => {
    setPage(1);
  }, [totalItems, sort, search]);

  useEffect(() => {
    dispatch(fetchBrandsAsync());
    dispatch(fetchCategoriesAsync());
  }, []);

  // Aria asked to filter (brand and/or category) → check them in the filter state.
  useEffect(() => {
    if (requestedFilters) {
      // Clone arrays — Redux state is frozen, and handleFilter must stay mutable-safe.
      const next = {};
      if (requestedFilters.category?.length) next.category = [...requestedFilters.category];
      if (requestedFilters.brand?.length) next.brand = [...requestedFilters.brand];
      setFilter(next); // empty object = cleared filters
      setPage(1);
      dispatch(clearRequestedFilters());
    }
  }, [requestedFilters, dispatch]);

  // map current sort to the select value (index into sortOptions)
  const selectedSortIndex = sortOptions.findIndex(
    (o) => o.sort === sort._sort && o.order === sort._order
  );

  const onSortChange = (e) => {
    const idx = e.target.value;
    if (idx === '') {
      setSort({});
      return;
    }
    handleSort(e, sortOptions[+idx]);
  };

  return (
    <div className="bg-background">
      <MobileFilter
        handleFilter={handleFilter}
        mobileFiltersOpen={mobileFiltersOpen}
        setMobileFiltersOpen={setMobileFiltersOpen}
        filters={filters}
        filter={filter}
        hasFilters={hasFilters}
        clearFilters={clearFilters}
      />

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-11 sm:px-10">
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">
              {search ? 'Search results' : 'All Products'}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {search ? (
                <>
                  {totalItems} {totalItems === 1 ? 'result' : 'results'} for{' '}
                  <span className="text-content">“{search}”</span>{' '}
                  <Link to="/" className="ml-1 text-primary-hover transition-colors hover:text-primary-light">
                    · Clear
                  </Link>
                </>
              ) : (
                <>
                  {totalItems} {totalItems === 1 ? 'product' : 'products'}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[13px] font-medium text-muted transition-colors hover:text-content lg:hidden"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </button>
            <div className="relative">
              <select
                onChange={onSortChange}
                value={selectedSortIndex === -1 ? '' : selectedSortIndex}
                className="cursor-pointer appearance-none rounded-[10px] border border-line bg-surface bg-none py-2.5 pl-3.5 pr-9 text-[13px] font-medium text-content outline-none focus:border-primary"
              >
                <option value="">Best match</option>
                {sortOptions.map((option, idx) => (
                  <option key={option.name} value={idx}>
                    {option.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dim">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="mt-9 grid grid-cols-1 items-start gap-11 lg:grid-cols-[250px_1fr]">
          <DesktopFilter
            handleFilter={handleFilter}
            filters={filters}
            filter={filter}
            hasFilters={hasFilters}
            clearFilters={clearFilters}
          />

          <div>
            <ProductGrid
              products={products}
              status={status}
              handleAddToCart={handleAddToCart}
            />
            <Pagination
              page={page}
              setPage={setPage}
              handlePage={handlePage}
              totalItems={totalItems}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Custom checkbox filter row ──────────────────────────────── */
function FilterGroup({ section, handleFilter, idPrefix, filter }) {
  return (
    <div className="mb-6">
      <div className="border-b border-line-subtle pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-dim">
        {section.name}
      </div>
      <div className="flex flex-col py-2.5">
        {section.options.map((option, optionIdx) => (
          <label
            key={option.value}
            htmlFor={`${idPrefix}-${section.id}-${optionIdx}`}
            className="group flex cursor-pointer items-center gap-2.5 py-[7px]"
          >
            <input
              id={`${idPrefix}-${section.id}-${optionIdx}`}
              name={`${section.id}[]`}
              value={option.value}
              type="checkbox"
              checked={(filter?.[section.id] || []).includes(option.value)}
              onChange={(e) => handleFilter(e, section, option)}
              className="peer sr-only"
            />
            <span className="flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-[#475569] text-[11px] font-bold leading-none text-transparent transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white">
              ✓
            </span>
            <span className="text-sm text-[#CBD5E1]">{option.label}</span>
            {option.count != null && (
              <span className="ml-auto font-mono text-[11.5px] text-dim">
                {option.count}
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function DesktopFilter({ handleFilter, filters, filter, hasFilters, clearFilters }) {
  return (
    <aside className="sticky top-24 hidden lg:block">
      {filters.map((section) => (
        <FilterGroup
          key={section.id}
          section={section}
          handleFilter={handleFilter}
          filter={filter}
          idPrefix="filter"
        />
      ))}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="py-1 text-[13px] font-medium text-primary-hover transition-colors hover:text-primary-light"
        >
          Clear all filters
        </button>
      )}
    </aside>
  );
}

function MobileFilter({
  mobileFiltersOpen,
  setMobileFiltersOpen,
  handleFilter,
  filters,
  filter,
  hasFilters,
  clearFilters,
}) {
  return (
    <Transition.Root show={mobileFiltersOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-40 lg:hidden"
        onClose={setMobileFiltersOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto border-l border-line bg-surface py-4 pb-12 shadow-auth">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-semibold text-content">Filters</h2>
                <button
                  type="button"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg p-2 text-muted hover:text-content"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 border-t border-line-subtle px-4 pt-4">
                {filters.map((section) => (
                  <FilterGroup
                    key={section.id}
                    section={section}
                    handleFilter={handleFilter}
                    filter={filter}
                    idPrefix="filter-mobile"
                  />
                ))}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="py-1 text-[13px] font-medium text-primary-hover transition-colors hover:text-primary-light"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function ProductGrid({ products, status, handleAddToCart }) {
  if (status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Grid
          height="70"
          width="70"
          color="#6366F1"
          ariaLabel="grid-loading"
          radius="12.5"
          visible={true}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const discount =
          product.price > 0
            ? Math.round((1 - product.discountPrice / product.price) * 100)
            : 0;
        const outOfStock = product.stock <= 0;
        return (
          <Link
            to={`/product-detail/${product.id}`}
            key={product.id}
            className="group block overflow-hidden rounded-card border border-line bg-surface transition-all duration-200 hover:-translate-y-[3px] hover:border-primary/65 hover:shadow-card-hover"
          >
            {/* Image area */}
            <div className="relative aspect-[4/3] overflow-hidden border-b border-surface-raised bg-background">
              <ProductImage
                src={product.thumbnail}
                alt={product.title}
                className="h-full w-full object-cover object-center"
              />
              {outOfStock ? (
                <span className="absolute left-3 top-3 rounded-full border border-error/35 bg-error/[0.14] px-2.5 py-1 text-[11px] font-semibold text-error-text">
                  Out of stock
                </span>
              ) : (
                discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-light">
                    −{discount}%
                  </span>
                )
              )}
            </div>

            {/* Body */}
            <div className="p-4 pb-[18px]">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-primary-hover">
                {product.brand}
              </div>
              <div className="mt-1.5 text-[15px] font-semibold leading-[1.35] text-content">
                {product.title}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
                <span className="text-[12px] text-primary-hover">★</span>
                {product.rating}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-bold tracking-[-0.01em] text-content">
                    ${product.discountPrice}
                  </span>
                  {discount > 0 && (
                    <span className="text-[13px] text-dim line-through">
                      ${product.price}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  title="Add to cart"
                  onClick={(e) => handleAddToCart(e, product)}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-raised text-[19px] leading-none text-primary-lighter transition-all hover:border-primary hover:bg-primary hover:text-white"
                >
                  +
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
