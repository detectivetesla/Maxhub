import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, ChevronRight } from 'lucide-react';
import axios from 'axios';
import api from '@/utils/api';
import { cn } from '@/utils/cn';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/dashboard/orders');
                setOrders(response.data.orders);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.bundle_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-black dark:text-white transition-colors">My Orders</h1>
                    <p className="text-slate-700 dark:text-slate-400 font-bold">Track and manage your data bundle purchases.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Order ID or number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 focus:border-slate-400 dark:focus:border-primary outline-none transition-all w-full md:w-64 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
            </header>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'processing', label: 'Processing' },
                    { id: 'success', label: 'Completed' },
                    { id: 'failed', label: 'Failed' }
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setStatusFilter(filter.id)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                            statusFilter === filter.id
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                : "bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        )}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Network</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Bundle</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Recipient</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={6} className="px-6 py-5 animate-pulse"><div className="h-8 bg-slate-200 dark:bg-white/5 rounded w-full" /></td></tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No orders found.</td></tr>
                            ) : filteredOrders.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5 font-mono text-sm font-black text-black dark:text-slate-400 uppercase">#{item.id.slice(0, 8)}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2.5 h-2.5 rounded-full",
                                                item.network === 'MTN' ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" :
                                                    item.network === 'Telecel' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                                        "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                            )} />
                                            <span className="font-black text-black dark:text-slate-300">{item.network}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-black dark:text-white">{item.bundle_name}</td>
                                    <td className="px-6 py-5 text-black dark:text-slate-400 font-black">{item.phone}</td>
                                    <td className="px-6 py-5">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border",
                                            item.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                item.status === 'processing' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                                    "bg-red-500/10 text-red-600 border-red-500/20"
                                        )}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Orders;
