import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Trash2, Settings } from 'lucide-react';
import { cn } from '@/utils/cn';

const Notifications: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
                    <p className="text-slate-500 font-bold mt-1">Stay updated with your account activity.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-sm hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Mark all as read</span>
                </button>
            </div>

            {/* Notification Categories */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-black/20 rounded-2xl w-fit">
                {['All', 'Orders', 'Payments', 'Security'].map((cat) => (
                    <button
                        key={cat}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            cat === 'All' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Notification List (Placeholder) */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Bell className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                            <h4 className="font-black text-slate-900 dark:text-white tracking-tight">Welcome to DataSwap</h4>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">JUST NOW</span>
                        </div>
                        <p className="text-sm font-bold text-slate-500">Thank you for joining our platform. Experience the fastest data delivery in Ghana.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 flex items-start gap-4 opacity-70">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                            <h4 className="font-black text-slate-900 dark:text-white tracking-tight">Profile Updated</h4>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">2 HOURS AGO</span>
                        </div>
                        <p className="text-sm font-bold text-slate-500">Your account details were successfully updated.</p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-8 flex justify-center">
                <button className="text-sm font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>View Older Notifications</span>
                </button>
            </div>
        </div>
    );
};

export default Notifications;
