import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    userProfile, 
    signOut, 
    isDemoMode, 
    isSupabaseConfigured,
    resetDemoData, 
    switchDemoRole 
  } = useAuth();

  const handleLogout = async () => {
    await signOut();
    handleNavigation();
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/sales-dashboard', icon: 'BarChart3', tooltip: 'Pipeline overview and metrics' },
    { label: 'Deals', path: '/deal-management', icon: 'Target', tooltip: 'Manage deal lifecycle and opportunities' },
    { label: 'Contacts', path: '/contact-management', icon: 'Users', tooltip: 'Customer relationship management' },
    { label: 'Analytics', path: '/pipeline-analytics', icon: 'TrendingUp', tooltip: 'Performance insights and analysis' },
    { label: 'Activity', path: '/activity-timeline', icon: 'Clock', tooltip: 'Interaction timeline and history' },
    { label: 'Settings', path: '/settings-administration', icon: 'Settings', tooltip: 'System and user settings' }
  ];

  const demoRoles = [
    { label: 'Sales Manager', email: 'sales.manager@salesflow.com', name: 'Jordan Hayes' },
    { label: 'Sales Representative', email: 'sales.rep@salesflow.com', name: 'Alex Rivera' },
    { label: 'Sales Director', email: 'sales.director@salesflow.com', name: 'Morgan Vance' },
    { label: 'System Admin', email: 'admin@salesflow.com', name: 'Devon Miller' },
  ];

  const isActiveRoute = (path) => {
    if (path === '/deal-management') {
      return location.pathname.startsWith('/deal-management');
    }
    return location.pathname === path;
  };

  const handleNavigation = () => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const formatRoleName = (role) => {
    if (!role) return 'Team Member';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-surface/95 backdrop-blur border-b border-border z-40">
        <div className="px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/sales-dashboard" 
                className="flex items-center space-x-2.5 group"
                onClick={handleNavigation}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform">
                  <Icon name="Activity" size={20} className="text-white" />
                </div>
                <div>
                  <span className="text-base font-bold text-text-primary tracking-tight font-heading">
                    SalesFlow<span className="text-primary font-bold">Pro</span>
                  </span>
                  <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary border border-primary-100">
                    CRM
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigation}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    isActiveRoute(item.path)
                      ? 'bg-primary-50 text-primary font-semibold border border-primary-100 shadow-xs' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  title={item.tooltip}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Environment / Demo Badge */}
              <div className="hidden sm:flex items-center space-x-2">
                {isDemoMode ? (
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Demo Mode</span>
                    <button
                      onClick={resetDemoData}
                      title="Reset sample CRM data to original state"
                      className="ml-1 text-[11px] underline text-emerald-800 hover:text-emerald-950 font-semibold"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Supabase Live</span>
                  </div>
                )}
              </div>

              {/* User Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-surface-hover border border-transparent hover:border-border transition-all"
                >
                  <img
                    src={userProfile?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={userProfile?.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-border"
                  />
                  <div className="hidden md:block text-left text-xs">
                    <p className="font-semibold text-text-primary leading-tight">
                      {userProfile?.full_name || 'Sales User'}
                    </p>
                    <p className="text-text-secondary text-[10px] leading-tight capitalize">
                      {formatRoleName(userProfile?.role)}
                    </p>
                  </div>
                  <Icon name="ChevronDown" size={14} className="text-text-tertiary" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-lg border border-border py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-text-primary">
                        {userProfile?.full_name || 'Sales User'}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {user?.email || 'sales.manager@salesflow.com'}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full font-medium bg-primary-50 text-primary">
                        {formatRoleName(userProfile?.role)}
                      </span>
                    </div>

                    {/* Role Switcher for Demo */}
                    {isDemoMode && (
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                          Switch Demo Role:
                        </p>
                        <div className="space-y-1">
                          {demoRoles.map(role => (
                            <button
                              key={role.email}
                              onClick={async () => {
                                await switchDemoRole(role.email);
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                                user?.email === role.email 
                                  ? 'bg-primary-50 text-primary font-medium'
                                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                              }`}
                            >
                              <span>{role.label}</span>
                              {user?.email === role.email && <Icon name="Check" size={12} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="py-1">
                      <Link
                        to="/settings-administration"
                        onClick={handleNavigation}
                        className="flex items-center space-x-2 px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                      >
                        <Icon name="Settings" size={14} />
                        <span>System Settings</span>
                      </Link>

                      {isDemoMode && (
                        <button
                          onClick={() => {
                            resetDemoData();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        >
                          <Icon name="RotateCcw" size={14} />
                          <span>Reset Demo CRM Data</span>
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs text-error hover:bg-error-50 transition-colors"
                      >
                        <Icon name="LogOut" size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-hover"
              >
                <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-surface shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <Icon name="Activity" size={18} />
                  </div>
                  <span className="font-bold text-text-primary">SalesFlow Pro</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-text-secondary">
                  <Icon name="X" size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                {navigationItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavigation}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActiveRoute(item.path)
                        ? 'bg-primary-50 text-primary font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error-50 w-full"
              >
                <Icon name="LogOut" size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for user menu */}
      {isUserMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)}></div>
      )}
    </>
  );
};

export default Header;
