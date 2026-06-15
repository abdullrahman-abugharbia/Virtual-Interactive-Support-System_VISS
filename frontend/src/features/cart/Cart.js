import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  deleteItemFromCartAsync,
  selectCartLoaded,
  selectCartStatus,
  selectItems,
  updateCartAsync,
} from './cartSlice';
import { Link, Navigate } from 'react-router-dom';
import { Grid } from 'react-loader-spinner';
import Modal from '../common/Modal';
import ProductImage from '../common/ProductImage';

export default function Cart() {
  const dispatch = useDispatch();

  const items = useSelector(selectItems);
  const status = useSelector(selectCartStatus);
  const cartLoaded = useSelector(selectCartLoaded);
  const [openModal, setOpenModal] = useState(null);

  const totalAmount = items.reduce(
    (amount, item) => item.product.discountPrice * item.quantity + amount,
    0
  );
  const totalItems = items.reduce((total, item) => item.quantity + total, 0);

  const updateQty = (item, quantity) => {
    if (quantity < 1) return;
    dispatch(updateCartAsync({ id: item.id, quantity }));
  };

  const handleRemove = (e, id) => {
    dispatch(deleteItemFromCartAsync(id));
  };

  return (
    <>
      {!items.length && cartLoaded && <Navigate to="/" replace={true}></Navigate>}

      <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-11 sm:px-10">
        <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">Cart</h1>
        <p className="mt-2 text-sm text-muted">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
        </p>

        {status === 'loading' && (
          <div className="flex justify-center py-16">
            <Grid height="70" width="70" color="#6366F1" ariaLabel="grid-loading" radius="12.5" visible={true} />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_380px]">
          {/* Line items */}
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-[18px] border-b border-line-subtle px-6 py-[22px] last:border-b-0"
              >
                <div className="h-[70px] w-[84px] flex-shrink-0 overflow-hidden rounded-[10px] border border-line bg-background">
                  <ProductImage
                    src={item.product.thumbnail}
                    alt={item.product.title}
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product-detail/${item.product.id}`}
                    className="text-[15px] font-semibold text-content hover:text-primary-lighter"
                  >
                    {item.product.title}
                  </Link>
                  <div className="mt-1 text-[12.5px] text-muted">
                    {item.product.brand} · ${item.product.discountPrice} each
                  </div>
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center overflow-hidden rounded-[10px] border border-line">
                  <button
                    type="button"
                    onClick={() => updateQty(item, item.quantity - 1)}
                    className="h-[34px] w-8 bg-surface-raised text-[16px] text-[#CBD5E1] transition-colors hover:bg-[#2C3B57]"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-[38px] text-center font-mono text-sm font-semibold text-content">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item, item.quantity + 1)}
                    className="h-[34px] w-8 bg-surface-raised text-[15px] text-[#CBD5E1] transition-colors hover:bg-[#2C3B57]"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="w-[84px] text-right text-[15px] font-bold text-content">
                  ${item.product.discountPrice * item.quantity}
                </div>

                <Modal
                  title={`Delete ${item.product.title}`}
                  message="Are you sure you want to delete this Cart item ?"
                  dangerOption="Delete"
                  cancelOption="Cancel"
                  dangerAction={(e) => handleRemove(e, item.id)}
                  cancelAction={() => setOpenModal(null)}
                  showModal={openModal === item.id}
                ></Modal>
                <button
                  onClick={() => setOpenModal(item.id)}
                  type="button"
                  title="Remove"
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[15px] text-dim transition-colors hover:bg-error/10 hover:text-error-text"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="sticky top-24 rounded-card border border-line bg-surface p-[26px]">
            <div className="text-base font-bold text-content">Order summary</div>
            <div className="mt-5 flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="font-semibold text-[#E2E8F0]">${totalAmount}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm text-muted">
              <span>Shipping</span>
              <span className="font-semibold text-success-text">Free</span>
            </div>
            <div className="mt-[18px] flex justify-between border-t border-line pt-[18px] text-base font-bold text-content">
              <span>Total</span>
              <span>${totalAmount}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-[22px] flex w-full items-center justify-center rounded-btn bg-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Checkout
            </Link>
            <Link
              to="/"
              className="mt-3 flex w-full items-center justify-center p-1.5 text-[13.5px] font-medium text-primary-hover transition-colors hover:text-primary-light"
            >
              Continue shopping →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
