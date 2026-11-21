import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from 'components/ui/Header';
import Breadcrumb from 'components/ui/Breadcrumb';
import Icon from 'components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import dealService from '../../utils/dealService';
import contactService from '../../utils/contactService';
import taskService from '../../utils/taskService';
import TaskFormModal from '../../components/TaskFormModal';
import CreateDealModal from '../../components/CreateDealModal';

import DealForm from './components/DealForm';
import ActivityTimeline from './components/ActivityTimeline';
import DealActions from './components/DealActions';

const DealManagement = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { id } = useParams();
  const dealId = id;
  const navigate = useNavigate();

  const [allDeals, setAllDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(() => {
    if (dealId === 'new') {
      return {
        title: '',
        name: '',
        value: '',
        probability: 50,
        stage: 'lead',
        expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        user_id: user?.id || 'usr-mgr-1',
        contact_id: null,
        description: ''
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const stages = [
    { value: "lead", label: "Lead", color: "bg-slate-100 text-slate-700 border border-slate-200" },
    { value: "qualified", label: "Qualified", color: "bg-blue-50 text-blue-700 border border-blue-200" },
    { value: "proposal", label: "Proposal", color: "bg-amber-50 text-amber-700 border border-amber-200" },
    { value: "negotiation", label: "Negotiation", color: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
    { value: "closed_won", label: "Closed Won", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    { value: "closed_lost", label: "Closed Lost", color: "bg-rose-50 text-rose-700 border border-rose-200" }
  ];

  const [salesReps, setSalesReps] = useState([
    { value: 'usr-mgr-1', label: 'Jordan Hayes (Manager)' },
    { value: 'usr-rep-1', label: 'Alex Rivera (Sales Rep)' },
    { value: 'usr-dir-1', label: 'Morgan Vance (Director)' }
  ]);
  const [contacts, setContacts] = useState([]);

  // Load contacts and reps
  useEffect(() => {
    const fetchData = async () => {
      const { data: contactsData } = await contactService.getContacts();
      if (contactsData) {
        setContacts(contactsData);
      }
    };
    fetchData();
  }, []);

  // Load deals list or single deal
  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true);
      if (dealId && dealId !== 'new') {
        const result = await dealService.getDealById(dealId);
        if (result.success && result.data) {
          setSelectedDeal(result.data);
        } else {
          setSelectedDeal(null);
        }
      } else if (dealId === 'new') {
        setSelectedDeal({
          title: '',
          name: '',
          value: '',
          probability: 50,
          stage: 'lead',
          expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          user_id: user?.id || 'usr-mgr-1',
          contact_id: contacts[0]?.id || null,
          description: ''
        });
      } else {
        // Load all deals for list view
        const result = await dealService.getDeals();
        if (result.success) {
          setAllDeals(result.data || []);
        }
        setSelectedDeal(null);
      }
      setIsLoading(false);
    };

    fetchDeals();
  }, [dealId, user, contacts.length]);

  const handleSaveDeal = async (dealData) => {
    setIsSaving(true);
    try {
      let result;
      if (selectedDeal?.id) {
        result = await dealService.updateDeal(selectedDeal.id, dealData);
      } else {
        result = await dealService.createDeal({
          ...dealData,
          user_id: dealData.user_id || user?.id
        });
      }

      if (result.success) {
        toast.success(`Deal "${result.data?.title || dealData.title}" saved successfully!`);
        navigate('/deal-management');
      } else {
        toast.error(result.error || 'Failed to save deal');
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeal = async () => {
    const targetId = dealToDelete?.id || selectedDeal?.id;
    if (!targetId) return;

    try {
      const result = await dealService.deleteDeal(targetId);
      if (result.success) {
        toast.success('Deal deleted successfully');
        setShowDeleteModal(false);
        setDealToDelete(null);
        if (dealId) {
          navigate('/deal-management');
        } else {
          setAllDeals(prev => prev.filter(d => String(d.id) !== String(targetId)));
        }
      } else {
        toast.error(result.error || 'Failed to delete deal');
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  const handleCloneDeal = async () => {
    if (!selectedDeal) return;
    try {
      const cloned = await dealService.createDeal({
        ...selectedDeal,
        title: `${selectedDeal.title || selectedDeal.name} (Copy)`,
        stage: 'lead',
        probability: 20
      });
      if (cloned.success) {
        navigate(`/deal-management/${cloned.data.id}`);
      }
    } catch (err) {
      console.error('Clone deal error:', err);
    }
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      const { assigned_to, ...restOfTaskData } = taskData;
      const result = await taskService.createTask({
        ...restOfTaskData,
        deal_id: selectedDeal?.id,
        contact_id: selectedDeal?.contact_id || null,
        user_id: user?.id,
      });
      if (result.success) {
        setShowTaskModal(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getStageBadge = (stageValue) => {
    const stageObj = stages.find(s => s.value === stageValue);
    return stageObj || { label: stageValue, color: 'bg-gray-100 text-gray-800' };
  };

  // Filtered deals for list view
  const filteredDeals = allDeals.filter(deal => {
    const title = (deal.title || deal.name || '').toLowerCase();
    const contactName = deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}`.toLowerCase() : '';
    const company = (deal.contacts?.company || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = title.includes(q) || contactName.includes(q) || company.includes(q);
    const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalValue = filteredDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);

  // --- DETAIL / FORM VIEW (when dealId is in URL) ---
  if (dealId) {
    if (isLoading && !selectedDeal && dealId !== 'new') {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-text-secondary">Loading deal details...</span>
              </div>
            </div>
          </main>
        </div>
      );
    }
    if (!selectedDeal && dealId !== 'new') {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-20 px-6">
            <div className="max-w-7xl mx-auto py-12 text-center">
              <Icon name="AlertCircle" size={48} className="text-text-tertiary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Deal Not Found</h2>
              <p className="text-text-secondary mb-6">The deal you're looking for doesn't exist or has been removed.</p>
              <button onClick={() => navigate('/deal-management')} className="btn-primary">
                Back to All Deals
              </button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 text-sm text-text-secondary mb-4">
              <Link to="/sales-dashboard" className="hover:text-primary">Dashboard</Link>
              <span>/</span>
              <Link to="/deal-management" className="hover:text-primary">Deals</Link>
              <span>/</span>
              <span className="text-text-primary font-medium">
                {selectedDeal?.title || selectedDeal?.name || 'New Opportunity'}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="mb-4 lg:mb-0">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => navigate('/deal-management')}
                    className="p-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    title="Back to list"
                  >
                    <Icon name="ArrowLeft" size={18} />
                  </button>
                  <h1 className="text-2xl font-bold text-text-primary">
                    {selectedDeal?.title || selectedDeal?.name || 'Create New Opportunity'}
                  </h1>
                </div>
                {selectedDeal?.id && (
                  <div className="flex items-center space-x-4 text-xs text-text-secondary mt-2 ml-11">
                    <span>Deal ID: #{selectedDeal.id}</span>
                    <span>•</span>
                    <span>Expected: {selectedDeal.expected_close_date || selectedDeal.expectedCloseDate || 'Not set'}</span>
                    <span>•</span>
                    <span>Probability: {selectedDeal.probability}%</span>
                  </div>
                )}
              </div>

              <DealActions
                onSave={null}
                onDelete={selectedDeal?.id ? () => setShowDeleteModal(true) : null}
                onClone={selectedDeal?.id ? handleCloneDeal : null}
                onCreateTask={selectedDeal?.id ? handleCreateTask : null}
                isSaving={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8">
                <DealForm
                  deal={selectedDeal}
                  contacts={contacts}
                  stages={stages}
                  salesReps={salesReps}
                  onSave={handleSaveDeal}
                  isSaving={isSaving}
                />
              </div>

              <div className="xl:col-span-4 space-y-6">
                <ActivityTimeline
                  dealId={selectedDeal?.id || null}
                  contact={selectedDeal?.contact_id ? contacts.find(c => c.id === selectedDeal.contact_id) : null}
                />
              </div>
            </div>
          </div>
        </main>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-border">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-error-50 rounded-full flex items-center justify-center">
                  <Icon name="AlertTriangle" size={20} className="text-error" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">Delete Deal</h3>
              </div>
              <p className="text-text-secondary text-sm mb-6">
                Are you sure you want to delete this deal? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDeal}
                  className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error-600 text-sm font-medium"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showTaskModal && (
          <TaskFormModal
            isOpen={showTaskModal}
            onClose={() => setShowTaskModal(false)}
            onSave={handleSaveTask}
            initialData={{
              deal_id: selectedDeal?.id,
              contact_id: selectedDeal?.contact_id || null,
              assigned_to: user?.id,
              status: 'pending',
              priority: 'medium',
            }}
          />
        )}
      </div>
    );
  }

  // --- LIST / OVERVIEW VIEW (default when visiting /deal-management) ---
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header & Quick Stats */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">Deal Opportunities</h1>
              <p className="text-text-secondary text-sm">
                Manage, track, and forecast your active sales deals
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center space-x-2 shadow-sm"
              >
                <Icon name="Plus" size={18} />
                <span>New Deal</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-4 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total Deals</p>
                <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">{filteredDeals.length}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">Active in pipeline</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center border border-primary-100/50 shadow-xs">
                <Icon name="Target" size={20} />
              </div>
            </div>
            <div className="card p-4 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Pipeline Value</p>
                <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">{formatCurrency(totalValue)}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Unweighted total</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-xs">
                <Icon name="DollarSign" size={20} />
              </div>
            </div>
            <div className="card p-4 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Avg Deal Size</p>
                <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                  {formatCurrency(filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0)}
                </p>
                <p className="text-[11px] text-text-tertiary mt-0.5">Per opportunity</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-xs">
                <Icon name="TrendingUp" size={20} />
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border/90">
            <div className="relative flex-1 max-w-md">
              <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search deals by title, company, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9.5 text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-border/60">
              <button
                onClick={() => setStageFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  stageFilter === 'all'
                    ? 'bg-surface text-primary font-semibold shadow-xs border border-border/80 ring-1 ring-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                }`}
              >
                All ({allDeals.length})
              </button>
              {stages.map(st => {
                const count = allDeals.filter(d => d.stage === st.value).length;
                return (
                  <button
                    key={st.value}
                    onClick={() => setStageFilter(st.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      stageFilter === st.value
                        ? 'bg-surface text-primary font-semibold shadow-xs border border-border/80 ring-1 ring-primary/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                    }`}
                  >
                    {st.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deals Table */}
          <div className="card overflow-hidden border border-border/90 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-border/80 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-3 px-4">Deal Title</th>
                    <th className="py-3 px-4">Contact & Company</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Probability</th>
                    <th className="py-3 px-4">Expected Close</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-sm">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-44"></div></td>
                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="py-4 px-4"><div className="h-5 bg-gray-200 rounded-full w-20"></div></td>
                        <td className="py-4 px-4"><div className="h-2 bg-gray-200 rounded w-24"></div></td>
                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="py-4 px-4 text-right"><div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-secondary">
                        <Icon name="Inbox" size={36} className="mx-auto mb-2 text-text-tertiary" />
                        <p className="font-medium">No deals found matching your filters</p>
                        <p className="text-xs text-text-tertiary mt-1">Try clearing filters or add a new deal</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => {
                      const badge = getStageBadge(deal.stage);
                      return (
                        <tr 
                          key={deal.id} 
                          className="hover:bg-surface-hover transition-colors cursor-pointer group"
                          onClick={() => navigate(`/deal-management/${deal.id}`)}
                        >
                          <td className="py-3.5 px-4 font-medium text-text-primary">
                            <div className="flex items-center space-x-2">
                              <span className="group-hover:text-primary transition-colors">
                                {deal.title || deal.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">
                            <div>
                              <p className="text-text-primary text-xs font-medium">
                                {deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : '—'}
                              </p>
                              <p className="text-xs text-text-tertiary">{deal.contacts?.company || 'Direct'}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-text-primary">
                            {formatCurrency(deal.value)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-primary h-full rounded-full" 
                                  style={{ width: `${deal.probability || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-text-secondary font-medium">{deal.probability || 0}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-text-secondary">
                            {deal.expected_close_date || deal.expectedCloseDate || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => navigate(`/deal-management/${deal.id}`)}
                                className="p-1.5 rounded hover:bg-gray-100 text-text-secondary hover:text-primary transition-colors"
                                title="Edit Deal"
                              >
                                <Icon name="Edit2" size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setDealToDelete(deal);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 rounded hover:bg-error-50 text-text-secondary hover:text-error transition-colors"
                                title="Delete Deal"
                              >
                                <Icon name="Trash2" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal for List View */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-error-50 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-error" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Delete Deal</h3>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to delete "{dealToDelete?.title || dealToDelete?.name || selectedDeal?.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDealToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeal}
                className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error-600 text-sm font-medium"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Deal Slide-over / Modal */}
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newDeal) => {
          setAllDeals((prev) => [newDeal, ...prev]);
        }}
      />
    </div>
  );
};

export default DealManagement;
