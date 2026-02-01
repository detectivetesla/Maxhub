import React, { useState, useEffect } from 'react';
import {
    Database, Search, Filter, Download,
    Trash2, AlertCircle, CheckCircle2,
    Info, Clock, User, Zap, ArrowRight,
    ExternalLink, RefreshCw, ShoppingBag, XCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import axios from 'axios';
import api from '@/utils/api';
import { supabase } from '@/utils/supabase';

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchOrders();

        // Supabase Realtime Listener
        let channel: any = null;
        if (supabase) {
            channel = supabase
                .channel('admin-orders-updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'orders' },
                    () => fetchOrders()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/orders');
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter;
        const matchesSearch =
            (order.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.recipient_phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Order Management</h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Real-time Transaction Ledger</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-sm hover:bg-slate-100 transition-all"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
                        <span>Refresh</span>
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-sm hover:scale-105 transition-all shadow-xl shadow-black/10">
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingBag, color: 'text-blue-500' },
                    { label: 'Successful', value: orders.filter(o => o.status === 'success').length.toString(), icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Processing', value: orders.filter(o => o.status === 'processing').length.toString(), icon: Clock, color: 'text-amber-500' },
                    { label: 'Failed', value: orders.filter(o => o.status === 'failed').length.toString(), icon: XCircle, color: 'text-red-500' },
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

            {/* Orders Table */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by user, phone, or order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-primary/50 rounded-2xl py-4 pl-14 pr-6 outline-none transition-all font-bold text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {['all', 'success', 'processing', 'failed'].map((t) => (
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
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bundle</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={5} className="px-10 py-6 animate-pulse"><div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl w-full" /></td></tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-bold">No orders found.</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</span>
                                            <span className="text-[10px] font-bold text-slate-400 mt-1">{new Date(order.created_at).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">{order.user_name}</span>
                                            <span className="text-xs font-bold text-slate-500">{order.recipient_phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center border text-[10px] font-black",
                                                order.network === 'MTN' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                                    order.network === 'Telecel' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                                        "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                            )}>
                                                {order.network?.[0]}
                                            </div>
                                            <span className="font-bold text-sm text-slate-600 dark:text-slate-400">{order.bundle_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-black text-sm text-slate-900 dark:text-white">GH₵ {Number(order.amount).toLocaleString()}</span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                            order.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                order.status === 'processing' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                    "bg-red-500/10 text-red-600 border-red-500/20"
                                        )}>
                                            {order.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> :
                                                order.status === 'processing' ? <Clock className="w-3 h-3" /> :
                                                    <AlertCircle className="w-3 h-3" />}
                                            {order.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Record Count: {filteredOrders.length}</p>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Previous</button>
                        <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10">1</button>
                        <button className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersPage;
