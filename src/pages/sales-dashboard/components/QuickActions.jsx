import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import dealService from '../../../utils/dealService';
import contactService from '../../../utils/contactService';

const QuickActions = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dealForm, setDealForm] = useState({
    title: '',
    value: '',
    stage: 'lead',
    probability: 25
  });

  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: ''
  });

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!dealForm.title) return;

    setIsSubmitting(true);
    try {
      const res = await dealService.createDeal({
        title: dealForm.title,
        value: parseFloat(dealForm.value || 0),
        stage: dealForm.stage,
        probability: dealForm.probability
      });

      if (res.success) {
        setShowAddDealModal(false);
        setDealForm({ title: '', value: '', stage: 'lead', probability: 25 });
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to quick create deal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!contactForm.firstName) return;

    setIsSubmitting(true);
    try {
      const res = await contactService.createContact({
        first_name: contactForm.firstName,
        last_name: contactForm.lastName || '',
        email: contactForm.email || `${contactForm.firstName.toLowerCase()}@example.com`,
        company: contactForm.company || 'Private Client',
        phone: contactForm.phone || '+1 (555) 000-0000',
        status: 'active'
      });

      if (res.success) {
        setShowAddContactModal(false);
        setContactForm({ firstName: '', lastName: '', email: '', company: '', phone: '' });
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to quick create contact:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    {
      id: 'add-deal',
      title: 'Add Deal',
      description: 'Create opportunity',
      icon: 'Plus',
      color: 'bg-primary text-white hover:bg-primary-700',
      action: () => setShowAddDealModal(true)
    },
    {
      id: 'add-contact',
      title: 'Add Contact',
      description: 'Register customer',
      icon: 'UserPlus',
      color: 'bg-success text-white hover:bg-success-600',
      action: () => setShowAddContactModal(true)
    },
    {
      id: 'log-activity',
      title: 'View Timeline',
      description: 'Activity feed',
      icon: 'Clock',
      color: 'bg-secondary text-white hover:bg-secondary-600',
      action: () => navigate('/activity-timeline')
    },
    {
      id: 'pipeline-analytics',
      title: 'Analytics',
      description: 'Conversion rates',
      icon: 'TrendingUp',
      color: 'bg-accent text-white hover:bg-accent-600',
      action: () => navigate('/pipeline-analytics')
    }
  ];

  const shortcuts = [
    { title: 'Deal Management', path: '/deal-management', icon: 'Target' },
    { title: 'Contact Management', path: '/contact-management', icon: 'Users' },
    { title: 'Pipeline Analytics', path: '/pipeline-analytics', icon: 'TrendingUp' },
    { title: 'Activity Timeline', path: '/activity-timeline', icon: 'Clock' },
    { title: 'System Administration', path: '/settings-administration', icon: 'Settings' }
  ];

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
        Quick Actions
      </h3>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`${action.color} p-3 rounded-lg transition-all text-left shadow-xs cursor-pointer flex flex-col justify-between`}
          >
            <div className="flex items-center space-x-2 mb-1.5">
              <Icon name={action.icon} size={16} />
              <span className="font-semibold text-xs">{action.title}</span>
            </div>
            <p className="text-[10px] opacity-85 leading-tight">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Shortcuts
        </h4>
        <div className="space-y-1">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.path}
              to={shortcut.path}
              className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-xs font-medium"
            >
              <Icon name={shortcut.icon} size={14} className="text-text-tertiary" />
              <span>{shortcut.title}</span>
              <Icon name="ChevronRight" size={12} className="ml-auto text-text-tertiary" />
            </Link>
          ))}
        </div>
      </div>

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                  <Icon name="Plus" size={18} />
                </div>
                <h3 className="text-base font-bold text-text-primary">Quick Add Deal</h3>
              </div>
              <button
                onClick={() => setShowAddDealModal(false)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. Acme Corp Cloud Upgrade"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Deal Value ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                  className="input-field text-sm"
                  placeholder="75000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Stage
                </label>
                <select
                  value={dealForm.stage}
                  onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
              </div>
              
              <div className="flex space-x-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-hover text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary text-xs font-medium"
                >
                  {isSubmitting ? 'Creating...' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-success-50 text-success flex items-center justify-center">
                  <Icon name="UserPlus" size={18} />
                </div>
                <h3 className="text-base font-bold text-text-primary">Quick Add Contact</h3>
              </div>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateContact} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="input-field text-sm"
                  placeholder="jane.doe@company.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Acme Innovations"
                />
              </div>
              
              <div className="flex space-x-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-hover text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary text-xs font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
