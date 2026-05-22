import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories?: Category[];
}

interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

interface ProductDetail {
  id: number;
  title: string;
  description: string;
  price: string;
  compare_at_price?: string;
  category?: Category;
  images: ProductImage[];
  stock: number;
  sku: string;
  is_customizable: boolean;
  customization_notes?: string;
  sizes_available: string[];
  fabric_type?: string;
  care_instructions?: string;
  status: 'draft' | 'active' | 'out_of_stock' | 'archived';
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

const VendorProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;
  const isApproved = user?.vendor_profile?.verification_status === 'approved';

  const [flatCategories, setFlatCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saveLoading, setSaveLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [sku, setSku] = useState('');
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [fabricType, setFabricType] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'out_of_stock' | 'archived'>('draft');

  // File Upload State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Flatten nested categories for select dropdown
  const flattenCategories = (cats: Category[], prefix = ''): { id: number; name: string }[] => {
    let list: { id: number; name: string }[] = [];
    cats.forEach(c => {
      list.push({ id: c.id, name: prefix + c.name });
      if (c.subcategories && c.subcategories.length > 0) {
        list = [...list, ...flattenCategories(c.subcategories, prefix + '— ')];
      }
    });
    return list;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get<Category[]>('products/categories/');
        const catsData = Array.isArray(res.data) ? res.data : ((res.data as any).results || []);
        const flattened = flattenCategories(catsData);
        setFlatCategories(flattened);
        // Default category if any exists
        if (flattened.length > 0 && !isEditMode) {
          setCategoryId(String(flattened[0].id));
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isEditMode) return;

      try {
        const res = await api.get<ProductDetail>(`vendor/products/${id}/`);
        const p = res.data;
        setTitle(p.title);
        setDescription(p.description);
        const categoryVal = p.category as any;
        setCategoryId(categoryVal ? (typeof categoryVal === 'object' ? String(categoryVal.id) : String(categoryVal)) : '');
        setPrice(p.price);
        setCompareAtPrice(p.compare_at_price || '');
        setStock(String(p.stock));
        setSku(p.sku || '');
        setIsCustomizable(p.is_customizable);
        setCustomizationNotes(p.customization_notes || '');
        setSelectedSizes(p.sizes_available || []);
        setFabricType(p.fabric_type || '');
        setCareInstructions(p.care_instructions || '');
        setStatus(p.status);
        setExistingImages(p.images || []);
      } catch (err) {
        console.error('Failed to fetch product details:', err);
        alert('Could not fetch product details.');
        navigate('/vendor/products');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      fetchProductDetails();
    }
  }, [id, isEditMode]);

