import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
}

interface VendorProfile {
  id: number;
  user: User;
  shop_name: string;
  vendor_type: 'tailor' | 'boutique' | 'handloom_weaver' | 'alteration_specialist';
  description: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  gstin: string;
  id_document: string | null;
  business_license: string | null;
  rejection_reason: string;
  created_at: string;
}

const VendorVerifications: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rejection modal state
  const [rejectingVendor, setRejectingVendor] = useState<VendorProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('admin-panel/vendors/pending/');
      setVendors(Array.isArray(response.data) ? response.data : response.data.results || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch pending vendors:', err);
      setError('Failed to fetch pending vendors from backend. Using local simulated data.');
      // Mock Fallback Data
      setVendors([
        {
          id: 1,
          user: {
            id: 10,
            username: 'weaver_ramesh',
            email: 'ramesh.weaver@gmail.com',
            first_name: 'Ramesh',
            last_name: 'Devangan',
            phone: '+91 98765 43210',
            role: 'vendor'
          },
          shop_name: 'Devangan Handlooms',
          vendor_type: 'handloom_weaver',
          description: 'Specializing in traditional Chanderi and Maheshwari silk sarees with heritage motifs.',
          location: 'Main Bazar, Chanderi',
          city: 'Chanderi',
          state: 'Madhya Pradesh',
          pincode: '473446',
          verification_status: 'pending',
          gstin: '23AAAAA1111A1Z1',
          id_document: '#',
          business_license: '#',
          rejection_reason: '',
          created_at: '2026-05-20T10:30:00Z'
        },
        {
          id: 2,
          user: {
            id: 11,
            username: 'priya_couture',
            email: 'priya.couture@outlook.com',
            first_name: 'Priya',
            last_name: 'Sharma',
            phone: '+91 98111 22233',
            role: 'vendor'
          },
          shop_name: 'Priya Heritage Boutique',
          vendor_type: 'boutique',
          description: 'Handcrafted custom wedding trousseaus and bespoke bridal lehengas.',
          location: '12, Hauz Khas Village',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110016',
          verification_status: 'pending',
          gstin: '07AAAAA2222B2Z2',
          id_document: '#',
          business_license: '#',
          rejection_reason: '',
          created_at: '2026-05-21T08:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const handleVerify = async (vendorId: number, action: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      await api.post(`admin-panel/vendors/${vendorId}/verify/`, {
        action,
        rejection_reason: action === 'reject' ? rejectionReason : ''
      });
      // Refresh list
      setRejectingVendor(null);
      setRejectionReason('');
      fetchPendingVendors();
    } catch (err: any) {
      console.error('Failed to submit vendor verification:', err);
      // Fallback state modification for frontend demo
      setVendors(prev => prev.filter(v => v.id !== vendorId));
      setRejectingVendor(null);
      setRejectionReason('');
    } finally {
      setSubmitting(false);
    }
  };

  const getVendorTypeLabel = (type: string) => {
    switch (type) {
      case 'tailor': return 'Custom Tailor';
      case 'boutique': return 'Heritage Boutique';
      case 'handloom_weaver': return 'Artisan Handloom Weaver';
      case 'alteration_specialist': return 'Alteration & Fit Specialist';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-surface">Vendor Verifications</h2>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Review and approve profiles of artisans and boutiques registering to sell on SUGA.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-tertiary-container/10 border border-outline-variant/30 rounded-lg text-secondary text-xs font-body flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold uppercase tracking-wider text-primary">Dismiss</button>
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4">verified_user</span>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-1">No Pending Verifications</h3>
          <p className="font-body text-xs text-on-surface-variant">All registered artisan shops have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6 lg:p-8 shadow-sm flex flex-col lg:flex-row gap-8">
              
              {/* Left Column: Profile Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-headline text-2xl font-semibold text-on-surface">{vendor.shop_name}</h3>
                    <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                      {getVendorTypeLabel(vendor.vendor_type)}
                    </span>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant mt-2 italic">
                    {vendor.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface p-3 rounded border border-outline-variant/5">
                    <p className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary mb-1">Contact Person</p>
                    <p className="font-body text-sm font-semibold text-on-surface">
                      {vendor.user.first_name} {vendor.user.last_name}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">{vendor.user.email}</p>
                    <p className="font-body text-xs text-on-surface-variant">{vendor.user.phone}</p>
                  </div>

                  <div className="bg-surface p-3 rounded border border-outline-variant/5">
                    <p className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary mb-1">Location Details</p>
                    <p className="font-body text-sm font-semibold text-on-surface">{vendor.location || 'N/A'}</p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {vendor.city}, {vendor.state} - {vendor.pincode}
                    </p>
                  </div>
                </div>

                <div className="border-t border-outline-variant/20 pt-4">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary">GSTIN Number</p>
                      <p className="font-body text-sm font-mono font-semibold text-on-surface mt-1">
                        {vendor.gstin || 'NOT PROVIDED'}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-wider font-bold text-secondary">Registered Date</p>
                      <p className="font-body text-sm font-semibold text-on-surface mt-1">
                        {new Date(vendor.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Uploaded Documents & Actions */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col justify-between bg-surface border border-outline-variant/20 rounded-xl p-5 lg:p-6">
                <div>
                  <h4 className="font-headline text-sm font-bold text-on-surface mb-4">Verification Documents</h4>
                  <div className="space-y-3">
                    {/* ID Document */}
                    <div className="flex items-center justify-between p-3 bg-background border border-outline-variant/10 rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">badge</span>
                        <div className="text-left">
                          <p className="font-body text-xs font-semibold text-on-surface">Identity Document</p>
                          <p className="font-body text-[10px] text-on-surface-variant">Aadhaar / PAN / Passport</p>
                        </div>
                      </div>
                      {vendor.id_document ? (
                        <a
                          href={vendor.id_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-container p-1"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                        </a>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-error tracking-wider">Missing</span>
                      )}
                    </div>

                    {/* Business License */}
                    <div className="flex items-center justify-between p-3 bg-background border border-outline-variant/10 rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary">receipt_long</span>
                        <div className="text-left">
                          <p className="font-body text-xs font-semibold text-on-surface">Business License</p>
                          <p className="font-body text-[10px] text-on-surface-variant">GST / Registration / Shop Act</p>
                        </div>
                      </div>
                      {vendor.business_license ? (
                        <a
                          href={vendor.business_license}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-container p-1"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                        </a>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-error tracking-wider">Missing</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => handleVerify(vendor.id, 'approve')}
                    disabled={submitting}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded font-label text-xs uppercase tracking-widest font-bold transition-all shadow-sm"
                  >
                    Approve Merchant
                  </button>
                  <button
                    onClick={() => setRejectingVendor(vendor)}
                    disabled={submitting}
                    className="w-full py-2.5 bg-error/10 text-error hover:bg-error hover:text-on-primary disabled:opacity-50 border border-error/30 rounded font-label text-xs uppercase tracking-widest font-bold transition-all"
                  >
                    Reject Application
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 lg:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-2">Reject Registration</h3>
            <p className="font-body text-xs text-on-surface-variant mb-4">
              Please enter the reason for rejecting <strong className="text-on-surface">{rejectingVendor.shop_name}</strong>. This feedback will be emailed to the artisan to help them correct their details.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. GSTIN is invalid or doesn't match business address. Please upload a clear ID document."
              className="w-full p-3 bg-surface border border-outline-variant/30 rounded text-sm text-on-surface focus:outline-none focus:border-primary font-body mb-6 placeholder:text-on-surface-variant/40"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectingVendor(null);
                  setRejectionReason('');
                }}
                disabled={submitting}
                className="px-4 py-2 border border-outline-variant/30 hover:bg-surface-variant/20 rounded font-label text-xs uppercase tracking-wider font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(rejectingVendor.id, 'reject')}
                disabled={submitting || !rejectionReason.trim()}
                className="px-4 py-2 bg-error text-on-primary rounded font-label text-xs uppercase tracking-wider font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorVerifications;
