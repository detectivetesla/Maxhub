import React, { useState } from 'react';
import {
    User, Mail, Phone, MessageCircle, Wallet,
    CheckCircle2, Shield, Edit3, Trash2,
    ExternalLink, Check
} from 'lucide-react';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <header className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white transition-colors">My Profile</h1>
                <p className="text-slate-600 dark:text-slate-400 font-bold">Manage your personal information and account settings</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column - Summary & Stats */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[#1F2937]/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />

                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/30 ring-4 ring-white dark:ring-slate-800">
                                    {(user?.fullName || user?.email)?.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg">
                                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{user?.fullName || 'Member'}</h3>
                                <span className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mt-1 border border-primary/20">
                                    {user?.role || 'User'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{user?.email}</span>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{user?.phoneNumber || 'Not provided'}</span>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>

                        {/* Financial Stats in Card */}
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-sm font-bold">Wallet Balance</span>
                                </div>
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">GH₵ {user?.walletBalance?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 text-opacity-80">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm font-bold">Account Status</span>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-black",
                                    user?.isBlocked ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {user?.isBlocked ? 'blocked' : 'active'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Forms & Actions */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Edit Profile Section */}
                    <div className="bg-white dark:bg-[#1F2937]/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Edit Profile</h3>
                                <p className="text-sm text-slate-500 font-bold">Update your personal details</p>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <Edit3 className="w-5 h-5 text-primary" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.fullName}
                                    disabled={!isEditing}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-transparent focus:border-primary/50 outline-none transition-all font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email}
                                    disabled={!isEditing}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-transparent focus:border-primary/50 outline-none transition-all font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    defaultValue={user?.phoneNumber}
                                    disabled={!isEditing}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-black/20 border border-transparent focus:border-primary/50 outline-none transition-all font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Account Verification Section */}
                    <div className="bg-white dark:bg-[#1F2937]/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Account Verification</h3>
                            <p className="text-sm text-slate-500 font-bold">Your identity is verified</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-blue-500">Email Address</p>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-emerald-500">Phone Number</p>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{user?.phoneNumber || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Actions Section */}
                    <div className="bg-white dark:bg-[#1F2937]/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-xl shadow-black/5">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Account Actions</h3>
                            <p className="text-sm text-slate-500 font-bold">Manage your account preferences and settings</p>
                        </div>

                        <div className="space-y-4">
                            <button className="w-full p-4 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <Edit3 className="w-5 h-5 text-blue-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-black text-blue-500">Edit Preferences</p>
                                        <p className="text-[10px] font-bold text-slate-500">Customize notifications, appearance, and privacy</p>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                            <button className="w-full p-4 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-black text-emerald-500">Contact Support</p>
                                        <p className="text-[10px] font-bold text-slate-500">Get help via WhatsApp</p>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                            <button className="w-full p-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-black text-red-500">Delete Account</p>
                                        <p className="text-[10px] font-bold text-slate-500">Permanently remove your account</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Settings;

