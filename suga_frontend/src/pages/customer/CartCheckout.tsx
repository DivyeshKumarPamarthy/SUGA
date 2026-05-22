import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface CartItem {
  cartItemId: string;
  id: number;
  title: string;
  price: string;
  slug: string;
  image: string;
  vendorName: string;
  vendorId: number;
  size: string;
  customizationRequest: string;
  quantity: number;
}

const CartCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Checkout Form States
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [notes, setNotes] = useState('');

  // UI Status
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  useEffect(() => {
    const loadCart = () => {
      const cartJson = localStorage.getItem('suga_cart');
      if (cartJson) {
        try {
          setCartItems(JSON.parse(cartJson));
        } catch (e) {
          setCartItems([]);
        }
      }
    };
    loadCart();
  }, []);

  const updateQuantity = (cartItemId: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('suga_cart', JSON.stringify(updated));
  };

  const removeItem = (cartItemId: string) => {
    const updated = cartItems.filter(item => item.cartItemId !== cartItemId);
    setCartItems(updated);
    localStorage.setItem('suga_cart', JSON.stringify(updated));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  };

  const handleOpenPaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/cart');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }

    setError(null);
    setShowPaymentModal(true);
  };

  const submitOrder = async (simulatedPaymentStatus: 'paid' | 'unpaid') => {
    setLoading(true);
    setError(null);
    setShowPaymentModal(false);

    // Format the payload to match OrderCreateSerializer
    const payload = {
      shipping_name: shippingName,
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_state: shippingState,
      shipping_pincode: shippingPincode,
      shipping_phone: shippingPhone,
      notes: notes,
      status: simulatedPaymentStatus === 'paid' ? 'confirmed' : 'pending',
      payment_status: simulatedPaymentStatus,
      items: cartItems.map(item => ({
        product: item.id,
        quantity: item.quantity,
        size: item.size,
        customization_request: item.customizationRequest
      }))
    };

    try {
      const res = await api.post('orders/place/', payload);
      // Success! Clear LocalStorage Cart
      localStorage.removeItem('suga_cart');
      setCartItems([]);
      setOrderSuccess(res.data);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Could not place the order. Please ensure shipping fields are valid.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="bg-background text-on-background min-h-screen py-16 px-6">
        <div className="max-w-2xl mx-auto text-center bg-surface-container-low border border-outline-variant/20 p-8 md:p-12 rounded-3xl shadow-xl space-y-6">
          <span className="material-symbols-outlined text-6xl text-primary animate-pulse">verified</span>
          
          <h1 className="font-headline text-3xl font-bold text-on-surface">Order Placed Successfully!</h1>
          <p className="font-body text-sm text-secondary">
            Your premium heritage creation order has been requested. The artisan will verify specifications and confirm shortly.
          </p>

          <div className="bg-surface p-6 rounded-xl border border-outline-variant/10 text-left space-y-2">
            <div className="flex justify-between text-xs font-label text-secondary">
              <span>Order Number</span>
              <span className="font-bold text-on-surface">{orderSuccess.order_number}</span>
            </div>
            <div className="flex justify-between text-xs font-label text-secondary">
              <span>Total Value</span>
              <span className="font-bold text-primary">₹{Number(orderSuccess.total).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs font-label text-secondary">
              <span>Status</span>
              <span className="font-semibold text-yellow-600 uppercase tracking-widest text-[9px]">{orderSuccess.status}</span>
            </div>
          </div>

          <p className="font-body text-xs text-secondary">
            💡 For custom orders, you can now schedule your digital measurement or atelier fitting session!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/orders"
              className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md"
            >
              Schedule Consultation
            </Link>
            <Link
              to="/products"
              className="px-6 py-3 border border-outline text-secondary hover:text-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-variant/20 transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-primary mb-8">Shopping Bag & Checkout</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 max-w-lg mx-auto">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4">shopping_bag</span>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-2">Your bag is empty</h3>
            <p className="font-body text-xs text-secondary mb-6">Explore Indian heritage looms and bespoke couture to add items.</p>
            <Link
              to="/products"
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
                <h2 className="font-headline text-xl font-bold text-on-surface border-b border-outline-variant/10 pb-4">
                  Bag Items ({cartItems.length})
                </h2>

                <div className="divide-y divide-outline-variant/10">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="py-6 flex gap-4 first:pt-0 last:pb-0">
                      {/* Image */}
                      <div className="h-24 w-20 flex-shrink-0 bg-surface-variant rounded-lg overflow-hidden border border-outline-variant/20">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-secondary">image</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Specs */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-headline text-sm font-bold text-on-surface line-clamp-1 hover:text-primary transition-colors">
                                <Link to={`/products/${item.slug}`}>{item.title}</Link>
                              </h3>
                              <p className="text-[10px] font-label text-primary uppercase tracking-wider">
                                {item.vendorName}
                              </p>
                            </div>
                            <span className="font-body text-sm font-bold text-on-surface">
                              ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <span className="text-[10px] font-label bg-surface border border-outline-variant/30 text-secondary px-2 py-0.5 rounded">
                              Size: {item.size}
                            </span>
                            {item.size === 'Custom' && (
                              <span className="text-[10px] font-label bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Bespoke Fitting
                              </span>
                            )}
                          </div>

                          {item.customizationRequest && (
                            <p className="text-[10px] font-body text-secondary italic bg-surface p-2 rounded border border-outline-variant/15 mt-2 max-w-md line-clamp-2">
                              <strong>Request:</strong> {item.customizationRequest}
                            </p>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex justify-between items-center pt-3 mt-2 border-t border-outline-variant/5">
                          <div className="flex items-center border border-outline-variant/30 rounded-lg overflow-hidden bg-surface">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, -1)}
                              className="px-2 py-1 text-secondary hover:text-primary hover:bg-surface-variant/20 disabled:opacity-30 transition-colors"
                            >
                              <span className="material-symbols-outlined text-xs font-bold">remove</span>
                            </button>
                            <span className="px-3 py-1 font-body text-xs font-bold text-on-surface">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, 1)}
                              className="px-2 py-1 text-secondary hover:text-primary hover:bg-surface-variant/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-xs font-bold">add</span>
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="text-xs text-error font-label font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Checkout Shipping Form */}
            <form onSubmit={handleOpenPaymentModal} className="lg:col-span-5 space-y-6">
              {error && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 flex gap-2 items-center">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="text-xs font-body">{error}</span>
                </div>
              )}

              {/* Order Summary Card */}
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-4">
                <h3 className="font-headline text-lg font-bold text-on-surface">Bag Summary</h3>
                <div className="space-y-2 text-xs font-body text-secondary border-b border-outline-variant/15 pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-on-surface">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-primary-fixed-dim uppercase font-bold text-[10px]">Free Heritage Courier</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline font-headline text-base font-bold text-on-surface">
                  <span>Grand Total</span>
                  <span className="text-primary text-xl">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Shipping Form Card */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-4">
                <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  Shipping & Delivery Address
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      name="shipping_name"
                      required
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                      Street Address & Studio Number *
                    </label>
                    <textarea
                      rows={2}
                      name="shipping_address"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g. 102, Crescent Road, Indiranagar"
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="shipping_city"
                        required
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="e.g. Bengaluru"
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="shipping_state"
                        required
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        placeholder="e.g. Karnataka"
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Pincode / Postal Code *
                      </label>
                      <input
                        type="text"
                        name="shipping_pincode"
                        required
                        value={shippingPincode}
                        onChange={(e) => setShippingPincode(e.target.value)}
                        placeholder="e.g. 560038"
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="shipping_phone"
                        required
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                      Order Special Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Please wrap as gift / leave with security."
                      className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {!isAuthenticated ? (
                  <Link
                    to="/login?redirect=/cart"
                    className="w-full flex justify-center py-3 bg-secondary text-on-secondary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-on-surface-variant transition-colors shadow-md block text-center"
                  >
                    Log In to Complete Checkout
                  </Link>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-on-primary rounded-xl font-label text-sm uppercase tracking-widest font-bold hover:bg-primary-container disabled:bg-secondary/40 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm font-bold animate-pulse">lock</span>
                        <span>Place Heritage Order</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Premium Mock Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div 
            className="bg-surface-container-low border border-outline-variant/30 w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-6 mx-4 relative animate-fade-in transform scale-100 transition-transform duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-primary animate-bounce">security</span>
              <h2 className="font-headline text-2xl font-bold text-on-surface">Simulated Secure Checkout</h2>
              <p className="font-body text-xs text-secondary max-w-sm mx-auto">
                SUGA respects artisan heritage. During this development validation phase, live Razorpay payments are disabled. Please choose a simulated completion path.
              </p>
            </div>

            {/* Order total info */}
            <div className="bg-surface-variant/40 p-4 rounded-xl border border-outline-variant/10 text-center space-y-1">
              <span className="text-[10px] font-label text-secondary uppercase tracking-widest">Amount Due</span>
              <div className="font-headline text-2xl font-bold text-primary">
                ₹{calculateSubtotal().toLocaleString('en-IN')}
              </div>
              <div className="text-[9px] font-body text-secondary">
                Free Heritage Courier & Packaging Included
              </div>
            </div>

            {/* Payment buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => submitOrder('paid')}
                className="w-full flex items-center justify-between px-5 py-4 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary/95 transition-all shadow-md group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">credit_card</span>
                  <span className="text-left font-bold text-xs">Simulate Card/UPI Success</span>
                </div>
                <span className="material-symbols-outlined text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={() => submitOrder('unpaid')}
                className="w-full flex items-center justify-between px-5 py-4 border border-primary text-primary hover:bg-primary/5 rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-all group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">payments</span>
                  <span className="font-bold text-xs">Pay Later / Cash on Delivery</span>
                </div>
                <span className="material-symbols-outlined text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </button>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
              <div className="flex items-center gap-1.5 text-secondary text-[10px]">
                <span className="material-symbols-outlined text-xs">verified_user</span>
                <span>Demo Environment</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-secondary hover:text-primary font-label font-bold uppercase tracking-wider transition-colors"
              >
                Cancel & Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartCheckout;
