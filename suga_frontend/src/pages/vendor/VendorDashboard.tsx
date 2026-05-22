import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface OrderItem {
  id: number;
  product: number;
  product_title: string;
  vendor: number;
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
  items: OrderItem[];
  created_at: string;
}

interface Appointment {
  id: number;
  customer_name: string;
  product_title: string;
  appointment_type: string;
  date: string;
  time_slot: string;
  status: string;
}

interface Product {
  id: number;
  title: string;
  price: string;
  status: string;
}

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const isApproved = user?.vendor_profile?.verification_status === 'approved';
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Parallel requests
      const [ordersRes, apptsRes, productsRes] = await Promise.all([
        api.get<any>('orders/'),
        api.get<any>('orders/appointments/'),
        api.get<any>('vendor/products/'),
      ]);

      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.results || [];
      const apptsData = Array.isArray(apptsRes.data) ? apptsRes.data : apptsRes.data.results || [];
      const productsData = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results || [];

      setOrders(ordersData);
      setAppointments(apptsData);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to fetch vendor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateItemStatus = async (itemId: number, newStatus: 'accepted' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to mark this item as ${newStatus}?`)) return;

    setActionLoading(true);
    try {
      await api.patch(`orders/items/${itemId}/status/`, { item_status: newStatus });
      // Re-fetch dashboard data to sync statuses
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to update item status:', err);
      alert('Could not update order item status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculations
  const calculateTotalSales = () => {
    // Sum price of all items that are accepted or pending (belonging to this vendor)
    let total = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.item_status !== 'rejected') {
          total += Number(item.total);
        }
      });
    });
    return total;
  };

  const getPendingItems = () => {
    const list: { orderNum: string; customer: string; item: OrderItem }[] = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.item_status === 'pending') {
          list.push({ orderNum: order.order_number, customer: order.customer_name, item });
        }
      });
    });
    return list;
  };

  const activeApptsCount = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed' || a.status === 'rescheduled').length;
  const totalSales = calculateTotalSales();
  const liveProductsCount = products.filter(p => p.status === 'active').length;
  const pendingItems = getPendingItems();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Assembling artisan statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Artisan Studio Dashboard</h2>
          <p className="font-body text-sm text-secondary mt-1">
            Manage your shop catalog, custom measurements, and incoming couture orders.
          </p>
        </div>
      </div>

      {/* Verification Warning Banner */}
      {!isApproved && (
        <div className="bg-error-container text-on-error-container border border-error/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm backdrop-blur-md bg-opacity-80">
          <span className="material-symbols-outlined text-error text-3xl shrink-0">warning</span>
          <div>
            <h4 className="font-headline text-lg font-bold">Verification Pending</h4>
            <p className="font-body text-sm mt-1 opacity-90">
              Your vendor account is currently pending verification. Some features, including catalog modifications and promotions, are restricted until your account has been reviewed and approved by the administrator.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="font-body text-xs font-bold uppercase tracking-wider text-secondary">
              Total Studio Sales
            </p>
            <span className="material-symbols-outlined text-primary">payments</span>
          </div>
          <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">
            ₹{totalSales.toLocaleString('en-IN')}
          </h3>
          <p className="font-body text-[11px] text-secondary">Across {orders.length} unique client orders</p>
        </div>

        {/* Appointments Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="font-body text-xs font-bold uppercase tracking-wider text-secondary">
              Active Consultations
            </p>
            <span className="material-symbols-outlined text-primary">event</span>
          </div>
          <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">
            {activeApptsCount} Active
          </h3>
          <p className="font-body text-[11px] text-secondary">Measurement & fitting sessions scheduled</p>
        </div>

        {/* Catalog Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="font-body text-xs font-bold uppercase tracking-wider text-secondary">
              Catalog Items
            </p>
            <span className="material-symbols-outlined text-primary">shopping_bag</span>
          </div>
          <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">
            {products.length} listed
          </h3>
          <p className="font-body text-[11px] text-secondary">{liveProductsCount} active public listings</p>
        </div>
      </div>

      {/* Main Grid: Pending Items & Upcoming Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pending Order Requests */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">pending_actions</span>
            Pending Couture Requests ({pendingItems.length})
          </h3>

          {pendingItems.length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">task_alt</span>
              <p className="text-xs font-body text-secondary">All client couture requests have been processed!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map(({ orderNum, customer, item }) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-label text-primary uppercase tracking-widest font-bold">
                        Order: {orderNum}
                      </span>
                      <h4 className="font-headline text-sm font-bold text-on-surface mt-0.5">
                        {item.product_title}
                      </h4>
                    </div>
                    <span className="font-body text-xs font-bold text-on-surface">
                      ₹{Number(item.total).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs font-body text-secondary">
                    <div>
                      <span>Size: <strong className="text-on-surface">{item.size}</strong></span>
                    </div>
                    <div>
                      <span>Qty: <strong className="text-on-surface">{item.quantity}</strong></span>
                    </div>
                    <div>
                      <span>Customer: <strong className="text-on-surface">{customer}</strong></span>
                    </div>
                  </div>

                  {item.customization_request && (
                    <div className="bg-background p-3 rounded-lg border border-outline-variant/10 text-xs font-body italic text-secondary">
                      <strong>Custom Request:</strong> "{item.customization_request}"
                    </div>
                  )}

                  {/* Accept/Decline Actions */}
                  <div className="flex gap-2 pt-2 border-t border-outline-variant/5">
                    <button
                      onClick={() => handleUpdateItemStatus(item.id, 'accepted')}
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-colors shadow-sm"
                    >
                      Accept Item
                    </button>
                    <button
                      onClick={() => handleUpdateItemStatus(item.id, 'rejected')}
                      disabled={actionLoading}
                      className="px-4 py-1.5 border border-error/20 text-error hover:bg-error/5 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-colors"
                    >
                      Decline Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sizing Consultations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">video_chat</span>
              Fitting Consultations
            </h3>
            <Link
              to="/vendor/appointments"
              className="text-xs text-primary font-bold uppercase tracking-wider hover:underline"
            >
              Manage Slots
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">calendar_today</span>
              <p className="text-xs font-body text-secondary">No sizing sessions scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 shadow-sm flex justify-between items-center gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-label font-bold uppercase tracking-widest">
                      {app.appointment_type}
                    </span>
                    <h4 className="font-headline text-xs font-bold text-on-surface pt-1">
                      {app.customer_name}
                    </h4>
                    <p className="text-[10px] font-body text-secondary truncate max-w-[200px]">
                      {app.product_title}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="block font-body text-[10px] font-bold text-on-surface">
                      {app.date}
                    </span>
                    <span className="block font-body text-[9px] text-secondary">
                      {app.time_slot}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-label font-bold uppercase tracking-wider ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
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

export default VendorDashboard;
