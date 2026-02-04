import React, { useState, useEffect } from 'react';
import {
    Activity, Search, Filter, Download,
    Trash2, AlertCircle, CheckCircle2,
    Info, Clock, User, Shield, Terminal,
    Database, Zap, ArrowRight, ExternalLink
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/utils/api';

import { supabase } from '@/utils/supabase';

const AdminActivityLogPage: React.FC = () => {
    const [filter, setFilter] = useState('all');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();

        // Real-time listener
        let channel: any = null;
        if (supabase) {
            channel = supabase
                .channel('admin-logs-updates')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'activity_logs' },
                    () => fetchLogs()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/logs');
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    const purgeHistory = async () => {
        if (!confirm('Are you sure you want to purge all activity logs? This action cannot be undone.')) return;

        try {
            await api.delete('/admin/logs/purge');
            setLogs([]);
        } catch (error) {
            console.error('Failed to purge logs', error);
            alert('Failed to purge logs');
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.type === filter;
        const matchesSearch =
            (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.user_name || 'System').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.type || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 10) return 'Just now';
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Activity Log</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Real-time Event Stream</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-all">
                        <Download className="w-4 h-4 text-slate-400" />
                        <span>Export Logs</span>
                    </button>
                    <button
                        onClick={purgeHistory}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 font-black text-xs sm:text-sm hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Purge History</span>
                    </button>
                </div>
            </header>

            {/* Logs Table */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-4 sm:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col gap-4 sm:gap-6">
                    <div className="relative w-full group">
                        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search protocol events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-blue-500/50 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-12 sm:pl-14 pr-4 sm:pr-6 outline-none transition-all font-bold text-xs sm:text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
                        {['all', 'auth', 'system', 'bundle', 'order', 'user'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={cn(
                                    "px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all shrink-0",
                                    filter === t
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-black/10"
                                        : "bg-slate-50 dark:bg-white/5 text-slate-400 border-transparent hover:border-slate-200"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <th className="px-6 sm:px-10 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Description</th>
                                <th className="px-4 sm:px-8 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Index</th>
                                <th className="px-6 sm:px-10 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading && logs.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={5} className="px-6 sm:px-10 py-4 sm:py-6 animate-pulse"><div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl w-full" /></td></tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 sm:px-10 py-12 text-center text-slate-400 font-bold">No activity matched your criteria.</td></tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 sm:px-10 py-4 sm:py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center border",
                                                log.type === 'auth' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                    log.type === 'system' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                        log.type === 'order' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                            log.type === 'user' ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" :
                                                                "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                            )}>
                                                {log.type === 'auth' ? <Shield className="w-4 h-4" /> :
                                                    log.type === 'system' ? <Terminal className="w-4 h-4" /> :
                                                        log.type === 'order' ? <ShoppingBag className="w-4 h-4" /> :
                                                            log.type === 'bundle' ? <Zap className="w-4 h-4" /> :
                                                                <Activity className="w-4 h-4" />}
                                            </div>
                                            <span className="font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{log.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                <User className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <span className="font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate max-w-[100px] sm:max-w-none">{log.user_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                                        <div className="flex flex-col min-w-[200px]">
                                            <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{log.action}</p>
                                            {log.message && <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-0.5">{log.message}</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                                        <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] sm:text-xs font-black">{formatTime(log.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 sm:px-10 py-4 sm:py-6 text-right">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                                            log.level === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                log.level === 'warning' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                    log.level === 'error' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                                        "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        )}>
                                            {log.level === 'success' ? <CheckCircle2 className="w-3 h-3" /> :
                                                log.level === 'warning' ? <AlertCircle className="w-3 h-3" /> :
                                                    log.level === 'error' ? <AlertCircle className="w-3 h-3" /> :
                                                        <Info className="w-3 h-3" />}
                                            {log.level}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 sm:p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">Streaming latest protocol sessions</p>
                    <button className="flex items-center gap-2 font-black text-[9px] sm:text-[10px] text-blue-500 uppercase tracking-widest hover:translate-x-1 transition-all">
                        <span>Load Advanced Buffer</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminActivityLogPage;
