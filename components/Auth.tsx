

import React, { useState, useContext } from 'react';
import { ICONS } from '../constants';
import { useSupabase } from '../contexts/SupabaseContext';
import { ThemeContext } from '../contexts/ThemeContext';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const { supabase } = useSupabase();
    const { theme } = useContext(ThemeContext);

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            console.error('Google Sign-In Error:', error);
            setError(`Google Sign-In failed: ${error.message}. Please double-check your Google Cloud Console configuration for 'Authorized JavaScript origins' and 'Redirect URIs'.`);
        }
        setLoading(false);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        if (!supabase) {
            setError("Database connection not available.");
            setLoading(false);
            return;
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Redirect user back here after password reset
            });
            if (error) throw error;
            setMessage('Password reset link has been sent to your email.');
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!supabase) {
            setError("Database connection not available.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                if (!fullName.trim()) {
                    throw new Error('Please enter your full name.');
                }

                const { error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: {
                        data: {
                            full_name: fullName.trim(),
                        }
                    }
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const inputClass = `w-full px-4 py-2.5 text-sm rounded-lg border transition-all duration-200 outline-none focus:ring-2 ${theme === 'light' ? 'bg-white/50 border-black/10 focus:ring-blue-400 text-light-fg placeholder:text-light-fg-alt' : 'bg-white/5 border-white/10 focus:ring-white/50 text-white placeholder:text-gray-400'}`;
    const googleButtonClass = `w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg transition-all duration-200 border ${theme === 'light' ? 'bg-white/80 border-black/10 text-light-fg hover:bg-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`;

    const renderMainContent = () => {
        if (isForgotPassword) {
            return (
                <div>
                     <div className="text-center mb-6">
                        <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>Reset Password</h2>
                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Enter your email to get a reset link.</p>
                    </div>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className={inputClass} />
                        </div>
                        <button type="submit" disabled={loading} className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-gray-200'}`}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                     <div className="text-center mt-6">
                        <button onClick={() => setIsForgotPassword(false)} className={`text-xs transition-colors ${theme === 'light' ? 'text-light-fg-alt hover:text-light-fg' : 'text-gray-400 hover:text-white'}`}>
                           Back to Sign In
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                 <div className="flex flex-col items-center mb-6">
                    <div className={`flex items-center space-x-2 mb-2 ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>
                        <span className="text-light-primary dark:text-dark-primary">{ICONS.gemini}</span>
                        <h1 className="text-2xl font-semibold">Articode</h1>
                    </div>
                    <p className={`${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'} text-sm`}>
                        {isLogin ? 'Sign in to start building' : 'Create your account'}
                    </p>
                </div>
                
                <div className="space-y-4">
                    <button onClick={handleGoogleLogin} className={googleButtonClass}>
                        {ICONS.google}
                        Sign in with Google
                    </button>

                     <div className="flex items-center">
                        <div className={`flex-grow border-t ${theme === 'light' ? 'border-black/10' : 'border-white/10'}`}></div>
                        <span className={`flex-shrink mx-4 text-xs ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>OR</span>
                        <div className={`flex-grow border-t ${theme === 'light' ? 'border-black/10' : 'border-white/10'}`}></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {!isLogin && (
                        <div>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required className={inputClass} />
                        </div>
                    )}
                    <div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className={inputClass} />
                    </div>
                    <div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className={inputClass} />
                    </div>
                    
                    {isLogin && (
                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className={theme === 'light' ? 'text-light-fg-alt' : 'text-gray-300'}>Remember me</span>
                            </label>
                            <button type="button" onClick={() => setIsForgotPassword(true)} className={`font-semibold transition-colors ${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'}`}>
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-gray-200'}`}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                            setMessage(null);
                        }}
                        className={`text-xs transition-colors ${theme === 'light' ? 'text-light-fg-alt hover:text-light-fg' : 'text-gray-400 hover:text-white'}`}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className={`w-screen h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'animated-gradient-agent' : 'animated-gradient-agent-light'}`}>
            <div className={`w-full max-w-sm backdrop-blur-2xl border rounded-2xl shadow-2xl p-8 transition-all duration-300 ${theme === 'light' ? 'bg-white/60 border-black/10' : 'bg-black/30 border-white/10'}`}>
                {error && <div className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs text-center p-2 rounded-md mb-4">{error}</div>}
                {message && <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs text-center p-2 rounded-md mb-4">{message}</div>}
                
                {renderMainContent()}
            </div>
        </div>
    );
};

export default Auth;