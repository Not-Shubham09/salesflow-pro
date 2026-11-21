import React, { useState, useMemo, useEffect } from 'react';
import Header from 'components/ui/Header';
import Breadcrumb from 'components/ui/Breadcrumb';
import Icon from 'components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../utils/analyticsService';
import dealService from '../../utils/dealService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const PipelineAnalytics = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('thisQuarter');
  const [selectedMetric, setSelectedMetric] = useState('value');
  const [analyticsData, setAnalyticsData] = useState({
    stageDistribution: {
      lead: { count: 5, value: 220000 },
      qualified: { count: 4, value: 310000 },
      proposal: { count: 3, value: 450000 },
      negotiation: { count: 2, value: 380000 },
      closed_won: { count: 8, value: 1250000 },
      closed_lost: { count: 3, value: 190000 }
    },
    winRate: 72,
    avgSalesCycle: 38,
    avgDealSize: 115000
  });
  const [pipelineStats, setPipelineStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        setError(null);

        // Load pipeline analytics and deal statistics
        const [analyticsResult, statsResult] = await Promise.all([
          analyticsService.getPipelineAnalytics(selectedPeriod),
          dealService.getDealStats()
        ]);

        if (analyticsResult?.success) {
          setAnalyticsData(analyticsResult.data);
        } else {
          setError(analyticsResult?.error || 'Failed to load analytics data');
        }

        if (statsResult?.success) {
          setPipelineStats(statsResult.data);
        }

      } catch (error) {
        setError('Failed to load pipeline analytics');
        console.log('Analytics loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user, authLoading, selectedPeriod]);

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const getStageDistributionData = () => {
    if (!analyticsData?.stageDistribution) return [];
    
    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const stageLabels = {
      lead: 'Lead',
      qualified: 'Qualified',
      proposal: 'Proposal', 
      negotiation: 'Negotiation',
      closed_won: 'Closed Won',
      closed_lost: 'Closed Lost'
    };

    return stages.map(stage => ({
      stage: stageLabels[stage],
      count: analyticsData.stageDistribution[stage]?.count || 0,
      value: analyticsData.stageDistribution[stage]?.value || 0,
      avgTime: analyticsData.avgTimeInStage?.[stage] || 0
    }));
  };

  const getConversionData = () => {
    const stageData = getStageDistributionData();
    let conversionData = [];
    let totalDeals = stageData.reduce((sum, stage) => sum + stage.count, 0);

    stageData.forEach((stage, index) => {
      if (index < stageData.length - 2) { // Exclude closed_won and closed_lost
        const conversionRate = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
        conversionData.push({
          stage: stage.stage,
          conversionRate: Math.round(conversionRate),
          count: stage.count
        });
      }
    });

    return conversionData;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value?.toLocaleString() || 0}`;
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary">Initializing Analytics...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">Failed to Load Analytics</h3>
                <p className="text-text-secondary mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn-primary"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const stageDistributionData = getStageDistributionData();
  const conversionData = getConversionData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb />
          
          {/* Analytics Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 pb-4 border-b border-border/80">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">Pipeline Analytics</h1>
              <p className="text-text-secondary text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()} &bull; Insights for {selectedPeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </p>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-3 lg:mt-0">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input-field text-xs py-1.5 font-medium"
              >
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="thisYear">This Year</option>
              </select>
              
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="input-field text-xs py-1.5 font-medium"
              >
                <option value="value">Deal Value ($)</option>
                <option value="count">Deal Count</option>
                <option value="time">Time Analysis</option>
              </select>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-5 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total Pipeline</p>
                  <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                    {formatCurrency(pipelineStats?.totalPipelineValue || 0)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">Combined opportunity value</p>
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
                    {formatCurrency(pipelineStats?.weightedPipelineValue || 0)}
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
                    {pipelineStats?.activeDealCount || 0}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">In negotiation & stages</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/50 shadow-xs">
                  <Icon name="Briefcase" size={20} />
                </div>
              </div>
            </div>
            
            <div className="card p-5 border border-border/80 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Avg Deal Size</p>
                  <p className="text-2xl font-bold text-text-primary mt-1 font-heading tracking-tight">
                    {formatCurrency(pipelineStats?.avgDealSize || 0)}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-1">Average closed value</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50 shadow-xs">
                  <Icon name="DollarSign" size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Stage Distribution Chart */}
            <div className="card p-6">
              <h2 className="text-xl font-normal text-text-primary mb-6">Pipeline Stage Distribution</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="stage" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" tickFormatter={(value) => selectedMetric === 'value' ? formatCurrency(value) : value} />
                    <Tooltip 
                      formatter={(value) => [
                        selectedMetric === 'value' ? formatCurrency(value) : value,
                        selectedMetric === 'value' ? 'Total Value' : selectedMetric === 'count' ? 'Deal Count' : 'Avg Days'
                      ]}
                      labelStyle={{ color: '#1F2937' }}
                    />
                    <Bar 
                      dataKey={selectedMetric === 'time' ? 'avgTime' : selectedMetric} 
                      fill="var(--color-primary)" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="card p-6">
              <h2 className="text-xl font-normal text-text-primary mb-6">Conversion Funnel</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="stage" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Conversion Rate']}
                      labelStyle={{ color: '#1F2937' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversionRate" 
                      stroke="var(--color-success)" 
                      strokeWidth={3}
                      dot={{ fill: 'var(--color-success)', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stage Breakdown Pie Chart */}
            <div className="card p-6">
              <h2 className="text-xl font-normal text-text-primary mb-6">Deal Count by Stage</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageDistributionData.filter(d => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ stage, count, percent }) => `${stage}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stageDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time in Stage Analysis */}
            <div className="card p-6">
              <h2 className="text-xl font-normal text-text-primary mb-6">Average Time in Stage</h2>
              <div className="space-y-4">
                {stageDistributionData.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-text-primary">{stage.stage}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-text-primary">
                        {stage.avgTime} days
                      </div>
                      <div className="text-sm text-text-secondary">
                        {stage.count} deals
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="card p-6 mt-8">
            <h2 className="text-xl font-normal text-text-primary mb-6">Pipeline Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Pipeline Health</h3>
                <p className="text-blue-700 text-sm">
                  {stageDistributionData.find(s => s.stage === 'Lead')?.count || 0} new leads, 
                  {stageDistributionData.find(s => s.stage === 'Qualified')?.count || 0} qualified prospects
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Closing Performance</h3>
                <p className="text-green-700 text-sm">
                  {((pipelineStats?.closedWonCount || 0) / Math.max((pipelineStats?.closedWonCount || 0) + (pipelineStats?.closedLostCount || 0), 1) * 100).toFixed(1)} 
                  win rate this period
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-medium text-orange-900 mb-2">Pipeline Velocity</h3>
                <p className="text-orange-700 text-sm">
                  Avg {stageDistributionData.reduce((avg, stage) => avg + stage.avgTime, 0) / stageDistributionData.length || 0} days 
                  per stage
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PipelineAnalytics;