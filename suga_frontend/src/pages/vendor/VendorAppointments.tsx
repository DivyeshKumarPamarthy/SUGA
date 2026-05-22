import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Appointment {
  id: number;
  customer: number;
  customer_name: string;
  vendor: number;
  vendor_name: string;
  order_item: number;
  product_title: string;
  order_number: string;
  appointment_type: string;
  date: string;
  time_slot: string;
  status: string;
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const VendorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Action States
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get<any>('orders/appointments/');
      setAppointments(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError('Could not retrieve scheduled consultations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const openConfirmModal = (app: Appointment) => {
    setActiveAppointment(app);
    setMeetingLink(app.meeting_link || '');
    setShowConfirmModal(true);
  };

  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`orders/appointments/${activeAppointment.id}/status/`, {
        status: 'confirmed',
        meeting_link: meetingLink
      });

      // Update state
      setAppointments(prev =>
        prev.map(app => (app.id === activeAppointment.id ? res.data : app))
      );
      setShowConfirmModal(false);
      setActiveAppointment(null);
    } catch (err: any) {
      console.error('Failed to confirm appointment:', err);
      alert('Could not confirm appointment. Please check meeting link format.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to mark this consultation as ${newStatus}?`)) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`orders/appointments/${id}/status/`, { status: newStatus });
      // Update state
      setAppointments(prev =>
        prev.map(app => (app.id === id ? res.data : app))
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert('Could not update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Loading artisan consultation ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Consultations & Sizing Calls</h1>
        <p className="font-body text-xs text-secondary mt-1">
          Manage digital measurements and fittings for custom items. Add virtual meeting URLs to confirm appointments.
        </p>
      </div>

      {error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 text-xs font-body max-w-md">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-secondary mb-3">calendar_month</span>
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">No custom sessions scheduled</h3>
          <p className="font-body text-xs text-secondary">Customers will request sizing calls for bespoke couture orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-label bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                    {app.appointment_type === 'virtual' ? 'Virtual Call' : 'In-Person Fitting'}
                  </span>
                  <h3 className="font-headline text-sm font-bold text-on-surface pt-1">
                    {app.product_title || 'Custom Couture Piece'}
                  </h3>
                  <div className="text-xs font-body text-secondary">
                    Order: <strong className="text-on-surface">{app.order_number || 'N/A'}</strong> | Customer: <strong className="text-primary">{app.customer_name}</strong>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-label font-bold uppercase tracking-wider ${
                  app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  app.status === 'cancelled' ? 'bg-error-container text-on-error-container' :
                  app.status === 'completed' ? 'bg-secondary-container text-on-secondary-container' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {app.status}
                </span>
              </div>

              {/* Time Details Box */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 flex items-center gap-4 text-xs font-body text-on-surface">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                  <span className="font-bold">
                    {new Date(app.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="border-l border-outline-variant/20 h-6"></div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                  <span className="font-medium">{app.time_slot}</span>
                </div>
              </div>

              {/* Custom notes from customer */}
              {app.notes && (
                <div className="bg-background p-3 rounded-lg border border-outline-variant/10 text-xs font-body italic text-secondary">
                  <strong>Notes:</strong> "{app.notes}"
                </div>
              )}

              {/* Virtual Meeting Link */}
              {app.appointment_type === 'virtual' && app.meeting_link && (
                <div className="bg-green-50/50 p-3 rounded-xl border border-green-200/50 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-green-800">
                    <span className="material-symbols-outlined text-green-700 text-sm">link</span>
                    <span className="font-body">Meeting Link:</span>
                  </div>
                  <a
                    href={app.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary font-semibold hover:underline truncate max-w-xs"
                  >
                    {app.meeting_link}
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/5">
                {app.status !== 'confirmed' && app.status !== 'cancelled' && app.status !== 'completed' && (
                  <button
                    onClick={() => openConfirmModal(app)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">check</span>
                    <span>Confirm & Set Link</span>
                  </button>
                )}

                {app.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(app.id, 'completed')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-700 text-white hover:bg-green-800 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">done_all</span>
                    <span>Mark Completed</span>
                  </button>
                )}

                {app.status !== 'cancelled' && app.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(app.id, 'cancelled')}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-error/20 text-error hover:bg-error/5 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-all text-center"
                  >
                    Cancel Call
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Confirm Sizing Appointment Modal */}
      {showConfirmModal && activeAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
          <div className="bg-surface-bright border border-outline-variant/20 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="bg-primary px-6 py-4 flex justify-between items-center text-on-primary">
              <h3 className="font-headline text-base font-bold">Confirm & Add Meeting Link</h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setActiveAppointment(null);
                }}
                className="text-on-primary hover:text-primary-fixed-dim focus:outline-none"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAppointment} className="p-6 space-y-4">
              <div className="text-xs font-body text-secondary space-y-1">
                <div>
                  Customer: <strong className="text-on-surface">{activeAppointment.customer_name}</strong>
                </div>
                <div>
                  Item: <strong className="text-on-surface">{activeAppointment.product_title}</strong>
                </div>
                <div>
                  Requested Slot: <strong className="text-primary">{activeAppointment.date} ({activeAppointment.time_slot})</strong>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                  Virtual Meeting URL (Google Meet / Zoom) *
                </label>
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[9px] text-secondary font-body mt-1">
                  * Customers will see this link on their profile to join the virtual measurements call.
                </p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setActiveAppointment(null);
                  }}
                  className="w-1/2 py-2 border border-outline text-secondary hover:text-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-colors shadow-md flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                  ) : (
                    'Confirm Slot'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorAppointments;
