import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password2: '',
    role: 'customer' as 'customer' | 'vendor',
    shop_name: '',
    vendor_type: 'tailor',
    location: '',
  });
  const [error, setError] = useState<Record<string, string[]> | string>('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.password2) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      if (formData.role === 'customer') {
        // Remove vendor-specific fields if registering as customer
        delete (payload as any).shop_name;
        delete (payload as any).vendor_type;
        delete (payload as any).location;
      }
      
      const response = await api.post('auth/register/', payload);
      setSuccess(response.data.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data && typeof err.response.data === 'object') {
        setError(err.response.data);
      } else {
        setError('Something went wrong. Please check the inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderErrorMessages = () => {
    if (!error) return null;
    if (typeof error === 'string') {
      return (
        <div className="p-3 bg-error-container/30 border border-error/20 rounded text-error text-xs font-body font-medium">
          {error}
        </div>
      );
    }
    
    // It's an object of field errors
    return (
      <div className="p-3 bg-error-container/30 border border-error/20 rounded text-error text-xs font-body font-medium space-y-1">
        {Object.entries(error).map(([field, messages]) => (
          <div key={field}>
            <span className="capitalize font-bold">{field}:</span>{' '}
            {Array.isArray(messages) ? messages.join(' ') : String(messages)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 bg-surface p-8 rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">SUGA</h1>
          <p className="font-body text-xs text-on-surface-variant uppercase tracking-widest mt-1">Artisan & Tailoring Marketplace</p>
          <h2 className="mt-6 font-headline text-xl font-medium text-on-surface">Create Your Account</h2>
        </div>

        {success && (
          <div className="p-3 bg-green-100 border border-green-200 rounded text-green-800 text-xs font-body font-medium">
            {success}
          </div>
        )}

        {renderErrorMessages()}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'customer' }))}
              className={`py-3 rounded-lg font-label text-xs uppercase tracking-widest font-bold border transition-colors ${
                formData.role === 'customer'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface text-secondary border-outline-variant/30 hover:border-primary'
              }`}
            >
              As Customer
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, role: 'vendor' }))}
              className={`py-3 rounded-lg font-label text-xs uppercase tracking-widest font-bold border transition-colors ${
                formData.role === 'vendor'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface text-secondary border-outline-variant/30 hover:border-primary'
              }`}
            >
              As Artisan/Vendor
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">First Name</label>
              <input
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Last Name</label>
              <input
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Username</label>
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Phone</label>
              <input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                placeholder="e.g. +91 9999999999"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Dynamic Vendor Fields */}
          {formData.role === 'vendor' && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-4">
              <h3 className="font-headline text-sm font-semibold text-primary">Vendor Shop Details</h3>
              
              <div>
                <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Shop Name</label>
                <input
                  name="shop_name"
                  type="text"
                  required={formData.role === 'vendor'}
                  value={formData.shop_name}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                  placeholder="e.g. Heritage Weavers"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Vendor Type</label>
                  <select
                    name="vendor_type"
                    value={formData.vendor_type}
                    onChange={handleChange}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="tailor">Tailor</option>
                    <option value="boutique">Boutique</option>
                    <option value="handloom_weaver">Handloom Weaver</option>
                    <option value="alteration_specialist">Alteration Specialist</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Location/City</label>
                  <input
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                    placeholder="e.g. Varanasi, UP"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                placeholder="Min. 8 characters"
              />
            </div>
            <div>
              <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Confirm Password</label>
              <input
                name="password2"
                type="password"
                required
                value={formData.password2}
                onChange={handleChange}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container disabled:bg-secondary-container transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></div>
                  Registering...
                </>
              ) : (
                'Register Account'
              )}
            </button>
          </div>
        </form>

        <div className="text-center font-body text-xs text-on-surface-variant mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
