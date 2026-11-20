import { supabase, isDemoMode } from './supabase';
import { localCrmStorage } from './localCrmStorage';

class DealService {
  // Get a single deal by ID
  async getDealById(dealId) {
    if (isDemoMode()) {
      return localCrmStorage.getDealById(dealId);
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts(first_name, last_name, company, email, avatar_url),
          activities(*)
        `)
        .eq('id', dealId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { 
        success: true, 
        data: {
          ...data,
          name: data.title,
          expectedCloseDate: data.expected_close_date
        } 
      };
    } catch (error) {
      return { success: false, error: 'Failed to load deal.' };
    }
  }

  // Get all deals for the current user
  async getDeals(filters = {}) {
    if (isDemoMode()) {
      return localCrmStorage.getDeals(filters);
    }

    try {
      let query = supabase
        .from('deals')
        .select(`
          *,
          contacts(first_name, last_name, company, email),
          activities(*)
        `)
        .order('updated_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: (data || []).map(d => ({ ...d, name: d.title })) };
    } catch (error) {
      return { success: false, error: 'Failed to load deals.' };
    }
  }

  // Get deals grouped by stage for pipeline view
  async getPipelineDeals() {
    if (isDemoMode()) {
      return localCrmStorage.getPipelineDeals();
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts(first_name, last_name, company, email, avatar_url)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const pipelineData = {
        lead: { id: 'lead', title: 'Lead', deals: [] },
        qualified: { id: 'qualified', title: 'Qualified', deals: [] },
        proposal: { id: 'proposal', title: 'Proposal', deals: [] },
        negotiation: { id: 'negotiation', title: 'Negotiation', deals: [] },
        closed_won: { id: 'closed_won', title: 'Closed Won', deals: [] },
        closed_lost: { id: 'closed_lost', title: 'Closed Lost', deals: [] }
      };

      (data || []).forEach(deal => {
        if (pipelineData[deal.stage]) {
          const transformedDeal = {
            id: deal.id,
            title: deal.title,
            value: parseFloat(deal.value || 0),
            probability: deal.probability || 0,
            contact: deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : 'No contact',
            company: deal.contacts?.company || 'Unknown company',
            avatar: deal.contacts?.avatar_url || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150`,
            daysInStage: deal.days_in_stage || 0,
            lastActivity: this.getRelativeTime(deal.updated_at)
          };
          
          pipelineData[deal.stage].deals.push(transformedDeal);
        }
      });

      return { success: true, data: pipelineData };
    } catch (error) {
      return { success: false, error: 'Failed to load pipeline data.' };
    }
  }

  normalizeStage(stage) {
    if (!stage) return 'lead';
    const s = String(stage).toLowerCase();
    if (s === 'qualification') return 'qualified';
    if (s === 'won') return 'closed_won';
    if (s === 'lost') return 'closed_lost';
    return s;
  }

  // Create a new deal
  async createDeal(dealData) {
    if (isDemoMode()) {
      return localCrmStorage.createDeal(dealData);
    }

    const { title, name, expectedCloseDate, user_id, contact_id, stage, ...rest } = dealData;
    let finalUserId = user_id;
    if (!finalUserId) {
      const { data: userData } = await supabase.auth.getUser();
      finalUserId = userData?.user?.id || null;
    }

    const dataToInsert = {
      ...rest,
      title: title || name || 'New Deal',
      stage: this.normalizeStage(stage),
      expected_close_date: expectedCloseDate || dealData.expected_close_date || null,
      user_id: finalUserId,
      contact_id: contact_id || null
    };
    
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: { ...data, name: data.title } };
    } catch (error) {
      return { success: false, error: 'Failed to create deal.' };
    }
  }

  // Update an existing deal
  async updateDeal(dealId, updates) {
    if (isDemoMode()) {
      return localCrmStorage.updateDeal(dealId, updates);
    }

    const { title, name, expectedCloseDate, user_id, contact_id, stage, ...rest } = updates;
    const dataToUpdate = {
      ...rest
    };
    if (title || name) dataToUpdate.title = title || name;
    if (stage) dataToUpdate.stage = this.normalizeStage(stage);
    if (expectedCloseDate !== undefined) dataToUpdate.expected_close_date = expectedCloseDate;
    if (user_id !== undefined) dataToUpdate.user_id = user_id;
    if (contact_id !== undefined) dataToUpdate.contact_id = contact_id;

    try {
      const { data, error } = await supabase
        .from('deals')
        .update(dataToUpdate)
        .eq('id', dealId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: { ...data, name: data.title } };
    } catch (error) {
      return { success: false, error: 'Failed to update deal.' };
    }
  }

  // Update deal stage (for drag and drop)
  async updateDealStage(dealId, newStage) {
    const normalizedStage = this.normalizeStage(newStage);
    if (isDemoMode()) {
      return localCrmStorage.updateDealStage(dealId, normalizedStage);
    }

    try {
      const stageProbs = {
        lead: 20,
        qualified: 40,
        proposal: 70,
        negotiation: 85,
        closed_won: 100,
        closed_lost: 0
      };

      const updates = {
        stage: normalizedStage,
        probability: stageProbs[normalizedStage] !== undefined ? stageProbs[normalizedStage] : 0,
        days_in_stage: 0
      };

      if (normalizedStage === 'closed_won' || normalizedStage === 'closed_lost') {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update deal stage.' };
    }
  }

  // Delete a deal
  async deleteDeal(dealId) {
    if (isDemoMode()) {
      return localCrmStorage.deleteDeal(dealId);
    }

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete deal.' };
    }
  }

  async getDealStats() {
    if (isDemoMode()) {
      return localCrmStorage.getDealStats();
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .select('value, stage, probability, expected_close_date');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        activeDealCount: 0,
        closedWonCount: 0,
        closedLostCount: 0,
        avgDealSize: 0,
        totalDeals: data?.length || 0
      };

      (data || []).forEach(deal => {
        const value = parseFloat(deal.value) || 0;
        
        if (deal.stage !== 'closed_won' && deal.stage !== 'closed_lost') {
          stats.totalPipelineValue += value;
          stats.weightedPipelineValue += (value * (deal.probability || 0) / 100);
          stats.activeDealCount++;
        } else if (deal.stage === 'closed_won') {
          stats.closedWonCount++;
        } else if (deal.stage === 'closed_lost') {
          stats.closedLostCount++;
        }
      });

      if (data?.length > 0) {
        stats.avgDealSize = data.reduce((sum, deal) => sum + parseFloat(deal.value || 0), 0) / data.length;
      }
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Failed to load deal statistics.' };
    }
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
    } else {
      return `${diffDays}d ago`;
    }
  }
}

const dealService = new DealService();
export default dealService;