  // Handle files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previews]);
    }
  };

  const removeImagePreview = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    const payload = {
      title,
      description,
      category: categoryId ? Number(categoryId) : null,
      price,
      compare_at_price: compareAtPrice || null,
      stock: Number(stock),
      sku,
      is_customizable: isCustomizable,
      customization_notes: customizationNotes,
      sizes_available: selectedSizes,
      fabric_type: fabricType,
      care_instructions: careInstructions,
      status,
    };

    try {
      let productId = id;

      if (isEditMode) {
        await api.put(`vendor/products/${id}/`, payload);
      } else {
        const res = await api.post<ProductDetail>('vendor/products/create/', payload);
        productId = String(res.data.id);
      }

      // If new images selected, upload them now
      if (imageFiles.length > 0 && productId) {
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
        await api.post(`vendor/products/${productId}/images/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      navigate('/vendor/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Could not save product. Please check the fields and try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link
        to="/vendor/products"
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-body text-sm"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span>Back to Catalog</span>
      </Link>

      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-surface">
          {isEditMode ? 'Edit Heritage Product' : 'Add New Craft Masterpiece'}
        </h2>
        <p className="font-body text-sm text-secondary mt-1">
          Specify catalog attributes, styling parameters, and bespoke custom sizing support.
        </p>
      </div>

      {/* Verification Warning Banner */}
      {!isApproved && (
        <div className="bg-error-container text-on-error-container border border-error/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm backdrop-blur-md bg-opacity-80">
          <span className="material-symbols-outlined text-error text-3xl shrink-0">warning</span>
          <div>
            <h4 className="font-headline text-lg font-bold">Verification Pending</h4>
            <p className="font-body text-sm mt-1 opacity-90">
              Your vendor account is currently pending verification. You cannot create or modify products until your account has been reviewed and approved by the administrator.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="font-headline text-lg font-bold text-primary border-b border-outline-variant/10 pb-3">
              Product Specifications
            </h3>

            {/* Title */}
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Listing Title *
              </label>
              <input
                type="text"
                required
                name="title"
                disabled={!isApproved}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pure Banarasi Silk Saree - Ruby Red"
                className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  required
                  name="category"
                  disabled={!isApproved}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {flatCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Catalog Status *
                </label>
                <select
                  name="status"
                  disabled={!isApproved}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="draft">Draft (Artisan Studio only)</option>
                  <option value="active">Active (Visible on Marketplace)</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  name="price"
                  disabled={!isApproved}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 8500.00"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>

              {/* Original Price */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Compare At Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="compare_at_price"
                  disabled={!isApproved}
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="e.g. 10000.00 (optional)"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stock */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Stock Qty *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  name="stock"
                  disabled={!isApproved}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  SKU Code
                </label>
                <input
                  type="text"
                  name="sku"
                  disabled={!isApproved}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. WEAVE-SLK-001"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Description & Craft Details *
              </label>
              <textarea
                required
                rows={6}
                name="description"
                disabled={!isApproved}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the handloom certificate details, weaving history, and unique texture of the design."
                className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="font-headline text-lg font-bold text-primary border-b border-outline-variant/10 pb-3">
              Couture & Tailoring
            </h3>

            {/* Custom Sizing Switch */}
            <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-outline-variant/20">
              <div>
                <h4 className="font-headline text-sm font-bold text-on-surface">Bespoke Custom Measurements</h4>
                <p className="font-body text-xs text-secondary mt-0.5">
                  Allows customers to input specific chest, waist, and length sizing.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_customizable"
                  disabled={!isApproved}
                  checked={isCustomizable}
                  onChange={(e) => setIsCustomizable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Custom Sizing Notes */}
            {isCustomizable && (
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Tailoring Instructions & Measurement Guide
                </label>
                <textarea
                  rows={3}
                  name="customization_notes"
                  disabled={!isApproved}
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                  placeholder="Specify which parts must be measured (e.g. 'Please provide measurements for shoulder, armhole, chest, and sleeve length')."
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fabric Type */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Fabric details
                </label>
                <input
                  type="text"
                  name="fabric_type"
                  disabled={!isApproved}
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  placeholder="e.g. 100% Organza Silk"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>

              {/* Care Instructions */}
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Care Instructions
                </label>
                <input
                  type="text"
                  name="care_instructions"
                  disabled={!isApproved}
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="e.g. Dry Clean Only"
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Size & Images */}
        <div className="lg:col-span-4 space-y-6">
          {/* Size Select Checkboxes */}
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-headline text-md font-bold text-on-surface border-b border-outline-variant/10 pb-3">
              Sizes Selection
            </h3>
            <p className="font-body text-xs text-secondary">
              Select standard sizes available for direct checkout.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {AVAILABLE_SIZES.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={!isApproved}
                    onClick={() => handleSizeToggle(sz)}
                    className={`px-3 py-2 rounded-lg text-xs font-label font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary border-primary text-on-primary shadow-sm'
                        : 'bg-surface border-outline-variant/30 text-secondary hover:bg-surface-variant/20'
                    } disabled:opacity-50`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-headline text-md font-bold text-on-surface border-b border-outline-variant/10 pb-3">
              Gallery Images
            </h3>

            {/* Existing Images (Edit Mode Only) */}
            {isEditMode && existingImages.length > 0 && (
              <div className="space-y-2">
                <span className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Current Images
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-outline-variant/30">
                      <img src={img.image} alt={img.alt_text} className="w-full h-full object-cover" />
                      {img.is_primary && (
                        <span className="absolute bottom-1 right-1 bg-primary text-on-primary text-[8px] px-1 py-0.5 rounded font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Files */}
            <div className="space-y-3 pt-2">
              <span className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Upload New Image(s)
              </span>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-xl p-4 cursor-pointer transition-all ${!isApproved ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-surface-container-low/20'}`}>
                <span className="material-symbols-outlined text-3xl text-secondary">cloud_upload</span>
                <span className="font-body text-xs text-secondary mt-1">Select files...</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={!isApproved}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="space-y-2">
                <span className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Previews ({imageFiles.length})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-outline-variant/30 group">
                      <img src={src} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        disabled={!isApproved}
                        onClick={() => removeImagePreview(idx)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-error text-white p-0.5 rounded-full flex items-center justify-center disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={saveLoading || !isApproved}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container disabled:bg-secondary/40 transition-colors shadow-md flex justify-center items-center gap-2"
            >
              {saveLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                  Saving Craftsmanship...
                </>
              ) : (
                'Save Product'
              )}
            </button>
            <Link
              to="/vendor/products"
              className="block w-full py-3 border border-outline-variant/40 text-center rounded-xl font-label text-xs uppercase tracking-widest font-bold text-secondary hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </Link>
          </div>

        </div>

      </form>
    </div>
  );

};

export default VendorProductForm;
