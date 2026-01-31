import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Wallet,
    Database,
    ShoppingBag,
    Clock,
    CheckCircle2,
    MoreHorizontal,
    ArrowLeftRight,
    Plus,
    Download
} from 'lucide-react';
import axios from 'axios';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { LineChartPlaceholder, DonutChartPlaceholder } from '@/components/ChartPlaceholders';
import { supabase } from '@/utils/supabase';

const Overview: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        walletBalance: 0,
        totalOrders: 0,
        processingOrders: 0,
        completedOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentFunding, setRecentFunding] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, ordersRes, fundingRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/orders'),
                    api.get('/dashboard/transactions')
                ]);

                setStats(statsRes.data);
                setRecentOrders(ordersRes.data.orders);
                setRecentFunding(fundingRes.data.transactions.filter((t: any) => t.purpose === 'wallet_funding').slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Supabase Realtime Listener
        let channel: any = null;
        if (supabase) {
            channel = supabase
                .channel('dashboard-updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'orders' },
                    () => fetchDashboardData()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions' },
                    () => fetchDashboardData()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    const statCards = [
        { label: 'Wallet Balance', value: `GHΓé╡ ${stats.walletBalance.toLocaleString()}`, icon: Wallet, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10', iconBg: 'bg-orange-500', trend: '+0.0%' },
        { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', iconBg: 'bg-emerald-500', trend: '+0' },
        { label: 'Processing Orders', value: stats.processingOrders.toString(), icon: Clock, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', iconBg: 'bg-blue-500', trend: '0' },
        { label: 'Completed Orders', value: stats.completedOrders.toString(), icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10', iconBg: 'bg-purple-500', trend: '+0' },
    ];

    const getNetworkLogo = (network: string) => {
        const net = network?.toLowerCase() || '';
        if (net.includes('mtn')) return '/logos/mtn.png';
        if (net.includes('telecel')) return '/logos/telecel.png';
        if (net.includes('airtel') || net.includes('tigo') || net.includes('at')) return '/logos/airteltigo.png';
        return '/logos/default.png';
    };

    const getNetworkColor = (network: string) => {
        const net = network?.toLowerCase() || '';
        if (net.includes('mtn')) return 'bg-[#FFCC00]';
        if (net.includes('telecel')) return 'bg-[#E60000]';
        if (net.includes('airtel') || net.includes('tigo') || net.includes('at')) return 'bg-[#003876]';
        return 'bg-slate-400';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Greeting */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-black dark:text-white mb-1">
                    {getGreeting()}, <span className="text-primary">{user?.fullName?.split(' ')[0] || 'Member'}!</span>
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-400 font-bold">Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Stats and Chart */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {statCards.map((stat, i) => (
                            <div key={i} className={cn(
                                "p-4 sm:p-5 md:p-6 rounded-3xl sm:rounded-[2rem] shadow-sm hover:shadow-md transition-all group border relative overflow-hidden",
                                stat.bgColor,
                                "border-transparent hover:border-primary/20"
                            )}>
                                {loading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-xl" />
                                        <div className="h-8 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                            <div className={cn(
                                                "w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                                                stat.iconBg
                                            )}>
                                                <stat.icon className="w-4 h-4 sm:w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div>
                                                <p className={cn("text-xl sm:text-2xl md:text-4xl font-black tracking-tight", stat.color)}>{stat.value}</p>
                                                <p className="text-[10px] sm:text-xs md:text-sm font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">{stat.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-black tracking-tighter",
                                                stat.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                                            )}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Chart Section */}
                    <div className="p-5 md:p-8 rounded-[2.5rem] bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-black dark:text-white">Order Overview</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-bold">Transaction volume (last 30 days)</p>
                            </div>
                            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors shrink-0">
                                <MoreHorizontal className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <LineChartPlaceholder />
                    </div>

                    {/* Recent Orders Table */}
                    <div className="p-5 md:p-8 rounded-[2.5rem] bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                                <span>Recent Orders</span>
                            </h3>
                            <button className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest hover:underline text-left">View History</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Order ID</th>
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Network / Bundle</th>
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">Recipient</th>
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i}><td colSpan={4} className="py-4 animate-pulse"><div className="h-12 bg-slate-100 dark:bg-white/5 rounded-xl w-full" /></td></tr>
                                        ))
                                    ) : recentOrders.length === 0 ? (
                                        <tr><td colSpan={4} className="py-8 text-center text-slate-400 font-bold">No orders found.</td></tr>
                                    ) : recentOrders.map((order, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 font-mono text-xs text-slate-400 uppercase">#{order.id.slice(0, 8)}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm border border-slate-100 flex-shrink-0">
                                                        <img src={getNetworkLogo(order.network)} alt={order.network} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-black dark:text-white">{order.network}</p>
                                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-500">{order.bundle_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{order.recipient_phone}</td>
                                            <td className="py-4 text-right">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    order.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" :
                                                        order.status === 'processing' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/10" :
                                                            "bg-red-500/10 text-red-600 border-red-500/10"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side: Distribution and Recent Items */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Distribution Chart */}
                    <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white">Network Distribution</h3>
                        </div>
                        <div className="flex justify-center py-4">
                            <DonutChartPlaceholder />
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'MTN Ghana', color: 'bg-[#FFCC00]', percent: 'N/A' },
                                { name: 'Telecel', color: 'bg-[#E60000]', percent: 'N/A' },
                                { name: 'AirtelTigo', color: 'bg-[#003876]', percent: 'N/A' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-3 h-3 rounded-full", item.color)} />
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.percent}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Deposits */}
                    <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white flex items-center gap-2">
                                <Download className="w-5 h-5 text-primary" />
                                <span>Recent Funding</span>
                            </h3>
                            <button className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest hover:underline">See All</button>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-20 bg-slate-50 dark:bg-white/5 rounded-2xl animate-pulse" />)
                            ) : recentFunding.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 font-bold py-4">No recent funding found.</p>
                            ) : recentFunding.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center p-2 shadow-sm border border-slate-100",
                                            getNetworkColor(item.payment_method || 'wallet')
                                        )}>
                                            <Wallet className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-black dark:text-white">GHΓé╡ {Number(item.amount).toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-tighter">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Refined Quick Access / Bottom Bar */}
            <div className="p-5 sm:p-6 md:p-8 rounded-3xl sm:rounded-[2.5rem] bg-slate-900 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                    <Database className="w-64 h-64 fill-white" />
                </div>

                <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="space-y-2 sm:space-y-4 text-center xl:text-left">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">Quick Actions</h3>
                        <p className="text-slate-400 text-xs sm:text-sm md:text-base font-medium max-w-md">Manage your wallet and orders instantly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full xl:w-auto">
                        <Link to="/dashboard/data-bundles" className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 bg-primary text-white rounded-2xl sm:rounded-[1.5rem] font-black shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all group/btn">
                            <Plus className="w-4 h-4 sm:w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                            <span className="text-xs sm:text-sm md:text-base">New Order</span>
                        </Link>

                        <Link to="/dashboard/wallet" className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl sm:rounded-[1.5rem] font-black border border-white/10 transition-all hover:translate-y-[-2px] active:translate-y-0">
                            <Download className="w-4 h-4 sm:w-5 h-5" />
                            <span className="text-xs sm:text-sm md:text-base">Fund Wallet</span>
                        </Link>

                        <Link to="/dashboard/transactions" className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl sm:rounded-[1.5rem] font-black border border-white/5 transition-all hover:translate-y-[-2px] active:translate-y-0 sm:col-span-2 lg:col-span-1">
                            <ArrowLeftRight className="w-4 h-4 sm:w-5 h-5" />
                            <span className="text-xs sm:text-sm md:text-base">Transactions</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
