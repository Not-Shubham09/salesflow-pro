import React, { useState, useEffect } from 'react';
import Icon from './AppIcon';
import dealService from '../utils/dealService';
import contactService from '../utils/contactService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const DEFAULT_STAGES = [
  { value: 'lead', label: 'Lead', defaultProb: 20 },
  { value: 'qualified', label: 'Qualified', defaultProb: 40 },
  { value: 'proposal', label: 'Proposal', defaultProb: 70 },
  { value: 'negotiation', label: 'Negotiation', defaultProb: 85 },
  { value: 'closed_won', label: 'Closed Won', defaultProb: 100 },
  { value: 'closed_lost', label: 'Closed Lost', defaultProb: 0 },
];

const CreateDealModal = ({ isOpen, onClose, onSuccess, initialStage = 'lead' }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [contacts, setContacts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: initialStage,
    probability: 20,
    expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    contact_id: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        title: '',
        value: '',
        stage: initialStage,
        probability: DEFAULT_STAGES.find(s => s.value === initialStage)?.defaultProb ?? 20,
        expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        contact_id: '',
        description: '',
      });
      setErrors({});

      // Load contacts if not loaded
      contactService.getContacts().then((res) => {
        if (res?.data && res.data.length > 0) {
          setContacts(res.data);
          setFormData((prev) => ({
            ...prev,
            contact_id: prev.contact_id || res.data[0].id,
          }));
        }
      });
    }
  }, [isOpen, initialStage]);

  if (!isOpen) return null;

  const handleStageChange = (newStage) => {
    const stageObj = DEFAULT_STAGES.find((s) => s.value === newStage);
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: stageObj ? stageObj.defaultProb : prev.probability,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Opportunity title is required';
    }
    const val = parseFloat(formData.value);
    if (!formData.value || isNaN(val) || val <= 0) {
      errs.value = 'Deal value must be greater than $0';
    }
    if (!formData.expected_close_date) {
      errs.expected_close_date = 'Target close date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        value: parseFloat(formData.value),
        stage: formData.stage,
        probability: parseInt(formData.probability, 10),
        expected_close_date: formData.expected_close_date,
        contact_id: formData.contact_id || null,
        description: formData.description.trim(),
        user_id: user?.id || null,
      };

      const result = await dealService.createDeal(payload);
      if (result.success && result.data) {
        toast.success(`Deal "${result.data.title || payload.title}" created successfully!`);
        if (onSuccess) onSuccess(result.data);
        onClose();
      } else {
        toast.error(result.error || 'Failed to create deal. Please try again.');
      }
    } catch (err) {
      console.error('CreateDealModal error:', err);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl p-6 sm:p-7 overflow-hidden z-10 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center border border-primary-100">
                <Icon name="Target" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary tracking-tight">
                  Create New Opportunity
                </h3>
                <p className="text-xs text-text-secondary">
                  Add a new sales deal to your pipeline
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                Deal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                placeholder="e.g. Acme Corp Enterprise Platform"
                className={`input-field text-sm ${errors.title ? 'border-error' : ''}`}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-xs text-error">{errors.title}</p>
              )}
            </div>

            {/* Value & Expected Close Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                  Deal Value ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-medium">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => {
                      setFormData({ ...formData, value: e.target.value });
                      if (errors.value) setErrors({ ...errors, value: '' });
                    }}
                    placeholder="50,000"
                    className={`input-field pl-7 text-sm ${errors.value ? 'border-error' : ''}`}
                  />
                </div>
                {errors.value && (
                  <p className="mt-1 text-xs text-error">{errors.value}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                  Target Close Date *
                </label>
                <input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => {
                    setFormData({ ...formData, expected_close_date: e.target.value });
                    if (errors.expected_close_date) setErrors({ ...errors, expected_close_date: '' });
                  }}
                  className={`input-field text-sm ${errors.expected_close_date ? 'border-error' : ''}`}
                />
                {errors.expected_close_date && (
                  <p className="mt-1 text-xs text-error">{errors.expected_close_date}</p>
                )}
              </div>
            </div>

            {/* Stage & Probability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                  Pipeline Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="input-field text-sm"
                >
                  {DEFAULT_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                  Probability ({formData.probability}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value, 10) })}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer mt-2"
                />
              </div>
            </div>

            {/* Primary Contact */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                Associated Contact
              </label>
              <select
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                className="input-field text-sm"
              >
                <option value="">Select or leave blank...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.company || 'Direct'})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes / Description */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
                Notes & Summary
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key scope, customer requirements, next steps..."
                className="input-field text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2 text-sm shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Deal...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Plus" size={16} />
                    <span>Create Deal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDealModal;
