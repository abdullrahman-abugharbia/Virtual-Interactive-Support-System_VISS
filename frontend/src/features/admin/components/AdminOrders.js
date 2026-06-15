import { useEffect, useState } from 'react';
import { ITEMS_PER_PAGE } from '../../../app/constants';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllOrdersAsync,
  selectOrders,
  selectTotalOrders,
  updateOrderAsync,
} from '../../order/orderSlice';
import { Link } from 'react-router-dom';
import Pagination from '../../common/Pagination';
import { statusBadgeStyle } from '../../common/statusBadge';

const gridCols = 'grid-cols-[120px_1.4fr_90px_100px_160px_130px]';

function AdminOrders() {
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);
  const totalOrders = useSelector(selectTotalOrders);
  const [sort] = useState({});

  const handleOrderStatus = (e, order) => {
    const updatedOrder = { ...order, status: e.target.value };
    dispatch(updateOrderAsync(updatedOrder));
  };

  const handlePage = (page) => setPage(page);

  useEffect(() => {
    const pagination = { _page: page, _limit: ITEMS_PER_PAGE };
    dispatch(fetchAllOrdersAsync({ sort, pagination }));
  }, [dispatch, page, sort]);

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-11 sm:px-10">
      {/* Header */}
      <div>
        <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">Admin</h1>
        <div className="mt-4 flex gap-1.5">
          <Link
            to="/admin"
            className="rounded-[9px] border border-transparent px-4 py-2 text-[13.5px] font-medium text-muted transition-colors hover:text-content"
          >
            Products
          </Link>
          <span className="rounded-[9px] border border-primary bg-primary-soft px-4 py-2 text-[13.5px] font-semibold text-primary-lighter">
            Orders
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="mt-7 overflow-hidden rounded-card border border-line bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div
              className={`grid ${gridCols} items-center gap-4 border-b border-line bg-background/50 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-dim`}
            >
              <span>Order</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
              <span>Payment</span>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                className={`grid ${gridCols} items-center gap-4 border-b border-[#232F44] px-6 py-3.5 transition-colors last:border-b-0 hover:bg-row-hover`}
              >
                <span className="font-mono text-[13px] font-semibold text-primary-lighter">
                  #{order.id}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-content">
                    {order.selectedAddress?.name}
                  </div>
                  <div className="mt-0.5 text-xs text-dim">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>
                <span className="text-[13px] text-muted">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </span>
                <span className="font-mono text-[13.5px] font-semibold text-content">
                  ${order.totalAmount}
                </span>
                <div className="relative inline-block">
                  <select
                    value={order.status}
                    onChange={(e) => handleOrderStatus(e, order)}
                    style={statusBadgeStyle(order.status)}
                    className="w-[138px] cursor-pointer appearance-none rounded-full bg-none py-1.5 pl-3.5 pr-7 text-xs font-semibold capitalize outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px]"
                    style={{ color: statusBadgeStyle(order.status).color }}
                  >
                    ▼
                  </span>
                </div>
                <span className="text-[13px] capitalize text-[#CBD5E1]">
                  {order.paymentMethod}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        handlePage={handlePage}
        totalItems={totalOrders}
      ></Pagination>
    </main>
  );
}

export default AdminOrders;
