import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import dealService from '../../../utils/dealService';
import contactService from '../../../utils/contactService';
import { useToast } from '../../../contexts/ToastContext';

const QuickActions = ({ onRefresh }) => {
  const navigate = useNavigate();
  const toast = useToast();
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
        toast.success(`Deal "${res.data?.title || dealForm.title}" created successfully!`);
        setShowAddDealModal(false);
        setDealForm({ title: '', value: '', stage: 'lead', probability: 25 });
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || 'Failed to create deal');
      }
    } catch (err) {
      console.error('Failed to quick create deal:', err);
      toast.error('Failed to create deal');
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
        toast.success(`Contact "${contactForm.firstName} ${contactForm.lastName}".trim() created!`);
        setShowAddContactModal(false);
        setContactForm({ firstName: '', lastName: '', email: '', company: '', phone: '' });
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || 'Failed to create contact');
      }
    } catch (err) {
      console.error('Failed to quick create contact:', err);
      toast.error('Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    {
      id: 'add-deal',
      title: 'New Deal',
      description: 'Create opportunity',
      icon: 'Plus',
      badgeBg: 'bg-primary-50 text-primary',
      action: () => setShowAddDealModal(true)
    },
    {
      id: 'add-contact',
      title: 'New Contact',
      description: 'Register customer',
      icon: 'UserPlus',
      badgeBg: 'bg-emerald-50 text-emerald-600',
      action: () => setShowAddContactModal(true)
    },
    {
      id: 'log-activity',
      title: 'Timeline',
      description: 'Activity stream',
      icon: 'Clock',
      badgeBg: 'bg-indigo-50 text-indigo-600',
      action: () => navigate('/activity-timeline')
    },
    {
      id: 'pipeline-analytics',
      title: 'Analytics',
      description: 'Conversion rates',
      icon: 'TrendingUp',
      badgeBg: 'bg-amber-50 text-amber-600',
      action: () => navigate('/pipeline-analytics')
    }
  ];

  const shortcuts = [
    { title: 'Deal Opportunities', path: '/deal-management', icon: 'Target' },
    { title: 'Contact Directory', path: '/contact-management', icon: 'Users' },
    { title: 'Pipeline Analytics', path: '/pipeline-analytics', icon: 'TrendingUp' },
    { title: 'Activity Audit Log', path: '/activity-timeline', icon: 'Clock' },
    { title: 'System Settings', path: '/settings-administration', icon: 'Settings' }
  ];

  return (
    <div className="card p-3 sm:p-3.5 border border-border/90 mb-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Left: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mr-1 hidden sm:inline">
            Quick Actions:
          </span>
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-border/80 bg-slate-50/70 hover:bg-surface hover:border-slate-300 hover:shadow-xs transition-all duration-150 cursor-pointer group"
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center ${action.badgeBg} group-hover:scale-105 transition-transform`}>
                <Icon name={action.icon} size={12} />
              </div>
              <span className="font-semibold text-xs text-text-primary group-hover:text-primary transition-colors">
                {action.title}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Compact Workspace Navigation */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs border-t xl:border-t-0 pt-2 xl:pt-0 border-border/60">
          <span className="text-[11px] text-text-tertiary hidden 2xl:inline font-medium mr-1.5">Workspaces:</span>
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.path}
              to={shortcut.path}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-text-secondary hover:text-primary hover:bg-slate-100/70 transition-colors text-xs font-medium whitespace-nowrap"
            >
              <Icon name={shortcut.icon} size={12} className="text-text-tertiary" />
              <span>{shortcut.title.replace(' Management', '').replace(' Opportunities', '')}</span>
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
