
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ivsxlfsbwmnftvwdrcgw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2c3hsZnNid21uZnR2d2RyY2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTYwNDUsImV4cCI6MjA3NzgzMjA0NX0.N4RO6oEMw7fb7X2m_OXB7tP_UHsFPglsvRSbJ8E4m-Y";


interface SupabaseContextType {
    supabase: SupabaseClient | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    useEffect(() => {
        try {
            const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                }
            });
            setSupabase(client);
        } catch (error) {
            console.error("Error initializing Supabase client:", error);
        }
    }, []);
    

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextType => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
      throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};