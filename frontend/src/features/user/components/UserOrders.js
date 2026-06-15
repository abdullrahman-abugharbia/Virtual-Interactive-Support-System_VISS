import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchLoggedInUserOrderAsync,
  selectUserInfoStatus,
  selectUserOrders,
} from '../userSlice';
import { Grid } from 'react-loader-spinner';
import { statusBadgeStyle } from '../../common/statusBadge';
import ProductImage from '../../common/ProductImage';

export default function UserOrders() {
  const dispatch = useDispatch();
  const orders = useSelector(selectUserOrders);
  const status = useSelector(selectUserInfoStatus);

  useEffect(() => {
    dispatch(fetchLoggedInUserOrderAsync());
  }, [dispatch]);

  return (
    <main className="mx-auto max-w-[980px] px-5 pb-24 pt-11 sm:px-10">
      <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">My Orders</h1>
      <p className="mt-2 text-sm text-muted">Track and review your past orders</p>

      {status === 'loading' && (
        <div className="flex justify-center py-16">
          <Grid height="70" width="70" color="#6366F1" ariaLabel="grid-loading" radius="12.5" visible={true} />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-[22px]">
        {orders &&
          orders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-card border border-line bg-surface"
            >
              {/* Header */}
              <div className="flex items-center gap-[18px] border-b border-line-subtle bg-background/40 px-6 py-[18px]">
                <div>
                  <div className="font-mono text-[14.5px] font-bold text-content">
                    #{order.id}
                  </div>
                  {order.createdAt && (
                    <div className="mt-0.5 text-[12.5px] text-muted">
                      Placed {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <span
                  className="rounded-full px-3 py-[5px] text-[11.5px] font-semibold capitalize"
                  style={statusBadgeStyle(order.status)}
                >
                  {order.status}
                </span>
                <div className="flex-1" />
                <div className="text-[15px] font-bold text-content">${order.totalAmount}</div>
              </div>

              {/* Items */}
              <div className="px-6">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-[#232F44] py-3.5 last:border-b-0"
                  >
                    <div className="h-[46px] w-[56px] flex-shrink-0 overflow-hidden rounded-lg border border-line bg-background">
                      <ProductImage
                        src={item.product.thumbnail}
                        alt={item.product.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-content">{item.product.title}</div>
                      <div className="mt-0.5 text-xs text-muted">{item.product.brand}</div>
                    </div>
                    <div className="font-mono text-[13px] text-muted">×{item.quantity}</div>
                    <div className="w-[80px] text-right text-sm font-semibold text-content">
                      ${item.product.discountPrice * item.quantity}
                    </div>
                  </div>
                ))}

                {/* Ships to */}
                <div className="flex flex-wrap items-center gap-2 py-3.5 text-[12.5px] text-dim">
                  <span className="font-semibold text-muted">Ships to:</span>
                  <span>
                    {order.selectedAddress.name} · {order.selectedAddress.street},{' '}
                    {order.selectedAddress.city} {order.selectedAddress.pinCode} ·{' '}
                    {order.selectedAddress.phone}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}
