import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Shield, Lock, Mail, ArrowRight,
    AlertCircle, Loader2, ChevronLeft,
    Eye, EyeOff, Sun, Moon, X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            const { user } = response.data;

            if (user.role !== 'admin') {
                setError('Access denied. This terminal is for authorized personnel only.');
                return;
            }

            login(response.data);
            const adminPath = import.meta.env.VITE_ADMIN_PATH || '/admin';
            navigate(adminPath);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500 bg-[#0B0F19]"
            style={{
                backgroundImage: 'url("/images/admin/bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-[#0B0F19]/90 dark:bg-[#0B0F19]/95 backdrop-blur-sm pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-6 px-2">
                    {/* Back to Portal */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-white transition-colors font-black text-[10px] uppercase tracking-[0.2em] group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Return to Public Portal</span>
                    </Link>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:scale-110 active:scale-95 transition-all shadow-sm"
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                </div>

                <div className="bg-[#161B26]/85 border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group transition-colors duration-500">
                    {/* Header */}
                    <div className="mb-10 text-center relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-[#0B0F19] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-105 group-hover:border-primary/30 transition-transform duration-500">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Admin Terminal</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Secure Infrastructure Entry</p>
                    </div>

                    {/* Inline alert box - Dismissible, clear content, pushes form elements downwards */}
                    {error && (
                        <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3 text-rose-400 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="space-y-0.5 text-left">
                                    <h4 className="text-xs font-bold uppercase tracking-wider">Access Denied</h4>
                                    <p className="text-xs font-medium opacity-90 leading-relaxed">{error}</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setError('')}
                                className="text-rose-400 hover:text-rose-300 transition-colors p-0.5 hover:bg-rose-500/10 rounded-lg shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        {/* Email Field */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@system.com"
                                    className="w-full bg-[#0B0F19]/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-medium text-white placeholder:text-slate-600 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Secret Key</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#0B0F19]/50 border border-white/10 rounded-2xl py-4 pl-14 pr-14 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-medium text-white placeholder:text-slate-600 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 border border-white/10 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-primary hover:border-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 mt-8"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Decrypting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Execute Access</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                        <Shield className="w-4 h-4 text-white" />
                        <div className="w-1 h-1 rounded-full bg-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Verified Terminal 4.2.0</span>
                    </div>
                </div>

                <p className="text-center text-slate-500 font-bold text-[9px] mt-6 uppercase tracking-[0.2em]">
                    Authorized Personnel Only • IP Tracking Active
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
