import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import axios from 'axios';
import api from '@/utils/api';
import { cn } from '@/utils/cn';

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await api.get('/dashboard/transactions');
                setTransactions(response.data.transactions);
            } catch (error) {
                console.error('Failed to fetch transactions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.purpose?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-black dark:text-white transition-colors">Transaction History</h1>
                    <p className="text-slate-700 dark:text-slate-400 font-bold">Keep track of all credits and debits on your account.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
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
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Type</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Description</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-5 font-black text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">Reference</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}><td colSpan={5} className="px-6 py-5 animate-pulse"><div className="h-8 bg-slate-200 dark:bg-white/5 rounded w-full" /></td></tr>
                                ))
                            ) : filteredTransactions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold">No transactions found.</td></tr>
                            ) : filteredTransactions.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            {item.type === 'credit' ? (
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <ArrowDownLeft className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </div>
                                            )}
                                            <span className="font-black text-black dark:text-slate-300 capitalize">{item.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-black dark:text-slate-300 font-black">
                                        {item.purpose?.replace(/_/g, ' ')}
                                        <div className="mt-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                                item.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                    item.status === 'processing' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                                        "bg-red-500/10 text-red-600 border-red-500/20"
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black">
                                        <span className={item.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                            {item.type === 'credit' ? '+' : '-'} GH₵ {Number(item.amount).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-tight">
                                        {new Date(item.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 font-mono text-sm text-slate-400 dark:text-slate-600 uppercase">
                                        {item.reference || 'N/A'}
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

export default Transactions;
