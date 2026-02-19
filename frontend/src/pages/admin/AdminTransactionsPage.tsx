import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Download,
    CheckCircle2, Clock, XCircle,
    ArrowUpRight, ArrowDownLeft,
    CreditCard, ShoppingBag,
    MoreVertical, ExternalLink,
    Calendar, User, Wallet,
    ChevronRight, Info, RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/utils/api';
import { supabase } from '@/utils/supabase';
import Button from '@/components/Button';

const AdminTransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [stats, setStats] = useState({
        totalAmount: 0,
        successCount: 0,
        pendingCount: 0,
        failedCount: 0
    });

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (typeFilter !== 'all') params.type = typeFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await api.get('/admin/transactions', { params });
            setTransactions(response.data.transactions);

            // Calculate stats from a broader set if needed, but for now use current list for UI
            const txs = response.data.transactions;
            setStats({
                totalAmount: txs.reduce((acc: number, curr: any) => acc + (curr.status === 'success' ? Number(curr.amount) : 0), 0),
                successCount: txs.filter((t: any) => t.status === 'success').length,
                pendingCount: txs.filter((t: any) => t.status === 'processing' || t.status === 'initialized').length,
                failedCount: txs.filter((t: any) => t.status === 'failed').length
            });
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();

        // Real-time listener
        let channel: any = null;
        if (supabase) {
            channel = supabase
                .channel('admin-transactions-live')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
                .subscribe();
        }

        return () => { if (channel) supabase?.removeChannel(channel); };
    }, [statusFilter, typeFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleRowClick = (tx: any) => {
        setSelectedTx(tx);
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const response = await api.post('/admin/orders/sync');
            alert(response.data.message);
            fetchTransactions();
        } catch (error: any) {
            console.error('Sync failed', error);
            alert(error.response?.data?.message || 'Synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Main Content Area */}
            <div className={cn("flex-1 space-y-8 transition-all duration-500", selectedTx ? "lg:w-[65%]" : "w-full")}>
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Finance Ledger</h1>
                        <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Live Transaction Monitoring
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            title="Sync with Portal-02"
                            disabled={loading}
                            className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all group flex items-center gap-2"
                        >
                            <RefreshCw className={cn("w-5 h-5 text-blue-500 transition-colors", loading && "animate-spin")} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Sync Portal</span>
                        </button>
                        <button
                            onClick={fetchTransactions}
                            className="p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all group"
                        >
                            <RefreshCw className={cn("w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors", loading && "animate-spin")} />
                        </button>
                        <Button className="rounded-2xl px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black flex items-center gap-2 shadow-xl shadow-slate-900/10 dark:shadow-none hover:translate-y-[-2px] transition-all">
                            <Download className="w-4 h-4" />
                            <span>Export Data</span>
                        </Button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Settled Volume', value: `GH₵ ${stats.totalAmount.toLocaleString()}`, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Successful', value: stats.successCount.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Processing', value: stats.pendingCount.toString(), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { label: 'Failed/Cancelled', value: stats.failedCount.toString(), icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    ].map((s) => (
                        <div key={s.label} className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", s.bg)}>
                                <s.icon className={cn("w-6 h-6", s.color)} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters and List */}
                <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                    {/* Filter Bar */}
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-sm focus:ring-2 ring-blue-500/20 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-slate-50 dark:bg-black/20 border-none rounded-2xl py-4 px-6 outline-none font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:ring-2 ring-blue-500/20 transition-all cursor-pointer"
                            >
                                <option value="all">Any Type</option>
                                <option value="credit">Deposit (+)</option>
                                <option value="debit">Purchase (-)</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-slate-50 dark:bg-black/20 border-none rounded-2xl py-4 px-6 outline-none font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:ring-2 ring-blue-500/20 transition-all cursor-pointer"
                            >
                                <option value="all">Any Status</option>
                                <option value="success">Success</option>
                                <option value="processing">Processing</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto h-[600px] custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50/80 dark:bg-[#0B0F19]/80 backdrop-blur-md z-20">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {loading && transactions.length === 0 ? (
                                    [1, 2, 3, 4, 5, 6].map(i => (
                                        <tr key={i}><td colSpan={4} className="px-8 py-6 animate-pulse"><div className="h-12 bg-slate-50 dark:bg-white/5 rounded-2xl w-full" /></td></tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found matching your criteria</td></tr>
                                ) : transactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        onClick={() => handleRowClick(tx)}
                                        className={cn(
                                            "group cursor-pointer transition-all duration-300",
                                            selectedTx?.id === tx.id ? "bg-blue-500/5 dark:bg-blue-500/[0.04]" : "hover:bg-slate-50 dark:hover:bg-white/[0.01]"
                                        )}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110",
                                                    tx.type === 'credit'
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                        : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                )}>
                                                    {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                                                        {tx.purpose === 'wallet_funding' ? 'Wallet Top-up' : (tx.bundle_name || 'Data Purchase')}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                        {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-900 dark:text-white">{tx.user_name || 'System User'}</span>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx.recipient_phone || tx.user_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "text-lg font-black tracking-tight",
                                                tx.type === 'credit' ? "text-emerald-500" : "text-slate-900 dark:text-white"
                                            )}>
                                                {tx.type === 'credit' ? '+' : '-'} GH₵ {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm",
                                                tx.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/5" :
                                                    tx.status === 'processing' || tx.status === 'initialized' ? "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-amber-500/5" :
                                                        "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-rose-500/5"
                                            )}>
                                                {tx.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                    tx.status === 'processing' ? <Clock className="w-3.5 h-3.5" /> :
                                                        <XCircle className="w-3.5 h-3.5" />}
                                                {tx.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-black/20 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Viewing the most recent {transactions.length} records</p>
                    </div>
                </div>
            </div>

            {/* Side Detail Panel (Inspired by Design 1) */}
            {selectedTx && (
                <div className="lg:w-[35%] animate-in slide-in-from-right-8 duration-500">
                    <div className="sticky top-10 bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden min-h-[700px] flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 relative bg-slate-50 dark:bg-black/10">
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="absolute right-8 top-8 p-3 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all"
                            >
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                            <div className="flex flex-col items-center text-center mt-6">
                                <div className={cn(
                                    "w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl transition-transform hover:scale-105",
                                    selectedTx.type === 'credit' ? "bg-emerald-500 text-white" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                )}>
                                    {selectedTx.type === 'credit' ? <ArrowDownLeft className="w-16 h-16" /> : <ShoppingBag className="w-16 h-16" />}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {selectedTx.purpose === 'wallet_funding' ? 'Wallet Deposit' : (selectedTx.bundle_name || 'Data Order')}
                                </h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">{selectedTx.reference || 'N/A'}</p>

                                <div className="mt-8">
                                    <span className={cn(
                                        "text-5xl font-black tracking-tighter",
                                        selectedTx.type === 'credit' ? "text-emerald-500" : "text-slate-900 dark:text-white"
                                    )}>
                                        {selectedTx.type === 'credit' ? '+' : '-'}₵{Number(selectedTx.amount).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                                    {new Date(selectedTx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(selectedTx.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Summary Group */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{selectedTx.user_name || 'System'}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>

                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method / Source</p>
                                            <p className="font-bold text-slate-900 dark:text-white uppercase text-xs">{selectedTx.payment_method || 'Internal'}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedTx.recipient_phone && (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{selectedTx.recipient_phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Verification Block for processing */}
                            {(selectedTx.status === 'processing' || selectedTx.status === 'initialized') && (
                                <div className="p-6 rounded-3xl bg-amber-500 border border-amber-400 shadow-xl shadow-amber-500/20 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className="w-5 h-5 animate-pulse" />
                                        <span className="font-black text-sm uppercase tracking-widest">Pending Settlement</span>
                                    </div>
                                    <p className="text-[11px] font-bold opacity-90 leading-relaxed mb-4">
                                        This transaction has not been fully verified yet. You can manually check the provider status.
                                    </p>
                                    <button
                                        className="w-full bg-white text-amber-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-inner hover:scale-105 transition-all"
                                        onClick={async () => {
                                            try {
                                                const res = await api.get(`/wallet/verify/${selectedTx.reference}`);
                                                alert(res.data.message);
                                                fetchTransactions();
                                            } catch (e: any) {
                                                alert(e.response?.data?.message || 'Verification failed');
                                            }
                                        }}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Verify Now</span>
                                    </button>
                                </div>
                            )}

                            {/* Mini spending chart placeholder (Inspired by Image 1) */}
                            <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">User Activity Trend</h4>
                                <div className="flex items-end justify-between h-24 gap-3">
                                    {[30, 60, 45, 80, 55, 95].map((h, i) => (
                                        <div key={i} className="flex-1 bg-slate-100 dark:bg-white/5 rounded-t-lg relative group transition-all duration-300">
                                            <div
                                                className={cn(
                                                    "absolute bottom-0 w-full rounded-t-lg transition-all duration-700 group-hover:opacity-100 bg-gradient-to-t",
                                                    selectedTx.type === 'credit' ? "from-emerald-500 to-emerald-400 opacity-60" : "from-blue-500 to-blue-400 opacity-60"
                                                )}
                                                style={{ height: `${h}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4">
                                    {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(m => (
                                        <span key={m} className="text-[9px] font-black text-slate-400 uppercase">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex items-center gap-4">
                            <Button className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-all">
                                <Info className="w-4 h-4 mr-2" />
                                Audit Log
                            </Button>
                            <Button
                                className="p-4 rounded-2xl aspect-square bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-none"
                            >
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTransactionsPage;
