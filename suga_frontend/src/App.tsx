import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import CustomerLayout from './components/layouts/CustomerLayout';
import AdminLayout from './components/layouts/AdminLayout';
import VendorLayout from './components/layouts/VendorLayout';

// Pages
import Home from './pages/customer/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Customer Pages
import ProductListing from './pages/customer/ProductListing';
import ProductDetail from './pages/customer/ProductDetail';
import CartCheckout from './pages/customer/CartCheckout';
import OrderHistory from './pages/customer/OrderHistory';
import AppointmentsPage from './pages/customer/AppointmentsPage';
import SupportPage from './pages/customer/SupportPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdsManager from './pages/admin/AdsManager';
import VendorVerifications from './pages/admin/VendorVerifications';
import ReviewModeration from './pages/admin/ReviewModeration';
import SupportTickets from './pages/admin/SupportTickets';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorAppointments from './pages/vendor/VendorAppointments';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorProductForm from './pages/vendor/VendorProductForm';
import VendorPromotions from './pages/vendor/VendorPromotions';

// Mock Page Placeholders to make links work cleanly
const AteliersPlaceholder = () => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <h2 className="font-headline text-2xl font-bold text-on-surface mb-4">Master Custom Ateliers</h2>
    <p className="font-body text-sm text-secondary">Find tailors and boutiques to craft apparel customized to your fit.</p>
  </div>
);



const ProfilePlaceholder = () => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <h2 className="font-headline text-2xl font-bold text-on-surface mb-4">My Profile</h2>
    <p className="font-body text-sm text-secondary">Manage your sizing profiles, order addresses, and contact info.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Customer / Storefront Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<ProductListing />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="ateliers" element={<AteliersPlaceholder />} />
            <Route
              path="support"
              element={
                <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route path="cart" element={<CartCheckout />} />
            
            {/* Protected Customer Routes */}
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
                  <ProfilePlaceholder />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="appointments"
              element={
                <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
                  <AppointmentsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="ads" element={<AdsManager />} />
            <Route path="verifications" element={<VendorVerifications />} />
            <Route path="reviews" element={<ReviewModeration />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Protected Vendor Routes */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="appointments" element={<VendorAppointments />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="products/add" element={<VendorProductForm />} />
            <Route path="products/:id/edit" element={<VendorProductForm />} />
            <Route path="promotions" element={<VendorPromotions />} />
            <Route path="*" element={<Navigate to="/vendor/dashboard" replace />} />
          </Route>

          {/* Global Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

