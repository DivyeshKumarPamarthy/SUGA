import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Advertisement {
  id: number;
  vendor: number;
  vendor_name: string;
  ad_type: string;
  title: string;
  banner: string | null;
  target_url: string;
  keywords: string;
  start_date: string;
  end_date: string;
  daily_rate: string;
  status: string;
  payment_status: string;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

const AD_TYPE_LABELS: Record<string, string> = {
  homepage_carousel: 'Homepage Carousel',
  search_top: 'Top of Search Results',
  featured_artisan: 'Featured Artisan',
  category_banner: 'Category Banner',
};

const VendorPromotions: React.FC = () => {
  const { user } = useAuth();
  const isApproved = user?.vendor_profile?.verification_status === 'approved';
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ad_type: 'homepage_carousel',
    title: '',
    target_url: '',
    keywords: '',
    start_date: '',
    end_date: '',
    daily_rate: '',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const fetchAds = async () => {
    try {
      const res = await api.get<any>('admin-panel/ads/my/');
      setAds(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err: unknown) {
      console.error('Failed to fetch promotions:', err);
      setError('Could not retrieve your promotional campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBannerFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const payload = new FormData();
      payload.append('ad_type', formData.ad_type);
      payload.append('title', formData.title);
      payload.append('target_url', formData.target_url);
      payload.append('keywords', formData.keywords);
      payload.append('start_date', formData.start_date);
      payload.append('end_date', formData.end_date);
      payload.append('daily_rate', formData.daily_rate);
      if (bannerFile) {
        payload.append('banner', bannerFile);
      }

      await api.post('admin-panel/ads/create/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset form and refresh list
      setFormData({
        ad_type: 'homepage_carousel',
        title: '',
        target_url: '',
        keywords: '',
        start_date: '',
        end_date: '',
        daily_rate: '',
      });
      setBannerFile(null);
      setShowForm(false);
      setLoading(true);
      fetchAds();
    } catch (err: unknown) {
      console.error('Failed to submit ad campaign:', err);
      const axiosErr = err as { response?: { data?: Record<string, string[]> } };
      if (axiosErr.response?.data) {
        const msgs = Object.values(axiosErr.response.data).flat().join(' ');
        setFormError(msgs || 'Failed to submit campaign. Please check your inputs.');
      } else {
        setFormError('Failed to submit campaign. Please try again.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (statusVal: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-primary/10 text-primary',
      rejected: 'bg-error-container text-on-error-container',
      expired: 'bg-secondary-container text-on-secondary-container',
    };
    return styles[statusVal] || 'bg-secondary-container text-on-secondary-container';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Loading promotional campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Promotional Campaigns</h1>
          <p className="font-body text-xs text-secondary mt-1">
            Request banner placements across the SUGA marketplace to showcase your artisan craft.
          </p>
        </div>
        {isApproved && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-[10px] uppercase tracking-widest font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">
              {showForm ? 'close' : 'add_circle'}
            </span>
            <span>{showForm ? 'Cancel' : 'New Campaign'}</span>
          </button>
        )}
      </div>

      {/* Verification Warning Banner */}
      {!isApproved && (
        <div className="bg-error-container text-on-error-container border border-error/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm backdrop-blur-md bg-opacity-80">
          <span className="material-symbols-outlined text-error text-3xl shrink-0">warning</span>
          <div>
            <h4 className="font-headline text-lg font-bold">Verification Pending</h4>
            <p className="font-body text-sm mt-1 opacity-90">
              Your vendor account is currently pending verification. You cannot create promotional campaigns or request advertisements until your account has been reviewed and approved by the administrator.
            </p>
          </div>
        </div>
      )}

      {/* New Campaign Form */}
      {showForm && (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm animate-scaleIn">
          <h2 className="font-headline text-base font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">campaign</span>
            Submit New Promotional Campaign
          </h2>

          {formError && (
            <div className="bg-error-container text-on-error-container p-3 rounded-xl border border-error/20 text-xs font-body mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ad Type */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Ad Placement Type *
                </label>
                <select
                  name="ad_type"
                  value={formData.ad_type}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                >
                  {Object.entries(AD_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Summer Silk Collection Spotlight"
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Target URL
                </label>
                <input
                  type="url"
                  name="target_url"
                  value={formData.target_url}
                  onChange={handleInputChange}
                  placeholder="https://suga.com/products/..."
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Keywords
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="silk, saree, handloom, festive"
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[9px] text-secondary font-body mt-0.5">Comma-separated keywords for targeting.</p>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Daily Rate */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Daily Rate (₹) *
                </label>
                <input
                  type="number"
                  name="daily_rate"
                  value={formData.daily_rate}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="500.00"
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Banner Image
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-sm font-body text-on-surface file:mr-3 file:px-3 file:py-1 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary"
                />
                <p className="text-[9px] text-secondary font-body mt-0.5">Accepted: PNG, JPG, JPEG, WebP, GIF</p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-3 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-outline text-secondary hover:text-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                {formLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xs">send</span>
                    Submit Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 text-xs font-body max-w-md">
          {error}
        </div>
      )}

      {/* Campaign List */}
      {ads.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-secondary mb-3">campaign</span>
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">No campaigns yet</h3>
          <p className="font-body text-xs text-secondary">
            Submit your first promotional campaign to feature your artisan work across the SUGA marketplace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-label bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                    {AD_TYPE_LABELS[ad.ad_type] || ad.ad_type}
                  </span>
                  <h3 className="font-headline text-sm font-bold text-on-surface pt-1">{ad.title}</h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-label font-bold uppercase tracking-wider ${getStatusBadge(ad.status)}`}
                >
                  {ad.status}
                </span>
              </div>

              {/* Details */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 grid grid-cols-2 gap-3 text-xs font-body text-on-surface">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <span>
                    {new Date(ad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {new Date(ad.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">payments</span>
                  <span className="font-bold">₹{ad.daily_rate}/day</span>
                </div>
                {ad.keywords && (
                  <div className="col-span-2 flex items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-sm">label</span>
                    <span>{ad.keywords}</span>
                  </div>
                )}
              </div>

              {/* Banner Preview */}
              {ad.banner && (
                <div className="rounded-xl overflow-hidden border border-outline-variant/10">
                  <img
                    src={ad.banner}
                    alt={ad.title}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* Rejection reason */}
              {ad.status === 'rejected' && ad.rejection_reason && (
                <div className="bg-error-container/30 p-3 rounded-lg border border-error/10 text-xs font-body text-error">
                  <strong>Rejection Reason:</strong> {ad.rejection_reason}
                </div>
              )}

              {/* Payment status */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/5 text-xs font-body text-secondary">
                <span className="material-symbols-outlined text-sm">receipt</span>
                Payment: <span className={`font-bold ${ad.payment_status === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>{ad.payment_status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorPromotions;
