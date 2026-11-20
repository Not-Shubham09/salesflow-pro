import { supabase, isDemoMode } from './supabase';
import { localCrmStorage } from './localCrmStorage';

class ContactService {
  // Get all contacts for the current user
  async getContacts(filters = {}) {
    if (isDemoMode()) {
      return localCrmStorage.getContacts(filters);
    }

    try {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          deals(*)
        `)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.company?.length > 0) {
        query = query.in('company', filters.company);
      }
      
      if (filters?.tags?.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        };
      }
      return { success: false, error: 'Failed to load contacts.' };
    }
  }

  // Get a single contact by ID
  async getContact(contactId) {
    if (isDemoMode()) {
      return localCrmStorage.getContact(contactId);
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          deals(*),
          activities(*)
        `)
        .eq('id', contactId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to load contact details.' };
    }
  }

  // Create a new contact
  async createContact(contactData) {
    if (isDemoMode()) {
      return localCrmStorage.createContact(contactData);
    }

    try {
      let dataToInsert = { ...contactData };
      if (!dataToInsert.user_id) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          dataToInsert.user_id = userData.user.id;
        }
      }
      if (dataToInsert.name && !dataToInsert.first_name) {
        const parts = dataToInsert.name.trim().split(' ');
        dataToInsert.first_name = parts[0] || '';
        dataToInsert.last_name = parts.slice(1).join(' ') || '';
        delete dataToInsert.name;
      }
      if (dataToInsert.job_title && !dataToInsert.position) {
        dataToInsert.position = dataToInsert.job_title;
        delete dataToInsert.job_title;
      }
      if (dataToInsert.owner_id) {
        if (!dataToInsert.user_id) dataToInsert.user_id = dataToInsert.owner_id;
        delete dataToInsert.owner_id;
      }
      if (dataToInsert.lifecycle_stage) {
        delete dataToInsert.lifecycle_stage;
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to create contact.' };
    }
  }

  // Update an existing contact
  async updateContact(contactId, updates) {
    if (isDemoMode()) {
      return localCrmStorage.updateContact(contactId, updates);
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update contact.' };
    }
  }

  // Delete a contact
  async deleteContact(contactId) {
    if (isDemoMode()) {
      return localCrmStorage.deleteContact(contactId);
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete contact.' };
    }
  }

  // Search contacts
  async searchContacts(searchQuery) {
    if (isDemoMode()) {
      const all = localCrmStorage.getContacts();
      if (!all.success) return all;
      const q = searchQuery.toLowerCase();
      const filtered = all.data.filter(c =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
      return { success: true, data: filtered };
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to search contacts.' };
    }
  }

  // Get contact activities
  async getContactActivities(contactId) {
    if (isDemoMode()) {
      return localCrmStorage.getActivities(50, { contactId });
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('activity_date', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to load contact activities.' };
    }
  }

  // Add activity to contact
  async addContactActivity(activityData) {
    if (isDemoMode()) {
      return localCrmStorage.createActivity(activityData);
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to add activity.' };
    }
  }
}

const contactService = new ContactService();
export default contactService;
