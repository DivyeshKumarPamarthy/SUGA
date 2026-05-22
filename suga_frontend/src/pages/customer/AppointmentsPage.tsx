import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule Form States
  const [rescheduleItem, setRescheduleItem] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('11:00 AM - 11:30 AM');
  const [newNotes, setNewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get<any>('orders/appointments/');
      setAppointments(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError('Could not retrieve your tailoring appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this consultation?')) return;
    
    setActionLoading(true);
    try {
      await api.patch(`orders/appointments/${id}/status/`, { status: 'cancelled' });
      // Update locally
      setAppointments(prev =>
        prev.map(app => (app.id === id ? { ...app, status: 'cancelled' } : app))
      );
    } catch (err: any) {
      console.error('Failed to cancel appointment:', err);
      alert('Could not cancel appointment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRescheduleModal = (app: Appointment) => {
    setRescheduleItem(app);
    setNewDate(app.date);
    setNewTimeSlot(app.time_slot);
    setNewNotes(app.notes || '');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`orders/appointments/${rescheduleItem.id}/status/`, {
        status: 'rescheduled',
        date: newDate,
        time_slot: newTimeSlot,
        notes: newNotes,
      });

      // Update state
      setAppointments(prev =>
        prev.map(app => (app.id === rescheduleItem.id ? res.data : app))
      );
      setRescheduleItem(null);
    } catch (err: any) {
      console.error('Failed to reschedule appointment:', err);
      alert('Could not update appointment slot. Please verify inputs.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Assembling measurement slot ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/15 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Atelier Sizing Consultations</h1>
            <p className="font-body text-xs text-secondary mt-1">
              Verify scheduled fits, join remote consultations, or manage appointment slots with couture designers.
            </p>
          </div>
          <Link
            to="/orders"
            className="mt-4 md:mt-0 px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 self-start"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>View Orders</span>
          </Link>
        </div>

        {error ? (
          <div className="bg-error-container text-on-error-container p-6 rounded-xl border border-error/20 max-w-lg mx-auto text-center font-body text-xs">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 max-w-md mx-auto">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4">calendar_today</span>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-2">No Scheduled Fitting Calls</h3>
            <p className="font-body text-xs text-secondary mb-6 font-medium">
              Appointments are tied to custom items. Complete a checkout and click "Book Sizing Call" from your Order Chronicles.
            </p>
            <Link
              to="/orders"
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md"
            >
              Order Chronicles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map((app) => (
              <div
                key={app.id}
                className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-label bg-primary/10 text-primary px-2.5 py-0.5 rounded font-bold uppercase tracking-widest">
                      {app.appointment_type === 'virtual' ? 'Virtual Call' : 'In-Person Fitting'}
                    </span>
                    <h3 className="font-headline text-base font-bold text-on-surface pt-1">
                      {app.product_title || 'Custom couture piece'}
                    </h3>
                    <p className="text-xs font-body text-secondary">
                      Order: <strong className="text-on-surface">{app.order_number || 'N/A'}</strong>
                    </p>
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

                {/* Date & Time Slot Row */}
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

                {/* Artisan Information */}
                <div className="text-xs font-body text-secondary space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">palette</span>
                    <span>Artisan Shop: <strong className="text-on-surface">{app.vendor_name || 'Master Weaver'}</strong></span>
                  </div>
                  {app.notes && (
                    <div className="bg-background p-3 rounded-lg border border-outline-variant/10 mt-2 italic">
                      <strong>Client Notes:</strong> "{app.notes}"
                    </div>
                  )}
                </div>

                {/* Meeting Link Area */}
                {app.status === 'confirmed' && app.meeting_link && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-700 animate-pulse text-lg">videocam</span>
                      <span className="font-body text-green-800">Your video conference slot is ready!</span>
                    </div>
                    <a
                      href={app.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-700 text-white rounded-lg font-label font-bold uppercase tracking-wider text-[10px] hover:bg-green-800 transition-colors shadow-sm text-center"
                    >
                      Join Call
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                {app.status !== 'cancelled' && app.status !== 'completed' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => openRescheduleModal(app)}
                      disabled={actionLoading}
                      className="w-1/2 py-2 border border-outline text-secondary hover:text-primary rounded-xl font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-variant/20 transition-all text-center"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(app.id)}
                      disabled={actionLoading}
                      className="w-1/2 py-2 border border-error/30 text-error hover:bg-error/5 rounded-xl font-label text-xs uppercase tracking-widest font-bold transition-all text-center"
                    >
                      Cancel
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
            <div className="bg-surface-bright border border-outline-variant/20 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
              <div className="bg-primary px-6 py-4 flex justify-between items-center text-on-primary">
                <h3 className="font-headline text-lg font-bold">Reschedule Sizing Call</h3>
                <button
                  onClick={() => setRescheduleItem(null)}
                  className="text-on-primary hover:text-primary-fixed-dim focus:outline-none"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                    Select New Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                    Select New Time Slot *
                  </label>
                  <select
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary"
                  >
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                    <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                    <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-label font-bold text-secondary uppercase tracking-wider mb-1">
                    Reason / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Provide comments or custom sizing constraints."
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:border-primary placeholder-secondary/40"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-outline-variant/10">
                  <button
                    type="button"
                    onClick={() => setRescheduleItem(null)}
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
                      'Update Slot'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppointmentsPage;
