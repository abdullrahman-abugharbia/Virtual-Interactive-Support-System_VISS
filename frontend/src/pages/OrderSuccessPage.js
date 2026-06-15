import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { resetCartAsync } from "../features/cart/cartSlice";
import { useDispatch } from "react-redux";
import { resetOrder } from "../features/order/orderSlice";
import NavBar from "../features/navbar/Navbar";

function OrderSuccessPage() {
  const params = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(resetCartAsync());
    dispatch(resetOrder());
  }, [dispatch]);

  return (
    <NavBar>
      {!params.id && <Navigate to="/" replace={true}></Navigate>}
      <main className="mx-auto max-w-[560px] px-10 py-28 text-center">
        <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-success/45 bg-success/10 text-[32px] font-bold text-success-text">
          ✓
        </div>
        <h1 className="mt-7 text-[30px] font-bold tracking-[-0.02em] text-content">
          Order placed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Thanks! Your order{' '}
          <span className="font-mono text-primary-lighter">#{params?.id}</span> is confirmed.
          <br />
          You can track its status anytime from My Orders.
        </p>
        <div className="mt-8 flex justify-center gap-3.5">
          <Link
            to="/my-orders"
            className="rounded-[11px] bg-primary px-[22px] py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            View my orders
          </Link>
          <Link
            to="/"
            className="rounded-[11px] border border-line bg-surface px-[22px] py-3 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#475569] hover:text-content"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    </NavBar>
  );
}

export default OrderSuccessPage;
