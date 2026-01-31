import React from 'react';
import { Mail, Search, Filter, Trash2, Archive, Star, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

const Inboxes: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Messages</h1>
                <p className="text-slate-500 font-bold mt-1">Direct communication and system alerts.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-16 pr-6 outline-none transition-all font-bold text-sm shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-500 hover:text-primary transition-all shadow-sm">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-500 hover:text-red-500 transition-all shadow-sm">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Empty State / Placeholder */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6">
                    <Mail className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your inbox is clear</h3>
                <p className="text-slate-500 font-bold max-w-sm">When you receive messages or important system notifications, they will appear here.</p>
            </div>
        </div>
    );
};

export default Inboxes;
