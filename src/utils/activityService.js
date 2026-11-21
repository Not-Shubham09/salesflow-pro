import { supabase, isDemoMode } from './supabase';
import { localCrmStorage } from './localCrmStorage';
import { isValidUUID } from './uuid';

class ActivityService {
  // Get all activities for the current user
  async getActivityTimeline(limit = 50, filters = {}) {
    limit = Math.max(1, limit);
    if (isDemoMode()) {
      return { success: true, data: localCrmStorage.getActivities(limit, filters).data };
    }

    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          contacts(first_name, last_name, company, email, avatar_url),
          deals(title, value, stage),
          user_profiles(full_name, avatar_url)
        `)
        .order('activity_date', { ascending: false })
        .limit(limit);

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.contactId && isValidUUID(filters.contactId)) query = query.eq('contact_id', filters.contactId);
      if (filters?.dealId && isValidUUID(filters.dealId)) query = query.eq('deal_id', filters.dealId);
      if (filters?.dateFrom) query = query.gte('activity_date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('activity_date', filters.dateTo);

      const { data, error } = await query;
      if (error) return { success: false, error: error.message };

      return { success: true, data: data || [] };
    } catch {
      return { success: false, error: 'Failed to load activities.' };
    }
  }

  // Get recent activities for dashboard
  async getRecentActivities(limit = 10) {
    if (isDemoMode()) {
      return { success: true, data: localCrmStorage.getActivities(limit).data };
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          contacts(first_name, last_name, company, avatar_url),
          deals(title, value, stage),
          user_profiles(full_name, avatar_url)
        `)
        .order('activity_date', { ascending: false })
        .limit(limit);

      if (error) return { success: false, error: error.message };

      const transformedActivities = (data || []).map(activity => ({
        id: activity.id,
        type: activity.type,
        subject: activity.subject || this.getDefaultSubject(activity.type),
        content: activity.content,
        date: activity.activity_date,
        duration: activity.duration_minutes,
        contact: activity.contacts ? {
          name: `${activity.contacts.first_name} ${activity.contacts.last_name}`,
          company: activity.contacts.company,
          avatar: activity.contacts.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
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
        relativeTime: this.getRelativeTime(activity.activity_date),
        icon: this.getActivityIcon(activity.type),
        color: this.getActivityColor(activity.type)
      }));

      return { success: true, data: transformedActivities };
    } catch (error) {
      return { success: false, error: 'Failed to load recent activities.' };
    }
  }

  // Create a new activity
  async createActivity(activityData) {
    if (isDemoMode()) {
      return localCrmStorage.createActivity(activityData);
    }

    try {
      let authUserId = null;
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        authUserId = authUser?.id;
      } catch {
        // Fallback to active cached session
      }

      if (!authUserId) {
        try {
          const cached = JSON.parse(localStorage.getItem('salesflow_active_user') || '{}');
          authUserId = cached.id;
        } catch {
          // ignore
        }
      }

      const rawDealId = activityData.dealId || activityData.deal_id;
      const rawContactId = activityData.contactId || activityData.contact_id;

      const dataToInsert = {
        user_id: authUserId || activityData.user_id,
        type: activityData.type || 'note',
        subject: activityData.title || activityData.subject || 'Activity note',
        content: activityData.description || activityData.content || '',
        activity_date: activityData.timestamp || activityData.activity_date || new Date().toISOString(),
        contact_id: isValidUUID(rawContactId) ? rawContactId : null,
        deal_id: isValidUUID(rawDealId) ? rawDealId : null,
      };

      const { data, error } = await supabase
        .from('activities')
        .insert([dataToInsert])
        .select(`
          *,
          contacts(first_name, last_name, company),
          deals(title, value)
        `)
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch {
      return { success: false, error: 'Failed to create activity.' };
    }
  }

  // Update an activity
  async updateActivity(activityId, updates) {
    if (isDemoMode()) {
      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch {
      return { success: false, error: 'Failed to update activity.' };
    }
  }

  // Delete an activity
  async deleteActivity(activityId) {
    if (isDemoMode()) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to delete activity.' };
    }
  }

  // Get activity statistics
  async getActivityStats(period = 'thisMonth') {
    if (isDemoMode()) {
      const acts = localCrmStorage.getActivities(100).data;
      return {
        success: true,
        data: {
          totalActivities: acts.length,
          emailsSent: acts.filter(a => a.type === 'email').length,
          callsMade: acts.filter(a => a.type === 'call').length,
          meetingsHeld: acts.filter(a => a.type === 'meeting').length,
          totalDuration: 180,
          avgDuration: 30,
          activitiesByType: {
            email: acts.filter(a => a.type === 'email').length,
            call: acts.filter(a => a.type === 'call').length,
            meeting: acts.filter(a => a.type === 'meeting').length,
            note: acts.filter(a => a.type === 'note').length,
            task: acts.filter(a => a.type === 'task').length,
            demo: acts.filter(a => a.type === 'demo').length
          }
        }
      };
    }

    try {
      let query = supabase
        .from('activities')
        .select('type, activity_date, duration_minutes');

      const now = new Date();
      let startDate;
      switch (period) {
        case 'thisWeek':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'thisQuarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), 0, 1);
      }

      query = query.gte('activity_date', startDate.toISOString());
      const { data, error } = await query;

      if (error) return { success: false, error: error.message };

      const stats = {
        totalActivities: data?.length || 0,
        emailsSent: 0,
        callsMade: 0,
        meetingsHeld: 0,
        totalDuration: 0,
        avgDuration: 0,
        activitiesByType: {
          email: 0, call: 0, meeting: 0, note: 0, task: 0, demo: 0
        }
      };

      (data || []).forEach(a => {
        if (a.type === 'email') stats.emailsSent++;
        if (a.type === 'call') stats.callsMade++;
        if (a.type === 'meeting') stats.meetingsHeld++;
        if (stats.activitiesByType[a.type] !== undefined) {
          stats.activitiesByType[a.type]++;
        }
        if (a.duration_minutes) stats.totalDuration += a.duration_minutes;
      });

      const activitiesWithDuration = (data || []).filter(a => a.duration_minutes);
      if (activitiesWithDuration.length > 0) {
        stats.avgDuration = Math.round(stats.totalDuration / activitiesWithDuration.length);
      }

      return { success: true, data: stats };
    } catch {
      return { success: false, error: 'Failed to load activity statistics.' };
    }
  }

  // Helpers
  getDefaultSubject(type) {
    const subjects = {
      email: 'Email sent', call: 'Phone call', meeting: 'Meeting held',
      note: 'Note added', task: 'Task created', demo: 'Demo conducted'
    };
    return subjects[type] || 'Activity recorded';
  }

  getActivityIcon(type) {
    const icons = {
      email: 'Mail', call: 'Phone', meeting: 'Calendar',
      note: 'FileText', task: 'CheckSquare', demo: 'Monitor'
    };
    return icons[type] || 'Activity';
  }

  getActivityColor(type) {
    const colors = {
      email: 'bg-blue-100 text-blue-600',
      call: 'bg-green-100 text-green-600',
      meeting: 'bg-purple-100 text-purple-600',
      note: 'bg-gray-100 text-gray-600',
      task: 'bg-orange-100 text-orange-600',
      demo: 'bg-red-100 text-red-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  }

  getRelativeTime(dateString) {
    if (!dateString) return 'recently';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }
}

const activityService = new ActivityService();
export default activityService;
