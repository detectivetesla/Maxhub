import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Users, Activity, Database, Zap,
    Smartphone, CreditCard, ChevronRight,
    TrendingUp, BarChart3, AlertCircle, CheckCircle2, Clock,
    Wallet, ShoppingBag, Plus, Download, ArrowLeftRight
} from 'lucide-react';
import api from '@/utils/api';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '@/utils/supabase';

const Overview: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>({
        walletBalance: 0,
        totalOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
        networkDistribution: [],
        dailyOrders: []
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentFunding, setRecentFunding] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ordersRes, fundingRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/orders'),
                api.get('/wallet/transactions')
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

    useEffect(() => {
        fetchDashboardData();

        // Supabase Realtime Listener
        let channel: any = null;
        if (supabase && user) {
            channel = supabase
                .channel('dashboard-live-updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
                    () => fetchDashboardData()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
                    () => fetchDashboardData()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, [user?.id]);

    const statCards = [
        { label: 'Wallet Balance', value: `GH₵ ${Number(stats.walletBalance).toLocaleString()}`, icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', iconBg: 'bg-emerald-500', trend: '+0.0%', path: '/dashboard/wallet' },
        { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10', iconBg: 'bg-orange-500', trend: `+${stats.totalOrders}`, path: '/dashboard/orders' },
        { label: 'Processing Orders', value: stats.processingOrders.toString(), icon: Clock, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', iconBg: 'bg-blue-500', trend: 'Live', path: '/dashboard/orders?status=processing' },
        { label: 'Completed Orders', value: stats.completedOrders.toString(), icon: CheckCircle2, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10', iconBg: 'bg-purple-500', trend: `+${stats.completedOrders}`, path: '/dashboard/orders?status=completed' },
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
        if (net.includes('mtn')) return '#FFCC00';
        if (net.includes('telecel')) return '#E60000';
        if (net.includes('airtel') || net.includes('tigo') || net.includes('at')) return '#003876';
        return '#CBD5E1';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const COLORS = ['#FFCC00', '#E60000', '#003876', '#8B5CF6'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-black dark:text-white mb-1">
                        {getGreeting()}, <span className="text-primary">{user?.fullName?.split(' ')[0] || 'Member'}!</span>
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-400 font-bold">Here's a real-time snapshot of your account.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Stats and Chart */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {statCards.map((stat, i) => (
                            <div
                                key={i}
                                onClick={() => stat.path && navigate(stat.path)}
                                className={cn(
                                    "p-4 sm:p-5 md:p-6 rounded-3xl sm:rounded-[2rem] shadow-sm hover:shadow-md transition-all group border relative overflow-hidden cursor-pointer",
                                    stat.bgColor,
                                    "border-transparent hover:border-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                                )}
                            >
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
                                                "px-2 py-1 rounded-full text-[10px] font-black tracking-tighter capitalize",
                                                "bg-white/50 dark:bg-black/20 text-slate-600 dark:text-slate-300"
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
                    <div className="p-5 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0B0F19] shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-black dark:text-white">Order Volume</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-bold">Daily transaction activity (last 7 days)</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[10px] font-black uppercase text-slate-400">
                                Active Stream
                            </div>
                        </div>

                        <div className="h-72 w-full">
                            {stats.dailyOrders.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.dailyOrders}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                border: 'none',
                                                borderRadius: '16px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#3B82F6' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3B82F6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-50">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                                        <TrendingUp className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <span className="text-xs font-black uppercase text-slate-400">Not enough data yet</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className="p-5 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0B0F19] shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-500" />
                                <span>Recent Orders</span>
                            </h3>
                            <button onClick={() => navigate('/dashboard/orders')} className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest hover:underline text-left">View History</button>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[600px]">
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
                                        <tr><td colSpan={4} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Database className="w-12 h-12 text-slate-200 mb-4" />
                                                <p className="text-sm font-bold text-slate-400">No orders found yet. Start by choosing a bundle!</p>
                                            </div>
                                        </td></tr>
                                    ) : recentOrders.map((order, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate('/dashboard/orders')}>
                                            <td className="py-4 font-mono text-[10px] text-slate-400 uppercase">#{order.id.slice(0, 8)}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white p-1.5 shadow-sm border border-slate-100 flex-shrink-0">
                                                        <img src={getNetworkLogo(order.network)} alt={order.network} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-black dark:text-white">{order.network}</p>
                                                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-500">{order.bundle_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm font-black text-slate-700 dark:text-slate-400">{order.recipient_phone}</td>
                                            <td className="py-4 text-right">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                    order.status === 'success' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" :
                                                        order.status === 'processing' ? "bg-blue-500/10 text-blue-600 border-blue-500/10" :
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
                    <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0B0F19] shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white">Network Distribution</h3>
                        </div>

                        <div className="h-64 flex justify-center py-4 relative">
                            {stats.networkDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.networkDistribution}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="count"
                                        >
                                            {stats.networkDistribution.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={getNetworkColor(entry.name)} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F172A',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                color: '#fff'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Zap className="w-12 h-12 text-slate-300" />
                                </div>
                            )}
                            {stats.networkDistribution.length > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                                        {stats.networkDistribution.reduce((acc: number, curr: any) => acc + curr.count, 0)}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Orders</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {stats.networkDistribution.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 font-bold">Waiting for your first order...</p>
                            ) : stats.networkDistribution.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNetworkColor(item.name) }} />
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 capitalize">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Deposits */}
                    <div className="p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-[#0B0F19] shadow-sm border border-slate-100 dark:border-white/10 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg md:text-xl font-black text-black dark:text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-500" />
                                <span>Funding Activity</span>
                            </h3>
                            <button onClick={() => navigate('/dashboard/transactions')} className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest hover:underline">See All</button>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-20 bg-slate-50 dark:bg-white/5 rounded-2xl animate-pulse" />)
                            ) : recentFunding.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No funding history</p>
                                </div>
                            ) : recentFunding.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary/20 transition-all cursor-pointer group" onClick={() => navigate('/dashboard/wallet')}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100 dark:border-white/10 bg-emerald-500/10 text-emerald-500",
                                        )}>
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-black dark:text-white">GH₵ {Number(item.amount).toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-tighter">
                                                {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        item.status === 'success' ? "bg-emerald-500" : "bg-orange-500 animate-pulse"
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Action Bar */}
            <div className="p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[3rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                {/* Visual Decoration */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />

                <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 text-center xl:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-2">
                            <Zap className="w-3 h-3 fill-white" />
                            <span>Instant Delivery</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-none">Ready to top up?</h3>
                        <p className="text-indigo-100 text-sm sm:text-base font-bold max-w-md opacity-80">Choose from MTN, Telecel, or AirtelTigo and get your data instantly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full xl:w-auto">
                        <Link to="/dashboard/data-bundles" className="flex items-center justify-center gap-3 px-8 py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black shadow-xl hover:translate-y-[-4px] active:translate-y-0 transition-all group/btn">
                            <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                            <span className="text-sm md:text-base">Order Data</span>
                        </Link>

                        <Link to="/dashboard/wallet" className="flex items-center justify-center gap-3 px-8 py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black border border-indigo-400 shadow-xl hover:translate-y-[-4px] active:translate-y-0 transition-all">
                            <Download className="w-5 h-5" />
                            <span className="text-sm md:text-base">Fund Wallet</span>
                        </Link>

                        <Link to="/dashboard/transactions" className="flex items-center justify-center gap-3 px-8 py-5 bg-black/20 hover:bg-black/30 text-white rounded-[1.5rem] font-black backdrop-blur-md transition-all hover:translate-y-[-4px] active:translate-y-0 sm:col-span-2 lg:col-span-1">
                            <ArrowLeftRight className="w-5 h-5 opacity-50" />
                            <span className="text-sm md:text-base">All Activity</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
