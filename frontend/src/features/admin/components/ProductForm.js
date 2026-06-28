import { useDispatch, useSelector } from 'react-redux';
import {
  clearSelectedProduct,
  createProductAsync,
  fetchProductByIdAsync,
  selectBrands,
  selectCategories,
  selectProductById,
  updateProductAsync,
} from '../../product/productSlice';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Modal from '../../common/Modal';
import { useAlert } from 'react-alert';

const inputCls =
  'w-full rounded-[10px] border border-line bg-background px-3.5 py-[11px] text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelCls = 'mb-[7px] block text-[13px] font-medium text-[#CBD5E1]';

function ProductForm() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const brands = useSelector(selectBrands);
  const categories = useSelector(selectCategories);
  const dispatch = useDispatch();
  const params = useParams();
  const selectedProduct = useSelector(selectProductById);
  const [openModal, setOpenModal] = useState(null);
  const alert = useAlert();

  const colors = [
    { name: 'White', class: 'bg-white', selectedClass: 'ring-gray-400', id: 'white' },
    { name: 'Gray', class: 'bg-gray-200', selectedClass: 'ring-gray-400', id: 'gray' },
    { name: 'Black', class: 'bg-gray-900', selectedClass: 'ring-gray-900', id: 'black' },
  ];

  const sizes = [
    { name: 'XXS', inStock: true, id: 'xxs' },
    { name: 'XS', inStock: true, id: 'xs' },
    { name: 'S', inStock: true, id: 's' },
    { name: 'M', inStock: true, id: 'm' },
    { name: 'L', inStock: true, id: 'l' },
    { name: 'XL', inStock: true, id: 'xl' },
    { name: '2XL', inStock: true, id: '2xl' },
    { name: '3XL', inStock: true, id: '3xl' },
  ];

  useEffect(() => {
    if (params.id) {
      dispatch(fetchProductByIdAsync(params.id));
    } else {
      dispatch(clearSelectedProduct());
    }
  }, [params.id, dispatch]);

  useEffect(() => {
    if (selectedProduct && params.id) {
      setValue('title', selectedProduct.title);
      setValue('description', selectedProduct.description);
      setValue('price', selectedProduct.price);
      setValue('discountPercentage', selectedProduct.discountPercentage);
      setValue('thumbnail', selectedProduct.thumbnail);
      setValue('stock', selectedProduct.stock);
      setValue('image1', selectedProduct.images[0]);
      setValue('image2', selectedProduct.images[1]);
      setValue('image3', selectedProduct.images[2]);
      setValue('brand', selectedProduct.brand);
      setValue('category', selectedProduct.category);
      setValue('tags', (selectedProduct.tags || []).join(', '));
      setValue('highlight1', selectedProduct.highlights[0]);
      setValue('highlight2', selectedProduct.highlights[1]);
      setValue('highlight3', selectedProduct.highlights[2]);
      setValue('highlight4', selectedProduct.highlights[3]);
      setValue('sizes', selectedProduct.sizes.map((size) => size.id));
      setValue('colors', selectedProduct.colors.map((color) => color.id));
    }
  }, [selectedProduct, params.id, setValue]);

  const handleDelete = () => {
    const product = { ...selectedProduct };
    product.deleted = true;
    dispatch(updateProductAsync(product));
  };

  return (
    <main className="mx-auto max-w-[900px] px-5 pb-24 pt-11 sm:px-10">
      <form
        noValidate
        onSubmit={handleSubmit((data) => {
          const product = { ...data };
          product.images = [product.image1, product.image2, product.image3, product.thumbnail];
          product.highlights = [
            product.highlight1,
            product.highlight2,
            product.highlight3,
            product.highlight4,
          ];
          product.rating = 0;
          if (product.colors) {
            product.colors = product.colors.map((color) => colors.find((clr) => clr.id === color));
          }
          if (product.sizes) {
            product.sizes = product.sizes.map((size) => sizes.find((sz) => sz.id === size));
          }
          // Tags = extra category memberships, entered comma-separated.
          product.tags =
            typeof product.tags === 'string'
              ? product.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
              : product.tags || [];
          delete product['image1'];
          delete product['image2'];
          delete product['image3'];
          product.price = +product.price;
          product.stock = +product.stock;
          product.discountPercentage = +product.discountPercentage;
          if (params.id) {
            product.id = params.id;
            product.rating = selectedProduct.rating || 0;
            dispatch(updateProductAsync(product));
            alert.success('Product Updated');
            reset();
          } else {
            dispatch(createProductAsync(product));
            alert.success('Product Created');
            reset();
          }
        })}
      >
        <div className="rounded-card border border-line bg-surface p-8">
          <h2 className="text-[18px] font-bold text-content">
            {params.id ? 'Edit product' : 'Add product'}
          </h2>

          {selectedProduct && selectedProduct.deleted && (
            <p className="mt-3 text-sm font-medium text-error-text">This product is deleted</p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="title" className={labelCls}>Product name</label>
              <input id="title" type="text" className={inputCls} {...register('title', { required: 'name is required' })} />
              {errors.title && <p className="mt-1 text-[12.5px] text-error-text">{errors.title.message}</p>}
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className={labelCls}>Description</label>
              <textarea id="description" rows={3} className={inputCls} {...register('description', { required: 'description is required' })} defaultValue={''} />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="brand" className={labelCls}>Brand</label>
              <select id="brand" className={inputCls} {...register('brand', { required: 'brand is required' })}>
                <option value="">-- choose brand --</option>
                {brands.map((brand) => (
                  <option key={brand.value} value={brand.value}>{brand.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="category" className={labelCls}>Category</label>
              <select id="category" className={inputCls} {...register('category', { required: 'category is required' })}>
                <option value="">-- choose category --</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="tags" className={labelCls}>Extra categories (tags)</label>
              <input
                id="tags"
                type="text"
                placeholder="e.g. gaming, premium — comma separated"
                className={inputCls}
                {...register('tags', {})}
              />
              <p className="mt-1 text-[12px] text-muted">
                Makes the product also show under these categories, on top of its main one
                (e.g. a laptop that also appears under “gaming”).
              </p>
            </div>

            <div className="sm:col-span-6">
              <label className={labelCls}>Colors</label>
              <div className="flex flex-wrap gap-4">
                {colors.map((color) => (
                  <label key={color.id} className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                    <input type="checkbox" value={color.id} className="h-4 w-4 rounded border-line bg-background text-primary focus:ring-primary" {...register('colors', {})} />
                    {color.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className={labelCls}>Sizes</label>
              <div className="flex flex-wrap gap-4">
                {sizes.map((size) => (
                  <label key={size.id} className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                    <input type="checkbox" value={size.id} className="h-4 w-4 rounded border-line bg-background text-primary focus:ring-primary" {...register('sizes', {})} />
                    {size.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="price" className={labelCls}>Price</label>
              <input id="price" type="number" className={inputCls} {...register('price', { required: 'price is required', min: 1, max: 10000 })} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="discountPercentage" className={labelCls}>Discount %</label>
              <input id="discountPercentage" type="number" className={inputCls} {...register('discountPercentage', { required: 'discountPercentage is required', min: 0, max: 100 })} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="stock" className={labelCls}>Stock</label>
              <input id="stock" type="number" className={inputCls} {...register('stock', { required: 'stock is required', min: 0 })} />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="thumbnail" className={labelCls}>Thumbnail</label>
              <input id="thumbnail" type="text" className={inputCls} {...register('thumbnail', { required: 'thumbnail is required' })} />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="image1" className={labelCls}>Image 1</label>
              <input id="image1" type="text" className={inputCls} {...register('image1', { required: 'image1 is required' })} />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="image2" className={labelCls}>Image 2</label>
              <input id="image2" type="text" className={inputCls} {...register('image2', { required: 'image is required' })} />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="image3" className={labelCls}>Image 3</label>
              <input id="image3" type="text" className={inputCls} {...register('image3', { required: 'image is required' })} />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="highlight1" className={labelCls}>Highlight 1</label>
              <input id="highlight1" type="text" className={inputCls} {...register('highlight1', {})} />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="highlight2" className={labelCls}>Highlight 2</label>
              <input id="highlight2" type="text" className={inputCls} {...register('highlight2', {})} />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="highlight3" className={labelCls}>Highlight 3</label>
              <input id="highlight3" type="text" className={inputCls} {...register('highlight3', {})} />
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="highlight4" className={labelCls}>Highlight 4</label>
              <input id="highlight4" type="text" className={inputCls} {...register('highlight4', {})} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-[10px] border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#475569] hover:text-content"
          >
            Cancel
          </button>

          {selectedProduct && !selectedProduct.deleted && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setOpenModal(true);
              }}
              className="rounded-[10px] bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-error/90"
            >
              Delete
            </button>
          )}

          <button
            type="submit"
            className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Save
          </button>
        </div>
      </form>

      {selectedProduct && (
        <Modal
          title={`Delete ${selectedProduct.title}`}
          message="Are you sure you want to delete this Product ?"
          dangerOption="Delete"
          cancelOption="Cancel"
          dangerAction={handleDelete}
          cancelAction={() => setOpenModal(null)}
          showModal={openModal}
        ></Modal>
      )}
    </main>
  );
}

export default ProductForm;
