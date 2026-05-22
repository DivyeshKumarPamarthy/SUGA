import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Advertisement {
  id: number;
  vendor: number;
  vendor_name: string;
  ad_type: 'homepage_carousel' | 'search_top' | 'featured_artisan' | 'category_banner';
  title: string;
  banner: string | null;
  target_url: string;
  keywords: string;
  start_date: string;
  end_date: string;
  daily_rate: string;
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'expired';
  payment_status: string;
  priority: number;
  rejection_reason: string;
}

const AdsManager: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tabs: 'sponsored' | 'banners' | 'offers'
  const [activeTab, setActiveTab] = useState<'sponsored' | 'banners' | 'offers'>('sponsored');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals/Review State
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch advertisements
  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('admin-panel/ads/');
      setAds(Array.isArray(response.data) ? response.data : response.data.results || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch ads:', err);
      setError('Could not connect to backend API. Loading mock design data.');
      // Load fallback mock data matching the Stitch design
      setAds([
        {
          id: 1,
          vendor: 101,
          vendor_name: 'Raja Tailors',
          ad_type: 'search_top',
          title: 'Premium Mens Suits Campaign',
          banner: null,
          target_url: 'https://suga.in/vendors/raja-tailors',
          keywords: 'suits, blazers, mens couture',
          start_date: '2026-05-22',
          end_date: '2026-05-29',
          daily_rate: '1428.57', // ₹10,000 total / 7 Days
          status: 'pending',
          payment_status: 'paid',
          priority: 0,
          rejection_reason: ''
        },
        {
          id: 2,
          vendor: 102,
          vendor_name: 'Kashmiri Looms',
          ad_type: 'featured_artisan',
          title: 'Homepage Featured Weave',
          banner: null,
          target_url: 'https://suga.in/vendors/kashmiri-looms',
          keywords: 'pashmina, shawls, woolen',
          start_date: '2026-05-22',
          end_date: '2026-06-05',
          daily_rate: '1785.71', // ₹25,000 / 14 Days
          status: 'pending',
          payment_status: 'paid',
          priority: 0,
          rejection_reason: ''
        },
        {
          id: 3,
          vendor: 103,
          vendor_name: 'Bespoke By Aditi',
          ad_type: 'category_banner',
          title: 'Womenswear Collection launch',
          banner: null,
          target_url: 'https://suga.in/vendors/bespoke-by-aditi',
          keywords: 'lehengas, anarkalis',
          start_date: '2026-05-15',
          end_date: '2026-05-23',
          daily_rate: '2500.00',
          status: 'active',
          payment_status: 'paid',
          priority: 0,
          rejection_reason: ''
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleModerate = async (action: 'approve' | 'reject') => {
    if (!selectedAd) return;
    setSubmitting(true);
    try {
      await api.post(`admin-panel/ads/${selectedAd.id}/approve/`, {
        action,
        rejection_reason: action === 'reject' ? rejectionReason : '',
      });
      setSelectedAd(null);
      setRejectionReason('');
      fetchAds();
    } catch (err: any) {
      console.error('Failed to moderate ad:', err);
      // Fallback state update for mockup/local demo
      setAds(prev => 
        prev.map(ad => 
          ad.id === selectedAd.id 
            ? { ...ad, status: action === 'approve' ? 'approved' : 'rejected', rejection_reason: rejectionReason }
            : ad
        )
      );
      setSelectedAd(null);
      setRejectionReason('');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formatting values
  const getAdTypeLabel = (type: string) => {
    switch (type) {
      case 'homepage_carousel': return 'Homepage Carousel';
      case 'search_top': return 'Top of Search: "Mens Suits"';
      case 'featured_artisan': return 'Homepage "Featured Artisan"';
      case 'category_banner': return 'Category Page: "Womenswear"';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-green-100 text-green-800 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">Active</span>;
      case 'approved':
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">Rejected</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">Pending Approval</span>;
    }
  };

  // Filter ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ad.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'sponsored') {
      return matchesSearch && (ad.ad_type === 'search_top' || ad.ad_type === 'featured_artisan' || ad.ad_type === 'category_banner');
    } else if (activeTab === 'banners') {
      return matchesSearch && ad.ad_type === 'homepage_carousel';
    }
    return matchesSearch;
  });

  const activeCount = ads.filter(a => a.status === 'active').length;
  const pendingCount = ads.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-tertiary-container/10 border border-outline-variant/30 rounded-lg text-secondary text-xs font-body flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold uppercase tracking-wider text-primary">Dismiss</button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="font-body text-sm text-on-surface-variant font-medium">Active Ad Campaigns</p>
            <span className="material-symbols-outlined text-primary">campaign</span>
          </div>
          <h3 className="font-headline text-3xl font-semibold text-on-surface mb-2">{activeCount || 12}</h3>
          <div className="flex items-center gap-1 text-xs font-body text-secondary font-medium">
            generating ₹45k / day in ad revenue
          </div>
        </div>
        
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="font-body text-sm text-on-surface-variant font-medium">Pending Approvals</p>
            <span className="material-symbols-outlined text-error">pending_actions</span>
          </div>
          <h3 className={`font-headline text-3xl font-semibold mb-2 ${pendingCount > 0 ? 'text-error' : 'text-on-surface'}`}>
            {pendingCount}
          </h3>
          <div className={`flex items-center gap-1 text-xs font-body font-medium ${pendingCount > 0 ? 'text-error' : 'text-secondary'}`}>
            <span className="material-symbols-outlined text-xs">warning</span> {pendingCount > 0 ? 'Needs immediate review' : 'All caught up'}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <p className="font-body text-sm text-on-surface-variant font-medium">Total Ad Revenue (MTD)</p>
            <span className="material-symbols-outlined text-green-600">payments</span>
          </div>
          <h3 className="font-headline text-3xl font-semibold text-on-surface mb-2">₹1.2M</h3>
          <div className="flex items-center gap-1 text-xs font-body text-green-600 font-medium">
            <span className="material-symbols-outlined text-xs">trending_up</span> +14% vs last month
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20">
        <button
          onClick={() => setActiveTab('sponsored')}
          className={`px-6 py-3 font-label text-sm uppercase tracking-widest font-bold transition-all ${
            activeTab === 'sponsored'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
          }`}
        >
          Sponsored Vendors
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-6 py-3 font-label text-sm uppercase tracking-widest font-bold transition-all ${
            activeTab === 'banners'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
          }`}
        >
          Banner Ads
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-6 py-3 font-label text-sm uppercase tracking-widest font-bold transition-all ${
            activeTab === 'offers'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
          }`}
        >
          Platform Offers
        </button>
      </div>

      {/* Ad Approvals Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-outline-variant/10 gap-4">
          <h3 className="font-headline text-xl font-semibold text-on-surface">
            {activeTab === 'sponsored' ? 'Vendor Ad Requests (Sponsored Listing)' : 
             activeTab === 'banners' ? 'Banner Ad Deployments' : 'Platform Promotion Campaigns'}
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search Vendor or Campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant font-body text-sm">
            No ad requests found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="py-4 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Vendor</th>
                  <th className="py-4 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Placement</th>
                  <th className="py-4 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Budget / Daily Rate</th>
                  <th className="py-4 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Duration</th>
                  <th className="py-4 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Status</th>
                  <th className="py-4 px-6 font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm text-on-surface">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold">{ad.vendor_name}</div>
                      <div className="text-xs text-on-surface-variant">ID: V-{ad.vendor}</div>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">{getAdTypeLabel(ad.ad_type)}</td>
                    <td className="py-4 px-6 font-medium">
                      ₹{Math.round(parseFloat(ad.daily_rate) * 7)} 
                      <span className="text-[10px] text-on-surface-variant block font-normal">₹{ad.daily_rate}/day</span>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {ad.status === 'active' ? 'Exp. soon' : '7 Days'}
                      <span className="text-[10px] block text-on-surface-variant">{ad.start_date} to {ad.end_date}</span>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(ad.status)}</td>
                    <td className="py-4 px-6 text-right">
                      {ad.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedAd(ad)}
                          className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded font-label uppercase tracking-widest text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-secondary text-xs">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Ad Request Dialog / Modal */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/20 rounded-xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div>
              <h4 className="font-headline text-lg font-bold text-on-surface">Review Ad Campaign</h4>
              <p className="font-body text-xs text-on-surface-variant">Requested by {selectedAd.vendor_name}</p>
            </div>
            
            <div className="space-y-3 font-body text-sm bg-surface-container-low p-4 rounded-lg border border-outline-variant/10">
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Campaign Title:</span> <span className="font-semibold">{selectedAd.title}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Slot Type:</span> <span>{getAdTypeLabel(selectedAd.ad_type)}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Keywords:</span> <span className="text-xs italic">{selectedAd.keywords}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Dates:</span> <span>{selectedAd.start_date} to {selectedAd.end_date}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant font-medium">Daily Budget:</span> <span className="font-semibold text-primary">₹{selectedAd.daily_rate}</span></div>
            </div>

            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Rejection Reason (only for rejection)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter details if rejecting this ad request..."
                className="w-full bg-surface border border-outline-variant/30 rounded-lg p-3 text-xs font-body text-on-surface placeholder-secondary-container focus:outline-none focus:border-primary"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedAd(null)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-outline-variant/30 text-secondary hover:text-on-surface rounded font-label text-xs uppercase tracking-widest font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModerate('reject')}
                disabled={submitting || !rejectionReason}
                className="flex-1 py-2.5 bg-error/15 text-error border border-error/25 hover:bg-error hover:text-on-error disabled:bg-secondary-container disabled:text-secondary rounded font-label text-xs uppercase tracking-widest font-bold transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleModerate('approve')}
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary text-on-primary hover:bg-primary-container disabled:bg-secondary-container rounded font-label text-xs uppercase tracking-widest font-bold transition-colors shadow-sm"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Pricing Configuration */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <h3 className="font-headline text-xl font-semibold text-on-surface mb-6">Slot Pricing Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-outline-variant/30 rounded-lg bg-surface flex justify-between items-center">
            <div>
              <div className="font-body text-sm font-bold text-on-surface">Homepage Carousel</div>
              <div className="text-xs text-on-surface-variant mt-1">Premium visibility slot</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">₹5,000 / day</span>
              <button className="text-primary hover:underline text-xs font-label uppercase tracking-widest font-bold">Edit</button>
            </div>
          </div>

          <div className="p-4 border border-outline-variant/30 rounded-lg bg-surface flex justify-between items-center">
            <div>
              <div className="font-body text-sm font-bold text-on-surface">Search Top Rank (Sponsored)</div>
              <div className="text-xs text-on-surface-variant mt-1">Keyword specific listing</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-on-surface">₹2,000 / day</span>
              <button className="text-primary hover:underline text-xs font-label uppercase tracking-widest font-bold">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsManager;
