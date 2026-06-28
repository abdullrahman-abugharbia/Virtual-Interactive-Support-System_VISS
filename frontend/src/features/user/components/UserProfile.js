import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUserInfo, updateUserAsync } from '../userSlice';
import { useForm } from 'react-hook-form';

const inputCls =
  'w-full rounded-[10px] border border-line bg-background px-3.5 py-[11px] text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelCls = 'mb-[7px] block text-[13px] font-medium text-[#CBD5E1]';

function initialsFor(userInfo) {
  const source = (userInfo?.name || userInfo?.email || 'V').trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (letters || source[0] || 'V').toUpperCase();
}

function AddressFields({ register, errors }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="name" className={labelCls}>Full name</label>
        <input id="name" type="text" className={inputCls} {...register('name', { required: 'name is required' })} />
        {errors.name && <p className="mt-1 text-[12.5px] text-error-text">{errors.name.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="email" className={labelCls}>Email address</label>
        <input id="email" type="email" className={inputCls} {...register('email', { required: 'email is required' })} />
        {errors.email && <p className="mt-1 text-[12.5px] text-error-text">{errors.email.message}</p>}
      </div>
      <div className="sm:col-span-2">
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
        <input id="state" type="text" className={inputCls} {...register('state', { required: 'state is required' })} />
        {errors.state && <p className="mt-1 text-[12.5px] text-error-text">{errors.state.message}</p>}
      </div>
      <div>
        <label htmlFor="pinCode" className={labelCls}>ZIP / Postal code</label>
        <input id="pinCode" type="text" className={inputCls} {...register('pinCode', { required: 'pinCode is required' })} />
        {errors.pinCode && <p className="mt-1 text-[12.5px] text-error-text">{errors.pinCode.message}</p>}
      </div>
      <div>
        <label htmlFor="phone" className={labelCls}>Phone</label>
        <input id="phone" type="tel" className={inputCls} {...register('phone', { required: 'phone is required' })} />
        {errors.phone && <p className="mt-1 text-[12.5px] text-error-text">{errors.phone.message}</p>}
      </div>
    </div>
  );
}

export default function UserProfile() {
  const dispatch = useDispatch();
  const rawUserInfo = useSelector(selectUserInfo);
  const userInfo = rawUserInfo
    ? { ...rawUserInfo, addresses: Array.isArray(rawUserInfo.addresses) ? rawUserInfo.addresses : [] }
    : null;
  const [selectedEditIndex, setSelectedEditIndex] = useState(-1);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const handleEdit = (addressUpdate, index) => {
    const addresses = [...userInfo.addresses];
    addresses.splice(index, 1, addressUpdate);
    dispatch(updateUserAsync({ id: userInfo.id, addresses }));
    setSelectedEditIndex(-1);
  };
  const handleRemove = (e, index) => {
    const addresses = [...userInfo.addresses];
    addresses.splice(index, 1);
    dispatch(updateUserAsync({ id: userInfo.id, addresses }));
  };

  const handleEditForm = (index) => {
    setSelectedEditIndex(index);
    setShowAddAddressForm(false);
    const address = userInfo.addresses[index];
    setValue('name', address.name);
    setValue('email', address.email);
    setValue('city', address.city);
    setValue('state', address.state);
    setValue('pinCode', address.pinCode);
    setValue('phone', address.phone);
    setValue('street', address.street);
  };

  const handleAdd = (address) => {
    dispatch(updateUserAsync({ id: userInfo.id, addresses: [...userInfo.addresses, address] }));
    setShowAddAddressForm(false);
  };

  if (!userInfo) return null;

  const openAddForm = () => {
    setShowAddAddressForm(true);
    setSelectedEditIndex(-1);
    reset();
  };

  return (
    <main className="mx-auto max-w-[760px] px-5 pb-24 pt-11 sm:px-10">
      <h1 className="text-[30px] font-bold tracking-[-0.02em] text-content">My Profile</h1>

      {/* Identity card */}
      <div className="mt-8 flex items-center gap-5 rounded-card border border-line bg-surface p-[26px]">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-logo-gradient text-[21px] font-bold text-white">
          {initialsFor(userInfo)}
        </span>
        <div className="min-w-0">
          <div className="text-[18px] font-bold text-content">{userInfo.name || 'New User'}</div>
          <div className="mt-1 text-[13.5px] text-muted">{userInfo.email}</div>
          {userInfo.role === 'admin' && (
            <div className="mt-1 text-[12px] font-medium uppercase tracking-wide text-primary-hover">
              {userInfo.role}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={openAddForm}
          className="rounded-[10px] border border-line bg-surface-raised px-[18px] py-2.5 text-[13.5px] font-semibold text-[#CBD5E1] transition-colors hover:border-[#475569] hover:text-content"
        >
          Edit profile
        </button>
      </div>

      {/* Saved addresses */}
      <div className="mt-9 flex items-baseline justify-between">
        <h2 className="text-[18px] font-bold text-content">Saved addresses</h2>
        <button
          onClick={openAddForm}
          className="text-[13.5px] font-semibold text-primary-hover transition-colors hover:text-primary-light"
        >
          + Add new address
        </button>
      </div>

      {showAddAddressForm && (
        <form
          className="mt-4 rounded-card border border-line bg-surface p-[26px]"
          noValidate
          onSubmit={handleSubmit((data) => {
            handleAdd(data);
            reset();
          })}
        >
          <div className="mb-4 text-[15px] font-bold text-content">New address</div>
          <AddressFields register={register} errors={errors} />
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddAddressForm(false)}
              className="rounded-[10px] px-4 py-2 text-[13.5px] font-semibold text-muted transition-colors hover:text-content"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-[10px] bg-primary px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Add address
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {userInfo.addresses.map((address, index) => (
          <div key={index}>
            {selectedEditIndex === index ? (
              <form
                className="rounded-card border border-line bg-surface p-[26px]"
                noValidate
                onSubmit={handleSubmit((data) => {
                  handleEdit(data, index);
                  reset();
                })}
              >
                <div className="mb-4 text-[15px] font-bold text-content">Edit address</div>
                <AddressFields register={register} errors={errors} />
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEditIndex(-1)}
                    className="rounded-[10px] px-4 py-2 text-[13.5px] font-semibold text-muted transition-colors hover:text-content"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-[10px] bg-primary px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Save address
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-5 rounded-[14px] border border-line bg-surface px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold text-content">{address.name}</div>
                  <div className="mt-1 text-[13px] leading-[1.55] text-muted">
                    {address.street}
                    <br />
                    {address.city} · {address.phone}
                  </div>
                </div>
                <button
                  onClick={() => handleEditForm(index)}
                  type="button"
                  className="text-[13px] font-semibold text-primary-hover transition-colors hover:text-primary-light"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => handleRemove(e, index)}
                  type="button"
                  className="text-[13px] font-semibold text-dim transition-colors hover:text-error-text"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
