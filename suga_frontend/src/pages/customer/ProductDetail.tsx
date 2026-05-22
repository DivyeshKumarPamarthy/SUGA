import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface VendorProfile {
  shop_name: string;
  description: string;
  city: string;
}

interface Vendor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  vendor_profile?: VendorProfile;
}

interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: string;
  compare_at_price?: string;
  vendor: Vendor;
  category: Category;
  images: ProductImage[];
  stock: number;
  sku: string;
  is_customizable: boolean;
  customization_notes?: string;
  sizes_available: string[];
  fabric_type?: string;
  care_instructions?: string;
  avg_rating: number;
  total_sold: number;
}

interface Review {
  id: number;
  customer: number;
  customer_name: string;
  product: number;
  product_title: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  moderation_status: string;
  created_at: string;
}

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection states
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [customizationText, setCustomizationText] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get<Product>(`products/${slug}/`);
        setProduct(res.data);
        if (res.data.images && res.data.images.length > 0) {
          // Find primary image or use first image
          const primary = res.data.images.find(img => img.is_primary) || res.data.images[0];
          setSelectedImage(primary.image);
        }
        // Set default size if available
        if (res.data.sizes_available && res.data.sizes_available.length > 0) {
          setSelectedSize(res.data.sizes_available[0]);
        } else if (res.data.is_customizable) {
          setSelectedSize('Custom');
        }
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError('Heritage couture item not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!product) return;
      setReviewsLoading(true);
      try {
        const res = await api.get<any>(`reviews/?product=${product.id}`);
        setReviews(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [product?.id]);

  const handleAddToCart = () => {
    if (!product) return;

    // Get current cart items from LocalStorage
    const cartJson = localStorage.getItem('suga_cart');
    let cart: any[] = [];
    if (cartJson) {
      try {
        cart = JSON.parse(cartJson);
      } catch (e) {
        cart = [];
      }
    }

    // Unique cart item key based on product ID, selected size, and customization
    const cartItemId = `${product.id}-${selectedSize}-${customizationText.slice(0, 10)}`;

    const existingIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        cartItemId,
        id: product.id, // backend product id
        title: product.title,
        price: product.price,
        slug: product.slug,
        image: selectedImage || (product.images?.[0]?.image),
        vendorName: product.vendor?.vendor_profile?.shop_name || product.vendor?.username || 'Artisan Loom',
        vendorId: product.vendor?.id,
        size: selectedSize,
        customizationRequest: customizationText,
        quantity,
      });
    }

    localStorage.setItem('suga_cart', JSON.stringify(cart));
    
    // Show success feedback
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-lg text-primary italic">Unveiling Artisan Masterpiece...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">drafts</span>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Item Unavailable</h2>
        <p className="font-body text-sm text-secondary mb-6">{error || 'This product is no longer active.'}</p>
        <Link
          to="/products"
          className="px-6 py-2 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-sm"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-background text-on-background min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-8 font-body text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Back to Certified Weaves</span>
        </Link>

        {/* Success Toast */}
        {addedToCart && (
          <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface py-3 px-5 rounded-lg shadow-xl flex items-center gap-3 border border-outline-variant/20 animate-bounce">
            <span className="material-symbols-outlined text-primary-fixed-dim fill-primary-fixed-dim">check_circle</span>
            <div className="text-sm font-body">
              <span className="font-semibold">Added to shopping bag!</span> Check your cart to verify custom sizing.
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="ml-2 text-xs font-bold uppercase tracking-wider text-primary-fixed-dim hover:underline"
            >
              View Cart
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Images Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-secondary">image</span>
                </div>
              )}

              {product.is_customizable && (
                <div className="absolute top-4 left-4 bg-primary/95 text-on-primary text-xs font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md">
                  Custom Fit Consultation Included
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image)}
                    className={`h-20 w-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img.image ? 'border-primary shadow-sm scale-95' : 'border-transparent hover:border-outline-variant/30'
                    }`}
                  >
                    <img src={img.image} alt={img.alt_text || product.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Customizer */}
          <div className="space-y-6">
            {/* Title, Category, Vendor */}
            <div className="space-y-2 border-b border-outline-variant/15 pb-6">
              <div className="flex items-center justify-between text-xs font-label uppercase tracking-widest text-secondary">
                <span>{product.category.name}</span>
                <span className="font-semibold text-primary">SKU: {product.sku || 'N/A'}</span>
              </div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">
                {product.title}
              </h1>

              {/* Artisan Profile Box */}
              <div className="flex items-center gap-3 pt-2">
                <span className="material-symbols-outlined text-primary text-xl">storefront</span>
                <div className="text-sm font-body">
                  <span className="text-secondary">Crafted by </span>
                  <span className="font-bold text-on-surface hover:text-primary cursor-pointer transition-colors">
                    {product.vendor.vendor_profile?.shop_name || product.vendor.username}
                  </span>
                  {product.vendor.vendor_profile?.city && (
                    <span className="text-secondary text-xs"> — {product.vendor.vendor_profile.city}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Rating */}
            <div className="flex items-baseline justify-between py-2">
              <div className="flex items-baseline gap-3">
                <span className="font-headline text-3xl font-bold text-primary">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </span>
                {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                  <span className="font-body text-lg text-secondary line-through">
                    ₹{Number(product.compare_at_price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {product.avg_rating > 0 && (
                <div className="flex items-center gap-1 text-sm text-yellow-600 font-semibold bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  <span className="material-symbols-outlined text-sm fill-yellow-600">star</span>
                  <span>{product.avg_rating}</span>
                  <span className="text-xs text-secondary font-normal">({product.total_sold} orders)</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="font-body text-sm leading-relaxed text-secondary border-b border-outline-variant/15 pb-6">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>

            {/* Customizer / Sizing Selector */}
            <div className="space-y-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
              <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">straighten</span>
                Select Size & Custom Specifications
              </h3>

              {/* Sizes Available Chips */}
              <div className="space-y-2">
                <span className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Available Sizes
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes_available && product.sizes_available.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        setSelectedSize(sz);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-label font-bold transition-all border ${
                        selectedSize === sz
                          ? 'bg-primary border-primary text-on-primary shadow-sm'
                          : 'bg-surface border-outline-variant/30 text-secondary hover:bg-surface-variant/20'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}

                  {/* Custom option */}
                  {product.is_customizable && (
                    <button
                      onClick={() => setSelectedSize('Custom')}
                      className={`px-4 py-2 rounded-lg text-xs font-label font-bold transition-all border flex items-center gap-1 ${
                        selectedSize === 'Custom'
                          ? 'bg-primary border-primary text-on-primary shadow-sm'
                          : 'bg-surface-bright border-outline text-primary hover:bg-surface-variant/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">tune</span>
                      Custom Measurement
                    </button>
                  )}
                </div>
              </div>

              {/* Sizing Detail / Custom Request Form */}
              {(selectedSize === 'Custom' || product.is_customizable) && (
                <div className="space-y-3 pt-2 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center">
                    <span className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Tailoring Requirements & Measurements
                    </span>
                    <span className="text-[10px] bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-label font-bold uppercase tracking-wider">
                      Bespoke Tailoring
                    </span>
                  </div>
                  
                  {product.customization_notes && (
                    <p className="text-xs font-body text-secondary italic bg-surface p-3 rounded-lg border border-outline-variant/20">
                      <strong>Artisan Note:</strong> {product.customization_notes}
                    </p>
                  )}

                  <textarea
                    rows={4}
                    value={customizationText}
                    onChange={(e) => setCustomizationText(e.target.value)}
                    placeholder="Enter your custom sizes (e.g. Chest: 38&quot;, Waist: 32&quot;, Height: 5'8&quot;) or specific styling requests (sleeves, neck design, color preference)."
                    className="w-full bg-surface border border-outline-variant/30 rounded-xl p-3 text-sm font-body text-on-surface focus:outline-none focus:border-primary placeholder-secondary/50"
                  />
                  <p className="text-[10px] text-secondary font-body">
                    * Booking a virtual measurement call will be available in your Order History page immediately after checkout!
                  </p>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/10">
                <div className="flex items-center border border-outline-variant/30 rounded-lg overflow-hidden bg-surface">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-secondary hover:text-primary hover:bg-surface-variant/20 disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">remove</span>
                  </button>
                  <span className="px-4 py-2 font-body text-sm font-bold text-on-surface select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3 py-2 text-secondary hover:text-primary hover:bg-surface-variant/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-grow flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label text-sm uppercase tracking-widest font-bold hover:bg-primary-container disabled:bg-secondary/40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 duration-100"
                >
                  <span className="material-symbols-outlined">shopping_bag</span>
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}</span>
                </button>
              </div>
            </div>

            {/* Details and care details */}
            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/15 pt-6 font-body text-xs text-secondary">
              {product.fabric_type && (
                <div className="space-y-1">
                  <span className="block font-bold text-on-surface-variant uppercase tracking-wider">Fabric Type</span>
                  <span>{product.fabric_type}</span>
                </div>
              )}
              {product.care_instructions && (
                <div className="space-y-1">
                  <span className="block font-bold text-on-surface-variant uppercase tracking-wider">Care Instructions</span>
                  <span>{product.care_instructions}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="block font-bold text-on-surface-variant uppercase tracking-wider">Authenticity</span>
                <span className="text-primary font-medium flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Handloom Certified
                </span>
              </div>
              <div className="space-y-1">
                <span className="block font-bold text-on-surface-variant uppercase tracking-wider">Availability</span>
                <span>{isOutOfStock ? 'Out of stock' : `${product.stock} items left in studio`}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-outline-variant/15 mt-16 pt-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/15 pb-6">
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">Curated Reviews & Feedback</h2>
              <p className="font-body text-xs text-secondary mt-1">
                Authentic testimonials from patrons who have acquired this masterpiece.
              </p>
            </div>
            {product.avg_rating > 0 && (
              <div className="mt-4 md:mt-0 flex items-center gap-4 bg-surface-container-low px-5 py-3 rounded-2xl border border-outline-variant/10">
                <div className="text-center border-r border-outline-variant/20 pr-4">
                  <span className="font-headline text-3xl font-bold text-primary block">
                    {Number(product.avg_rating).toFixed(1)}
                  </span>
                  <span className="font-label text-[10px] text-secondary uppercase tracking-widest font-bold">Average Rating</span>
                </div>
                <div className="space-y-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-outlined text-sm ${
                          star <= Math.round(product.avg_rating) ? 'text-amber-500 fill-amber-500' : 'text-outline-variant'
                        }`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="font-body text-xs text-secondary block">
                    Based on {reviews.length} {reviews.length === 1 ? 'curated review' : 'curated reviews'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 max-w-md mx-auto">
              <span className="material-symbols-outlined text-4xl text-secondary mb-3">rate_review</span>
              <h3 className="font-headline text-base font-bold text-on-surface mb-1">No reviews yet</h3>
              <p className="font-body text-xs text-secondary">Be the first to share your experience after acquiring this item.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Rating, Verified Badge & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`material-symbols-outlined text-base ${
                              star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-outline-variant'
                            }`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full font-label font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[10px] fill-green-700">verified</span>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="font-body text-[10px] text-secondary">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-1">
                    <h4 className="font-headline text-sm font-bold text-on-surface">
                      {review.title}
                    </h4>
                    <p className="font-body text-xs text-secondary leading-relaxed">
                      {review.comment}
                    </p>
                  </div>

                  {/* Reviewer Name */}
                  <div className="flex items-center gap-2 border-t border-outline-variant/10 pt-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary font-headline">
                      {review.customer_name ? review.customer_name[0] : 'P'}
                    </div>
                    <span className="font-body text-xs font-semibold text-on-surface">
                      {review.customer_name || 'Anonymous Patron'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
