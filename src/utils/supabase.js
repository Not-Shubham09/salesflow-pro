import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project')
);

export const isDemoMode = () => {
  if (typeof window !== 'undefined' && localStorage.getItem('salesflow_force_demo') === 'true') {
    return true;
  }
  return !isSupabaseConfigured;
};

export const setDemoMode = (enabled) => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('salesflow_force_demo', 'true');
    } else {
      localStorage.removeItem('salesflow_force_demo');
    }
  }
};

let client = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        lock: async (name, acquireTimeout, fn) => await fn()
      }
    });
  } catch (err) {
    console.warn('[SalesFlow CRM] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.info('[SalesFlow CRM] Running in Local Demo Mode (no Supabase credentials configured).');
}

// Fallback dummy client to prevent uncaught runtime errors if a raw supabase call is executed
const createFallbackQuery = () => {
  const handler = {
    get(target, prop) {
      if (prop === 'then') {
        return (resolve) => resolve({ data: [], error: null });
      }
      return () => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
};

export const supabase = client || new Proxy({}, {
  get(target, prop) {
    if (prop === 'auth') {
      return {
        signInWithPassword: async () => ({ data: null, error: new Error('Demo mode active') }),
        signUp: async () => ({ data: null, error: new Error('Demo mode active') }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      };
    }
    if (prop === 'from') {
      return () => createFallbackQuery();
    }
    return () => new Proxy({}, { get: () => () => ({}) });
  }
});

export default supabase;
