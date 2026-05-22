import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarItemProps {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-4 px-4 py-3 rounded transition-all duration-200 ${
          isActive
            ? 'text-primary font-bold bg-primary/5 border-r-4 border-primary'
            : 'text-secondary hover:text-primary hover:bg-surface-variant/20'
        }`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-body text-sm font-medium tracking-wider">{label}</span>
    </NavLink>
  );
};

const VendorLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/vendor/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/vendor/products', icon: 'shopping_bag', label: 'My Products', end: true },
    { to: '/vendor/products/add', icon: 'add_circle', label: 'Add Product' },
    { to: '/vendor/appointments', icon: 'event', label: 'Appointments' },
    { to: '/vendor/promotions', icon: 'campaign', label: 'Promotions' },
    { to: '/vendor/analytics', icon: 'analytics', label: 'Analytics' },
    { to: '/vendor/profile/edit', icon: 'person', label: 'Edit Profile' },
  ];

  return (
    <div className="bg-background text-on-background flex h-screen w-screen overflow-hidden">
      {/* Overlay for mobile sidebar */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar for Desktop & Mobile */}
      <aside
        className={`bg-secondary-container h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/10 flex flex-col py-8 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-8 mb-10 text-center relative">
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">SUGA Partner</h1>
          <p className="font-body text-xs text-on-surface-variant uppercase tracking-widest mt-1">Artisan Studio</p>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-0 right-4 p-1 text-secondary lg:hidden"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <SidebarItem key={link.to} to={link.to} icon={link.icon} label={link.label} end={link.end} />
          ))}
          
          <div className="my-4 border-t border-outline-variant/20 mx-4"></div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded text-error hover:text-on-primary hover:bg-error transition-all duration-200"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body text-sm font-medium tracking-wider">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col h-screen relative w-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-surface h-16 border-b border-outline-variant/10 flex justify-between items-center px-6 lg:px-8 z-40 w-full shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1 text-secondary hover:text-primary lg:hidden"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="font-headline text-lg lg:text-xl font-semibold text-on-surface">
              {user?.vendor_profile?.shop_name || 'Artisan Workshop'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.vendor_profile?.verification_status && (
              <span className={`hidden sm:inline-block text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${
                user.vendor_profile.verification_status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : user.vendor_profile.verification_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.vendor_profile.verification_status}
              </span>
            )}
            
            <div className="h-9 w-9 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="vendor-logo" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-secondary text-lg">storefront</span>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
