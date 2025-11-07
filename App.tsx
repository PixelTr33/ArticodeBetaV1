
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import { ThemeContext } from './contexts/ThemeContext';
import { Theme } from './types';
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AppProvider } from './contexts/AppContext';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';

const AuthGate: React.FC = () => {
    const { supabase } = useSupabase();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (supabase) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setLoading(false);
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
            });

            return () => subscription.unsubscribe();
        }
    }, [supabase]);

    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
                {/* Optional: Add a nice loading spinner here */}
            </div>
        );
    }
    
    return session ? <Layout session={session} /> : <Auth />;
}


function App() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  const themeContextValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <SupabaseProvider>
        <SettingsProvider>
          <AppProvider>
            <AuthGate />
          </AppProvider>
        </SettingsProvider>
      </SupabaseProvider>
    </ThemeContext.Provider>
  );
}

export default App;