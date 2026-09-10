'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isGuest: boolean;
  guestName: string;
  setGuestName: (name: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'username'>>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [guestName, setGuestNameState] = useState<string>('Grandmaster Guest');

  const setGuestName = (name: string) => {
    setGuestNameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chess_guest_name', name);
    }
  };

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
      } else if (error && error.code === 'PGRST116') {
        // Record not found: create default profile
        const { data: userAuth } = await supabase.auth.getUser();
        const fallbackUsername = userAuth?.user?.email?.split('@')[0] || `player_${userId.slice(0, 5)}`;
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: fallbackUsername,
            display_name: fallbackUsername,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
            rating: 1200,
          })
          .select('*')
          .single();
        if (newProfile) setProfile(newProfile as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // Load local guest name
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chess_guest_name') || localStorage.getItem('playerName');
      if (stored) setGuestNameState(stored);
    }

    // Initialize Supabase Auth state
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Supabase getSession error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
            display_name: displayName || username,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          },
        },
      });

      if (error) return { error };

      if (data.user) {
        // Upsert profile in case trigger hasn't fired yet
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: username.toLowerCase().trim(),
            display_name: displayName || username,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            rating: 1200,
          }, { onConflict: 'id' });
        
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'username'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) return { error };

      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isGuest: !user,
        guestName,
        setGuestName,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
