import React, { useState, useEffect } from 'react';

import Icon from 'components/AppIcon';
import analyticsService from '../../../utils/analyticsService';
import { useAuth } from 'contexts/AuthContext';

const PerformanceMetrics = ({ data: propData }) => {
  const { user } = useAuth();
  const [data, setData] = useState(propData || {});
  const [loading, setLoading] = useState(!propData);
  const [error, setError] = useState(null);

  // Load performance data if not provided via props or when propData updates
  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(false);
    } else if (user) {
      loadPerformanceData();
    }
  }, [propData, user]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await analyticsService.getPerformanceMetrics(user?.id);
      
      if (result?.success) {
        setData(result.data);
      } else {
        setError(result?.error || 'Failed to load performance metrics');
      }
    } catch (error) {
      setError('Failed to load performance metrics');
      console.log('Performance metrics loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value?.toLocaleString() || 0}`;
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-normal text-text-primary mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-normal text-text-primary mb-6">Performance Metrics</h2>
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={24} className="text-error mx-auto mb-2" />
          <p className="text-text-secondary">{error}</p>
          <button 
            onClick={loadPerformanceData}
            className="btn-primary btn-sm mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary font-heading">Performance Metrics</h2>
          <p className="text-xs text-text-secondary">Quota attainment and key sales efficiency ratios</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quota Achievement */}
        <div className="bg-slate-50/80 border border-border/80 p-4 rounded-xl hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Quota Achievement</h3>
            <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <Icon name="Target" size={14} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-2xl font-bold text-text-primary font-heading">
              {data?.percentage || 0}%
            </div>
            <div className="text-xs text-text-tertiary mt-0.5">
              {formatCurrency(data?.achieved || 0)} of {formatCurrency(data?.quota || 0)}
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(data?.percentage || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Deals Won/Lost */}
        <div className="bg-slate-50/80 border border-border/80 p-4 rounded-xl hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Deals Closed</h3>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon name="TrendingUp" size={14} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-2xl font-bold text-text-primary font-heading">
              {(data?.dealsWon || 0) + (data?.dealsLost || 0)}
            </div>
            <div className="text-xs text-text-tertiary mt-0.5">
              <span className="text-emerald-700 font-semibold">{data?.dealsWon || 0} won</span> &bull; {data?.dealsLost || 0} lost
            </div>
          </div>
          <div className="flex space-x-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full"
              style={{ width: `${((data?.dealsWon || 0) / Math.max((data?.dealsWon || 0) + (data?.dealsLost || 0), 1)) * 100}%` }}
            ></div>
            <div 
              className="bg-rose-400 h-full"
              style={{ width: `${((data?.dealsLost || 0) / Math.max((data?.dealsWon || 0) + (data?.dealsLost || 0), 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Average Deal Size */}
        <div className="bg-slate-50/80 border border-border/80 p-4 rounded-xl hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg Deal Size</h3>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Icon name="DollarSign" size={14} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-2xl font-bold text-text-primary font-heading">
              {formatCurrency(data?.avgDealSize || 0)}
            </div>
            <div className="text-xs text-text-tertiary mt-0.5">
              Pipeline: {formatCurrency(data?.activePipeline || 0)}
            </div>
          </div>
          <div className="text-[11px] text-text-secondary font-medium">
            {data?.activeDealCount || 0} active opportunities
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-50/80 border border-border/80 p-4 rounded-xl hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Conversion Rate</h3>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon name="BarChart3" size={14} />
            </div>
          </div>
          <div className="mb-3">
            <div className="text-2xl font-bold text-text-primary font-heading">
              {data?.conversionRate || 0}%
            </div>
            <div className="text-xs text-text-tertiary mt-0.5">
              Win rate from closed deals
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(data?.conversionRate || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-5 p-4 bg-slate-50/70 border border-border/70 rounded-xl">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Performance Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center">
            <span className="text-text-secondary">Quota Progress:</span>
            <span className={`ml-2 font-semibold px-2 py-0.5 rounded-full ${
              data?.percentage >= 90 ? 'bg-emerald-50 text-emerald-700' :
              data?.percentage >= 70 ? 'bg-blue-50 text-blue-700' :
              data?.percentage >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {data?.percentage >= 90 ? 'Excellent' : 
               data?.percentage >= 70 ? 'On Track' : 
               data?.percentage >= 50 ? 'Needs Attention' : 'Below Target'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Deal Activity:</span>
            <span className="ml-2 font-medium text-gray-900">
              {data?.activeDealCount || 0} deals in pipeline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;