import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Users, ShoppingBag, Wallet,
    ArrowUpRight, ArrowDownRight, Calendar,
    RefreshCw, Filter, Download
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { cn } from '@/utils/cn';
import api from '@/utils/api';
import Button from '@/components/Button';

const AdminAnalyticsPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const cards = [
        { label: 'Total Revenue', value: `GH₵ ${(stats?.lifetimeRevenue || 0).toLocaleString()}`, change: '+12.5%', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Users', value: (stats?.totalUsers || 0).toLocaleString(), change: '+3.2%', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Today\'s Orders', value: (stats?.todayOrders || 0).toString(), change: '+5.4%', icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Today\'s Revenue', value: `GH₵ ${(stats?.todayRevenue || 0).toLocaleString()}`, change: '+8.1%', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence Terminal</h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Live Business Intelligence & Metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none transition-all"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last quarter</option>
                    </select>
                    <Button onClick={fetchAnalytics} className="rounded-2xl p-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 transition-all">
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", card.bg)}>
                            <card.icon className={cn("w-6 h-6", card.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                            <div className="flex items-end gap-3 mt-1">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{card.value}</h3>
                                <span className="flex items-center text-[10px] font-black text-emerald-500 mb-1">
                                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                                    {card.change}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Evolution */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Evolution</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Growth over the last {timeRange === '7d' ? '7 days' : 'period'}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.dailyRevenue || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        border: 'none',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Network Distribution */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Provider Market Share</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Order volume breakdown by network</p>
                        </div>
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                            <Download className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.networkDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="count"
                                >
                                    {(stats?.networkDistribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    verticalAlign="middle"
                                    align="right"
                                    layout="vertical"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Growth */}
                <div className="lg:col-span-2 bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Onboarding Velocity</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily new user registrations</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.userGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Bundles */}
                <div className="bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Product Rankings</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Top performing data bundles</p>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <ArrowUpRight className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        {(stats?.bundlePerformance || []).slice(0, 5).map((bundle: any, index: number) => (
                            <div key={bundle.name} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight">{bundle.name}</p>
                                        <p className="text-[10px] font-black text-blue-500 uppercase">{bundle.sales} Sales</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(bundle.sales / Math.max(...(stats?.bundlePerformance || []).map((b: any) => b.sales))) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
