import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Shield, Lock, Mail, ArrowRight,
    AlertCircle, Loader2, ChevronLeft,
    Eye, EyeOff, Sun, Moon
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
            navigate('/admin');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500"
            style={{
                backgroundImage: 'url("/images/admin/bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-slate-50/90 dark:bg-[#0B0F19]/90 backdrop-blur-sm pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between mb-8">
                    {/* Back to Portal */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-black text-[10px] uppercase tracking-[0.2em] group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Return to Public Portal</span>
                    </Link>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:scale-110 active:scale-95 transition-all shadow-sm"
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                </div>

                <div className="bg-white/95 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group transition-colors duration-500">
                    {/* Header */}
                    <div className="mb-10 text-center relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 group-hover:scale-110 transition-transform duration-700">
                            <Shield className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Admin Terminal</h1>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Secure Infrastructure Entry</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-xs font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@system.com"
                                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl py-4 sm:py-5 pl-14 sm:pl-16 pr-6 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secret Key</label>
                            </div>
                            <div className="relative group/input">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-primary transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl py-4 sm:py-5 pl-14 sm:pl-16 pr-14 sm:pr-16 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-2xl uppercase tracking-[0.3em] text-xs shadow-2xl shadow-slate-900/20 dark:shadow-none hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 mt-10"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Decrypting...</span>
                                </>
                            ) : (
                                <>
                                    <span>Execute Access</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-10 flex items-center justify-center gap-6 opacity-30">
                        <Shield className="w-4 h-4 text-slate-900 dark:text-white" />
                        <div className="w-1 h-1 rounded-full bg-slate-900 dark:bg-white" />
                        <span className="text-[8px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Verified Terminal 4.2.0</span>
                    </div>
                </div>

                <p className="text-center text-slate-400 dark:text-slate-600 font-black text-[10px] mt-8 uppercase tracking-[0.2em]">
                    Authorized Personnel Only • IP Tracking Active
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
