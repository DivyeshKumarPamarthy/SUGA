import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

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
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const ReviewModeration: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('admin-panel/reviews/pending/');
      setReviews(Array.isArray(response.data) ? response.data : response.data.results || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setError('Could not connect to backend API. Loading local design simulation data.');
      // Mock Fallback Data
      setReviews([
        {
          id: 1,
          customer: 5,
          customer_name: 'Anjali Deshmukh',
          product: 12,
          product_title: 'Bespoke Crimson Kanjeevaram Lehenga',
          rating: 5,
          title: 'Exquisite Crafts, perfect sizing!',
          comment: 'The tailoring call was extremely thorough. They helped me take measurements correctly over Zoom and the fit is perfect. The handloom silk is heavy and authentic. Worth every rupee.',
          is_verified_purchase: true,
          moderation_status: 'pending',
          created_at: '2026-05-20T14:45:00Z'
        },
        {
          id: 2,
          customer: 6,
          customer_name: 'Vikram Malhotra',
          product: 15,
          product_title: 'Raw Silk Bandhgala Jacket',
          rating: 2,
          title: 'Sizing was a bit loose, details are good',
          comment: 'The stitch quality is excellent, but it was too loose around the shoulders. I had to get local alterations. Maybe a warning about sizing margins is needed.',
          is_verified_purchase: true,
          moderation_status: 'pending',
          created_at: '2026-05-21T05:30:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleModerate = async (reviewId: number, action: 'approve' | 'reject') => {
    setSubmittingId(reviewId);
    try {
      await api.post(`admin-panel/reviews/${reviewId}/moderate/`, { action });
      // Remove from list
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err: any) {
      console.error('Failed to moderate review:', err);
      // Fallback state update for mockup demo
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } finally {
      setSubmittingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-primary">
        {Array.from({ length: 5 }).map((_, idx) => (
          <span
            key={idx}
            className={`material-symbols-outlined text-base ${
              idx < rating ? 'fill-1 font-variation-fill' : ''
            }`}
            style={{ fontVariationSettings: idx < rating ? '"FILL" 1' : '"FILL" 0' }}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-surface">Review Moderation</h2>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Review customer feedback submissions. Approved reviews will become public and update the product ratings automatically.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-tertiary-container/10 border border-outline-variant/30 rounded-lg text-secondary text-xs font-body flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold uppercase tracking-wider text-primary">Dismiss</button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4">rate_review</span>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-1">All Reviews Moderated</h3>
          <p className="font-body text-xs text-on-surface-variant">There are no pending customer reviews needing action.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-headline text-base font-bold text-on-surface">{review.product_title}</h4>
                    <p className="font-body text-xs text-on-surface-variant mt-1">
                      Submitted by <strong className="text-on-surface">{review.customer_name}</strong> on{' '}
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {review.is_verified_purchase && (
                      <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Verified Buyer
                      </span>
                    )}
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Body Content */}
                <div className="bg-surface border border-outline-variant/5 p-4 rounded-lg">
                  {review.title && (
                    <h5 className="font-headline text-sm font-semibold text-on-surface mb-1">
                      "{review.title}"
                    </h5>
                  )}
                  <p className="font-body text-xs text-secondary leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="flex md:flex-col justify-end gap-3 md:w-36 shrink-0 md:justify-center">
                <button
                  onClick={() => handleModerate(review.id, 'approve')}
                  disabled={submittingId !== null}
                  className="flex-1 md:flex-none py-2 px-4 bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 rounded font-label text-xs uppercase tracking-widest font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(review.id, 'reject')}
                  disabled={submittingId !== null}
                  className="flex-1 md:flex-none py-2 px-4 bg-surface hover:bg-error hover:text-on-primary disabled:opacity-50 border border-outline-variant/30 hover:border-error rounded font-label text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewModeration;
