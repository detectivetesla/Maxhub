import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, Landmark, Download } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/utils/cn';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

const Wallet: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/dashboard/transactions', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTransactions(response.data.transactions);
            } catch (error) {
                console.error('Failed to fetch transactions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <header>
                <h1 className="text-3xl font-black text-black dark:text-white transition-colors">My Wallet</h1>
                <p className="text-slate-600 dark:text-slate-400 font-bold">Manage your funds, view balance, and top up instantly.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Balance and Funding */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 rounded-[2rem] bg-slate-900 dark:bg-white/[0.03] border border-slate-900 dark:border-white/5 flex flex-col justify-between min-h-[260px] relative overflow-hidden group shadow-2xl shadow-slate-900/10 dark:shadow-none transition-all duration-300">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                            <WalletIcon className="w-40 h-40 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Live Balance</p>
                            </div>
                            <h2 className="text-7xl font-black text-white mt-1 tracking-tight drop-shadow-md">
                                GH₵ {user?.walletBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </h2>
                            <p className="text-slate-400 mt-4 font-medium flex items-center gap-2">
                                <span className="opacity-60 italic text-sm">Account Name:</span>
                                <span className="text-slate-200">{user?.fullName || 'User'}</span>
                            </p>
                        </div>
                    </div>
                    {/* Deposit Form */}
                    <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-8 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Plus className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-black dark:text-white">Quick Top Up</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-bold">Add funds to your wallet balance instantly.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Payment Method Selection First */}
                            <div className="grid grid-cols-1 gap-4">
                                <button className="p-8 rounded-[1.5rem] border-2 border-primary bg-primary/5 flex flex-col items-center gap-4 transition-all group scale-100 active:scale-[0.98] text-center w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xl font-black text-black dark:text-white block">Paystack</span>
                                        <span className="text-xs text-slate-700 font-bold uppercase tracking-widest block opacity-70">Secure Payment (Cards / Mobile Money)</span>
                                    </div>
                                </button>
                            </div>

                            {/* Amount Input Second */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-600 ml-1 uppercase tracking-widest">Amount to Deposit (GH₵)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full px-10 py-6 rounded-[1.5rem] bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 focus:border-slate-400 dark:focus:border-primary outline-none transition-all text-4xl font-black text-black dark:text-white shadow-inner"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 font-bold text-xl">₵</div>
                                </div>
                            </div>

                            <Button className="w-full py-6 text-xl rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-2xl shadow-slate-900/20 dark:shadow-white/5 hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
                                Process Payment
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Information & History */}
                <div className="space-y-8">
                    {/* Recent Deposits sidebar */}
                    <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-6 transition-all duration-300 h-full">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-xl flex items-center gap-3 text-black dark:text-white">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Download className="w-5 h-5" />
                                </div>
                                <span>History</span>
                            </h3>
                            <Link to="/dashboard/deposits" className="text-[10px] font-black uppercase text-blue-500 hover:underline tracking-widest">View All</Link>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />)
                            ) : transactions.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 font-bold py-8">No transactions found.</p>
                            ) : transactions.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none transition-all hover:border-slate-300 dark:hover:border-white/10 group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
                                            item.type === 'credit' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                        )}>
                                            {item.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-black dark:text-white text-lg">₵{Number(item.amount).toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-600 uppercase tracking-widest">
                                                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={cn(
                                            "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            item.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                item.status === 'processing' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                                    "bg-red-500/10 text-red-600 border-red-500/20"
                                        )}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Tips */}
                        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                            <h4 className="text-xs font-black text-primary uppercase mb-2 tracking-widest">Wallet Tip</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                Fund your wallet with at least **GH₵ 50.00** to enjoy premium discounts on all data bundles and fast processing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
