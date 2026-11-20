import { supabase, isDemoMode } from './supabase';
import { localCrmStorage } from './localCrmStorage';

class AnalyticsService {
  // Get revenue forecast data
  async getRevenueData(period = 'thisYear') {
    if (isDemoMode()) {
      return localCrmStorage.getRevenueData();
    }

    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('value, stage, expected_close_date, actual_close_date, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      const monthlyData = this.generateMonthlyRevenueData(deals || [], period);
      return { success: true, data: monthlyData };
    } catch (error) {
      return { success: false, error: 'Failed to load revenue data.' };
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    if (isDemoMode()) {
      return localCrmStorage.getPerformanceMetrics();
    }

    try {
      let totalQuota = 2500000;
      const { data: profiles, error: quotaError } = await supabase
        .from('user_profiles')
        .select('quota_amount');

      if (!quotaError && profiles) {
        totalQuota = profiles.reduce((sum, p) => sum + parseFloat(p.quota_amount || 0), 0) || 2500000;
      }

      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('value, stage, created_at, actual_close_date');

      if (dealsError) {
        return { success: false, error: dealsError.message };
      }

      const metrics = this.calculatePerformanceMetrics(deals || [], totalQuota);
      return { success: true, data: metrics };
    } catch (error) {
      return { success: false, error: 'Failed to load performance metrics.' };
    }
  }

  // Get activity timeline data
  async getActivityTimeline(limit = 20, filters = {}) {
    if (isDemoMode()) {
      return { success: true, data: localCrmStorage.getActivities(limit, filters).data };
    }

    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          contacts(first_name, last_name, company, avatar_url),
          deals(title, value, stage),
          user_profiles(full_name, avatar_url)
        `)
        .order('activity_date', { ascending: false })
        .limit(limit);

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.contactId) query = query.eq('contact_id', filters.contactId);
      if (filters?.dealId) query = query.eq('deal_id', filters.dealId);
      if (filters?.dateFrom) query = query.gte('activity_date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('activity_date', filters.dateTo);

      const { data, error } = await query;
      if (error) return { success: false, error: error.message };

      const transformedActivities = (data || []).map(activity => ({
        id: activity.id,
        type: activity.type,
        subject: activity.subject,
        content: activity.content,
        timestamp: activity.activity_date,
        duration: activity.duration_minutes,
        contact: activity.contacts ? {
          name: `${activity.contacts.first_name} ${activity.contacts.last_name}`,
          company: activity.contacts.company,
          avatar: activity.contacts.avatar_url
        } : null,
        deal: activity.deals ? {
          title: activity.deals.title,
          value: activity.deals.value,
          stage: activity.deals.stage
        } : null,
        user: activity.user_profiles ? {
          name: activity.user_profiles.full_name,
          avatar: activity.user_profiles.avatar_url
        } : null,
        relativeTime: this.getRelativeTime(activity.activity_date)
      }));

      return { success: true, data: transformedActivities };
    } catch (error) {
      return { success: false, error: 'Failed to load activity timeline.' };
    }
  }

  // Get pipeline analytics
  async getPipelineAnalytics(period = 'thisQuarter') {
    if (isDemoMode()) {
      return localCrmStorage.getPipelineAnalytics();
    }

    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('value, stage, probability, days_in_stage, created_at, actual_close_date')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const analytics = this.calculatePipelineAnalytics(deals || [], period);
      return { success: true, data: analytics };
    } catch (error) {
      return { success: false, error: 'Failed to load pipeline analytics.' };
    }
  }

  // Helper method to generate monthly revenue data
  generateMonthlyRevenueData(deals, period) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const monthlyData = [];

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      const year = monthIndex <= currentMonth ? currentYear : currentYear - 1;
      
      const forecast = this.calculateMonthlyForecast(deals, year, monthIndex);
      const actual = this.calculateMonthlyActual(deals, year, monthIndex);

      monthlyData.push({
        month: months[monthIndex],
        forecast,
        actual: monthIndex <= currentMonth ? actual : 0
      });
    }

    return monthlyData;
  }

  calculateMonthlyForecast(deals, year, month) {
    const targetMonth = new Date(year, month);
    const nextMonth = new Date(year, month + 1);

    return deals
      .filter(deal => {
        if (!deal.expected_close_date) return false;
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= targetMonth && closeDate < nextMonth;
      })
      .reduce((sum, deal) => sum + (parseFloat(deal.value || 0) * (deal.probability || 0) / 100), 0);
  }

  calculateMonthlyActual(deals, year, month) {
    const targetMonth = new Date(year, month);
    const nextMonth = new Date(year, month + 1);

    return deals
      .filter(deal => {
        if (!deal.actual_close_date || deal.stage !== 'closed_won') return false;
        const closeDate = new Date(deal.actual_close_date);
        return closeDate >= targetMonth && closeDate < nextMonth;
      })
      .reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0);
  }

  calculatePerformanceMetrics(deals, quotaAmount = 0) {
    const thisYear = new Date().getFullYear();
    const yearDeals = deals.filter(deal => {
      const dealYear = new Date(deal.created_at).getFullYear();
      return dealYear === thisYear;
    });

    const closedWonDeals = yearDeals.filter(deal => deal.stage === 'closed_won');
    const closedLostDeals = yearDeals.filter(deal => deal.stage === 'closed_lost');
    const activeDeals = yearDeals.filter(deal => 
      !['closed_won', 'closed_lost'].includes(deal.stage)
    );

    const achieved = closedWonDeals.reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0);
    const totalDealsValue = yearDeals.reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0);

    const safeQuotaAmount = parseFloat(quotaAmount) || 2500000;
    const percentage = safeQuotaAmount > 0 ? Math.round((achieved / safeQuotaAmount) * 100) : 0;

    return {
      quota: safeQuotaAmount,
      achieved,
      percentage,
      dealsWon: closedWonDeals.length,
      dealsLost: closedLostDeals.length,
      avgDealSize: yearDeals.length > 0 ? totalDealsValue / yearDeals.length : 0,
      conversionRate: yearDeals.length > 0 
        ? Math.round((closedWonDeals.length / yearDeals.length) * 100) 
        : 0,
      activePipeline: activeDeals.reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0),
      activeDealCount: activeDeals.length
    };
  }

  calculatePipelineAnalytics(deals, period) {
    const analytics = {
      stageDistribution: {},
      avgTimeInStage: {},
      conversionRates: {},
      velocityMetrics: {
        avgDealCycle: 0,
        avgTimeToClose: 0
      }
    };

    const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    stages.forEach(stage => {
      const stageDeals = deals.filter(deal => deal.stage === stage);
      analytics.stageDistribution[stage] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0)
      };
    });

    stages.forEach(stage => {
      const stageDeals = deals.filter(deal => deal.stage === stage);
      if (stageDeals.length > 0) {
        const avgDays = stageDeals.reduce((sum, deal) => sum + (deal.days_in_stage || 0), 0) / stageDeals.length;
        analytics.avgTimeInStage[stage] = Math.round(avgDays);
      } else {
        analytics.avgTimeInStage[stage] = 0;
      }
    });

    return analytics;
  }

  getRelativeTime(dateString) {
    if (!dateString) return 'recently';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${Math.max(1, diffMins)}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 30) {
      return `${diffDays}d ago`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths}mo ago`;
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
