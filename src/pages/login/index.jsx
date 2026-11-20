import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from 'components/AppIcon';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading, authError, clearError, isDemoMode } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/sales-dashboard');
    }
  }, [user, loading, navigate]);

  // Demo credentials for quick access
  const demoCredentials = [
    { 
      email: 'sales.manager@salesflow.com', 
      password: 'Manager456!', 
      role: 'Sales Manager',
      badge: 'Recommended',
      badgeColor: 'bg-primary-50 text-primary border-primary-200'
    },
    { 
      email: 'sales.rep@salesflow.com', 
      password: 'SalesRep123!', 
      role: 'Sales Representative',
      badge: 'Sales Rep',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      email: 'sales.director@salesflow.com', 
      password: 'Director789!', 
      role: 'Sales Director',
      badge: 'Executive',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    { 
      email: 'admin@salesflow.com', 
      password: 'Admin2024!', 
      role: 'System Administrator',
      badge: 'Admin',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn(formData.email, formData.password);
      if (result?.success) {
        navigate('/sales-dashboard');
      } else {
        setFailedAttempts(prev => prev + 1);
        setErrors({ 
          general: result?.error || 'Invalid credentials'
        });
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (cred) => {
    setFormData({
      email: cred.email,
      password: cred.password,
      rememberMe: true
    });
    setIsLoading(true);
    setErrors({});

    try {
      const result = await signIn(cred.email, cred.password);
      if (result?.success) {
        navigate('/sales-dashboard');
      } else {
        setErrors({ general: result?.error || 'Login failed' });
      }
    } catch {
      setErrors({ general: 'Failed to sign in with demo credentials' });
    } finally {
      setIsLoading(false);
    }
  };

  if (user && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-text-secondary text-sm">Redirecting to Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 via-background to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-600 text-white shadow-md shadow-primary/25 mb-3">
            <Icon name="Activity" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">
            SalesFlow <span className="text-primary font-bold">Pro</span> CRM
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Sign in to access your sales workspace
          </p>
        </div>

        {/* Demo Mode Notice Banner */}
        <div className="mb-4 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between text-emerald-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">1-Click Demo Mode Active</span>
          </div>
          <span className="text-emerald-700 text-[11px]">Ready for presentation</span>
        </div>

        {/* Login Card */}
        <div className="card p-6 sm:p-8 shadow-md border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(errors.general || authError) && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-center space-x-2 text-xs text-error">
                <Icon name="AlertCircle" size={16} className="flex-shrink-0" />
                <span>{errors.general || authError}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-field pl-9 text-sm ${errors.email ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  placeholder="sales.manager@salesflow.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input-field pl-9 pr-9 text-sm ${errors.password ? 'border-error focus:ring-error focus:border-error' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-error">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-2.5 text-sm font-semibold shadow-sm mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Accounts Section */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Quick Demo Access
              </span>
              <span className="text-[11px] text-text-tertiary">Select a role to test</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => handleQuickLogin(cred)}
                  disabled={isLoading}
                  className="p-2.5 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {cred.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate font-mono">
                    {cred.email.split('@')[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-text-tertiary">
          SalesFlow Pro CRM &bull; Academic Project Demonstration
        </div>
      </div>
    </div>
  );
};

export default Login;
