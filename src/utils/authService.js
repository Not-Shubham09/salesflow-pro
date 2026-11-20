import { supabase, isDemoMode } from './supabase';
import { localCrmStorage } from './localCrmStorage';

// Storage key to dispatch auth event listeners locally in demo mode
const authListeners = new Set();

const notifyAuthListeners = (event, session) => {
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
};

class AuthService {
  // Sign in with email and password
  async signIn(email, password) {
    if (isDemoMode()) {
      const res = localCrmStorage.signIn(email, password);
      if (res.success) {
        notifyAuthListeners('SIGNED_IN', res.data.session);
      }
      return res;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service. Your Supabase project may be paused or inactive.' 
        };
      }
      return { success: false, error: 'An unexpected error occurred during sign in.' };
    }
  }

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    if (isDemoMode()) {
      return { success: true, data: { user: { id: `usr-${Date.now()}`, email } } };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.fullName || '',
            role: userData?.role || 'sales_rep'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service. Your Supabase project may be paused or inactive.' 
        };
      }
      return { success: false, error: 'An unexpected error occurred during sign up.' };
    }
  }

  // Sign out
  async signOut() {
    if (isDemoMode()) {
      localCrmStorage.signOut();
      notifyAuthListeners('SIGNED_OUT', null);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred during sign out.' };
    }
  }

  // Get current session
  async getSession() {
    if (isDemoMode()) {
      const currentUser = localCrmStorage.getCurrentUser();
      if (!currentUser) {
        return { success: true, data: { session: null } };
      }
      return {
        success: true,
        data: {
          session: {
            access_token: 'local-demo-token',
            user: currentUser
          }
        }
      };
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service. Your Supabase project may be paused or inactive.' 
        };
      }
      return { success: false, error: 'Failed to retrieve session.' };
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    if (isDemoMode()) {
      return localCrmStorage.getUserProfile(userId);
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        };
      }
      return { success: false, error: 'Failed to load user profile.' };
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    if (isDemoMode()) {
      return localCrmStorage.updateUserProfile(userId, updates);
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        };
      }
      return { success: false, error: 'Failed to update profile.' };
    }
  }

  // Reset password
  async resetPassword(email) {
    if (isDemoMode()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to send reset email.' };
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback) {
    if (isDemoMode()) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            }
          }
        }
      };
    }

    return supabase.auth.onAuthStateChange(callback);
  }

  // Get current user
  getCurrentUser() {
    if (isDemoMode()) {
      const user = localCrmStorage.getCurrentUser();
      return Promise.resolve({ data: { user }, error: null });
    }
    return supabase.auth.getUser();
  }
}

const authService = new AuthService();
export default authService;
