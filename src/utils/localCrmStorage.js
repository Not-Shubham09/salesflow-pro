// Local CRM Storage Engine for Demo Mode
// Provides persistent localStorage-backed CRUD matching the Supabase schema and relations

const STORAGE_KEY = 'salesflow_crm_local_data';
const AUTH_KEY = 'salesflow_crm_local_auth';

const getInitialData = () => {
  const now = Date.now();
  const day = 24 * 3600 * 1000;

  const users = [
    {
      id: 'usr-mgr-1',
      email: 'sales.manager@salesflow.com',
      full_name: 'Jordan Hayes',
      role: 'sales_manager',
      territory: 'Global Enterprise',
      quota_amount: 3500000,
      phone: '+1 (555) 014-9281',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'usr-rep-1',
      email: 'sales.rep@salesflow.com',
      full_name: 'Alex Rivera',
      role: 'sales_rep',
      territory: 'North America East',
      quota_amount: 1500000,
      phone: '+1 (555) 019-2834',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    {
      id: 'usr-dir-1',
      email: 'sales.director@salesflow.com',
      full_name: 'Morgan Vance',
      role: 'sales_director',
      territory: 'Worldwide',
      quota_amount: 8000000,
      phone: '+1 (555) 018-3829',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'usr-adm-1',
      email: 'admin@salesflow.com',
      full_name: 'Devon Miller',
      role: 'admin',
      territory: 'System HQ',
      quota_amount: 0,
      phone: '+1 (555) 011-8273',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    }
  ];

  const contacts = [
    {
      id: 'c-1',
      user_id: 'usr-mgr-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@acmecorp.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corporation',
      position: 'Chief Technology Officer',
      status: 'active',
      tags: ['enterprise', 'decision-maker', 'tech'],
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      notes: 'Key decision maker for enterprise ERP evaluation. Prefers communication via email.',
      last_contact_date: new Date(now - 2 * day).toISOString(),
      created_at: new Date(now - 30 * day).toISOString(),
      updated_at: new Date(now - 2 * day).toISOString()
    },
    {
      id: 'c-2',
      user_id: 'usr-mgr-1',
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@globex.com',
      phone: '+1 (555) 987-6543',
      company: 'Globex Industries',
      position: 'Procurement Director',
      status: 'active',
      tags: ['manufacturing', 'procurement', 'mid-market'],
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      notes: 'Evaluating supply chain automation. Budget approved for Q3.',
      last_contact_date: new Date(now - 1 * day).toISOString(),
      created_at: new Date(now - 25 * day).toISOString(),
      updated_at: new Date(now - 1 * day).toISOString()
    },
    {
      id: 'c-3',
      user_id: 'usr-rep-1',
      first_name: 'Emily',
      last_name: 'Rodriguez',
      email: 'emily.rodriguez@innovateco.com',
      phone: '+1 (555) 234-5678',
      company: 'InnovateCo',
      position: 'VP of Marketing',
      status: 'active',
      tags: ['marketing', 'fast-growth', 'saas'],
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      notes: 'Looking to consolidate marketing tech stack into unified platform.',
      last_contact_date: new Date(now - 3 * 3600 * 1000).toISOString(),
      created_at: new Date(now - 15 * day).toISOString(),
      updated_at: new Date(now - 3 * 3600 * 1000).toISOString()
    },
    {
      id: 'c-4',
      user_id: 'usr-rep-1',
      first_name: 'David',
      last_name: 'Kim',
      email: 'david.kim@nextgen.io',
      phone: '+1 (555) 345-6789',
      company: 'NextGen Solutions',
      position: 'VP Engineering',
      status: 'active',
      tags: ['engineering', 'cloud', 'enterprise'],
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      notes: 'Exploring cloud security compliance and automated audit logging.',
      last_contact_date: new Date(now - 5 * day).toISOString(),
      created_at: new Date(now - 20 * day).toISOString(),
      updated_at: new Date(now - 5 * day).toISOString()
    },
    {
      id: 'c-5',
      user_id: 'usr-dir-1',
      first_name: 'Lisa',
      last_name: 'Wang',
      email: 'lisa.wang@apexlogistics.com',
      phone: '+1 (555) 456-7890',
      company: 'Apex Logistics',
      position: 'Chief Operating Officer',
      status: 'active',
      tags: ['logistics', 'automation', 'enterprise'],
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      notes: 'Recently signed fleet expansion deal. Upsell opportunity next quarter.',
      last_contact_date: new Date(now - 4 * day).toISOString(),
      created_at: new Date(now - 40 * day).toISOString(),
      updated_at: new Date(now - 4 * day).toISOString()
    },
    {
      id: 'c-6',
      user_id: 'usr-rep-1',
      first_name: 'Robert',
      last_name: 'Torres',
      email: 'robert.torres@stratahealth.com',
      phone: '+1 (555) 567-8901',
      company: 'Strata Health',
      position: 'Director of Operations',
      status: 'inactive',
      tags: ['healthcare', 'compliance'],
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      notes: 'Evaluation postponed until next fiscal year.',
      last_contact_date: new Date(now - 28 * day).toISOString(),
      created_at: new Date(now - 60 * day).toISOString(),
      updated_at: new Date(now - 28 * day).toISOString()
    }
  ];

  const deals = [
    {
      id: 'd-1',
      user_id: 'usr-mgr-1',
      contact_id: 'c-1',
      title: 'Acme Corp - Enterprise License',
      description: 'Enterprise software licensing for 500+ seat deployment across North America.',
      value: 125000,
      stage: 'negotiation',
      probability: 85,
      expected_close_date: new Date(now + 20 * day).toISOString().split('T')[0],
      created_at: new Date(now - 25 * day).toISOString(),
      updated_at: new Date(now - 2 * day).toISOString()
    },
    {
      id: 'd-2',
      user_id: 'usr-mgr-1',
      contact_id: 'c-2',
      title: 'Globex - Supply Chain Integration',
      description: 'Integration of real-time inventory tracking with SAP and procurement portals.',
      value: 78000,
      stage: 'proposal',
      probability: 65,
      expected_close_date: new Date(now + 35 * day).toISOString().split('T')[0],
      created_at: new Date(now - 18 * day).toISOString(),
      updated_at: new Date(now - 1 * day).toISOString()
    },
    {
      id: 'd-3',
      user_id: 'usr-rep-1',
      contact_id: 'c-3',
      title: 'InnovateCo - Marketing Platform',
      description: 'Omnichannel marketing automation, analytics, and CRM synchronization.',
      value: 95000,
      stage: 'qualified',
      probability: 40,
      expected_close_date: new Date(now + 45 * day).toISOString().split('T')[0],
      created_at: new Date(now - 12 * day).toISOString(),
      updated_at: new Date(now - 3 * 3600 * 1000).toISOString()
    },
    {
      id: 'd-4',
      user_id: 'usr-rep-1',
      contact_id: 'c-4',
      title: 'NextGen Cloud Security Suite',
      description: 'Multi-cloud compliance and policy enforcement module.',
      value: 160000,
      stage: 'lead',
      probability: 25,
      expected_close_date: new Date(now + 60 * day).toISOString().split('T')[0],
      created_at: new Date(now - 7 * day).toISOString(),
      updated_at: new Date(now - 4 * day).toISOString()
    },
    {
      id: 'd-5',
      user_id: 'usr-dir-1',
      contact_id: 'c-5',
      title: 'Apex Logistics Fleet Automation',
      description: 'Full telemetry and automated routing system deployment.',
      value: 210000,
      stage: 'closed_won',
      probability: 100,
      expected_close_date: new Date(now - 10 * day).toISOString().split('T')[0],
      created_at: new Date(now - 45 * day).toISOString(),
      updated_at: new Date(now - 10 * day).toISOString()
    },
    {
      id: 'd-6',
      user_id: 'usr-rep-1',
      contact_id: null,
      title: 'Metro Media Content Workflow',
      description: 'Budget frozen due to internal corporate restructuring.',
      value: 45000,
      stage: 'closed_lost',
      probability: 0,
      expected_close_date: new Date(now - 15 * day).toISOString().split('T')[0],
      created_at: new Date(now - 50 * day).toISOString(),
      updated_at: new Date(now - 15 * day).toISOString()
    }
  ];

  const tasks = [
    {
      id: 't-1',
      user_id: 'usr-mgr-1',
      contact_id: 'c-1',
      deal_id: 'd-1',
      title: 'Prepare final contract for Acme Corp',
      description: 'Review SLA terms and finalize enterprise payment schedule.',
      priority: 'high',
      status: 'pending',
      due_date: new Date(now + 2 * day).toISOString(),
      created_at: new Date(now - 5 * day).toISOString()
    },
    {
      id: 't-2',
      user_id: 'usr-mgr-1',
      contact_id: 'c-2',
      deal_id: 'd-2',
      title: 'Schedule technical deep dive with Globex',
      description: 'Coordinate with solutions engineering team on API gateway demo.',
      priority: 'medium',
      status: 'in_progress',
      due_date: new Date(now + 4 * day).toISOString(),
      created_at: new Date(now - 3 * day).toISOString()
    },
    {
      id: 't-3',
      user_id: 'usr-rep-1',
      contact_id: 'c-3',
      deal_id: 'd-3',
      title: 'Send SaaS marketing case studies to InnovateCo',
      description: 'Highlight 3x conversion lift from similar marketing migrations.',
      priority: 'medium',
      status: 'pending',
      due_date: new Date(now + 1 * day).toISOString(),
      created_at: new Date(now - 2 * day).toISOString()
    },
    {
      id: 't-4',
      user_id: 'usr-rep-1',
      contact_id: 'c-4',
      deal_id: 'd-4',
      title: 'Review SOC2 and ISO compliance requirements',
      description: 'Clarify data residency questions with NextGen infosec officer.',
      priority: 'urgent',
      status: 'in_progress',
      due_date: new Date(now + 3 * day).toISOString(),
      created_at: new Date(now - 1 * day).toISOString()
    },
    {
      id: 't-5',
      user_id: 'usr-dir-1',
      contact_id: 'c-5',
      deal_id: 'd-5',
      title: 'Apex Logistics implementation kickoff',
      description: 'Introduced customer success team and outlined rollout phases.',
      priority: 'low',
      status: 'completed',
      due_date: new Date(now - 2 * day).toISOString(),
      created_at: new Date(now - 12 * day).toISOString()
    }
  ];

  const activities = [
    {
      id: 'act-1',
      user_id: 'usr-mgr-1',
      contact_id: 'c-1',
      deal_id: 'd-1',
      type: 'email',
      subject: 'Follow-up on enterprise proposal',
      content: 'Sent detailed pricing breakdown, tiered seat discounts, and 24/7 SLA terms.',
      duration_minutes: null,
      activity_date: new Date(now - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'act-2',
      user_id: 'usr-mgr-1',
      contact_id: 'c-1',
      deal_id: 'd-1',
      type: 'call',
      subject: 'Technical requirements discussion',
      content: 'Discussed API rate limits, single sign-on integration, and SAML 2.0 configuration.',
      duration_minutes: 35,
      activity_date: new Date(now - 1 * day).toISOString()
    },
    {
      id: 'act-3',
      user_id: 'usr-mgr-1',
      contact_id: 'c-2',
      deal_id: 'd-2',
      type: 'meeting',
      subject: 'Product demo presentation to procurement',
      content: 'Demonstrated real-time order tracking and warehouse notification webhook triggers.',
      duration_minutes: 50,
      activity_date: new Date(now - 2 * day).toISOString()
    },
    {
      id: 'act-4',
      user_id: 'usr-rep-1',
      contact_id: 'c-3',
      deal_id: 'd-3',
      type: 'call',
      subject: 'Marketing platform requirements review',
      content: 'Walked through campaign builder, segmentation, and automated drip sequences.',
      duration_minutes: 25,
      activity_date: new Date(now - 5 * 3600 * 1000).toISOString()
    },
    {
      id: 'act-5',
      user_id: 'usr-rep-1',
      contact_id: 'c-4',
      deal_id: 'd-4',
      type: 'note',
      subject: 'Discovery notes from introductory call',
      content: 'Budget confirmed for upcoming quarter. Seeking fast-track onboarding within 30 days.',
      duration_minutes: null,
      activity_date: new Date(now - 3 * day).toISOString()
    }
  ];

  return { users, contacts, deals, tasks, activities };
};

class LocalCrmStorage {
  constructor() {
    this._memoryCache = null;
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        this.resetData();
      }
    }
  }

  getData() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return this.resetData();
        return JSON.parse(raw);
      } catch {
        return this.resetData();
      }
    }
    if (!this._memoryCache) {
      this._memoryCache = getInitialData();
    }
    return this._memoryCache;
  }

  saveData(data) {
    this._memoryCache = data;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  resetData() {
    const data = getInitialData();
    this._memoryCache = data;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return data;
  }

  // --- AUTH ---
  getCurrentUser() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return this._authCache || null;
  }

  setCurrentUser(user) {
    this._authCache = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }

  signIn(email, password) {
    const data = this.getData();
    const cleanEmail = (email || '').toLowerCase().trim();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const authPayload = {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.full_name,
        role: user.role
      }
    };

    this.setCurrentUser(authPayload);
    return {
      success: true,
      data: {
        user: authPayload,
        session: {
          access_token: 'local-demo-token',
          user: authPayload
        }
      }
    };
  }

  signOut() {
    this.setCurrentUser(null);
    return { success: true };
  }

  getUserProfile(userId) {
    const data = this.getData();
    const profile = data.users.find(u => u.id === userId) || data.users[0];
    return { success: true, data: profile };
  }

  updateUserProfile(userId, updates) {
    const data = this.getData();
    const index = data.users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'User not found' };
    }
    data.users[index] = { ...data.users[index], ...updates };
    this.saveData(data);
    return { success: true, data: data.users[index] };
  }

  // --- CONTACTS ---
  getContacts(filters = {}) {
    const data = this.getData();
    let result = data.contacts.map(contact => {
      // populate associated deals
      const contactDeals = data.deals.filter(d => d.contact_id === contact.id);
      return {
        ...contact,
        deals: contactDeals
      };
    });

    if (filters?.status) {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters?.company && filters.company.length > 0) {
      result = result.filter(c => filters.company.includes(c.company));
    }
    if (filters?.tags && filters.tags.length > 0) {
      result = result.filter(c => c.tags?.some(tag => filters.tags.includes(tag)));
    }

    return { success: true, data: result };
  }

  getContact(contactId) {
    const data = this.getData();
    const contact = data.contacts.find(c => String(c.id) === String(contactId));
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }
    const deals = data.deals.filter(d => String(d.contact_id) === String(contactId));
    const activities = data.activities.filter(a => String(a.contact_id) === String(contactId));
    return {
      success: true,
      data: {
        ...contact,
        deals,
        activities
      }
    };
  }

  createContact(contactData) {
    const data = this.getData();
    const newId = `c-${Date.now()}`;
    const newContact = {
      id: newId,
      first_name: contactData.first_name || '',
      last_name: contactData.last_name || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      company: contactData.company || '',
      position: contactData.position || '',
      status: contactData.status || 'active',
      tags: contactData.tags || [],
      avatar_url: contactData.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      notes: contactData.notes || '',
      last_contact_date: contactData.last_contact_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deals: []
    };

    data.contacts.unshift(newContact);
    this.saveData(data);
    return { success: true, data: newContact };
  }

  updateContact(contactId, updates) {
    const data = this.getData();
    const index = data.contacts.findIndex(c => String(c.id) === String(contactId));
    if (index === -1) {
      return { success: false, error: 'Contact not found' };
    }
    data.contacts[index] = {
      ...data.contacts[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData(data);
    const deals = data.deals.filter(d => String(d.contact_id) === String(contactId));
    return { success: true, data: { ...data.contacts[index], deals } };
  }

  deleteContact(contactId) {
    const data = this.getData();
    data.contacts = data.contacts.filter(c => String(c.id) !== String(contactId));
    // unlink deals
    data.deals = data.deals.map(d => String(d.contact_id) === String(contactId) ? { ...d, contact_id: null } : d);
    this.saveData(data);
    return { success: true };
  }

  // --- DEALS ---
  getDeals(filters = {}) {
    const data = this.getData();
    let result = data.deals.map(deal => {
      const contact = data.contacts.find(c => String(c.id) === String(deal.contact_id));
      const activities = data.activities.filter(a => String(a.deal_id) === String(deal.id));
      return {
        ...deal,
        name: deal.title,
        expectedCloseDate: deal.expected_close_date,
        contacts: contact ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          email: contact.email,
          avatar_url: contact.avatar_url
        } : null,
        activities
      };
    });

    if (filters?.stage) {
      result = result.filter(d => d.stage === filters.stage);
    }
    if (filters?.userId) {
      result = result.filter(d => d.user_id === filters.userId);
    }

    return { success: true, data: result };
  }

  getDealById(dealId) {
    const data = this.getData();
    const deal = data.deals.find(d => String(d.id) === String(dealId));
    if (!deal) {
      return { success: false, error: 'Deal not found' };
    }
    const contact = data.contacts.find(c => String(c.id) === String(deal.contact_id));
    const activities = data.activities.filter(a => String(a.deal_id) === String(deal.id));
    return {
      success: true,
      data: {
        ...deal,
        name: deal.title,
        expectedCloseDate: deal.expected_close_date,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        contacts: contact ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          email: contact.email,
          avatar_url: contact.avatar_url
        } : null,
        activities
      }
    };
  }

  getPipelineDeals() {
    const data = this.getData();
    const pipelineData = {
      lead: { id: 'lead', title: 'Lead', deals: [] },
      qualified: { id: 'qualified', title: 'Qualified', deals: [] },
      proposal: { id: 'proposal', title: 'Proposal', deals: [] },
      negotiation: { id: 'negotiation', title: 'Negotiation', deals: [] },
      closed_won: { id: 'closed_won', title: 'Closed Won', deals: [] },
      closed_lost: { id: 'closed_lost', title: 'Closed Lost', deals: [] }
    };

    data.deals.forEach(deal => {
      const stage = deal.stage || 'lead';
      if (pipelineData[stage]) {
        const contact = data.contacts.find(c => String(c.id) === String(deal.contact_id));
        pipelineData[stage].deals.push({
          id: deal.id,
          title: deal.title,
          value: parseFloat(deal.value || 0),
          probability: deal.probability || 0,
          contact: contact ? `${contact.first_name} ${contact.last_name}` : 'No contact',
          company: contact?.company || 'Unknown company',
          avatar: contact?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          daysInStage: Math.max(1, Math.round((Date.now() - new Date(deal.updated_at || deal.created_at).getTime()) / (1000 * 3600 * 24))),
          lastActivity: 'Recent'
        });
      }
    });

    return { success: true, data: pipelineData };
  }

  getDealStats() {
    const data = this.getData();
    const totalDeals = data.deals.length;
    const totalValue = data.deals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const wonDeals = data.deals.filter(d => d.stage === 'closed_won');
    const lostDeals = data.deals.filter(d => d.stage === 'closed_lost');
    const wonValue = wonDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const activeDeals = data.deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    return {
      success: true,
      data: {
        totalDeals,
        totalValue,
        wonValue,
        winRate,
        avgDealSize: totalDeals > 0 ? totalValue / totalDeals : 0,
        activeDealsCount: activeDeals.length,
        activeDealCount: activeDeals.length,
        closedWonCount: wonDeals.length,
        closedLostCount: lostDeals.length,
        totalPipelineValue: activeDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0),
        weightedPipelineValue: activeDeals.reduce((sum, d) => sum + parseFloat(d.value || 0) * (d.probability || 0) / 100, 0)
      }
    };
  }

  createDeal(dealData) {
    const data = this.getData();
    const newId = `d-${Date.now()}`;
    const newDeal = {
      id: newId,
      title: dealData.title || dealData.name || 'Untitled Deal',
      contact_id: dealData.contact_id || dealData.contactId || null,
      user_id: dealData.user_id || 'usr-mgr-1',
      value: parseFloat(dealData.value || 0),
      stage: dealData.stage || 'lead',
      probability: parseInt(dealData.probability ?? 50, 10),
      expected_close_date: dealData.expected_close_date || dealData.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      description: dealData.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.deals.unshift(newDeal);
    this.saveData(data);
    return { success: true, data: { ...newDeal, name: newDeal.title } };
  }

  updateDeal(dealId, updates) {
    const data = this.getData();
    const index = data.deals.findIndex(d => String(d.id) === String(dealId));
    if (index === -1) {
      return { success: false, error: 'Deal not found' };
    }
    const current = data.deals[index];
    data.deals[index] = {
      ...current,
      ...updates,
      title: updates.title || updates.name || current.title,
      value: updates.value !== undefined ? parseFloat(updates.value) : current.value,
      expected_close_date: updates.expected_close_date || updates.expectedCloseDate || current.expected_close_date,
      updated_at: new Date().toISOString()
    };
    this.saveData(data);
    return { success: true, data: { ...data.deals[index], name: data.deals[index].title } };
  }

  updateDealStage(dealId, newStage) {
    const data = this.getData();
    const deal = data.deals.find(d => String(d.id) === String(dealId));
    if (!deal) return { success: false, error: 'Deal not found' };

    const stageProbs = {
      lead: 20,
      qualified: 40,
      proposal: 70,
      negotiation: 85,
      closed_won: 100,
      closed_lost: 0
    };

    deal.stage = newStage;
    if (stageProbs[newStage] !== undefined) {
      deal.probability = stageProbs[newStage];
    }
    deal.updated_at = new Date().toISOString();
    this.saveData(data);
    return { success: true, data: deal };
  }

  deleteDeal(dealId) {
    const data = this.getData();
    data.deals = data.deals.filter(d => String(d.id) !== String(dealId));
    data.tasks = data.tasks.filter(t => String(t.deal_id) !== String(dealId));
    data.activities = data.activities.filter(a => String(a.deal_id) !== String(dealId));
    this.saveData(data);
    return { success: true };
  }

  // --- TASKS ---
  getTasks(filters = {}) {
    const data = this.getData();
    let result = data.tasks.map(task => {
      const contact = data.contacts.find(c => String(c.id) === String(task.contact_id));
      const deal = data.deals.find(d => String(d.id) === String(task.deal_id));
      return {
        ...task,
        dueDate: task.due_date,
        contacts: contact ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          email: contact.email
        } : null,
        deals: deal ? {
          title: deal.title,
          value: deal.value,
          stage: deal.stage
        } : null
      };
    });

    if (filters?.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters?.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }

    return { success: true, data: result };
  }

  getUpcomingTasks(userId, limit = 5) {
    const data = this.getData();
    const activeTasks = data.tasks
      .filter(t => ['pending', 'in_progress'].includes(t.status))
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, limit);

    const transformed = activeTasks.map(task => {
      const contact = data.contacts.find(c => String(c.id) === String(task.contact_id));
      const deal = data.deals.find(d => String(d.id) === String(task.deal_id));
      const isOverdue = task.due_date && new Date(task.due_date) < new Date();
      const daysUntilDue = task.due_date ? Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        contact: contact ? `${contact.first_name} ${contact.last_name}` : null,
        company: contact?.company || null,
        deal: deal?.title || null,
        dealValue: deal?.value || null,
        isOverdue,
        daysUntilDue
      };
    });

    return { success: true, data: transformed };
  }

  createTask(taskData) {
    const data = this.getData();
    const newId = `t-${Date.now()}`;
    const newTask = {
      id: newId,
      user_id: taskData.user_id || 'usr-mgr-1',
      contact_id: taskData.contact_id || null,
      deal_id: taskData.deal_id || null,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      due_date: taskData.due_date || taskData.dueDate || new Date(Date.now() + 3 * 86400000).toISOString(),
      created_at: new Date().toISOString()
    };
    data.tasks.unshift(newTask);
    this.saveData(data);
    return { success: true, data: newTask };
  }

  updateTask(taskId, updates) {
    const data = this.getData();
    const index = data.tasks.findIndex(t => String(t.id) === String(taskId));
    if (index === -1) return { success: false, error: 'Task not found' };
    data.tasks[index] = { ...data.tasks[index], ...updates };
    this.saveData(data);
    return { success: true, data: data.tasks[index] };
  }

  deleteTask(taskId) {
    const data = this.getData();
    data.tasks = data.tasks.filter(t => String(t.id) !== String(taskId));
    this.saveData(data);
    return { success: true };
  }

  // --- ACTIVITIES ---
  getActivities(limit = 20, filters = {}) {
    const data = this.getData();
    let result = [...data.activities];

    if (filters?.type) {
      result = result.filter(a => a.type === filters.type);
    }
    if (filters?.contactId) {
      result = result.filter(a => String(a.contact_id) === String(filters.contactId));
    }
    if (filters?.dealId) {
      result = result.filter(a => String(a.deal_id) === String(filters.dealId));
    }

    result.sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date));
    result = result.slice(0, limit);

    const transformed = result.map(act => {
      const contact = data.contacts.find(c => String(c.id) === String(act.contact_id));
      const deal = data.deals.find(d => String(d.id) === String(act.deal_id));
      const user = data.users.find(u => String(u.id) === String(act.user_id)) || data.users[0];

      return {
        id: act.id,
        type: act.type,
        subject: act.subject,
        content: act.content,
        date: act.activity_date,
        duration: act.duration_minutes,
        contact: contact ? {
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          company: contact.company,
          avatar: contact.avatar_url
        } : null,
        deal: deal ? {
          id: deal.id,
          title: deal.title,
          value: deal.value,
          stage: deal.stage
        } : null,
        user: user ? {
          name: user.full_name,
          avatar: user.avatar_url
        } : null,
        relativeTime: this.formatRelativeTime(act.activity_date),
        icon: this.getActivityIcon(act.type),
        color: this.getActivityColor(act.type)
      };
    });

    return { success: true, data: transformed };
  }

  createActivity(activityData) {
    const data = this.getData();
    const newId = `act-${Date.now()}`;
    const newActivity = {
      id: newId,
      user_id: activityData.user_id || 'usr-mgr-1',
      contact_id: activityData.contact_id || null,
      deal_id: activityData.deal_id || null,
      type: activityData.type || 'note',
      subject: activityData.subject || activityData.title || 'New Activity',
      content: activityData.content || activityData.description || '',
      duration_minutes: activityData.duration_minutes || activityData.duration || null,
      activity_date: activityData.activity_date || activityData.date || new Date().toISOString()
    };
    data.activities.unshift(newActivity);
    this.saveData(data);
    return { success: true, data: newActivity };
  }

  // --- ANALYTICS ---
  getRevenueData() {
    return {
      success: true,
      data: [
        { month: 'Jan', forecast: 420000, actual: 395000 },
        { month: 'Feb', forecast: 480000, actual: 460000 },
        { month: 'Mar', forecast: 550000, actual: 535000 },
        { month: 'Apr', forecast: 610000, actual: 590000 },
        { month: 'May', forecast: 670000, actual: 645000 },
        { month: 'Jun', forecast: 740000, actual: 710000 },
        { month: 'Jul', forecast: 810000, actual: 785000 },
        { month: 'Aug', forecast: 880000, actual: 860000 }
      ]
    };
  }

  getPerformanceMetrics(quota = 2500000) {
    const data = this.getData();
    const thisYear = new Date().getFullYear();
    const yearDeals = data.deals.filter(d => new Date(d.created_at).getFullYear() === thisYear);
    const wonDeals = yearDeals.filter(d => d.stage === 'closed_won');
    const lostDeals = yearDeals.filter(d => d.stage === 'closed_lost');
    const activeDeals = data.deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
    const achieved = wonDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const totalDealsValue = yearDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const safeQuota = parseFloat(quota) || 2500000;
    const percentage = safeQuota > 0 ? Math.round((achieved / safeQuota) * 100) : 0;
    const closedCount = wonDeals.length + lostDeals.length;

    return {
      success: true,
      data: {
        quota: safeQuota,
        achieved,
        percentage,
        dealsWon: wonDeals.length,
        dealsLost: lostDeals.length,
        avgDealSize: yearDeals.length > 0 ? totalDealsValue / yearDeals.length : 0,
        conversionRate: closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 100) : 0,
        activePipeline: activeDeals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0),
        activeDealCount: activeDeals.length
      }
    };
  }

  getPipelineAnalytics() {
    const data = this.getData();
    const stageDistribution = {
      lead: { count: 0, value: 0 },
      qualified: { count: 0, value: 0 },
      proposal: { count: 0, value: 0 },
      negotiation: { count: 0, value: 0 },
      closed_won: { count: 0, value: 0 },
      closed_lost: { count: 0, value: 0 }
    };

    data.deals.forEach(deal => {
      const stage = deal.stage || 'lead';
      if (stageDistribution[stage]) {
        stageDistribution[stage].count += 1;
        stageDistribution[stage].value += parseFloat(deal.value || 0);
      }
    });

    return {
      success: true,
      data: {
        stageDistribution,
        avgTimeInStage: {
          lead: 5,
          qualified: 12,
          proposal: 8,
          negotiation: 14,
          closed_won: 22,
          closed_lost: 15
        },
        winRate: 72,
        salesCycleLength: 32,
        totalPipelineValue: data.deals.reduce((sum, d) => sum + parseFloat(d.value || 0), 0)
      }
    };
  }

  formatRelativeTime(dateString) {
    if (!dateString) return 'recently';
    const now = new Date();
    const diff = Math.floor((now - new Date(dateString)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  getActivityIcon(type) {
    const icons = {
      email: 'Mail',
      call: 'Phone',
      meeting: 'Calendar',
      demo: 'PlayCircle',
      note: 'FileText',
      task: 'CheckSquare'
    };
    return icons[type] || 'Activity';
  }

  getActivityColor(type) {
    const colors = {
      email: 'text-primary bg-primary-50',
      call: 'text-success bg-success-50',
      meeting: 'text-secondary bg-secondary-50',
      demo: 'text-accent bg-accent-50',
      note: 'text-text-secondary bg-surface-hover',
      task: 'text-warning bg-warning-50'
    };
    return colors[type] || 'text-text-secondary bg-surface-hover';
  }
}

export const localCrmStorage = new LocalCrmStorage();
export default localCrmStorage;
