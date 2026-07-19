import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Check, Globe, Phone, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Button from '@/components/Button';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import api from '@/utils/api';

interface AuthPageProps {
    type: 'signin' | 'signup';
    onToggle: () => void;
}

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const AuthPage: React.FC<AuthPageProps> = ({ type, onToggle }) => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        agreedToTerms: false
    });
    const [countryCode, setCountryCode] = useState('+233');
    const [registrationEnabled, setRegistrationEnabled] = useState(true);

    // Initial system config check
    React.useEffect(() => {
        const checkSettings = async () => {
            try {
                const response = await api.get('/auth/config');
                if (response.data.public_registration === false) {
                    setRegistrationEnabled(false);
                    if (type === 'signup') {
                        onToggle();
                    }
                }
            } catch (error) {
                console.error('Failed to check system config', error);
            }
        };
        checkSettings();
    }, []);

    // Listen to Google Redirect Hash (direct Google OAuth)
    React.useEffect(() => {
        const handleHashAuth = async () => {
            const hash = window.location.hash;
            if (hash) {
                const params = new URLSearchParams(hash.substring(1)); // remove '#'
                const accessToken = params.get('access_token');
                if (accessToken) {
                    // Clear the hash from the address bar so the token isn't visible
                    window.history.replaceState(null, '', window.location.pathname);
                    
                    setLoading(true);
                    setErrorMsg('');
                    setSuccessMsg('');
                    try {
                        const response = await api.post('/auth/google-login', {
                            accessToken,
                            provider: 'google'
                        });
                        
                        // Log in via custom backend session token
                        login(response.data);
                        navigate('/dashboard');
                    } catch (err: any) {
                        console.error('Backend Google Auth validation failed:', err);
                        setErrorMsg(err.response?.data?.message || 'Google Authentication failed. Please try again.');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };
        handleHashAuth();
    }, [navigate, login]);

    // Keep Supabase listener as fallback
    React.useEffect(() => {
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                setLoading(true);
                setErrorMsg('');
                setSuccessMsg('');
                try {
                    const response = await api.post('/auth/google-login', {
                        accessToken: session.access_token,
                        provider: 'supabase'
                    });
                    
                    login(response.data);
                    await supabase?.auth.signOut();
                    navigate('/dashboard');
                } catch (err: any) {
                    console.error('Backend Supabase Auth validation failed:', err);
                    setErrorMsg(err.response?.data?.message || 'Google Authentication failed. Please try again.');
                    await supabase?.auth.signOut();
                } finally {
                    setLoading(false);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate, login]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            // Direct Google OAuth 2.0 flow
            const clientId = '981565476180-t34i5j4fbklm84ehptj293t29eb2bci2.apps.googleusercontent.com';
            const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
            const scope = encodeURIComponent('openid email profile');
            const state = type; // Keep track of signin / signup state
            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&state=${state}`;
            
            // Redirect the user to Google OAuth login screen directly
            window.location.href = googleAuthUrl;
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to initialize Google authentication.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            if (type === 'signup') {
                await register({
                    email: formData.email,
                    password: formData.password,
                    fullName: `${formData.firstName} ${formData.lastName}`,
                    phoneNumber: `${countryCode}${formData.phoneNumber}`
                });
                setSuccessMsg('Account created successfully! Please login to continue.');
                setFormData(prev => ({ ...prev, password: '' }));
                setTimeout(() => onToggle(), 2000);
            } else {
                const response = await api.post('/auth/login', {
                    email: formData.email,
                    password: formData.password
                });
                login(response.data);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 font-sans relative overflow-hidden bg-[#0B0F19]">
            {/* Background Image with blur & premium overlay */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <img
                    src="/images/auth-bg.jpg"
                    alt="Background"
                    className="w-full h-full object-cover opacity-30 sm:opacity-40 scale-105 filter blur-[3px]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/90 via-[#0B0F19]/80 to-[#0B0F19]" />
            </div>

            {/* Top Header */}
            <header className="relative w-full max-w-[1400px] flex items-center justify-between z-20 mb-6 sm:mb-10 md:mb-14">
                <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 group-hover:border-primary/30 transition-all duration-300">
                        <img src="/logos/Logo.jpg" alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
                    </div>
                    <span className="text-lg sm:text-2xl font-black text-white tracking-tight">MaxHub</span>
                </div>

                <button className="hidden xs:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs sm:text-sm font-bold text-slate-300 shadow-lg">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">English (UK)</span>
                    <span className="sm:hidden">EN</span>
                </button>
            </header>

            <div className="relative w-full max-w-[540px] z-10 flex flex-col items-center px-2">
                {/* Auth Context Header */}
                <div className="text-center mb-6 sm:mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                        {type === 'signin' ? 'Welcome Back' : 'Get Started'}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base font-semibold max-w-[340px] mx-auto">
                        {type === 'signin'
                            ? "Access Ghanaian's premier high-speed data marketplace"
                            : "Create an account to purchase affordable data bundles in seconds"}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="w-full bg-[#161B26]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/[0.08] relative overflow-hidden transition-all duration-300">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                            <img src="/logos/Logo.jpg" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
                        </div>
                        <span className="text-lg font-black text-white tracking-tight">MaxHub Account</span>
                    </div>

                    {/* Inline Usability alerts (HCI) - Non-overlapping list that pushes form contents */}
                    {successMsg && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start justify-between gap-3 text-emerald-400 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex gap-3 items-start">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Success</h4>
                                    <p className="text-xs font-medium opacity-90 leading-relaxed">{successMsg}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSuccessMsg('')}
                                className="text-emerald-400 hover:text-emerald-300 transition-colors p-0.5 hover:bg-emerald-500/10 rounded-lg shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3 text-rose-400 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Action Required</h4>
                                    <p className="text-xs font-medium opacity-90 leading-relaxed">{errorMsg}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setErrorMsg('')}
                                className="text-rose-400 hover:text-rose-300 transition-colors p-0.5 hover:bg-rose-500/10 rounded-lg shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Social Auth Buttons */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 hover:border-white/20 transition-all text-sm font-bold text-white shadow-xl group disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-[1px] bg-white/[0.08]" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">OR</span>
                        <div className="flex-1 h-[1px] bg-white/[0.08]" />
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {type === 'signup' && (
                            <>
                                {/* Name Fields (inline, responsive wrap) */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                placeholder="John"
                                                className="w-full bg-[#0B0F19]/50 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Doe"
                                                className="w-full bg-[#0B0F19]/50 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Phone Number Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                                    <div className="flex gap-3">
                                        <div className="relative shrink-0 w-[110px]">
                                            <select
                                                value={countryCode}
                                                onChange={(e) => setCountryCode(e.target.value)}
                                                className="w-full h-full bg-[#0B0F19]/50 border border-white/10 rounded-2xl py-3.5 px-3.5 text-white text-sm font-semibold outline-none cursor-pointer focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none text-center"
                                            >
                                                <option value="+233" className="bg-[#161B26] text-white">🇬🇭 +233</option>
                                                <option value="+234" className="bg-[#161B26] text-white">🇳🇬 +234</option>
                                                <option value="+254" className="bg-[#161B26] text-white">🇰🇪 +254</option>
                                                <option value="+44" className="bg-[#161B26] text-white">🇬🇧 +44</option>
                                                <option value="+1" className="bg-[#161B26] text-white">🇺🇸 +1</option>
                                            </select>
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="relative flex-1 group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                placeholder="24 123 4567"
                                                className="w-full bg-[#0B0F19]/50 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="yourname@domain.com"
                                    className="w-full bg-[#0B0F19]/50 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#0B0F19]/50 border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl py-3.5 pl-11 pr-11 text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        {type === 'signin' && (
                            <div className="flex items-center justify-between px-1 text-xs">
                                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe} 
                                        onChange={() => setRememberMe(!rememberMe)} 
                                        className="sr-only"
                                    />
                                    <div className={cn(
                                        "w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200",
                                        rememberMe 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-[#0B0F19]/50 border-white/15 group-hover:border-white/30"
                                    )}>
                                        {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                </label>
                                <button type="button" className="font-bold text-slate-400 hover:text-primary transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        {type === 'signup' && (
                            <div className="px-1 text-xs">
                                <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.agreedToTerms} 
                                        onChange={() => setFormData({ ...formData, agreedToTerms: !formData.agreedToTerms })} 
                                        className="sr-only"
                                    />
                                    <div className={cn(
                                        "w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 mt-0.5 shrink-0",
                                        formData.agreedToTerms 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-[#0B0F19]/50 border-white/15 group-hover:border-white/30"
                                    )}>
                                        {formData.agreedToTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="font-semibold text-slate-400 leading-normal group-hover:text-slate-300 transition-colors">
                                        I agree to the <button type="button" className="text-primary font-bold hover:underline" onClick={(e) => { e.stopPropagation(); navigate('/terms'); }}>Terms of Service</button> and <button type="button" className="text-primary font-bold hover:underline" onClick={(e) => { e.stopPropagation(); navigate('/privacy'); }}>Privacy Policy</button>
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            isLoading={loading}
                            disabled={type === 'signup' && !formData.agreedToTerms}
                            className="w-full py-4 text-xs font-black rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {type === 'signin' ? 'Sign In Account' : 'Register Account'}
                        </Button>
                    </form>

                    {/* Toggle Link */}
                    <div className="text-center mt-6">
                        <p className="text-slate-400 text-xs font-semibold">
                            {type === 'signin' ? "Don't have an account yet?" : "Already have an account?"}{' '}
                            <button
                                onClick={onToggle}
                                className={cn(
                                    "text-primary font-black hover:underline transition-all ml-1",
                                    !registrationEnabled && type === 'signin' && "hidden"
                                )}
                                disabled={!registrationEnabled && type === 'signin'}
                            >
                                {type === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                            {!registrationEnabled && type === 'signin' && (
                                <span className="text-slate-500 text-xs ml-2">(Registration Closed)</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
