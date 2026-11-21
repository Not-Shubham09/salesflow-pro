import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import dealService from '../../utils/dealService';
import activityService from '../../utils/activityService';
import analyticsService from '../../utils/analyticsService';
import taskService from '../../utils/taskService';
import Header from 'components/ui/Header';
import Breadcrumb from 'components/ui/Breadcrumb';
import Icon from 'components/AppIcon';

import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import UpcomingTasks from './components/UpcomingTasks';
import PipelineStage from './components/PipelineStage';
import PerformanceMetrics from './components/PerformanceMetrics';
import CreateDealModal from '../../components/CreateDealModal';

const SalesDashboard = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pipelineData, setPipelineData] = useState({
    lead: { id: 'lead', title: 'Lead', deals: [] },
    qualified: { id: 'qualified', title: 'Qualified', deals: [] },
    proposal: { id: 'proposal', title: 'Proposal', deals: [] },
    negotiation: { id: 'negotiation', title: 'Negotiation', deals: [] },
    closed_won: { id: 'closed_won', title: 'Closed Won', deals: [] },
    closed_lost: { id: 'closed_lost', title: 'Closed Lost', deals: [] }
  });
  const [dealStats, setDealStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', forecast: 450000, actual: 420000 },
    { month: 'Feb', forecast: 520000, actual: 485000 },
    { month: 'Mar', forecast: 580000, actual: 562000 },
    { month: 'Apr', forecast: 620000, actual: 598000 },
    { month: 'May', forecast: 680000, actual: 645000 },
    { month: 'Jun', forecast: 750000, actual: 710000 }
  ]);
  const [performanceData, setPerformanceData] = useState({
    quota: userProfile?.quota_amount ?? 0,
    achieved: 0,
    percentage: 0,
    dealsWon: 0,
    dealsLost: 0,
    avgDealSize: 0,
    conversionRate: 0,
    activePipeline: 0,
    activeDealCount: 0
  });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!user || authLoading) return;

    try {
      setLoading(true);
      setError(null);

      const [
        pipelineResult,
        statsResult,
        activitiesResult,
        revenueResult,
        performanceResult,
        tasksResult
      ] = await Promise.all([
        dealService.getPipelineDeals(),
        dealService.getDealStats(),
        activityService.getRecentActivities(10),
        analyticsService.getRevenueData(selectedDateRange),
        analyticsService.getPerformanceMetrics(),
        taskService.getUpcomingTasks(user?.id, 5)
      ]);

      if (pipelineResult?.success && pipelineResult.data) {
        setPipelineData(pipelineResult.data);
      }

      if (statsResult?.success) {
        setDealStats(statsResult.data || {});
      }

      if (activitiesResult?.success) {
        setRecentActivities(activitiesResult.data || []);
      }

      if (revenueResult?.success) {
        setRevenueData(revenueResult.data || []);
      }

      if (performanceResult?.success) {
        setPerformanceData(performanceResult.data || {});
      }

      if (tasksResult?.success) {
        setUpcomingTasks(tasksResult.data || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, selectedDateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle drag and drop
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    try {
      const updateResult = await dealService.updateDealStage(draggableId, destination.droppableId);
      
      if (!updateResult?.success) {
        setError(updateResult?.error || 'Failed to update deal stage');
        return;
      }

      const sourceStage = pipelineData[source.droppableId];
      const destStage = pipelineData[destination.droppableId];
      const draggedDeal = sourceStage?.deals?.find(deal => String(deal.id) === String(draggableId));

      if (!draggedDeal) return;

      const stageProbs = {
        'lead': 20,
        'qualified': 40,
        'proposal': 70,
        'negotiation': 85,
        'closed_won': 100,
        'closed_lost': 0
      };

      const updatedDeal = {
        ...draggedDeal,
        probability: stageProbs[destination.droppableId] ?? draggedDeal.probability,
        daysInStage: 0
      };

      const newSourceDeals = sourceStage.deals.filter(deal => String(deal.id) !== String(draggableId));
      const newDestDeals = [...destStage.deals];
      newDestDeals.splice(destination.index, 0, updatedDeal);

      setPipelineData({
        ...pipelineData,
        [source.droppableId]: {
          ...sourceStage,
          deals: newSourceDeals
        },
        [destination.droppableId]: {
          ...destStage,
          deals: newDestDeals
        }
      });

      const statsResult = await dealService.getDealStats();
      if (statsResult?.success) {
        setDealStats(statsResult.data);
      }
    } catch (err) {
      console.error('Drag and drop error:', err);
    }
  };

  const calculateStageTotal = (stage) => {
    return stage?.deals?.reduce((total, deal) => total + (parseFloat(deal.value) || 0), 0) || 0;
  };

  const calculateWeightedTotal = (stage) => {
    return stage?.deals?.reduce((total, deal) => total + ((parseFloat(deal.value) || 0) * (deal.probability || 0) / 100), 0) || 0;
  };

  const totalPipelineValue = Object.values(pipelineData).reduce((total, stage) => 
    total + calculateStageTotal(stage), 0
  );

  const weightedPipelineValue = Object.values(pipelineData).reduce((total, stage) => 
    total + calculateWeightedTotal(stage), 0
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-text-secondary text-sm">Initializing CRM session...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">
                Welcome back, {userProfile?.full_name || user?.email?.split('@')[0] || 'Team Lead'}!
              </h1>
              <p className="text-text-secondary text-xs mt-1 flex items-center space-x-2">
                <span>Territory: <strong className="text-text-primary">{userProfile?.territory || 'Global Enterprise'}</strong></span>
                <span>•</span>
                <span>Role: <strong className="text-text-primary capitalize">{userProfile?.role?.replace('_', ' ') || 'Sales Manager'}</strong></span>
                <span>•</span>
                <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
              </p>
            </div>

            <div className="mt-3 md:mt-0 flex items-center space-x-2">
              <button
                onClick={loadDashboardData}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center space-x-1.5 transition-colors"
                title="Refresh dashboard data"
              >
                <Icon name="RefreshCw" size={14} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary text-xs flex items-center space-x-1.5 px-3 py-1.5 shadow-xs"
                title="Create a new opportunity"
              >
                <Icon name="Plus" size={14} />
                <span>New Deal</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-5 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total Pipeline</p>
                  <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                    {formatCurrency(totalPipelineValue)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1 font-medium">Across all active stages</p>
                </div>
                <div className="w-10 h-10 bg-primary-50 text-primary rounded-xl flex items-center justify-center border border-primary-100/50 shadow-xs">
                  <Icon name="TrendingUp" size={20} />
                </div>
              </div>
            </div>
            
            <div className="card p-5 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Weighted Forecast</p>
                  <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                    {formatCurrency(weightedPipelineValue)}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Probability-adjusted</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50 shadow-xs">
                  <Icon name="Target" size={20} />
                </div>
              </div>
            </div>
            
            <div className="card p-5 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Active Deals</p>
                  <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                    {dealStats?.activeDealCount ?? 0}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1 font-medium">
                    <span className="text-emerald-700 font-semibold">{dealStats?.closedWonCount ?? 0} won</span> &bull; {dealStats?.closedLostCount ?? 0} lost
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/50 shadow-xs">
                  <Icon name="Briefcase" size={20} />
                </div>
              </div>
            </div>
            
            <div className="card p-5 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Quota Progress</p>
                  <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                    {performanceData.percentage ?? 0}%
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1 font-medium">
                    Target: {formatCurrency(performanceData.quota ?? 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50 shadow-xs">
                  <Icon name="Award" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Horizontal Quick Actions Toolbar */}
          <QuickActions onRefresh={loadDashboardData} />

          {/* Full-Width Interactive Sales Pipeline Board */}
          <div className="card p-5 border border-border/90 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <div>
                <h2 className="text-base font-bold text-text-primary font-heading">Sales Pipeline Board</h2>
                <p className="text-xs text-text-secondary">Drag deals between columns to transition lifecycle stages</p>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-text-tertiary">
                <span className="hidden sm:inline font-medium">Scroll to view all 6 stages</span>
                <Icon name="ArrowRight" size={13} className="text-text-tertiary" />
              </div>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex items-start gap-4 overflow-x-auto pb-4 pt-1">
                {Object.values(pipelineData).map((stage) => (
                  <PipelineStage
                    key={stage.id}
                    stage={stage}
                    totalValue={calculateStageTotal(stage)}
                    weightedValue={calculateWeightedTotal(stage)}
                  />
                ))}
              </div>
            </DragDropContext>
          </div>

          {/* Bottom Grid: Analytics & Forecast on Left, Tasks & Activity Stream on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {/* Monthly Revenue Forecast Chart */}
              <div className="card p-5 border border-border/90">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-text-primary font-heading">Revenue Forecast vs Actual</h2>
                    <p className="text-xs text-text-secondary">Trailing and projected monthly performance</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-medium">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                      <span className="text-text-secondary">Forecast</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                      <span className="text-text-secondary">Actual Won</span>
                    </div>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), '']}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)', fontSize: '12px' }}
                      />
                      <Bar dataKey="forecast" fill="#1E40AF" name="Forecast" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="actual" fill="#10B981" name="Actual Won" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Metrics Summary */}
              <PerformanceMetrics data={performanceData} />
            </div>

            {/* Right Column: UpcomingTasks & RecentActivity */}
            <div className="lg:col-span-5 space-y-6">
              <UpcomingTasks tasks={upcomingTasks} />
              <RecentActivity activities={recentActivities} />
            </div>
          </div>
        </div>
      </main>

      {/* Global Create Deal Modal */}
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default SalesDashboard;
