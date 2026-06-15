import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProductByIdAsync,
  selectProductById,
  selectProductListStatus,
} from '../productSlice';
import { Link, useParams } from 'react-router-dom';
import { addToCartAsync, selectItems } from '../../cart/cartSlice';
import { useAlert } from 'react-alert';
import { Grid } from 'react-loader-spinner';
import ProductImage from '../../common/ProductImage';

export default function ProductDetail() {
  const [selectedColor, setSelectedColor] = useState(null);
  const items = useSelector(selectItems);
  const product = useSelector(selectProductById);
  const dispatch = useDispatch();
  const params = useParams();
  const alert = useAlert();
  const status = useSelector(selectProductListStatus);

  const handleCart = (e) => {
    e.preventDefault();
    if (items.findIndex((item) => item.product.id === product.id) < 0) {
      const newItem = { product: product.id, quantity: 1 };
      if (selectedColor) {
        newItem.color = selectedColor;
      }
      dispatch(addToCartAsync({ item: newItem, alert }));
    } else {
      alert.error('Item Already added');
    }
  };

  useEffect(() => {
    dispatch(fetchProductByIdAsync(params.id));
  }, [dispatch, params.id]);

  const outOfStock = product && product.stock <= 0;
  const lowStock = product && product.stock > 0 && product.stock <= 10;
  const stockLabel = outOfStock
    ? 'Out of stock'
    : lowStock
    ? `Only ${product.stock} left`
    : 'In stock';
  const stockColor = outOfStock
    ? 'text-error-text'
    : lowStock
    ? 'text-warning'
    : 'text-success-text';
  const discount =
    product && product.price > 0
      ? Math.round((1 - product.discountPrice / product.price) * 100)
      : 0;

  return (
    <div className="bg-background">
      {status === 'loading' && (
        <div className="flex justify-center py-24">
          <Grid height="70" width="70" color="#6366F1" ariaLabel="grid-loading" radius="12.5" visible={true} />
        </div>
      )}

      {product && (
        <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-9 sm:px-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-dim">
            <Link to="/" className="text-muted transition-colors hover:text-primary-lighter">
              Products
            </Link>
            {product.category && (
              <>
                <span className="text-line">/</span>
                <span>{product.category}</span>
              </>
            )}
            <span className="text-line">/</span>
            <span className="text-[#CBD5E1]">{product.title}</span>
          </nav>

          <div className="mt-7 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            {/* Left: gallery */}
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-card-lg border border-line bg-surface">
                <ProductImage
                  src={product.images?.[0] || product.thumbnail}
                  alt={product.title}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="mt-3.5 grid grid-cols-3 gap-3.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface"
                  >
                    <ProductImage
                      src={product.images?.[i] || product.thumbnail}
                      alt={`${product.title} ${i}`}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: info */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-hover">
                {product.brand}
              </div>
              <h1 className="mt-2.5 text-[32px] font-bold leading-tight tracking-[-0.02em] text-content">
                {product.title}
              </h1>

              <div className="mt-3.5 flex items-center gap-3.5 text-sm">
                <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                  <span className="text-primary-hover">★</span>
                  {product.rating}
                </span>
                <span className="text-line">·</span>
                <span className={`font-medium ${stockColor}`}>{stockLabel}</span>
              </div>

              <div className="mt-[22px] flex items-baseline gap-3">
                <span className="text-[34px] font-bold tracking-[-0.02em] text-content">
                  ${product.discountPrice}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-[17px] text-dim line-through">${product.price}</span>
                    <span className="rounded-full border border-primary/40 bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary-light">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Color swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-7">
                  <div className="mb-2.5 text-[13px] font-semibold text-[#CBD5E1]">
                    Color
                    {selectedColor && (
                      <span className="font-normal text-muted"> — {selectedColor.name}</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        title={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`h-[34px] w-[34px] rounded-full ring-offset-2 ring-offset-background transition-shadow ${color.class} ${
                          selectedColor?.name === color.name
                            ? 'ring-2 ring-primary-hover'
                            : 'ring-1 ring-line'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add to cart */}
              {outOfStock ? (
                <button
                  disabled
                  className="mt-[30px] w-full cursor-not-allowed rounded-btn border border-line bg-surface px-6 py-[15px] text-[15px] font-semibold text-dim"
                >
                  Out of stock
                </button>
              ) : (
                <button
                  onClick={handleCart}
                  type="button"
                  className="mt-[30px] w-full rounded-btn bg-primary px-6 py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  Add to cart
                </button>
              )}

              {/* Description */}
              <div className="mt-8 border-t border-line-subtle pt-[26px]">
                <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
                  Description
                </div>
                <p className="mt-3 text-[14.5px] leading-[1.7] text-muted">
                  {product.description}
                </p>
              </div>

              {/* Highlights */}
              {product.highlights && product.highlights.filter(Boolean).length > 0 && (
                <div className="mt-6">
                  <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
                    Highlights
                  </div>
                  <div className="mt-3 flex flex-col gap-2.5">
                    {product.highlights.filter(Boolean).map((highlight) => (
                      <div
                        key={highlight}
                        className="flex gap-2.5 text-sm leading-[1.5] text-[#CBD5E1]"
                      >
                        <span className="font-bold text-success">✓</span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
