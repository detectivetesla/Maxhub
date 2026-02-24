import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Check, Globe, LayoutGrid, Phone } from 'lucide-react';
import Button from '@/components/Button';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
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

    React.useEffect(() => {
        const checkSettings = async () => {
            try {
                const response = await api.get('/auth/config');
                // Check if public registration is disabled
                if (response.data.public_registration === false) {
                    setRegistrationEnabled(false);
                    // If currently on signup and it's disabled, switch to signin
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
                setSuccessMsg('Account created! Please login to continue.');
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
        <div className="min-h-screen flex flex-col items-center p-3 sm:p-6 font-sans relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/auth-bg.jpg"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-[#0B0F19]/70 backdrop-blur-[2px]" />
            </div>

            {/* Top Header */}
            <header className="relative w-full max-w-[1400px] flex items-center justify-between z-20 mb-4 sm:mb-8 md:mb-12">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-transparent flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img src="/src/assets/images/logo.png" alt="Logo" className="w-full h-full object-contain brightness-110" />
                    </div>
                    <span className="text-base sm:text-xl font-black text-white tracking-tighter">MaxHub</span>
                </div>

                <button className="hidden xs:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs sm:text-sm font-bold text-slate-300">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">English (UK)</span>
                    <span className="sm:hidden">EN</span>
                </button>
            </header>

            <div className="relative w-full max-w-[520px] z-10 flex flex-col items-center">
                {/* Auth Context Header */}
                <div className="text-center mb-6 sm:mb-10 md:mb-14 space-y-2 sm:space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 px-4">
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
                        {type === 'signin' ? 'Sign In' : 'Sign Up'}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg md:text-xl font-medium">
                        {type === 'signin'
                            ? "Welcome back, you've been missed!"
                            : "Join us and start your journey today!"}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="w-full bg-[#1F2937]/90 backdrop-blur-3xl rounded-3xl sm:rounded-[2rem] p-6 sm:p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">

                    {successMsg && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] bg-blue-500/10 border border-blue-500/20 py-2 sm:py-3 rounded-xl text-center text-xs font-bold text-blue-400 px-4 animate-in slide-in-from-top-2">
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] bg-red-500/10 border border-red-500/20 py-2 sm:py-3 rounded-xl text-center text-xs font-bold text-red-400 px-4 animate-in slide-in-from-top-2">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center">
                            <img src="/src/assets/images/logo.png" alt="Logo" className="w-full h-full object-contain brightness-110" />
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter">MaxHub</span>
                    </div>

                    {/* Social Auth Buttons */}
                    <div className="mb-8">
                        <button className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 transition-all text-sm font-bold text-white shadow-xl group">
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="text-xs uppercase font-bold tracking-widest text-slate-400">OR</span>
                        <div className="flex-1 h-[1px] bg-white/10" />
                    </div>

                    <form className="space-y-4 sm:space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                        {type === 'signup' && (
                            <>
                                {/* Name Fields */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative group flex-1">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="First Name"
                                            className="w-full bg-[#0B0F19]/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative group flex-1">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="Last Name"
                                            className="w-full bg-[#0B0F19]/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs text-slate-500 font-bold ml-1">Phone Number</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-shrink-0 w-full sm:w-auto">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                            <select
                                                value={countryCode}
                                                onChange={(e) => setCountryCode(e.target.value)}
                                                className="w-full sm:w-auto h-full bg-[#0B0F19]/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm font-medium outline-none cursor-pointer focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                                            >
                                                <option value="+233" className="bg-[#1c1f26] text-white">🇬🇭 +233</option>
                                                <option value="+234" className="bg-[#1c1f26] text-white">🇳🇬 +234</option>
                                                <option value="+254" className="bg-[#1c1f26] text-white">🇰🇪 +254</option>
                                                <option value="+44" className="bg-[#1c1f26] text-white">🇬🇧 +44</option>
                                                <option value="+1" className="bg-[#1c1f26] text-white">🇺🇸 +1</option>
                                            </select>
                                        </div>
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="24 123 4567"
                                            className="flex-1 bg-[#0B0F19]/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm font-medium placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email Field */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email Address"
                                className="w-full bg-[#0B0F19]/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white text-sm font-medium placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                            <input
                                required
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Password"
                                className="w-full bg-[#0B0F19]/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-white text-sm font-medium placeholder:text-slate-500 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        {type === 'signin' && (
                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={cn(
                                        "w-4 h-4 rounded border border-white/10 flex items-center justify-center transition-all",
                                        rememberMe ? "bg-primary border-primary" : "bg-white/5"
                                    )} onClick={() => setRememberMe(!rememberMe)}>
                                        {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                </label>
                                <button type="button" className="text-xs font-medium text-slate-400 hover:text-primary transition-colors">
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        {type === 'signup' && (
                            <div className="px-1">
                                <div
                                    className="flex items-start gap-2 cursor-pointer group"
                                    onClick={() => setFormData({ ...formData, agreedToTerms: !formData.agreedToTerms })}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border border-white/10 flex items-center justify-center transition-all mt-0.5 shrink-0",
                                        formData.agreedToTerms ? "bg-primary border-primary" : "bg-white/5"
                                    )}>
                                        {formData.agreedToTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                                        I agree to the <button type="button" className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate('/terms'); }}>Terms of Service</button> and <button type="button" className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate('/privacy'); }}>Privacy Policy</button>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            isLoading={loading}
                            disabled={type === 'signup' && !formData.agreedToTerms}
                            className="w-full py-3.5 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {type === 'signin' ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </form>

                    {/* Toggle Link */}
                    <div className="text-center mt-6">
                        <p className="text-slate-400 text-xs font-medium">
                            {type === 'signin' ? "You haven't any account?" : "Already have an account?"}{' '}
                            <button
                                onClick={onToggle}
                                className={cn(
                                    "text-primary font-bold hover:underline transition-all",
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
