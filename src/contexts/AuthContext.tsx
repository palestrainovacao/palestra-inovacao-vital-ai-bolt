import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, role: User['role'], organizationId?: string) => Promise<boolean>;
  createOrganization: (name: string) => Promise<string | null>;
  getOrganizations: () => Promise<any[]>;
  setCurrentOrganization: (organizationId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !initialized) return;

      console.log('Auth state change:', event, session?.user?.id);

      try {
        if (session?.user) {
          // Only load profile for existing users, not during sign-up
          if (event !== 'SIGNED_UP') {
            await loadUserProfile(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const profile = await getUserProfile(supabaseUser.id);
      setUser({
        id: supabaseUser.id,
        name: profile.name,
        email: supabaseUser.email || '',
        role: profile.role,
        avatar: profile.avatar_url || undefined,
        organizationId: profile.organization_id || undefined
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If profile doesn't exist, create a basic user object
      setUser({
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'Usuário',
        email: supabaseUser.email || '',
        role: 'caregiver',
      });
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: User['role'], 
    organizationId?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if user is trying to create an organization but is not an admin
      if (organizationId === undefined && role !== 'admin') {
        throw new Error('Apenas administradores podem criar novas organizações');
      }
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error);
        return false;
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            name,
            role,
            organization_id: organizationId
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return false;
        }

        // Wait a bit for the database to commit
        await new Promise(resolve => setTimeout(resolve, 500));

        // Load the user profile after successful creation
        await loadUserProfile(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async (name: string): Promise<string | null> => {
    try {
      // Use the service role key for organization creation to bypass RLS
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating organization:', error);
      return null;
    }
  };

  const getOrganizations = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching organizations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  };

  const setCurrentOrganization = async (organizationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ organization_id: organizationId })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating organization:', error);
        return false;
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, organizationId } : null);
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      signUp, 
      createOrganization, 
      getOrganizations, 
      setCurrentOrganization 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
