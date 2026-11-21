// src/pages/settings-administration/components/SettingsNavigation.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const SettingsNavigation = ({ activeSection, onSectionChange }) => {
  const navigationItems = [
    {
      id: 'user-management',
      label: 'User Management',
      icon: 'Users',
      description: 'Manage users, roles and status'
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: 'Shield',
      description: 'Role-based access control'
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: 'Plug',
      description: 'API connections and services'
    },
    {
      id: 'custom-fields',
      label: 'Custom Fields',
      icon: 'ListPlus',
      description: 'Field creation and configuration'
    },
    {
      id: 'email-templates',
      label: 'Email Templates',
      icon: 'Mail',
      description: 'Template editor and management'
    },
    {
      id: 'system-config',
      label: 'System Configuration',
      icon: 'Settings',
      description: 'General system settings'
    }
  ];

  return (
    <nav className="w-72 bg-surface border-r border-border/80 h-full">
      <div className="p-4 sm:p-5">
        <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">System Settings</h2>
        <ul className="space-y-1.5">
          {navigationItems?.map((item) => (
            <li key={item?.id}>
              <button
                onClick={() => onSectionChange?.(item?.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-150 group cursor-pointer ${
                  activeSection === item?.id
                    ? 'bg-primary-50/80 border border-primary-200 text-primary shadow-xs' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50/80 border border-transparent'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeSection === item?.id ? 'bg-primary text-white' : 'bg-slate-100 text-text-tertiary group-hover:text-text-primary'
                  }`}>
                    <Icon name={item?.icon} size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-xs truncate ${
                      activeSection === item?.id ? 'text-primary' : 'text-text-primary'
                    }`}>
                      {item?.label}
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5 leading-tight truncate">
                      {item?.description}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default SettingsNavigation;