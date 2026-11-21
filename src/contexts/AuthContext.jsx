import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../utils/authService";
import { isDemoMode, setDemoMode, isSupabaseConfigured } from "../utils/supabase";
import { localCrmStorage } from "../utils/localCrmStorage";

const AuthContext = createContext();

const ACTIVE_USER_KEY = "salesflow_active_user";
const ACTIVE_PROFILE_KEY = "salesflow_active_profile";

const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getCachedProfile = () => {
  try {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  // Initialize synchronously from localStorage to prevent ANY flash of unauthenticated state
  const [user, setUser] = useState(getCachedUser);
  const [userProfile, setUserProfile] = useState(getCachedProfile);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [demoActive, setDemoActive] = useState(isDemoMode());

  // Save/clear active session helpers
  const persistSession = (authUser, profile) => {
    try {
      if (authUser) {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(authUser));
      } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
      }
      if (profile) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
      }
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  };

  // Background verification of existing session without destroying cached user on network jitter
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const sessionResult = await authService.getSession();

        if (!isMounted) return;

        if (sessionResult?.success && sessionResult?.data?.session?.user) {
          const authUser = sessionResult.data.session.user;
          setUser(authUser);

          const profileResult = await authService.getUserProfile(authUser.id);
          if (profileResult?.success && isMounted) {
            setUserProfile(profileResult.data);
            persistSession(authUser, profileResult.data);
          } else {
            persistSession(authUser, getCachedProfile());
          }
        } else if (sessionResult?.success && !sessionResult?.data?.session) {
          // Only clear if neither Supabase nor Demo has a session
          const localUser = localCrmStorage.getCurrentUser();
          if (!localUser && !isDemoMode()) {
            setUser(null);
            setUserProfile(null);
            persistSession(null, null);
          }
        }
      } catch (err) {
        // Network or API failure MUST NOT log out an existing session
        console.warn("Session verification check deferred:", err?.message);
      }
    };

    verifySession();

    // Listen for auth state events
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const profileResult = await authService.getUserProfile(session.user.id);
        const prof = profileResult?.success ? profileResult.data : null;
        setUserProfile(prof);
        persistSession(session.user, prof);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
        persistSession(null, null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
        persistSession(session.user, userProfile);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      setLoading(true);
      const result = await authService.signIn(email, password);

      if (!result?.success) {
        setAuthError(result?.error || "Login failed");
        setLoading(false);
        return { success: false, error: result?.error };
      }

      if (result?.data?.user) {
        const authUser = result.data.user;
        setUser(authUser);
        const profileResult = await authService.getUserProfile(authUser.id);
        const prof = profileResult?.success ? profileResult.data : (authUser.user_metadata || {
          full_name: authUser.email?.split('@')[0],
          role: 'sales_manager'
        });
        setUserProfile(prof);
        persistSession(authUser, prof);
      }

      setLoading(false);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      setLoading(false);
      const errorMsg = "Unable to sign in. Please check credentials or use 1-Click Demo.";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setAuthError(null);
      const result = await authService.signUp(email, password, userData);
      if (!result?.success) {
        setAuthError(result?.error || "Signup failed");
        return { success: false, error: result?.error };
      }
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = "Signup failed. Please try again.";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      setUser(null);
      setUserProfile(null);
      persistSession(null, null);
      await authService.signOut();
      return { success: true };
    } catch (error) {
      console.warn("Sign out cleanup:", error);
      setUser(null);
      setUserProfile(null);
      persistSession(null, null);
      return { success: true };
    }
  };

  const updateProfile = async (updates) => {
    try {
      setAuthError(null);
      if (!user?.id) {
        return { success: false, error: "User not authenticated" };
      }

      const result = await authService.updateUserProfile(user.id, updates);
      if (!result?.success) {
        setAuthError(result?.error || "Profile update failed");
        return { success: false, error: result?.error };
      }

      setUserProfile(result.data);
      persistSession(user, result.data);
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = "Failed to update profile";
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const resetDemoData = () => {
    localCrmStorage.resetData();
    window.location.reload();
  };

  const switchDemoRole = async (email) => {
    await signIn(email, 'Manager456!');
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isDemoMode: demoActive,
    isSupabaseConfigured,
    resetDemoData,
    switchDemoRole,
    clearError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
