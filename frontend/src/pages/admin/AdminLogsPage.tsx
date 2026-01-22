import React, { useState, useEffect } from 'react';
import {
    Activity, Search, Filter, Download,
    Trash2, AlertCircle, CheckCircle2,
    Info, Clock, User, Shield, Terminal,
    Database, Zap, ArrowRight, ExternalLink
} from 'lucide-react';
import { cn } from '@/utils/cn';

import axios from 'axios';

const AdminLogsPage: React.FC = () => {
    const [filter, setFilter] = useState('all');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/admin/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    const purgeHistory = async () => {
        if (!confirm('Are you sure you want to purge all system logs? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete('http://localhost:5000/admin/logs/purge', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs([]);
        } catch (error) {
            console.error('Failed to purge logs', error);
            alert('Failed to purge logs');
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.type === filter;
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.user_name || 'System').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Logs</h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Real-time Event Stream</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-sm hover:bg-slate-100 transition-all">
                        <Download className="w-4 h-4 text-slate-400" />
                        <span>Export Logs</span>
                    </button>
                    <button
                        onClick={purgeHistory}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 font-black text-sm hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Purge History</span>
                    </button>
                </div>
            </header>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Event Flow', value: '+12.4k', icon: Activity, color: 'text-blue-500' },
                    { label: 'Error Rate', value: '0.04%', icon: AlertCircle, color: 'text-emerald-500' },
                    { label: 'Active Sessions', value: '428', icon: User, color: 'text-amber-500' },
                    { label: 'Avg Latency', value: '114ms', icon: Clock, color: 'text-purple-500' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                        </div>
                        <stat.icon className={cn("w-6 h-6 opacity-30", stat.color)} />
                    </div>
                ))}
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by event, message, or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-primary/50 rounded-2xl py-4 pl-14 pr-6 outline-none transition-all font-bold text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'auth', 'system', 'bundle', 'order', 'user'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0",
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Description</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Index</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={5} className="px-10 py-6 animate-pulse"><div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl w-full" /></td></tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-bold">No logs matched your criteria.</td></tr>
                            ) : filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                log.type === 'auth' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                                    log.type === 'system' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                        log.type === 'bundle' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                            "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                            )}>
                                                {log.type === 'auth' ? <Shield className="w-4 h-4" /> :
                                                    log.type === 'system' ? <Terminal className="w-4 h-4" /> :
                                                        log.type === 'bundle' ? <Zap className="w-4 h-4" /> :
                                                            <Activity className="w-4 h-4" />}
                                            </div>
                                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{log.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                                <User className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <span className="font-bold text-sm text-slate-600 dark:text-slate-400">{log.user_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{log.action}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black">{formatTime(log.created_at)}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
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

                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing last 500 events from global cluster</p>
                    <button className="flex items-center gap-2 font-black text-[10px] text-primary uppercase tracking-widest hover:translate-x-1 transition-transform">
                        <span>Load Advanced Buffer</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 opacity-30 pb-10">
                <Database className="w-6 h-6" />
                <Activity className="w-6 h-6" />
                <Zap className="w-6 h-6" />
                <Shield className="w-6 h-6" />
            </div>
        </div>
    );
};

export default AdminLogsPage;
