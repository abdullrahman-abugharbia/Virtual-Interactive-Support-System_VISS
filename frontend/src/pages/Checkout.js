import { Link, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectItems } from '../features/cart/cartSlice';
import { useForm } from 'react-hook-form';
import { updateUserAsync } from '../features/user/userSlice';
import { useState, useEffect } from 'react';
import {
  selectRequestedCheckout,
  clearRequestedCheckout,
} from '../features/support/supportSlice';
import {
  createOrderAsync,
  selectCurrentOrder,
  selectStatus,
} from '../features/order/orderSlice';
import { selectUserInfo } from '../features/user/userSlice';
import { Grid } from 'react-loader-spinner';
import NavBar from '../features/navbar/Navbar';

const inputCls =
  'w-full rounded-[10px] border border-line bg-background px-3.5 py-[11px] text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelCls = 'mb-[7px] block text-[13px] font-medium text-[#CBD5E1]';

function Checkout() {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const rawUser = useSelector(selectUserInfo);
  // Normalize: addresses must always be an array (it can be null/undefined).
  const user = rawUser
    ? { ...rawUser, addresses: Array.isArray(rawUser.addresses) ? rawUser.addresses : [] }
    : null;
  const items = useSelector(selectItems);
  const status = useSelector(selectStatus);
  const currentOrder = useSelector(selectCurrentOrder);
  const requestedCheckout = useSelector(selectRequestedCheckout);

  const totalAmount = items.reduce(
    (amount, item) => item.product.discountPrice * item.quantity + amount,
    0
  );
  const totalItems = items.reduce((total, item) => item.quantity + total, 0);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  const handleAddress = (e) => {
    setSelectedAddress(user.addresses[e.target.value]);
  };

  const handlePayment = (method) => {
    setPaymentMethod(method);
  };

  // Aria can pre-fill the shipping form for the customer (she never places the
  // order — that stays a manual click). Populate fields, then clear the request.
  useEffect(() => {
    if (!requestedCheckout) return;
    const { address, paymentMethod: pm } = requestedCheckout;
    if (address) {
      Object.entries(address).forEach(([field, value]) => {
        if (value != null && value !== '') setValue(field, value);
      });
    }
    if (pm === 'card' || pm === 'cash') setPaymentMethod(pm);
    dispatch(clearRequestedCheckout());
  }, [requestedCheckout, setValue, dispatch]);

  const handleOrder = () => {
    if (selectedAddress && paymentMethod) {
      const order = {
        items,
        totalAmount,
        totalItems,
        user: user.id,
        paymentMethod,
        selectedAddress,
        status: 'pending',
      };
      dispatch(createOrderAsync(order));
    } else {
      alert('Enter Address and Payment method');
    }
  };

  return (
    <NavBar>
      {!items.length && <Navigate to="/" replace={true}></Navigate>}
      {currentOrder && currentOrder.id && (
        <Navigate to={`/order-success/${currentOrder.id}`} replace={true}></Navigate>
      )}

      {status === 'loading' || !user ? (
        <div className="flex justify-center py-24">
          <Grid height="70" width="70" color="#6366F1" ariaLabel="grid-loading" radius="12.5" visible={true} />
        </div>
      ) : (
        <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-11 sm:px-10">
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">Checkout</h1>

          <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_400px]">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              {/* Shipping address form */}
              <form
                className="rounded-card border border-line bg-surface p-[26px]"
                noValidate
                onSubmit={handleSubmit((data) => {
                  // Send only id + addresses (sending the whole user can fail
                  // validation, e.g. a null name on signup accounts).
                  dispatch(
                    updateUserAsync({
                      id: user.id,
                      addresses: [...user.addresses, data],
                    })
                  );
                  reset();
                })}
              >
                <div className="text-[15px] font-bold text-content">Shipping address</div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="name" className={labelCls}>Full name</label>
                    <input id="name" type="text" className={inputCls} {...register('name', { required: 'name is required' })} />
                    {errors.name && <p className="mt-1 text-[12.5px] text-error-text">{errors.name.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="email" className={labelCls}>Email address</label>
                    <input id="email" type="email" className={inputCls} {...register('email', { required: 'email is required' })} />
                    {errors.email && <p className="mt-1 text-[12.5px] text-error-text">{errors.email.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="street" className={labelCls}>Street address</label>
                    <input id="street" type="text" className={inputCls} {...register('street', { required: 'street is required' })} />
                    {errors.street && <p className="mt-1 text-[12.5px] text-error-text">{errors.street.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="city" className={labelCls}>City</label>
                    <input id="city" type="text" autoComplete="address-level2" className={inputCls} {...register('city', { required: 'city is required' })} />
                    {errors.city && <p className="mt-1 text-[12.5px] text-error-text">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="state" className={labelCls}>State / Province</label>
                    <input id="state" type="text" autoComplete="address-level1" className={inputCls} {...register('state', { required: 'state is required' })} />
                    {errors.state && <p className="mt-1 text-[12.5px] text-error-text">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="pinCode" className={labelCls}>ZIP code</label>
                    <input id="pinCode" type="text" className={inputCls} {...register('pinCode', { required: 'pinCode is required' })} />
                    {errors.pinCode && <p className="mt-1 text-[12.5px] text-error-text">{errors.pinCode.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>Phone</label>
                    <input id="phone" type="tel" className={inputCls} {...register('phone', { required: 'phone is required' })} />
                    {errors.phone && <p className="mt-1 text-[12.5px] text-error-text">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => reset()} className="rounded-[10px] px-4 py-2 text-[13.5px] font-semibold text-muted transition-colors hover:text-content">
                    Reset
                  </button>
                  <button type="submit" className="rounded-[10px] bg-surface-raised px-4 py-2 text-[13.5px] font-semibold text-[#CBD5E1] transition-colors hover:text-content">
                    Add address
                  </button>
                </div>
              </form>

              {/* Saved addresses */}
              <div className="rounded-card border border-line bg-surface p-[26px]">
                <div className="text-[15px] font-bold text-content">Choose a shipping address</div>
                <p className="mt-1 text-[12.5px] text-muted">Select from your saved addresses</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {user.addresses.map((address, index) => {
                    const selected = selectedAddress === user.addresses[index];
                    return (
                      <li key={index}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                            selected ? 'border-primary bg-primary-soft' : 'border-line bg-background'
                          }`}
                        >
                          <input
                            onChange={handleAddress}
                            name="address"
                            type="radio"
                            value={index}
                            checked={selected}
                            className="mt-1 h-4 w-4 border-line text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-content">{address.name}</p>
                            <p className="mt-1 text-[12.5px] text-muted">
                              {address.street} · {address.city} · {address.pinCode}
                            </p>
                            <p className="mt-0.5 text-[12.5px] text-dim">Phone: {address.phone}</p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                  {user.addresses.length === 0 && (
                    <li className="rounded-xl border border-dashed border-line p-5 text-center text-[13px] text-muted">
                      No saved addresses yet — add one above.
                    </li>
                  )}
                </ul>
              </div>

              {/* Payment method */}
              <div className="rounded-card border border-line bg-surface p-[26px]">
                <div className="text-[15px] font-bold text-content">Payment method</div>
                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handlePayment('card')}
                    className={`rounded-btn border p-4 text-left transition-colors ${
                      paymentMethod === 'card' ? 'border-primary bg-primary-soft' : 'border-line bg-background'
                    }`}
                  >
                    <div className="text-sm font-semibold text-content">Card payment</div>
                    <div className="mt-1 text-[12.5px] text-muted">Pay securely online</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePayment('cash')}
                    className={`rounded-btn border p-4 text-left transition-colors ${
                      paymentMethod === 'cash' ? 'border-primary bg-primary-soft' : 'border-line bg-background'
                    }`}
                  >
                    <div className="text-sm font-semibold text-content">Cash on delivery</div>
                    <div className="mt-1 text-[12.5px] text-muted">Pay when it arrives</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="sticky top-24 rounded-card border border-line bg-surface p-[26px]">
              <div className="text-base font-bold text-content">Your order</div>
              <div className="mt-4 flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-[13.5px]">
                    <span className="text-[#CBD5E1]">
                      {item.product.title}{' '}
                      <span className="font-mono text-dim">×{item.quantity}</span>
                    </span>
                    <span className="flex-shrink-0 font-semibold text-content">
                      ${item.product.discountPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-[18px] flex justify-between border-t border-line pt-[18px] text-sm text-muted">
                <span>Shipping</span>
                <span className="font-semibold text-success-text">Free</span>
              </div>
              <div className="mt-3 flex justify-between text-base font-bold text-content">
                <span>Total</span>
                <span>${totalAmount}</span>
              </div>
              <button
                onClick={handleOrder}
                className="mt-[22px] w-full rounded-btn bg-primary px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Place order
              </button>
              <p className="mt-3.5 text-center text-[12px] leading-relaxed text-dim">
                By placing your order you agree to the VISS terms of service.
              </p>
              <Link
                to="/"
                className="mt-3 flex w-full items-center justify-center p-1 text-[13.5px] font-medium text-primary-hover transition-colors hover:text-primary-light"
              >
                Continue shopping →
              </Link>
            </div>
          </div>
        </main>
      )}
    </NavBar>
  );
}

export default Checkout;
