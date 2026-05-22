import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface OrderItem {
  id: number;
  product: number;
  product_title: string;
  vendor: number;
  vendor_name: string;
  quantity: number;
  price: string;
  total: string;
  size: string;
  customization_request: string;
  item_status: string;
}

interface Order {
  id: number;
  order_number: string;
  customer: number;
  customer_name: string;
  status: string;
  subtotal: string;
  shipping_charge: string;
  discount: string;
  total: string;
  payment_status: string;
  items: OrderItem[];
  created_at: string;
}

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal States
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [appointmentType, setAppointmentType] = useState('virtual');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 11:30 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review Modal States
  const [selectedReviewItem, setSelectedReviewItem] = useState<OrderItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const openReviewModal = (item: OrderItem) => {
    setSelectedReviewItem(item);
    setShowReviewModal(true);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewSuccess(false);
    setReviewError(null);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReviewItem(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewItem) return;

    setReviewLoading(true);
    setReviewError(null);

    const payload = {
      product: selectedReviewItem.product,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment
    };

    try {
      await api.post('reviews/create/', payload);
      setReviewSuccess(true);
      setTimeout(() => {
        closeReviewModal();
      }, 2000);
    } catch (err: any) {
      console.error('Submitting review failed:', err);
      let errMsg = 'Failed to submit review. Please try again.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errMsg = err.response.data;
        } else if (Array.isArray(err.response.data)) {
          errMsg = err.response.data.join(' ');
        } else if (err.response.data.non_field_errors) {
          errMsg = err.response.data.non_field_errors.join(' ');
        } else if (err.response.data.detail) {
          errMsg = err.response.data.detail;
        } else {
          const errors = Object.values(err.response.data).flat();
          if (errors.length > 0) {
            errMsg = errors.join(' ');
          }
        }
      }
      setReviewError(errMsg);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<any>('orders/');
        setOrders(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err: any) {
        console.error('Failed to fetch orders:', err);
        setError('Unable to load your order history. Please make sure you are logged in.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const openBookingModal = (item: OrderItem) => {
    setSelectedItem(item);
    setShowBookingModal(true);
    setBookingSuccess(false);
    setBookingError(null);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedItem(null);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setBookingLoading(true);
    setBookingError(null);

    const payload = {
      vendor: selectedItem.vendor,
      order_item: selectedItem.id,
      appointment_type: appointmentType,
      date,
      time_slot: timeSlot,
      notes: bookingNotes
    };

    try {
      await api.post('orders/appointments/book/', payload);
      setBookingSuccess(true);
      setTimeout(() => {
        closeBookingModal();
        navigate('/appointments');
      }, 2000);
    } catch (err: any) {
      console.error('Booking appointment failed:', err);
      setBookingError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Failed to book slot. Please select a future date and fill out the details.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Gathering couture order chronicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/15 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Your Order Chronicles</h1>
            <p className="font-body text-xs text-secondary mt-1">
              Track custom stitching progress, view specifications, and schedule measurement calls with masters.
            </p>
          </div>
          <Link
            to="/appointments"
            className="mt-4 md:mt-0 px-4 py-2 border border-primary text-primary hover:bg-primary/5 rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 self-start"
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>View Consultations</span>
          </Link>
        </div>

        {error ? (
          <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 max-w-lg mx-auto text-center">
            <span className="material-symbols-outlined text-4xl mb-2 text-error">gpp_maybe</span>
            <p className="text-sm font-body">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 max-w-md mx-auto">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4">receipt_long</span>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-2">No orders placed yet</h3>
            <p className="font-body text-xs text-secondary mb-6">Your ordered masterpieces will show up here.</p>
            <Link
              to="/products"
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md"
            >
              Explore Certified Weaves
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Top Bar */}
                <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/10 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4 text-xs font-body">
                    <div>
                      <span className="text-secondary block uppercase tracking-wider text-[10px]">Order Number</span>
                      <span className="font-bold text-on-surface">{order.order_number}</span>
                    </div>
                    <div className="border-l border-outline-variant/20 h-8"></div>
                    <div>
                      <span className="text-secondary block uppercase tracking-wider text-[10px]">Date Placed</span>
                      <span className="font-medium text-on-surface">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="border-l border-outline-variant/20 h-8"></div>
                    <div>
                      <span className="text-secondary block uppercase tracking-wider text-[10px]">Total Bill</span>
                      <span className="font-bold text-primary">₹{Number(order.total).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Order Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-secondary text-[10px] font-label uppercase tracking-widest">Order Status</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-wider ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-error-container text-on-error-container' :
                      'bg-primary-fixed text-on-primary-fixed'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="divide-y divide-outline-variant/10">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-headline text-base font-bold text-on-surface">
                            {item.product_title}
                          </h3>
                          <span className="text-xs text-secondary font-body">x{item.quantity}</span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-body text-secondary">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">storefront</span>
                            <span>Studio: <strong className="text-on-surface">{item.vendor_name}</strong></span>
                          </div>
                          <div>
                            <span>Size: <strong className="text-on-surface">{item.size}</strong></span>
                          </div>
                          <div>
                            <span>Price: <strong className="text-on-surface">₹{Number(item.price).toLocaleString('en-IN')}</strong></span>
                          </div>
                          <div>
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-label font-bold uppercase tracking-wider ${
                              item.item_status === 'accepted' ? 'bg-green-50 border border-green-300 text-green-700' :
                              item.item_status === 'rejected' ? 'bg-red-50 border border-red-300 text-red-700' :
                              'bg-yellow-50 border border-yellow-300 text-yellow-700'
                            }`}>
                              Item: {item.item_status}
                            </span>
                          </div>
                        </div>

                        {item.customization_request && (
                          <div className="text-xs font-body text-secondary bg-background p-3 rounded-lg border border-outline-variant/10 max-w-2xl">
                            <strong className="text-on-surface-variant block font-bold uppercase tracking-wider text-[9px] mb-1">
                              Custom tailoring request details:
                            </strong>
                            <p className="whitespace-pre-line italic">"{item.customization_request}"</p>
                          </div>
                        )}
                      </div>

                      {/* Right Action Side: Scheduling Appointment or Writing Review */}
                      <div className="flex gap-2 self-start md:self-center">
                        {item.size === 'Custom' && (item.item_status === 'accepted' || item.item_status === 'pending') && (
                          <button
                            onClick={() => openBookingModal(item)}
                            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">video_call</span>
                            <span>Book Sizing Call</span>
                          </button>
                        )}
                        {item.item_status === 'delivered' && (
                          <button
                            onClick={() => openReviewModal(item)}
                            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">rate_review</span>
                            <span>Write Review</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sizing Appointment Booking Modal */}
        {showBookingModal && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
            <div className="bg-surface-bright border border-outline-variant/20 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
              {/* Modal Header */}
              <div className="bg-primary px-6 py-4 flex justify-between items-center text-on-primary">
                <h3 className="font-headline text-lg font-bold">Schedule Sizing Call</h3>
                <button
                  onClick={closeBookingModal}
                  className="text-on-primary hover:text-primary-fixed-dim focus:outline-none"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                {bookingSuccess ? (
                  <div className="text-center py-6 space-y-3">
                    <span className="material-symbols-outlined text-5xl text-primary animate-bounce">check_circle</span>
                    <h4 className="font-headline text-lg font-bold text-on-surface">Consultation Requested!</h4>
                    <p className="font-body text-xs text-secondary">
                      Your virtual measurement call request has been sent to <strong className="text-primary">{selectedItem.vendor_name}</strong>.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 bg-surface-container-low p-3 rounded-lg border border-outline-variant/10 text-xs font-body">
                      <div>
                        <span className="text-secondary">Item:</span> <strong className="text-on-surface">{selectedItem.product_title}</strong>
                      </div>
                      <div>
                        <span className="text-secondary">Artisan:</span> <strong className="text-primary">{selectedItem.vendor_name}</strong>
                      </div>
                    </div>

                    {bookingError && (
                      <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/20 flex gap-2 items-center text-xs">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{bookingError}</span>
                      </div>
                    )}

                    {/* Appt Type */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Consultation Format
                      </label>
                      <select
                        name="appointment_type"
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                      >
                        <option value="virtual">Virtual Video Measurement (Recommended)</option>
                        <option value="in_person">In-Person Studio Fitting</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Select Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Time Slot */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Select Time Slot *
                      </label>
                      <select
                        name="time_slot"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                      >
                        <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                        <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                        <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                        <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                        <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Notes & Fit Details
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Mention any custom specifications, your waist/chest/shoulder size, or alternative slot preferences."
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary placeholder-secondary/40"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-3 border-t border-outline-variant/10">
                      <button
                        type="button"
                        onClick={closeBookingModal}
                        className="w-1/2 py-2 border border-outline text-secondary hover:text-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bookingLoading}
                        className="w-1/2 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors shadow-md flex items-center justify-center"
                      >
                        {bookingLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                        ) : (
                          'Schedule Consultation'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Write Review Modal */}
        {showReviewModal && selectedReviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
            <div className="bg-surface-bright border border-outline-variant/20 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
              {/* Modal Header */}
              <div className="bg-primary px-6 py-4 flex justify-between items-center text-on-primary">
                <h3 className="font-headline text-lg font-bold">Write a Product Review</h3>
                <button
                  onClick={closeReviewModal}
                  className="text-on-primary hover:text-primary-fixed-dim focus:outline-none"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
                {reviewSuccess ? (
                  <div className="text-center py-6 space-y-3">
                    <span className="material-symbols-outlined text-5xl text-primary animate-bounce">check_circle</span>
                    <h4 className="font-headline text-lg font-bold text-on-surface">Review Submitted!</h4>
                    <p className="font-body text-xs text-secondary">
                      Thank you for sharing your experience. Your review will be visible once approved by our curators.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1 bg-surface-container-low p-3 rounded-lg border border-outline-variant/10 text-xs font-body">
                      <div>
                        <span className="text-secondary">Product:</span> <strong className="text-on-surface">{selectedReviewItem.product_title}</strong>
                      </div>
                      <div>
                        <span className="text-secondary">Studio:</span> <strong className="text-primary">{selectedReviewItem.vendor_name}</strong>
                      </div>
                    </div>

                    {reviewError && (
                      <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/20 flex gap-2 items-center text-xs text-error">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{reviewError}</span>
                      </div>
                    )}

                    {/* Rating Selector */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Your Rating *
                      </label>
                      <select
                        name="rating"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                      >
                        <option value="5">5</option>
                        <option value="4">4</option>
                        <option value="3">3</option>
                        <option value="2">2</option>
                        <option value="1">1</option>
                      </select>
                    </div>

                    {/* Review Title */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Review Title *
                      </label>
                      <input
                        type="text"
                        required
                        name="title"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Summarize your experience..."
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary placeholder-secondary/40"
                      />
                    </div>

                    {/* Review Comment */}
                    <div>
                      <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                        Detailed Feedback *
                      </label>
                      <textarea
                        rows={4}
                        required
                        name="comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell us about the weave quality, fit, and craftsmanship..."
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary placeholder-secondary/40"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-3 border-t border-outline-variant/10">
                      <button
                        type="button"
                        onClick={closeReviewModal}
                        className="w-1/2 py-2 border border-outline text-secondary hover:text-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={reviewLoading}
                        className="w-1/2 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors shadow-md flex items-center justify-center"
                      >
                        {reviewLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderHistory;
