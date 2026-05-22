import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine where to redirect after successful login
  const from = location.state?.from?.pathname || '';
  const redirectUser = (role: 'customer' | 'vendor' | 'admin') => {
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'vendor') {
      navigate('/vendor/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // If already logged in, redirect away
  React.useEffect(() => {
    if (isAuthenticated && user) {
      redirectUser(user.role);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(username, password);
      redirectUser(loggedInUser.role);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Invalid credentials. Please verify your username and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">SUGA</h1>
          <p className="font-body text-xs text-on-surface-variant uppercase tracking-widest mt-1">Artisan & Tailoring Marketplace</p>
          <h2 className="mt-6 font-headline text-xl font-medium text-on-surface">Log In to Your Account</h2>
        </div>
        
        {error && (
          <div className="p-3 bg-error-container/30 border border-error/20 rounded text-error text-xs font-body font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md">
            <div className="mb-4">
              <label htmlFor="username" className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm font-body text-on-surface placeholder-secondary-container focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter your username"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm font-body text-on-surface placeholder-secondary-container focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
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
                  Logging In...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center font-body text-xs text-on-surface-variant mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
