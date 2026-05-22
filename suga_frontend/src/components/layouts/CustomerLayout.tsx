import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CustomerLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/products', label: 'Explore Products' },
    { to: '/ateliers', label: 'Find Ateliers' },
    { to: '/support', label: 'Support' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex flex-col">
            <span className="font-headline text-2xl font-bold text-primary tracking-tight">SUGA</span>
            <span className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest -mt-1">Artisan Marketplace</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `font-body text-sm font-medium tracking-wide transition-colors ${
                    isActive ? 'text-primary' : 'text-secondary hover:text-primary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/cart" className="relative text-secondary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {/* Cart Badge could go here */}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 focus:outline-none">
                  <div className="h-8 w-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary">person</span>
                    )}
                  </div>
                  <span className="font-body text-xs font-medium text-on-surface">{user?.username}</span>
                </button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg py-1 border border-outline-variant/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {user?.role === 'admin' && (
                    <Link to="/admin/dashboard" className="block px-4 py-2 text-xs font-body text-secondary hover:bg-surface-variant/20">
                      Admin Dashboard
                    </Link>
                  )}
                  {user?.role === 'vendor' && (
                    <Link to="/vendor/dashboard" className="block px-4 py-2 text-xs font-body text-secondary hover:bg-surface-variant/20">
                      Vendor Dashboard
                    </Link>
                  )}
                  <Link to="/profile" className="block px-4 py-2 text-xs font-body text-secondary hover:bg-surface-variant/20">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-xs font-body text-secondary hover:bg-surface-variant/20">
                    Order History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-xs font-body text-error hover:bg-error/5"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="font-body text-xs uppercase tracking-widest font-bold text-secondary hover:text-primary transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative text-secondary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 text-secondary hover:text-primary focus:outline-none"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-outline-variant/10 bg-surface px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block font-body text-sm font-medium text-secondary hover:text-primary py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-outline-variant/10 my-2 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-body text-sm font-medium text-secondary hover:text-primary py-2"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block font-body text-sm font-medium text-secondary hover:text-primary py-2"
                  >
                    Order History
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left font-body text-sm font-medium text-error py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2 border border-outline-variant/30 rounded font-label text-xs uppercase tracking-widest font-bold text-secondary hover:text-primary transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-secondary-container border-t border-outline-variant/10 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left md:flex md:justify-between md:items-center">
          <div>
            <span className="font-headline text-xl font-bold text-primary tracking-tight">SUGA</span>
            <p className="font-body text-xs text-on-surface-variant mt-1">© 2026 SUGA. Supporting Indian Handloom, Craft, and Ateliers.</p>
          </div>
          <div className="flex justify-center gap-6 mt-6 md:mt-0 font-body text-xs text-secondary">
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
