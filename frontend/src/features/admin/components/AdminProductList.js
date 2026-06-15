import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchBrandsAsync,
  fetchCategoriesAsync,
  fetchProductsByFiltersAsync,
  selectAllProducts,
  selectTotalItems,
  updateProductAsync,
} from '../../product/productSlice';
import { Link } from 'react-router-dom';
import { ITEMS_PER_PAGE } from '../../../app/constants';
import Pagination from '../../common/Pagination';
import Modal from '../../common/Modal';
import ProductImage from '../../common/ProductImage';

const gridCols =
  'grid-cols-[minmax(280px,1.7fr)_130px_110px_130px_80px_130px]';

export default function AdminProductList() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const totalItems = useSelector(selectTotalItems);

  // Existing filter/sort/pagination wiring is preserved (drives the same thunk).
  const [filter] = useState({});
  const [sort] = useState({});
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handlePage = (page) => setPage(page);

  const handleDelete = (product) => {
    dispatch(updateProductAsync({ ...product, deleted: true }));
    setDeleteTarget(null);
  };

  useEffect(() => {
    const pagination = { _page: page, _limit: ITEMS_PER_PAGE };
    dispatch(fetchProductsByFiltersAsync({ filter, sort, pagination, admin: true }));
  }, [dispatch, filter, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [totalItems, sort]);

  useEffect(() => {
    dispatch(fetchBrandsAsync());
    dispatch(fetchCategoriesAsync());
  }, []);

  const stockInfo = (product) => {
    if (product.stock <= 0) return { label: 'Out of stock', cls: 'text-error-text' };
    if (product.stock <= 10) return { label: `Low · ${product.stock}`, cls: 'text-warning' };
    return { label: `${product.stock} in stock`, cls: 'text-muted' };
  };

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-11 sm:px-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">Admin</h1>
          <div className="mt-4 flex gap-1.5">
            <span className="rounded-[9px] border border-primary bg-primary-soft px-4 py-2 text-[13.5px] font-semibold text-primary-lighter">
              Products
            </span>
            <Link
              to="/admin/orders"
              className="rounded-[9px] border border-transparent px-4 py-2 text-[13.5px] font-medium text-muted transition-colors hover:text-content"
            >
              Orders
            </Link>
          </div>
        </div>
        <Link
          to="/admin/product-form"
          className="rounded-[11px] bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          + Add product
        </Link>
      </div>

      {/* Table */}
      <div className="mt-7 overflow-hidden rounded-card border border-line bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div
              className={`grid ${gridCols} items-center gap-4 border-b border-line bg-background/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-dim`}
            >
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Rating</span>
              <span className="text-right">Actions</span>
            </div>

            {products.map((product) => {
              const stock = stockInfo(product);
              return (
                <div
                  key={product.id}
                  className={`grid ${gridCols} items-center gap-4 border-b border-[#232F44] px-6 py-3.5 transition-colors last:border-b-0 hover:bg-row-hover`}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="h-[42px] w-[52px] flex-shrink-0 overflow-hidden rounded-lg border border-line bg-background">
                      <ProductImage
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-content">
                        {product.title}
                        {product.deleted && (
                          <span className="ml-2 text-[11px] font-medium text-error-text">
                            (deleted)
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">{product.brand}</div>
                    </div>
                  </div>
                  <span className="text-[13px] text-[#CBD5E1]">{product.category}</span>
                  <span className="font-mono text-[13.5px] font-semibold text-content">
                    ${product.discountPrice}
                  </span>
                  <span className={`text-[13px] font-medium ${stock.cls}`}>{stock.label}</span>
                  <span className="text-[13px] text-muted">
                    <span className="text-primary-hover">★</span> {product.rating}
                  </span>
                  <div className="flex justify-end gap-3.5">
                    <Link
                      to={`/admin/product-form/edit/${product.id}`}
                      className="text-[13px] font-semibold text-primary-hover transition-colors hover:text-primary-light"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="text-[13px] font-semibold text-dim transition-colors hover:text-error-text"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        handlePage={handlePage}
        totalItems={totalItems}
      />

      {deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.title}`}
          message="Are you sure you want to delete this Product ?"
          dangerOption="Delete"
          cancelOption="Cancel"
          dangerAction={() => handleDelete(deleteTarget)}
          cancelAction={() => setDeleteTarget(null)}
          showModal={!!deleteTarget}
        ></Modal>
      )}
    </main>
  );
}
